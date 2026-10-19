#!/usr/bin/env python3
import re
from pathlib import Path

en = Path("tools/aom-extracted/strings/English/string_table.txt").read_text(encoding="utf-8")
pt = Path("tools/aom-extracted/strings/PortugueseBrazil/string_table.txt").read_text(
    encoding="utf-8"
)


def get(table: str, key: str) -> str | None:
    m = re.search(rf'ID\s*=\s*"{re.escape(key)}"\s*;\s*Str\s*=\s*"(.*)"\s*(?:;|$)', table)
    return m.group(1) if m else None


for k in [
    "STR_TECH_MASONS_LR",
    "STR_TECH_HAND_AXE_LR",
    "STR_MAP_ALFHEIM_DESC",
    "STR_MAP_ALFHEIM_DESC_LOAD",
]:
    print(k)
    print(" EN:", get(en, k))
    print(" PT:", get(pt, k))
    print()

srs = re.findall(r'ID\s*=\s*"(STR_TECH_[^"]+_SR)"', en)
print("tech SR count", len(srs), srs[:8])
hts = re.findall(r'ID\s*=\s*"(STR_HISTORY_[^"]*TECH[^"]*)"', en)
print("history*tech", len(hts), hts[:8])
