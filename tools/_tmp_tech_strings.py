#!/usr/bin/env python3
import re
from pathlib import Path

# sample tech from techtree
tech = Path("tools/aom-extracted/gameplay/techtree.xml").read_text(encoding="utf-8", errors="replace")
# find Masons or Husbandry
for name in ("Masons", "Husbandry", "CopperWeapons", "Sarissa"):
    m = re.search(rf'<tech\s+name="{name}"[^>]*>(.*?)</tech>', tech, re.S)
    if not m:
        print(name, "NOT FOUND")
        continue
    block = m.group(0)[:1200]
    print("=" * 40, name)
    print(block)

en = Path("tools/aom-extracted/strings/English/string_table.txt").read_text(encoding="utf-8")
for k in (
    "STR_TECH_MASONS_NAME",
    "STR_TECH_MASONS",
    "STR_TECH_MASONS_LR",
    "STR_TECH_MASONS_SR",
    "STR_HISTORY_TECH_MASONS",
):
    m = re.search(rf'ID\s*=\s*"{k}"\s*;\s*Str\s*=\s*"(.*)"\s*(?:;|$)', en)
    print(k, "->", (m.group(1)[:120] if m else None))

# count SR vs LR for tech
sr = len(re.findall(r'STR_TECH_[A-Z0-9_]+_SR"', en))
lr = len(re.findall(r'STR_TECH_[A-Z0-9_]+_LR"', en))
hist = len(re.findall(r'STR_HISTORY_TECH', en))
print("tech SR", sr, "LR", lr, "HISTORY_TECH", hist)
