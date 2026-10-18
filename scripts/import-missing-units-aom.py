#!/usr/bin/env python3
"""
Importa unidades faltantes (Titãs + gaps treináveis) de todos os panteões.

Exemplos:
  python scripts/import-missing-units-aom.py --dry-run
  python scripts/import-missing-units-aom.py --write
  python scripts/import-missing-units-aom.py --only-titans --write
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from copy import deepcopy
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import (  # noqa: E402
    DEFAULT_CACHE_DIR,
    DEFAULT_CRYBAR,
    DEFAULT_GAME_DIR,
    UI_TEXTURE_CACHE_BAR,
    resolve_game_dir,
)
from aom_proto_maps import ERA_FROM_TOKEN  # noqa: E402
from aom_relic_icons import icon_path_to_dds_entry, png_to_webp, token_to_asset_filename  # noqa: E402
from aom_unit_extractor import extract_units, icon_token_from_path  # noqa: E402
from aom_unit_merge import (  # noqa: E402
    TIPO_LABEL_EN,
    _normalize_number,
    load_building_id_map,
)

CACHE = Path(DEFAULT_CACHE_DIR)
PT_UNITS = ROOT / "src" / "data" / "locale" / "pt" / "unidades_aom.json"
EN_UNITS = ROOT / "src" / "data" / "locale" / "en" / "unidades_aom.json"
PT_CONS = ROOT / "src" / "data" / "locale" / "pt" / "construcoes.json"
TOKEN_MAP = ROOT / "src" / "data" / "token_asset_map.json"

PANTHEON_META = {
    1: {"id": 1, "nome": "Grego :aomr_pantheon_greeks_icon:", "folder": "unit_greek"},
    2: {"id": 2, "nome": "Egípcio :aomr_pantheon_egyptians_icon:", "folder": "unit_egyptian"},
    3: {"id": 3, "nome": "Nórdico :aomr_pantheon_norse_icon:", "folder": "unit_norse"},
    4: {"id": 4, "nome": "Atlante :aomr_pantheon_atlanteans_icon:", "folder": "unit_atlantean"},
    5: {"id": 5, "nome": "Chinês :aomr_pantheon_chinese_icon:", "folder": "unit_chinese"},
    6: {"id": 6, "nome": "Japonês :aomr_pantheon_japanese_icon:", "folder": "unit_japanese"},
    7: {"id": 7, "nome": "Asteca :aomr_pantheon_azteca_icon:", "folder": "unit_aztec"},
}

# proto → (pantheon_id, era_id, ingles_override|None, nome_pt_override|None)
TITANS: dict[str, tuple[int, int, str, str]] = {
    "TitanCerberus": (1, 5, "Titan (Cerberus)", "Titã (Cérbero)"),
    "TitanBird": (2, 5, "Titan (Egyptian)", "Titã (Egípcio)"),
    "TitanYmir": (3, 5, "Titan (Ymir)", "Titã (Ymir)"),
    "TitanAtlantean": (4, 5, "Titan (Atlantean)", "Titã (Atlante)"),
    "TitanXingTian": (5, 5, "Titan (Xing Tian)", "Titã (Xing Tian)"),
    "TitanYamataNoOrochi": (6, 5, "Titan (Yamata no Orochi)", "Titã (Yamata no Orochi)"),
}

# Gaps treináveis / multiplayer (sem OfSet, WalkingWoods, campanha)
CURATED: dict[str, tuple[int, int, str | None, str | None]] = {
    # Greek
    "VillagerGreek": (1, 1, None, None),
    "Kataskopos": (1, 1, None, None),
    "Militia": (1, 1, None, None),
    "Petrobolos": (1, 3, None, None),
    "Helepolis": (1, 4, None, None),
    "Hippocampus": (1, 2, None, None),
    "Scylla": (1, 3, None, None),
    "Carcinos": (1, 4, None, None),
    "Trireme": (1, 2, None, None),
    "Pentekonter": (1, 2, None, None),
    "Juggernaut": (1, 3, None, None),
    # Egyptian
    "VillagerEgyptian": (2, 1, None, None),
    "Mercenary": (2, 2, None, None),
    "MercenaryCavalry": (2, 3, None, None),
    "SiegeTower": (2, 3, None, None),
    "Catapult": (2, 4, None, None),
    "Roc": (2, 4, None, None),
    "Leviathan": (2, 3, None, None),
    "WarTurtle": (2, 4, None, None),
    "PhoenixEgg": (2, 4, None, None),
    "Kebenit": (2, 2, None, None),
    "RammingGalley": (2, 2, None, None),
    "WarBarge": (2, 3, None, None),
    "Minion": (2, 4, None, None),
    # Norse
    "VillagerNorse": (3, 1, None, None),
    "VillagerDwarf": (3, 1, "Dwarf", None),
    "PortableRam": (3, 3, None, None),
    "Ballista": (3, 4, None, None),
    "Kraken": (3, 3, None, None),
    "Nidhogg": (3, 4, None, None),
    "JormunElver": (3, 3, None, None),
    "FimbulwinterWolf": (3, 4, None, None),
    "Longboat": (3, 2, None, None),
    "Dreki": (3, 3, None, None),
    "DragonShip": (3, 4, None, None),
    "GullinburstiClassical": (3, 2, "Gullinbursti", None),
    # Atlantean
    "VillagerAtlantean": (4, 1, "Citizen", None),
    "Destroyer": (4, 3, None, None),
    "DestroyerHero": (4, 3, None, None),
    "FireSiphon": (4, 4, None, None),
    "Carnivora": (4, 2, None, None),
    "WaterCarnivora": (4, 2, None, None),
    "PrometheanOffspring": (4, 2, None, None),
    "Servant": (4, 2, None, None),
    "Dryad": (4, 3, None, None),
    "Nereid": (4, 3, None, None),
    "TartarianSpawn": (4, 4, None, None),
    "ManOWar": (4, 4, None, None),
    "Bireme": (4, 2, None, None),
    "FireShip": (4, 3, None, None),
    "SiegeBireme": (4, 3, None, None),
    # Chinese
    "VillagerChinese": (5, 1, None, None),
    "Kuafu": (5, 1, None, None),
    "TerracottaRider": (5, 3, None, None),
    "QingQi": (5, 3, None, None),
    "GongQi": (5, 3, None, None),
    "SiegeCrossbow": (5, 4, None, None),
    "AxeCart": (5, 4, None, None),
    "PiXiu": (5, 2, None, None),
    "ChiWen": (5, 3, None, None),
    "XuanWu": (5, 4, None, None),
    "Fei": (5, 3, None, None),
    "YingLong": (5, 4, None, None),
    "DouJian": (5, 2, None, None),
    "MengChong": (5, 3, None, None),
    "LouChuan": (5, 4, None, None),
    # Japanese
    "VillagerJapanese": (6, 1, None, None),
    "SamuraiHatamoto": (6, 4, None, None),
    "Sakimori": (6, 2, None, None),
    "BushiYari": (6, 2, None, None),
    "Oyumi": (6, 4, None, None),
    "OnnaMusha": (6, 3, None, None),
    "Shogun": (6, 4, None, None),
    "Honengyo": (6, 2, None, None),
    "Umibozu": (6, 4, None, None),
    "Wasen": (6, 2, None, None),
    "RammingWasen": (6, 2, None, None),
    "Junkozosen": (6, 3, None, None),
    "MasterlessSword": (6, 3, None, None),
    "Wretch": (6, 3, None, None),
    "Tanuki": (6, 2, None, None),
    "Kappa": (6, 2, None, None),
}

ERA_LABEL_EN = {
    "Archaic": "Archaic",
    "Classical": "Classical",
    "Heroic": "Heroic",
    "Mythic": "Mythic",
    "Titan": "Titan",
}

TIPO_OVERRIDES: dict[str, list[dict[str, str]]] = {
    "VillagerGreek": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerEgyptian": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerNorse": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerDwarf": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerAtlantean": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerChinese": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "VillagerJapanese": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
}

# Prefer existing und_villagers assets when proto token points elsewhere
ICON_URL_OVERRIDES: dict[str, str] = {
    "aomr_villager_greek_icon": "/assets/und_villagers/AoMR_Villager_Greek_icon.webp",
    "aomr_villager_egyptian_icon": "/assets/und_villagers/AoMR_Laborer_icon.webp",
    "aomr_villager_norse_icon": "/assets/und_villagers/AoMR_Gatherer_icon.webp",
    "aomr_villager_dwarf_icon": "/assets/und_villagers/AoMR_Dwarf_icon.webp",
    "aomr_villager_atlantean_icon": "/assets/und_villagers/AoMR_Citizen_icon.webp",
    "aomr_villager_chinese_icon": "/assets/und_villagers/AoMR_Peasant_icon.webp",
    "aomr_villager_japanese_icon": "/assets/und_villagers/AoMR_Commoner_icon.webp",
    "aomr_laborer_icon": "/assets/und_villagers/AoMR_Laborer_icon.webp",
    "aomr_gatherer_icon": "/assets/und_villagers/AoMR_Gatherer_icon.webp",
    "aomr_dwarf_icon": "/assets/und_villagers/AoMR_Dwarf_icon.webp",
    "aomr_citizen_icon": "/assets/und_villagers/AoMR_Citizen_icon.webp",
    "aomr_peasant_icon": "/assets/und_villagers/AoMR_Peasant_icon.webp",
    "aomr_commoner_icon": "/assets/und_villagers/AoMR_Commoner_icon.webp",
    "aomr_kuafu_icon": "/assets/und_villagers/AoMR_Kuafu_icon.webp",
}


def era_entry(era_id: int, *, locale: str) -> dict[str, Any]:
    token_by_id = {meta["id"]: token for token, meta in ERA_FROM_TOKEN.items()}
    token = token_by_id[era_id]
    meta = ERA_FROM_TOKEN[token]
    label = ERA_LABEL_EN.get(token, meta["nome"]) if locale == "en" else meta["nome"]
    return {"id": meta["id"], "nome": f"{label} :{meta['icon']}:"}


def localize_tipo(tipo: list[dict[str, Any]] | None, *, locale: str) -> list[dict[str, Any]]:
    if not tipo:
        return []
    if locale != "en":
        return deepcopy(tipo)
    out = []
    for item in tipo:
        mapped = deepcopy(item)
        label = mapped.get("type")
        if isinstance(label, str) and label in TIPO_LABEL_EN:
            mapped["type"] = TIPO_LABEL_EN[label]
        elif label == "Aldeão":
            mapped["type"] = "Villager"
        elif label == "Navio":
            mapped["type"] = "Ship"
        out.append(mapped)
    return out


def resolve_construcao(
    extracted: list[dict[str, Any]] | None,
    building_ids: dict[str, int],
) -> list[dict[str, Any]]:
    if not extracted:
        return []
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in extracted:
        proto = (item.get("proto") or "").strip()
        nome = (item.get("nome") or proto).strip()
        if not nome or nome in seen:
            continue
        # Skip traps / walls noise
        if any(x in proto for x in ("Trap", "Wall", "Farm", "House", "Sentry")):
            continue
        seen.add(nome)
        row: dict[str, Any] = {"nome": nome}
        bid = building_ids.get(proto) or building_ids.get(nome) or building_ids.get(
            proto.replace(" ", "")
        )
        if bid is not None:
            row["id"] = bid
        out.append(row)
        if len(out) >= 2:
            break
    return out


def next_catalog_id(rows: list[dict[str, Any]]) -> int:
    ids = [int(r["id"]) for r in rows if r.get("id") is not None]
    return (max(ids) + 1) if ids else 1


def catalog_has_unit(rows: list[dict[str, Any]], ingles: str) -> dict[str, Any] | None:
    wanted = ingles.strip().lower()
    for row in rows:
        if (row.get("ingles") or "").strip().lower() == wanted:
            return row
    return None


def build_row(
    extracted: dict[str, Any],
    *,
    locale: str,
    unit_id: int,
    pantheon_id: int,
    era_id: int,
    ingles_override: str | None,
    nome_pt_override: str | None,
    building_ids: dict[str, int],
    proto: str,
) -> dict[str, Any]:
    pantheon = PANTHEON_META[pantheon_id]
    tipo = TIPO_OVERRIDES.get(proto) or extracted.get("tipo") or []
    if proto.startswith("Titan"):
        tipo = [{"type": "Unidade mítica", "icon": "aomr_type_myth_unit_icon"}]

    ingles = ingles_override or extracted.get("ingles") or proto
    if locale == "en":
        nome = ingles_override or extracted.get("ingles") or proto
    else:
        nome = nome_pt_override or extracted.get("nome") or ingles

    row: dict[str, Any] = {
        "id": unit_id,
        "nome": nome,
        "ingles": ingles,
        "tipo": localize_tipo(tipo, locale=locale),
        "panteao": [{"id": pantheon["id"], "nome": pantheon["nome"]}],
        "era": [era_entry(era_id, locale=locale)],
        "multiplicador": deepcopy(extracted.get("multiplicador") or []),
        "pontos_de_vida": _normalize_number(extracted.get("pontos_de_vida")),
        "velocidade_de_ataque_atk_s": _normalize_number(
            extracted.get("velocidade_de_ataque_atk_s")
        ),
        "dps": _normalize_number(extracted.get("dps")),
        "armadura_anticorte": _normalize_number(extracted.get("armadura_anticorte")),
        "armadura_antiperfurante": _normalize_number(
            extracted.get("armadura_antiperfurante")
        ),
        "construcao": []
        if proto.startswith("Titan")
        else resolve_construcao(extracted.get("construcao"), building_ids),
        "comida": _normalize_number(extracted.get("comida") or 0),
        "madeira": _normalize_number(extracted.get("madeira") or 0),
        "ouro": _normalize_number(extracted.get("ouro") or 0),
        "favor": _normalize_number(extracted.get("favor") or 0),
        "custo_total": _normalize_number(extracted.get("custo_total") or 0),
        "populacao": _normalize_number(extracted.get("populacao") or 0),
        "tempo_treinamento": _normalize_number(extracted.get("tempo_treinamento") or 0),
        "velocidade_movimento": _normalize_number(
            extracted.get("velocidade_movimento") or 0
        ),
        "icon": extracted.get("icon"),
    }

    if extracted.get("armadura_anticontusao") is not None:
        row["armadura_anticontusao"] = _normalize_number(
            extracted.get("armadura_anticontusao")
        )

    for field in (
        "dano_cortante",
        "dano_perfurante",
        "dano_contusao",
        "dano_divino",
        "alcance",
    ):
        if field in extracted:
            row[field] = _normalize_number(extracted[field])

    if extracted.get("max_range"):
        row["alcance"] = _normalize_number(extracted["max_range"])

    types = set(extracted.get("unit_types") or [])
    if "MythUnit" in types or "AbstractMythUnit" in types or proto.startswith("Titan"):
        row["fraco_contra"] = "Herói :aomr_type_hero_icon:"

    return row


def public_url_for_token(token: str, pantheon_id: int, icon_path: str) -> str:
    if token in ICON_URL_OVERRIDES:
        return ICON_URL_OVERRIDES[token]
    # Prefer und_sieges / god_power / unit_myths if already mapped
    existing = None
    if TOKEN_MAP.exists():
        existing = json.loads(TOKEN_MAP.read_text(encoding="utf-8")).get(token)
    if existing and (ROOT / "public" / existing.lstrip("/")).exists():
        return existing

    folder = PANTHEON_META[pantheon_id]["folder"]
    # Aztec-style lowercase for aztec folder; AoMR_ for others (match repo)
    if pantheon_id == 7:
        stem = token.replace("aomr_", "").replace("_icon", "")
        filename = f"{stem}_icon.webp"
    else:
        filename = token_to_asset_filename(token)
    return f"/assets/unit_humans/{folder}/{filename}"


def export_icon(
    *,
    token: str,
    icon_path: str,
    dest_webp: Path,
    game_dir: Path,
    crybar_exe: Path,
    dry_run: bool,
) -> str:
    if dest_webp.exists():
        return "skipped"
    if dry_run:
        return "would-export"
    texture_bar = game_dir / UI_TEXTURE_CACHE_BAR
    temp_dir = ROOT / "tools" / ".unit-icon-export"
    shutil.rmtree(temp_dir, ignore_errors=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    dds_entry = icon_path_to_dds_entry(icon_path)
    result = subprocess.run(
        [
            str(crybar_exe),
            "bar",
            "export",
            str(texture_bar),
            dds_entry,
            "-o",
            str(temp_dir),
            "--decompress",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return "missing"
    dds_files = list(temp_dir.rglob("*.dds"))
    if not dds_files:
        return "missing"
    convert = subprocess.run(
        [str(crybar_exe), "convert", "dds-to-png", str(dds_files[0])],
        capture_output=True,
        text=True,
    )
    if convert.returncode != 0:
        return "missing"
    png_files = list(dds_files[0].parent.glob("*.png"))
    if not png_files:
        return "missing"
    dest_webp.parent.mkdir(parents=True, exist_ok=True)
    try:
        png_to_webp(png_files[0], dest_webp)
    except Exception:
        return "missing"
    return "exported"


def update_token_map(updates: dict[str, str], *, dry_run: bool) -> int:
    mapping = json.loads(TOKEN_MAP.read_text(encoding="utf-8")) if TOKEN_MAP.exists() else {}
    changes = 0
    for token, url in sorted(updates.items()):
        if mapping.get(token) != url:
            mapping[token] = url
            changes += 1
    if changes and not dry_run:
        TOKEN_MAP.write_text(
            json.dumps(mapping, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changes


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", default=str(CACHE))
    parser.add_argument("--game-dir", default=str(DEFAULT_GAME_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    parser.add_argument(
        "--only-titans",
        action="store_true",
        help="Importa apenas os Titãs dos panteões",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args()

    cache = Path(args.cache_dir)
    game_dir = resolve_game_dir(args.game_dir)
    crybar = Path(args.crybar)

    specs: dict[str, tuple[int, int, str | None, str | None]] = dict(TITANS)
    if not args.only_titans:
        specs.update(CURATED)

    pt_rows = json.loads(PT_UNITS.read_text(encoding="utf-8"))
    en_rows = json.loads(EN_UNITS.read_text(encoding="utf-8"))
    building_ids = load_building_id_map(PT_CONS)
    next_id = next_catalog_id(pt_rows)

    added: list[str] = []
    skipped: list[str] = []
    icon_updates: dict[str, str] = {}
    icon_stats = {"exported": 0, "skipped": 0, "missing": 0, "would-export": 0}

    proto_units = {
        u.get("name"): u
        for u in ET.parse(cache / "gameplay" / "proto.xml").getroot().findall("unit")
        if u.get("name")
    }

    for proto, (pantheon_id, era_id, ingles_ov, nome_pt_ov) in specs.items():
        extracted_list = extract_units(
            cache, only_unit=proto, construcoes_path=PT_CONS
        )
        if not extracted_list:
            print(f"sem extract: {proto}")
            continue
        extracted = extracted_list[0]
        ingles = ingles_ov or extracted.get("ingles") or proto
        existing = catalog_has_unit(pt_rows, ingles)
        if existing and proto.startswith("Titan") and ingles_ov:
            # also check Cipactli-style already present
            pass
        if existing:
            skipped.append(f"{proto} (já id={existing.get('id')})")
            continue

        unit_id = next_id
        next_id += 1

        pt_row = build_row(
            extracted,
            locale="pt",
            unit_id=unit_id,
            pantheon_id=pantheon_id,
            era_id=era_id,
            ingles_override=ingles_ov,
            nome_pt_override=nome_pt_ov,
            building_ids=building_ids,
            proto=proto,
        )
        en_row = build_row(
            extracted,
            locale="en",
            unit_id=unit_id,
            pantheon_id=pantheon_id,
            era_id=era_id,
            ingles_override=ingles_ov,
            nome_pt_override=nome_pt_ov,
            building_ids=building_ids,
            proto=proto,
        )

        # Icon export / map
        icon_path = ""
        unit_el = proto_units.get(proto)
        if unit_el is not None:
            icon_path = (unit_el.findtext("icon") or "").strip()
        token = pt_row.get("icon") or (
            icon_token_from_path(icon_path) if icon_path else ""
        )
        if token:
            pt_row["icon"] = token
            en_row["icon"] = token
            url = public_url_for_token(token, pantheon_id, icon_path)
            dest = ROOT / "public" / url.lstrip("/")
            # If override already on disk, just map
            if dest.exists() or token in ICON_URL_OVERRIDES:
                icon_updates[token] = url
                if dest.exists():
                    icon_stats["skipped"] += 1
                elif icon_path and not dest.exists():
                    status = export_icon(
                        token=token,
                        icon_path=icon_path,
                        dest_webp=dest,
                        game_dir=game_dir,
                        crybar_exe=crybar,
                        dry_run=args.dry_run,
                    )
                    icon_stats[status] = icon_stats.get(status, 0) + 1
                    if status in ("exported", "would-export", "skipped"):
                        icon_updates[token] = url
            elif icon_path:
                status = export_icon(
                    token=token,
                    icon_path=icon_path,
                    dest_webp=dest,
                    game_dir=game_dir,
                    crybar_exe=crybar,
                    dry_run=args.dry_run,
                )
                icon_stats[status] = icon_stats.get(status, 0) + 1
                if status in ("exported", "would-export", "skipped"):
                    icon_updates[token] = url
                elif status == "missing":
                    print(f"  aviso: ícone ausente no bar para {proto} ({icon_path})")

        pt_rows.append(pt_row)
        en_rows.append(en_row)
        added.append(f"{proto} id={unit_id} | {pt_row['nome']}")
        print(
            f"+ {proto:28} id={unit_id:3} pant={pantheon_id} era={era_id} | "
            f"{pt_row['nome']}"
        )

    map_changes = update_token_map(icon_updates, dry_run=args.dry_run)
    print(f"\nAdicionadas: {len(added)}")
    print(f"Puladas: {len(skipped)}")
    for s in skipped[:20]:
        print(f"  - {s}")
    if len(skipped) > 20:
        print(f"  ... +{len(skipped) - 20}")
    print(f"ícones: {icon_stats} | token_map: {map_changes}")

    if args.dry_run:
        print("\nDry-run — nenhum arquivo escrito.")
        return 0

    PT_UNITS.write_text(
        json.dumps(pt_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    EN_UNITS.write_text(
        json.dumps(en_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("\nArquivos atualizados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
