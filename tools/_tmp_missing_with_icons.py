#!/usr/bin/env python3
"""Lista faltantes relevantes que já têm (ou não) token no map."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))
from aom_game_paths import DEFAULT_CACHE_DIR
from aom_unit_extractor import extract_units, unit_icon_token
import xml.etree.ElementTree as ET
from aom_unit_extractor import detect_pantheon, is_exportable_unit

CACHE = Path(DEFAULT_CACHE_DIR)
token_map = json.loads((ROOT / "src/data/token_asset_map.json").read_text(encoding="utf-8"))

CURATED = [
    # Greek
    "VillagerGreek", "Kataskopos", "Militia", "Petrobolos", "Helepolis",
    "Hippocampus", "Scylla", "Carcinos", "Trireme", "Pentekonter", "Juggernaut",
    "TitanCerberus", "AmazonArcher",
    # Egyptian
    "VillagerEgyptian", "Mercenary", "MercenaryCavalry", "SiegeTower", "Catapult",
    "Roc", "Leviathan", "WarTurtle", "PhoenixEgg", "Kebenit", "RammingGalley",
    "WarBarge", "TitanBird", "Minion",
    # Norse
    "VillagerNorse", "VillagerDwarf", "PortableRam", "Ballista", "Kraken",
    "Nidhogg", "JormunElver", "FimbulwinterWolf", "Longboat", "Dreki",
    "DragonShip", "TitanYmir", "GullinburstiClassical",
    # Atlantean
    "VillagerAtlantean", "Destroyer", "DestroyerHero", "FireSiphon", "Carnivora",
    "WaterCarnivora", "PrometheanOffspring", "Servant", "Dryad", "Nereid",
    "TartarianSpawn", "ManOWar", "TitanAtlantean", "Bireme", "FireShip",
    "SiegeBireme",
    # Chinese
    "VillagerChinese", "Kuafu", "TerracottaRider", "QingQi", "GongQi",
    "SiegeCrossbow", "AxeCart", "PiXiu", "ChiWen", "XuanWu", "Fei", "YingLong",
    "TitanXingTian", "DouJian", "MengChong", "LouChuan",
    # Japanese
    "VillagerJapanese", "SamuraiHatamoto", "Sakimori", "BushiYari", "Oyumi",
    "OnnaMusha", "Shogun", "Honengyo", "Umibozu", "TitanYamataNoOrochi",
    "Wasen", "RammingWasen", "Junkozosen", "MasterlessSword", "Wretch",
    "Tanuki", "Kappa",
]

proto = ET.parse(CACHE / "gameplay" / "proto.xml")
units = {u.get("name"): u for u in proto.getroot().findall("unit") if u.get("name")}

print(f"{'proto':32} {'token':40} mapped  file")
for name in CURATED:
    unit = units.get(name)
    if not unit:
        print(f"{name:32} MISSING_PROTO")
        continue
    icon_path = (unit.findtext("icon") or "").strip()
    from aom_unit_extractor import icon_token_from_path
    token = unit_icon_token(icon_path) or icon_token_from_path(icon_path)
    url = token_map.get(token)
    exists = False
    if url:
        exists = (ROOT / "public" / url.lstrip("/")).exists()
    print(f"{name:32} {token:40} {bool(url)!s:5}  {exists}")
