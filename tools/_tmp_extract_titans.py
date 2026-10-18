#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))
from aom_game_paths import DEFAULT_CACHE_DIR
from aom_unit_extractor import extract_units

CACHE = Path(DEFAULT_CACHE_DIR)
CONS = ROOT / "src/data/locale/pt/construcoes.json"
for p in [
    "TitanCerberus",
    "TitanBird",
    "TitanYmir",
    "TitanAtlantean",
    "TitanXingTian",
    "TitanYamataNoOrochi",
]:
    rows = extract_units(CACHE, only_unit=p, construcoes_path=CONS)
    if not rows:
        print(p, "NONE")
        continue
    r = rows[0]
    keys = [
        k
        for k in r
        if k.startswith("dano") or k.startswith("armadura") or k in ("icon", "ingles", "nome", "dps", "pontos_de_vida", "velocidade_de_ataque_atk_s", "panteao")
    ]
    print(p, {k: r.get(k) for k in sorted(keys)})
    print("  multiplicador", r.get("multiplicador"))
