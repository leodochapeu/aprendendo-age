#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, "scripts/lib")
from aom_string_table import parse_string_table

pt = parse_string_table(Path("tools/aom-extracted/strings/PortugueseBrazil/string_table.txt"))
en = parse_string_table(Path("tools/aom-extracted/strings/English/string_table.txt"))

keys = sorted(k for k in en if k.startswith("STR_EFFECT_"))
print("count", len(keys))
for k in keys:
    if any(
        x in k
        for x in (
            "WORKRATE",
            "CARRY",
            "HITPOINTS",
            "DAMAGE",
            "ARMOR",
            "COST",
            "TRAIN",
            "RANGE",
            "SPEED",
        )
    ):
        print(f"{k}")
        print(f"  EN {en[k]}")
        print(f"  PT {pt.get(k, '')}")
