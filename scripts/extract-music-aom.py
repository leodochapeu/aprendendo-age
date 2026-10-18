#!/usr/bin/env python3
"""
Extrai a trilha do Age of Mythology: Retold para o site.

A lista de faixas vem de game/sound/Sound.bar (playlist.xml), que o crybar
já abre. O áudio está no banco FSB5 Vorbis game/sound/banks/Desktop/music.bank,
ao lado desse arquivo. Mixes quietos (*_mellow_mix) e as camadas calma/intro
do tema de Arena of the Gods ficam de fora: no jogo elas são o mesmo tema
em outro humor, não faixas sorteadas à parte.

Exemplos:
  python scripts/extract-music-aom.py
  python scripts/extract-music-aom.py --game-dir "E:\\SteamLibrary\\steamapps\\common\\Age of Mythology Retold"
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CRYBAR, resolve_game_dir  # noqa: E402

MUSIC_BANK_REL = Path("game") / "sound" / "banks" / "Desktop" / "music.bank"
SOUND_BAR_REL = Path("game") / "sound" / "Sound.bar"
OUT_DIR = ROOT / "public" / "assets" / "music"
MANIFEST_PATH = ROOT / "src" / "data" / "music_tracks.json"
XIPH_CACHE = ROOT / "tools" / ".xiph-cache"

SKIP_NAMES = {"aotg_theme_calm_loop", "aotg_theme_intro_short"}

TITULOS = {
    "OM_THEME": "OM Theme",
    "OM_JINGLE": "OM Jingle",
    "(fine_layers_of)_slaysenflite": "(Fine Layers of) Slaysenflite",
    "flavor_cats_(in_the_comfort_zone)": "Flavor Cats (In the Comfort Zone)",
    "n_d_nile": "N.D. Nile",
    "of_norse_not!": "Of Norse Not!",
    "oi_that_pops!!!": "Oi, That Pops!!!",
    "ma_am..some_other_sunset": "Ma'am, Some Other Sunset",
    "if_you_can_use_a_doorknob": "If You Can Use a Doorknob",
    "i_wish_i_could_throw_shapes": "I Wish I Could Throw Shapes",
    "a_cat_named_mittens": "A Cat Named Mittens",
    "a_matt_named_kittens": "A Matt Named Kittens",
    "a_mimi_named_mochi": "A Mimi Named Mochi",
    "main_menu_chinese": "Main Menu Chinese",
    "battle_track_japanese": "Battle Track Japanese",
    "aotg_theme_full_short": "Arena of the Gods",
    "gauntlet_music_loop": "Gauntlet",
    "kuafu_panda": "Kuafu Panda",
    "nori_grets": "Nori Grets",
    "hotlantis": "Hotlantis",
    "greek_to_me": "Greek to Me",
    "gank_sneakin": "Gank Sneakin'",
    "the_fire_brigade": "The Fire Brigade",
    "eat_your_potatoes": "Eat Your Potatoes",
    "chocolate_outline": "Chocolate Outline",
    "never_mind_the_slacks_and_bashers": "Never Mind the Slacks and Bashers",
    "suture_self": "Suture Self",
    "hoping_for_real_betterness": "Hoping for Real Betterness",
    "adult_swim": "Adult Swim",
    "the_ballad_of_ace_lebaron": "The Ballad of Ace LeBaron",
    "in_a_pile_of_its_own_good": "In a Pile of Its Own Good",
    "behold_the_great_science_fi": "Behold the Great Science Fi",
    "lil_drips": "Lil' Drips",
    "meatier_shower": "Meatier Shower",
    "rot_loaf": "Rot Loaf",
}

OGG_ZIP = "https://github.com/ShiftMediaProject/ogg/releases/download/v1.3.5-1/libogg_v1.3.5-1_msvc17.zip"
VORBIS_ZIP = "https://github.com/ShiftMediaProject/vorbis/releases/download/v1.3.7-2/libvorbis_v1.3.7-2_msvc17.zip"


def titulo_da_faixa(nome: str) -> str:
    if nome in TITULOS:
        return TITULOS[nome]
    palavras = []
    for palavra in nome.replace("_", " ").split():
        if palavra.isupper() and len(palavra) <= 3:
            palavras.append(palavra)
        else:
            palavras.append(palavra[:1].upper() + palavra[1:])
    return " ".join(palavras)


def slug_da_faixa(nome: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-")
    if not slug:
        raise ValueError(f"Nome de faixa sem slug: {nome}")
    return slug


def exportar_playlist(crybar: Path, sound_bar: Path, destino: Path) -> Path:
    destino.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [
            str(crybar),
            "bar",
            "export",
            str(sound_bar),
            "playlist.xml.XMB",
            "-o",
            str(destino),
            "--decompress",
            "--convert",
            "-q",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        detalhe = (proc.stderr or proc.stdout or "").strip()
        raise RuntimeError(f"crybar não exportou playlist.xml: {detalhe}")
    xml_path = destino / "playlist.xml"
    if not xml_path.exists():
        raise FileNotFoundError(f"playlist.xml não apareceu em {destino}")
    return xml_path


def nomes_da_playlist(xml_path: Path) -> list[str]:
    raiz = ET.parse(xml_path).getroot()
    vistos: list[str] = []
    presentes: set[str] = set()
    for nodo in raiz.iter("file"):
        bruto = (nodo.text or "").strip().replace("/", "\\")
        if not bruto:
            continue
        nome = Path(bruto).stem
        if nome.casefold().endswith("_mellow_mix") or nome in SKIP_NAMES:
            continue
        chave = nome.casefold()
        if chave in presentes:
            continue
        presentes.add(chave)
        vistos.append(nome)
    return vistos


def _extrair_dll(url: str, destino: Path, nome_zip: str) -> None:
    print(f"Baixando {nome_zip}…")
    with urllib.request.urlopen(url) as resposta:
        pacote = zipfile.ZipFile(io.BytesIO(resposta.read()))
    for entrada in pacote.namelist():
        if not entrada.lower().endswith(".dll"):
            continue
        if "x64" not in entrada.replace("\\", "/").lower():
            continue
        alvo = destino / Path(entrada).name
        with pacote.open(entrada) as origem, alvo.open("wb") as saida:
            shutil.copyfileobj(origem, saida)


def garantir_xiph(cache: Path) -> None:
    cache.mkdir(parents=True, exist_ok=True)
    if not (cache / "ogg.dll").exists():
        _extrair_dll(OGG_ZIP, cache, "libogg")
    if not (cache / "vorbis.dll").exists():
        _extrair_dll(VORBIS_ZIP, cache, "libvorbis")
    vorbis = cache / "vorbis.dll"
    ogg = cache / "ogg.dll"
    shutil.copyfile(vorbis, cache / "libvorbis.dll")
    shutil.copyfile(vorbis, cache / "libvorbisenc.dll")
    shutil.copyfile(ogg, cache / "libogg.dll")
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(str(cache))


def extrair_faixas(bank_path: Path, nomes: list[str], xiph: Path) -> list[dict]:
    try:
        from fsb5 import FSB5
    except ImportError as exc:
        raise SystemExit("Instale o extrator FSB5: pip install fsb5") from exc

    dados = bank_path.read_bytes()
    inicio = dados.find(b"FSB5")
    if inicio < 0:
        raise RuntimeError(f"FSB5 não encontrado em {bank_path}")
    banco = FSB5(dados[inicio:])
    por_nome = {amostra.name.casefold(): amostra for amostra in banco.samples}

    faltando = [nome for nome in nomes if nome.casefold() not in por_nome]
    if faltando:
        raise RuntimeError("Faixas da playlist sem áudio no music.bank: " + ", ".join(faltando))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    slugs: set[str] = set()
    manifesto: list[dict] = []
    anterior = Path.cwd()
    os.chdir(xiph)
    try:
        for nome in nomes:
            amostra = por_nome[nome.casefold()]
            slug = slug_da_faixa(amostra.name)
            if slug in slugs:
                raise RuntimeError(f"Slug duplicado: {slug}")
            slugs.add(slug)
            print(f"  {amostra.name}")
            ogg = bytes(banco.rebuild_sample(amostra))
            if not ogg.startswith(b"OggS"):
                raise RuntimeError(f"{amostra.name} não saiu como Ogg Vorbis")
            destino = OUT_DIR / f"{slug}.ogg"
            destino.write_bytes(ogg)
            manifesto.append(
                {
                    "id": slug,
                    "title": titulo_da_faixa(amostra.name),
                    "src": f"/assets/music/{slug}.ogg",
                    "durationSec": round(amostra.samples / amostra.frequency, 1),
                }
            )
    finally:
        os.chdir(anterior)
    return manifesto


def limpar_ogg_antigos(ids: set[str]) -> None:
    if not OUT_DIR.exists():
        return
    for caminho in OUT_DIR.glob("*.ogg"):
        if caminho.stem not in ids:
            caminho.unlink()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-dir", default=None)
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    args = parser.parse_args()

    game_dir = resolve_game_dir(args.game_dir)
    crybar = Path(args.crybar).resolve()
    sound_bar = game_dir / SOUND_BAR_REL
    bank = game_dir / MUSIC_BANK_REL
    if not sound_bar.exists():
        print(f"Erro: Sound.bar não encontrado em {sound_bar}", file=sys.stderr)
        return 1
    if not bank.exists():
        print(f"Erro: music.bank não encontrado em {bank}", file=sys.stderr)
        return 1
    if not crybar.exists():
        print(f"Erro: crybar não encontrado em {crybar}", file=sys.stderr)
        return 1

    probe = ROOT / "tools" / ".music-probe"
    print(f"Lendo playlist de {sound_bar}")
    xml_path = exportar_playlist(crybar, sound_bar, probe)
    nomes = nomes_da_playlist(xml_path)
    print(f"{len(nomes)} faixas (sem mixes quietos)")

    print("Preparando libvorbis…")
    garantir_xiph(XIPH_CACHE)
    print(f"Extraindo {bank}")
    manifesto = extrair_faixas(bank, nomes, XIPH_CACHE)
    limpar_ogg_antigos({item["id"] for item in manifesto})
    MANIFEST_PATH.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(manifesto)} faixas em {OUT_DIR}")
    print(f"Manifesto em {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
