#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, "scripts/lib")
from aom_string_table import parse_string_table

en = parse_string_table(Path("tools/aom-extracted/strings/English/string_table.txt"))
pt = parse_string_table(Path("tools/aom-extracted/strings/PortugueseBrazil/string_table.txt"))

for k in [
    "STR_TECH_MASONS_LR",
    "STR_TECH_HAND_AXE_LR",
    "STR_TECH_MASONS_NAME",
    "STR_MAP_ALFHEIM_DESC",
    "STR_MAP_ALFHEIM_DESC_LOAD",
    "STR_HISTORY_TECHS_MASONS",
    "STR_HISTORY_TECHS_HANDAXE",
]:
    print(k)
    print(" EN:", (en.get(k) or "")[:220])
    print(" PT:", (pt.get(k) or "")[:220])
    print()

srs = [k for k in en if k.startswith("STR_TECH_") and k.endswith("_SR")]
print("tech SR", len(srs), srs[:5])
hts = [k for k in en if k.startswith("STR_HISTORY_TECHS_")]
print("HISTORY_TECHS", len(hts))
print("sample hist", hts[0], "->", en[hts[0]][:100])
