#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))
from aom_game_paths import DEFAULT_CACHE_DIR
from aom_unit_extractor import extract_units

CACHE = Path(DEFAULT_CACHE_DIR)
CONS = ROOT / "src/data/locale/pt/construcoes.json"
protos = [
    "VillagerAztec",
    "ArrowCanoe",
    "TepoztliCanoe",
    "AtlatlSiegeCanoe",
    "TeixiptlaHuitz",
    "TeixiptlaTezca",
    "TeixiptlaQuetz",
    "FishingShipAztec",
    "TransportShipAztec",
    "LargeScorpion",
    "Tlacanexquimilli",
    "AnacondaCoatlicue",
    "CaravanAztec",
]
for p in protos:
    rows = extract_units(CACHE, only_unit=p, construcoes_path=CONS)
    if not rows:
        print(f"{p}: NONE")
        continue
    r = rows[0]
    print(
        f"{p}: icon={r.get('icon')} en={r.get('ingles')} pt={r.get('nome')} "
        f"hp={r.get('pontos_de_vida')} tipo={r.get('tipo')} "
        f"era={r.get('era')} train={r.get('construcao')} "
        f"food={r.get('comida')} wood={r.get('madeira')} gold={r.get('ouro')} favor={r.get('favor')}"
    )
