#!/usr/bin/env python3
import re
from pathlib import Path

en = Path("tools/aom-extracted/strings/English/string_table.txt").read_text(encoding="utf-8")
# map-related history and rollover
pats = [
    r'STR_HISTORY_MAP[A-Z0-9_]*',
    r'STR_MAP_[A-Z0-9_]+',
    r'STR_RM_[A-Z0-9_]+',
    r'STR_RANDOM_MAP[A-Z0-9_]*',
]
for pat in pats:
    keys = sorted(set(re.findall(pat, en)))
    print(pat, len(keys))
    for k in keys[:15]:
        print(" ", k)
    if len(keys) > 15:
        print("  ...")

# sample alfheim / acropolis
for needle in ("ALFHEIM", "ACROPOLIS", "ANATOLIA", "Elysium", "ELISIUM"):
    hits = re.findall(rf'ID\s*=\s*"(STR_[^"]*{needle}[^"]*)"', en, flags=re.I)
    print("needle", needle, hits[:20])
