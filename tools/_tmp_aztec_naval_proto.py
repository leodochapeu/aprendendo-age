#!/usr/bin/env python3
"""Lista unidades navais/civis aztecas no proto e techs ligadas."""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

from aom_string_table import parse_string_table
from aom_unit_extractor import detect_pantheon, is_exportable_unit

CACHE = ROOT / "tools" / "aom-extracted"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    proto = ET.parse(CACHE / "gameplay" / "proto.xml")
    strings = parse_string_table(CACHE / "strings" / "English" / "string_table.txt")
    strings_pt = parse_string_table(
        CACHE / "strings" / "PortugueseBrazil" / "string_table.txt"
    )

    keywords = (
        "Canoe",
        "Villager",
        "Settler",
        "Fish",
        "Transport",
        "Anaconda",
        "Scorpion",
        "Tlacanex",
        "Jaguar",
        "Heart",
    )
    print("=== proto match keywords (pantheon 7 or name match) ===")
    for unit in proto.getroot().findall("unit"):
        name = unit.get("name") or ""
        pant = detect_pantheon(unit)
        pid = pant.get("id") if pant else None
        if pid != 7 and not any(k.lower() in name.lower() for k in keywords):
            continue
        if pid != 7 and "Aztec" not in name and not any(
            k in name
            for k in (
                "ArrowCanoe",
                "Tepoztli",
                "Atlatl",
                "VillagerAztec",
                "AnacondaCoatlicue",
                "Tlacanex",
                "LargeScorpion",
                "JaguarRider",
            )
        ):
            continue
        display = unit.findtext("displaynameid") or ""
        types = sorted(
            {n.text.strip() for n in unit.findall("unittype") if n.text}
        )
        train = [t.text for t in unit.findall("train") if t.text]
        costs = {
            c.get("resourcetype"): c.text for c in unit.findall("cost") if c.get("resourcetype")
        }
        print(
            f"{name:32} pant={pid} export={is_exportable_unit(unit)} "
            f"en={strings.get(display, '?')} pt={strings_pt.get(display, '?')} "
            f"types={types} cost={costs} train={train}"
        )

    # techtree enable for missing candidates
    tt = ET.parse(CACHE / "gameplay" / "techtree.xml")
    targets = {
        "VillagerAztec",
        "ArrowCanoe",
        "TepoztliCanoe",
        "AtlatlSiegeCanoe",
        "LargeScorpion",
        "Tlacanexquimilli",
        "AnacondaCoatlicue",
        "JaguarRider",
        "WarriorPriestHeart",
    }
    print("\n=== techtree EffectUnit / ProtoUnit mentions ===")
    for tech in tt.getroot().findall("tech"):
        tname = tech.get("name") or ""
        hits = []
        for eff in tech.iter():
            for attr in ("unit", "protounit", "proto"):
                val = eff.get(attr)
                if val in targets:
                    hits.append((eff.tag, attr, val, eff.get("status"), eff.get("relativity")))
            if (eff.text or "").strip() in targets:
                hits.append((eff.tag, "text", eff.text.strip(), None, None))
        if hits:
            print(f"{tname}: {hits[:8]}")


if __name__ == "__main__":
    main()
