#!/usr/bin/env python3
"""Compara unidades aztecas exportáveis do proto com o catálogo."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

from aom_string_table import parse_string_table  # noqa: E402
from aom_unit_extractor import detect_pantheon, is_exportable_unit  # noqa: E402
from aom_unit_merge import CATALOG_PROTO_ALIASES, _compact_key, resolve_proto_name  # noqa: E402

CACHE = ROOT / "tools" / "aom-extracted"


def compact(value: str) -> str:
    return _compact_key(value)


def main() -> None:
    proto = ET.parse(CACHE / "gameplay" / "proto.xml")
    strings_en = parse_string_table(CACHE / "strings" / "English" / "string_table.txt")
    strings_pt = parse_string_table(
        CACHE / "strings" / "PortugueseBrazil" / "string_table.txt"
    )

    game_units: list[dict] = []
    for unit in proto.getroot().findall("unit"):
        name = unit.get("name") or ""
        if not is_exportable_unit(unit):
            continue
        pantheon = detect_pantheon(unit)
        if not pantheon or pantheon.get("id") != 7:
            continue
        display = unit.findtext("displaynameid") or ""
        types = {n.text.strip() for n in unit.findall("unittype") if n.text}
        flags = {n.text.strip() for n in unit.findall("flag") if n.text}
        game_units.append(
            {
                "proto": name,
                "en": strings_en.get(display, name),
                "pt": strings_pt.get(display, name),
                "types": sorted(types),
                "flags": sorted(flags),
            }
        )

    cat = json.loads(
        (ROOT / "src/data/locale/pt/unidades_aom.json").read_text(encoding="utf-8")
    )
    az_cat = [
        r
        for r in cat
        if isinstance(r.get("panteao"), list)
        and any(p.get("id") == 7 for p in r["panteao"] if isinstance(p, dict))
    ]

    stub = {u["proto"]: {} for u in game_units}
    # also allow full proto name set for resolve
    all_protos = {u.get("name") for u in proto.getroot().findall("unit") if u.get("name")}
    stub_all = {n: {} for n in all_protos}

    matched: list[tuple[dict, dict]] = []
    missing: list[dict] = []
    for gu in game_units:
        # match by proto / english
        found = None
        for row in az_cat:
            resolved = resolve_proto_name(row.get("ingles") or "", stub_all)
            if resolved == gu["proto"]:
                found = row
                break
            if compact(row.get("ingles") or "") in {
                compact(gu["en"]),
                compact(gu["proto"]),
            }:
                found = row
                break
            if compact(row.get("nome") or "") == compact(gu["pt"]):
                found = row
                break
        if found:
            matched.append((gu, found))
        else:
            missing.append(gu)

    # catalog aztec without game match
    matched_ids = {m[1].get("id") for m in matched}
    orphan_cat = [r for r in az_cat if r.get("id") not in matched_ids]

    print(f"Jogo (exportável, panteão 7): {len(game_units)}")
    print(f"Catálogo panteão 7: {len(az_cat)}")
    print(f"Match: {len(matched)}")
    print(f"Faltando no catálogo: {len(missing)}")
    for u in missing:
        myth = "MythUnit" in u["types"] or "AbstractMythUnit" in u["types"]
        hero = "Hero" in u["types"] or "AbstractHero" in u["types"]
        tag = "MU" if myth else ("HERO" if hero else "HUM")
        print(f"  [{tag}] {u['proto']:40} | {u['en']}")

    print(f"\nNo catálogo sem match no jogo: {len(orphan_cat)}")
    for r in orphan_cat:
        print(f"  id={r.get('id')} {r.get('ingles')} / {r.get('nome')}")

    # Suggest skip patterns among missing
    skip_hints = []
    for u in missing:
        p = u["proto"]
        if any(
            x in p
            for x in (
                "SPC",
                "CG",
                "Cheat",
                "Idol",
                "Mutant",
                "Dummy",
                "Rabbits",
                "Teixiptla",
            )
        ):
            skip_hints.append(p)
    print(f"\nProváveis skip (variantes): {skip_hints}")


if __name__ == "__main__":
    main()
