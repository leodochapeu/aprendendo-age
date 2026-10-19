#!/usr/bin/env python3
"""
Gera o GLB estático de cada construção e inclui a maravilha de cada deus maior.

Exemplos:
  python scripts/extract-building-models-aom.py --ids 1
  python scripts/extract-building-models-aom.py --all
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_building_extractor import parse_proto_buildings  # noqa: E402
from aom_building_merge import resolve_proto_name  # noqa: E402
from aom_building_model import PANTHEON_CULTURE, anim_for, bake_building_glb  # noqa: E402
from aom_game_paths import DEFAULT_CACHE_DIR, DEFAULT_CRYBAR, resolve_game_dir  # noqa: E402
from aom_unit_extractor import ensure_bar_extracted  # noqa: E402
from aom_unit_merge import parse_id_range  # noqa: E402
from aom_unit_model import WORK_ROOT, BarIndex  # noqa: E402

PUBLIC_MODELS = ROOT / "public" / "assets" / "building-models"
MANIFEST_PATH = ROOT / "src" / "data" / "building_models.json"
PT_BUILDINGS = ROOT / "src" / "data" / "locale" / "pt" / "construcoes.json"
EN_BUILDINGS = ROOT / "src" / "data" / "locale" / "en" / "construcoes.json"
PT_GODS = ROOT / "src" / "data" / "locale" / "pt" / "deuses_aom.json"
EN_GODS = ROOT / "src" / "data" / "locale" / "en" / "deuses_aom.json"
WONDER_COPY = (
    "tipo",
    "pontos_de_vida",
    "dps",
    "armadura_anticorte",
    "armadura_antiperfurante",
    "armadura_anticontucao",
    "armadura_anticontusao",
    "madeira",
    "ouro",
    "custo",
    "tempo_construir_segundos",
    "era",
    "era_id",
    "icon",
)


def _slug(proto: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in proto)
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-") or "building"


# O catálogo em inglês não usa o nome do ramo Civ (Frog para Rá, Cronos, Urano, Frey).
CIV_ALIASES = {
    "ra": "ra",
    "cronos": "kronos",
    "kronos": "kronos",
    "urano": "oranos",
    "oranos": "oranos",
    "frey": "freyr",
    "freyr": "freyr",
}
EN_GOD_NAME = {
    "ra": "Ra",
    "kronos": "Kronos",
    "oranos": "Oranos",
    "freyr": "Freyr",
}


def _civ_key(name: str) -> str:
    normalized = unicodedata.normalize("NFD", name)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    key = re.sub(r"[^a-z0-9]", "", stripped.lower())
    return CIV_ALIASES.get(key, key)


def _load(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def _save(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _wonder_civ(ingles: str, proto: str) -> str | None:
    if proto not in {"Wonder", "MonumentToGods"}:
        return None
    match = re.search(r"\(([^)]+)\)\s*$", ingles)
    if not match:
        return None
    return _civ_key(match.group(1))


def ensure_god_wonders(buildings: dict[str, Any]) -> int:
    """Acrescenta uma ficha por maravilha de deus maior. A ficha genérica permanece."""
    pt = _load(PT_BUILDINGS)
    en = _load(EN_BUILDINGS)
    en_gods = {row["id"]: row for row in _load(EN_GODS)}
    existing = {(row.get("ingles") or "").strip() for row in pt}
    pt_pantheon = {row.get("panteao_id"): row.get("panteao") for row in pt if row.get("panteao_id")}
    en_pantheon = {row.get("panteao_id"): row.get("panteao") for row in en if row.get("panteao_id")}
    pt_wonder = next(row for row in pt if row.get("ingles") == "Wonder" and not _wonder_civ("Wonder", "Wonder"))
    en_wonder = next(row for row in en if row.get("id") == pt_wonder["id"])
    next_id = max(row["id"] for row in pt) + 1
    added = 0
    gods = [row for row in _load(PT_GODS) if row.get("hierarquia") == "Maior"]
    gods.sort(key=lambda row: ((row.get("panteao") or [{}])[0].get("id") or 0, row["id"]))
    for god in gods:
        pantheon_id = (god.get("panteao") or [{}])[0].get("id")
        culture = PANTHEON_CULTURE.get(pantheon_id)
        unit = buildings.get("Wonder")
        if culture is None or unit is None:
            continue
        en_name = (en_gods.get(god["id"]) or {}).get("nome") or god["nome"]
        tags = _civ_tags(unit, culture)
        civ = None
        for candidate in (god["nome"], en_name):
            key = _civ_key(candidate)
            if tags is None or key in tags:
                civ = key
                break
        if civ is None:
            continue
        en_label = en_name if _civ_key(en_name) == civ else EN_GOD_NAME.get(civ, god["nome"])
        ingles = f"Wonder ({en_label})"
        if ingles in existing:
            continue
        pt_row = {key: pt_wonder[key] for key in WONDER_COPY if key in pt_wonder}
        pt_row.update(
            {
                "id": next_id,
                "nome": f"Maravilha ({god['nome']})",
                "ingles": ingles,
                "panteao": pt_pantheon.get(pantheon_id) or pt_wonder.get("panteao"),
                "panteao_id": pantheon_id,
            }
        )
        en_row = {key: en_wonder[key] for key in WONDER_COPY if key in en_wonder}
        en_row.update(
            {
                "id": next_id,
                "nome": ingles,
                "ingles": ingles,
                "panteao": en_pantheon.get(pantheon_id) or en_wonder.get("panteao"),
                "panteao_id": pantheon_id,
            }
        )
        pt.append(pt_row)
        en.append(en_row)
        existing.add(ingles)
        next_id += 1
        added += 1
        print(f"  maravilha: {pt_row['nome']}")
    if added:
        _save(PT_BUILDINGS, pt)
        _save(EN_BUILDINGS, en)
    return added


def _civ_tags(unit: Any, culture: str) -> set[str] | None:
    """Ramos Civ do anim da maravilha. None quando o XML ainda não foi exportado."""
    rel = anim_for(unit, culture)
    if not rel:
        return set()
    safe = re.sub(r"[^a-z0-9._-]+", "_", rel.replace("\\", "/").lower()).strip("_")
    xml_path = WORK_ROOT / "xml" / safe / "anim.xml"
    if not xml_path.exists():
        return None
    root = __import__("xml.etree.ElementTree", fromlist=["ElementTree"]).parse(xml_path).getroot()
    tags: set[str] = set()
    for elem in root.iter():
        if elem.tag.split("}")[-1].lower() != "logic":
            continue
        if (elem.get("type") or "").lower() != "civ":
            continue
        for child in elem:
            tags.add(child.tag.split("}")[-1].lower())
    return tags


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai modelos 3D das construções do AoM Retold")
    parser.add_argument("--game-dir", default=None)
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    parser.add_argument("--ids", help="ID(s) do catálogo: 1,3 ou 1-20")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--force-extract", action="store_true")
    parser.add_argument("--skip-wonders", action="store_true")
    args = parser.parse_args()
    if not args.all and not args.ids:
        print("Informe --ids ou --all.", file=sys.stderr)
        return 1

    game_dir = resolve_game_dir(args.game_dir)
    cache_dir = Path(args.cache_dir).resolve()
    crybar = Path(args.crybar).resolve()
    try:
        ensure_bar_extracted(game_dir=game_dir, cache_dir=cache_dir, crybar_exe=crybar, force=args.force_extract)
    except FileNotFoundError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    proto_path = cache_dir / "gameplay" / "proto.xml"
    buildings = parse_proto_buildings(proto_path)
    if args.all and not args.skip_wonders:
        print("Maravilhas por deus...")
        # A checagem de ramo usa o XML já em cache. Sem o arquivo, deixa entrar e o bake valida.
        added = ensure_god_wonders(buildings)
        print(f"  novas fichas: {added}")

    catalog = _load(PT_BUILDINGS)
    index = {name: {} for name in buildings}
    id_filter = parse_id_range(args.ids)
    selected: list[tuple[dict[str, Any], str, str, str | None]] = []
    for row in catalog:
        if id_filter is not None and row.get("id") not in id_filter:
            continue
        proto = resolve_proto_name(row.get("ingles") or row.get("nome") or "", index)
        if not proto and str(row.get("ingles") or "").startswith("Wonder ("):
            proto = "Wonder"
        if not proto or proto not in buildings:
            print(f"  sem proto: {row.get('id')} {row.get('nome')}")
            continue
        culture = PANTHEON_CULTURE.get(row.get("panteao_id"))
        anim = anim_for(buildings[proto], culture)
        if not anim:
            print(f"  sem animfile: {proto}")
            continue
        civ = _wonder_civ(row.get("ingles") or "", proto)
        if proto == "Wonder" and civ is None:
            continue
        selected.append((row, proto, anim, civ))

    if not selected:
        print("Nenhuma construção selecionada.", file=sys.stderr)
        return 1

    print(f"Indexando arquivos do jogo ({len(selected)} construções)...")
    bars = BarIndex(game_dir, crybar, WORK_ROOT)
    PUBLIC_MODELS.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    if MANIFEST_PATH.exists() and not args.all:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    ok = 0
    for index_no, (row, proto, anim, civ) in enumerate(selected, start=1):
        unit_id = str(row["id"])
        filename = f"{unit_id}-{_slug(proto if not civ else proto + '-' + civ)}.glb"
        dest = PUBLIC_MODELS / filename
        print(f"[{index_no}/{len(selected)}] {row.get('nome')} -> {filename}")
        if dest.exists() and not args.force:
            manifest[unit_id] = f"/assets/building-models/{filename}"
            ok += 1
            continue
        try:
            info = bake_building_glb(bars, anim, dest, era_id=row.get("era_id"), civ=civ)
        except Exception as exc:  # noqa: BLE001 — uma construção ruim não para o lote
            print(f"  falhou: {exc}")
            continue
        manifest[unit_id] = f"/assets/building-models/{filename}"
        ok += 1
        print(f"  {info['visual']} ({info['bytes']} bytes)")
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{ok}/{len(selected)} modelos em {PUBLIC_MODELS}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
