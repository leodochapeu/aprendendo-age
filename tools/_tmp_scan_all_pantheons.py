#!/usr/bin/env python3
"""Varredura proto vs catálogo para todos os panteões."""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

from aom_proto_maps import PANTHEON_FROM_PATH
from aom_string_table import parse_string_table
from aom_unit_extractor import detect_pantheon, is_exportable_unit
from aom_unit_merge import CATALOG_PROTO_ALIASES, _compact_key, resolve_proto_name

CACHE = ROOT / "tools" / "aom-extracted"

PANTHEON_BY_ID = {m["id"]: m for m in PANTHEON_FROM_PATH.values()}

SKIP_SUBSTR = (
    "Cheat",
    "SPC",
    "CG",
    "Mutant",
    "Idol",
    "Dummy",
    "Rabbits",
    "Injured",
    "Wounded",
    "Snakeless",
    "Carrying",
    "Dismounted",
    "Elixir",
    "Preview",
    "Dead",
    "Hammer",
    "Gate",
)


def should_skip_variant(name: str) -> bool:
    if name.startswith("Super") or name.startswith("Teixiptla"):
        return True
    if any(s in name for s in SKIP_SUBSTR):
        return True
    # campaign / scenario heroes often have no cost and no train — still list separately
    return False


def catalog_pantheon_id(row: dict) -> int | None:
    p = row.get("panteao")
    if isinstance(p, dict):
        return p.get("id")
    if isinstance(p, list) and p and isinstance(p[0], dict):
        return p[0].get("id")
    return None


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    proto = ET.parse(CACHE / "gameplay" / "proto.xml")
    strings_en = parse_string_table(CACHE / "strings" / "English" / "string_table.txt")
    strings_pt = parse_string_table(
        CACHE / "strings" / "PortugueseBrazil" / "string_table.txt"
    )

    all_protos = {
        u.get("name"): u for u in proto.getroot().findall("unit") if u.get("name")
    }
    stub_all = {n: {} for n in all_protos}

    game_by_pantheon: dict[int, list[dict]] = {i: [] for i in range(1, 8)}
    titans: list[dict] = []

    for name, unit in all_protos.items():
        types = {n.text.strip() for n in unit.findall("unittype") if n.text}
        is_titan = "AbstractTitan" in types
        if not is_exportable_unit(unit) and not is_titan:
            continue
        pantheon = detect_pantheon(unit)
        if not pantheon and not is_titan:
            continue
        display = unit.findtext("displaynameid") or ""
        row = {
            "proto": name,
            "en": strings_en.get(display, name),
            "pt": strings_pt.get(display, name),
            "types": sorted(types),
            "pantheon_id": pantheon["id"] if pantheon else None,
            "is_titan": is_titan,
            "icon": (unit.findtext("icon") or "").strip(),
        }
        if is_titan and "Gate" not in name and "Hammer" not in name and "Preview" not in name and "Dead" not in name:
            titans.append(row)
        if pantheon:
            game_by_pantheon[pantheon["id"]].append(row)

    cat = json.loads(
        (ROOT / "src/data/locale/pt/unidades_aom.json").read_text(encoding="utf-8")
    )
    cat_by_pantheon: dict[int, list[dict]] = {i: [] for i in range(1, 8)}
    for row in cat:
        pid = catalog_pantheon_id(row)
        if pid in cat_by_pantheon:
            cat_by_pantheon[pid].append(row)

    print("=== RESUMO POR PANTEÃO ===")
    for pid in range(1, 8):
        meta = PANTHEON_BY_ID[pid]
        game = game_by_pantheon[pid]
        catalog = cat_by_pantheon[pid]
        matched = 0
        missing = []
        for gu in game:
            if should_skip_variant(gu["proto"]):
                continue
            found = False
            for row in catalog:
                resolved = resolve_proto_name(row.get("ingles") or "", stub_all)
                if resolved == gu["proto"]:
                    found = True
                    break
                if _compact_key(row.get("ingles") or "") in {
                    _compact_key(gu["en"]),
                    _compact_key(gu["proto"]),
                }:
                    found = True
                    break
            if found:
                matched += 1
            else:
                missing.append(gu)

        # classify missing
        relevant = []
        campaignish = []
        for u in missing:
            types = set(u["types"])
            myth = "MythUnit" in types or "AbstractMythUnit" in types
            hero = "Hero" in types or "AbstractHero" in types
            titan = u["is_titan"]
            # no cost often = campaign
            unit_el = all_protos[u["proto"]]
            costs = list(unit_el.findall("cost"))
            tag = "TITAN" if titan else ("MU" if myth else ("HERO" if hero else "HUM"))
            entry = (tag, u)
            if titan or costs or "LogicalTypeTrainableMythUnit" in types:
                relevant.append(entry)
            elif hero and not costs:
                campaignish.append(entry)
            else:
                relevant.append(entry)

        print(
            f"\n{meta['nome']} (id={pid}): jogo_export={len(game)} catálogo={len(catalog)} "
            f"match≈{matched} faltando_relevantes={len(relevant)} campanha≈{len(campaignish)}"
        )
        for tag, u in relevant:
            print(f"  [{tag}] {u['proto']:36} | {u['en']}")
        if campaignish:
            print(f"  --- campanha/sem custo ({len(campaignish)}) — omitidos no detalhe ---")

    print("\n=== TODOS OS TITÃS (AbstractTitan jogáveis) ===")
    for t in sorted(titans, key=lambda x: (x["pantheon_id"] or 99, x["proto"])):
        pid = t["pantheon_id"]
        pname = PANTHEON_BY_ID.get(pid, {}).get("nome", "?") if pid else "?"
        in_cat = any(
            resolve_proto_name(r.get("ingles") or "", stub_all) == t["proto"]
            or _compact_key(r.get("ingles") or "")
            in {_compact_key(t["en"]), _compact_key(t["proto"])}
            or "cipactli" in (r.get("ingles") or "").lower()
            and t["proto"] == "TitanCipactli"
            for r in cat
        )
        mark = "OK" if in_cat else "MISS"
        print(
            f"  [{mark}] pant={pid}/{pname:8} {t['proto']:28} | {t['en']:20} | {t['pt']}"
        )
        if t["icon"]:
            print(f"         icon={t['icon']}")


if __name__ == "__main__":
    main()
