#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "tools" / "aom-extracted"
tt = ET.parse(CACHE / "gameplay" / "techtree.xml")
targets = {"LargeScorpion", "Tlacanexquimilli", "AnacondaCoatlicue", "TeixiptlaHuitz", "TeixiptlaTezca", "TeixiptlaQuetz", "CaravanAztec"}
for tech in tt.getroot().findall("tech"):
    tname = tech.get("name") or ""
    blob = ET.tostring(tech, encoding="unicode")
    hits = [t for t in targets if t in blob]
    if hits:
        god = tech.findtext("godpower") or tech.get("researchlocation") or ""
        print(f"{tname}: {hits}")
