#!/usr/bin/env python3
"""GLBs das variantes de Casa, Muralha e Torre de Sentinela."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_building_model import bake_building_glb, visual_primitives  # noqa: E402
from aom_game_paths import DEFAULT_CRYBAR, resolve_game_dir  # noqa: E402
from aom_unit_model import WORK_ROOT, BarIndex, write_static_glb  # noqa: E402

PUBLIC = ROOT / "public" / "assets" / "building-models" / "variants"
MANIFEST = ROOT / "src" / "data" / "building_variants.json"
WOOD = "shared/buildings/wall/wall_wooden/wall_wooden_short"
SENTRY = "shared/buildings/sentry_tower/sentry_tower"

# Casas: primeira variação, era arcaica. Atlante usa Mansão, não Casa.
HOUSES = {
    1: "greek/buildings/house/house.xml",
    2: "egyptian/buildings/house/house.xml",
    3: "norse/buildings/house/house.xml",
    5: "chinese/buildings/house/house.xml",
    6: "japanese/buildings/house/house.xml",
    7: "aztec/buildings/house/house.xml",
}

# tag, rank, panteões, malha. "base" é o prédio sem upgrade.
WALLS: list[tuple[str, int, list[int], str]] = [
    ("base", 0, [1, 2, 3, 4, 5, 6, 7], WOOD),
    ("stonewall", 1, [1], "greek/buildings/wall/wall_stone/wall_stone_g_short"),
    ("fortifiedwall", 2, [1], "greek/buildings/wall/wall_fortified/wall_fortified_g_short"),
    ("stonewall", 1, [2], "egyptian/buildings/wall/wall_stone/wall_stone_e_short"),
    ("fortifiedwall", 2, [2], "egyptian/buildings/wall/wall_fortified/wall_fortified_e_short"),
    ("citadelwall", 3, [2], "egyptian/buildings/wall/wall_citadel/wall_citadel_short"),
    ("stonewall", 1, [3], "norse/buildings/wall/wall_stone/wall_stone_n_short"),
    ("stonewall", 1, [4], "atlantean/buildings/wall/wall_stone/wall_stone_a_short"),
    ("bronzewall", 2, [4], "atlantean/buildings/wall/wall_bronze/wall_bronze_short"),
    ("ironwall", 3, [4], "atlantean/buildings/wall/wall_iron/wall_iron_short"),
    ("orichalcumwall", 4, [4], "atlantean/buildings/wall/wall_orichalcum/wall_orichalcum_short"),
    ("stonewall", 1, [5], "chinese/buildings/wall/wall_stone/wall_stone_c_short"),
    ("fortifiedwall", 2, [5], "chinese/buildings/wall/wall_fortified/wall_fortified_c_short"),
    ("greatwall", 3, [5], "chinese/buildings/wall/wall_great/wall_great_short"),
    ("stonewall", 1, [6], "japanese/buildings/wall/wall_stone/wall_stone_j_short"),
    ("fortifiedwall", 2, [6], "japanese/buildings/wall/wall_fortified/wall_fortified_j_short"),
    ("stonewall", 1, [7], "aztec/buildings/wall/wall_stone/wall_stone_z_short"),
]

TOWERS: list[tuple[str, int, list[int], str]] = [
    ("base", 0, [1, 2, 3, 4, 5, 6], SENTRY),
    ("watchtower", 1, [1], "greek/buildings/tower/watch_tower/watch_tower_g_age4"),
    ("guardtower", 2, [1], "greek/buildings/tower/guard_tower/guard_tower_g_age4"),
    ("watchtower", 1, [2], "egyptian/buildings/tower/watch_tower/watch_tower_e_age4"),
    ("guardtower", 2, [2], "egyptian/buildings/tower/guard_tower/guard_tower_e_age4"),
    ("ballistatower", 3, [2], "egyptian/buildings/tower/ballista_tower/ballista_tower"),
    ("watchtower", 1, [3], "norse/buildings/tower/watch_tower/watch_tower_n_age4"),
    ("watchtower", 1, [4], "atlantean/buildings/tower/watch_tower/watch_tower_a_age4"),
    ("guardtower", 2, [4], "atlantean/buildings/tower/guard_tower/guard_tower_a_age4"),
    ("watchtower", 1, [5], "chinese/buildings/tower/watch_tower/watch_tower_c_age4"),
    ("guardtower", 2, [5], "chinese/buildings/tower/guard_tower/guard_tower_c_age4"),
    ("fusilladetower", 3, [5], "chinese/buildings/tower/fusillade_tower/fusillade_tower"),
    ("watchtower", 1, [6], "japanese/buildings/tower/watch_tower/watch_tower_j_age4"),
    ("guardtower", 2, [6], "japanese/buildings/tower/guard_tower/guard_tower_j_age4"),
    ("base", 0, [7], "aztec/buildings/tower/tzompantli_tower/tzompantli_tower_z_age1"),
    ("watchtower", 1, [7], "aztec/buildings/tower/tzompantli_tower/tzompantli_tower_z_age4"),
]

UPGRADES = {
    "69": [
        {"tag": "stonewall", "rank": 1, "catalog": "Stone Wall", "icon": "aomr_stone_wall_greek_icon", "pantheons": [1, 2, 3, 4, 5, 6, 7]},
        {"tag": "fortifiedwall", "rank": 2, "catalog": "Fortified Wall", "icon": "aomr_fortified_wall_greek_icon", "pantheons": [1, 2, 5, 6]},
        {"tag": "citadelwall", "rank": 3, "label": {"pt": "Muralha de Cidadela", "en": "Citadel Wall"}, "icon": "aomr_citadel_wall_icon", "pantheons": [2]},
        {"tag": "bronzewall", "rank": 2, "label": {"pt": "Muralha de Bronze", "en": "Bronze Wall"}, "icon": "aomr_bronze_wall_icon", "pantheons": [4]},
        {"tag": "ironwall", "rank": 3, "label": {"pt": "Muralha de Ferro", "en": "Iron Wall"}, "icon": "aomr_iron_wall_icon", "pantheons": [4]},
        {"tag": "orichalcumwall", "rank": 4, "label": {"pt": "Muralha de Oricalco", "en": "Orichalcum Wall"}, "icon": "aomr_orichalcum_wall_icon", "pantheons": [4]},
        {"tag": "greatwall", "rank": 3, "label": {"pt": "Grande Muralha", "en": "Great Wall"}, "icon": "aomr_great_wall_chinese_icon", "pantheons": [5]},
    ],
    "70": [
        {"tag": "watchtower", "rank": 1, "catalog": "Watch Tower", "icon": "aomr_watch_tower_greek_icon", "pantheons": [1, 2, 3, 4, 5, 6]},
        {"tag": "guardtower", "rank": 2, "catalog": "Guard Tower", "icon": "aomr_guard_tower_greek_icon", "pantheons": [1, 2, 4, 5, 6]},
        {"tag": "ballistatower", "rank": 3, "label": {"pt": "Torre de Balista", "en": "Ballista Tower"}, "icon": "aomr_ballista_tower_icon", "pantheons": [2]},
        {"tag": "fusilladetower", "rank": 3, "label": {"pt": "Torre de Besta", "en": "Crossbow Tower"}, "icon": "aomr_fusillade_tower_icon", "pantheons": [5]},
        {"tag": "watchtower", "rank": 1, "catalog": "Tzompantli Watch Tower", "icon": "aomr_tzompantli_watch_tower_icon", "pantheons": [7]},
    ],
}


def bake_visual(bars: BarIndex, visual: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  existe {dest.name}")
        return
    prims = visual_primitives(bars, visual)
    if not prims:
        raise FileNotFoundError(f"sem malha em {visual}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    write_static_glb(prims, dest)
    print(f"  {visual} ({dest.stat().st_size} bytes)")


def url_for(building_id: int, pantheon: int, tag: str) -> str:
    return f"/assets/building-models/variants/{building_id}-{pantheon}-{tag}.glb"


def main() -> int:
    game_dir = resolve_game_dir(None)
    bars = BarIndex(game_dir, DEFAULT_CRYBAR, WORK_ROOT)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, Any] = {}

    house_models: dict[str, dict[str, str]] = {}
    for pantheon, anim in HOUSES.items():
        dest = PUBLIC / f"8-{pantheon}-base.glb"
        print(f"casa {pantheon} -> {dest.name}")
        try:
            if not (dest.exists() and dest.stat().st_size > 0):
                info = bake_building_glb(bars, anim, dest, era_id=1, civ=None)
                print(f"  {info['visual']} ({info['bytes']} bytes)")
            else:
                print(f"  existe {dest.name}")
        except Exception as exc:  # noqa: BLE001
            print(f"  falhou: {exc}")
            continue
        house_models[str(pantheon)] = {"base": url_for(8, pantheon, "base")}
    manifest["8"] = {"pantheons": list(HOUSES), "models": house_models}

    def bake_rows(building_id: int, rows: list[tuple[str, int, list[int], str]]) -> dict[str, dict[str, str]]:
        models: dict[str, dict[str, str]] = {}
        seen: dict[str, str] = {}
        for tag, _rank, pantheons, visual in rows:
            dest_name = f"{building_id}-{tag}-{Path(visual).name}.glb"
            if visual not in seen:
                dest = PUBLIC / dest_name
                print(f"{building_id} {tag} -> {dest.name}")
                try:
                    bake_visual(bars, visual, dest)
                except Exception as exc:  # noqa: BLE001
                    print(f"  falhou: {exc}")
                    continue
                seen[visual] = f"/assets/building-models/variants/{dest_name}"
            for pantheon in pantheons:
                models.setdefault(str(pantheon), {})[tag] = seen[visual]
        return models

    wall_models = bake_rows(69, WALLS)
    manifest["69"] = {
        "pantheons": [1, 2, 3, 4, 5, 6, 7],
        "upgrades": UPGRADES["69"],
        "models": wall_models,
    }
    tower_models = bake_rows(70, TOWERS)
    manifest["70"] = {
        "pantheons": [1, 2, 3, 4, 5, 6, 7],
        "upgrades": UPGRADES["70"],
        "models": tower_models,
    }

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifesto em {MANIFEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
