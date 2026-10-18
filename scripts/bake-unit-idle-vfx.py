#!/usr/bin/env python3
"""Grava os pontos de efeito da pose parada das unidades que já têm projeção."""

from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CRYBAR, resolve_game_dir  # noqa: E402
from aom_unit_merge import load_proto_name_set, match_catalog_to_proto, resolve_proto_name  # noqa: E402
from aom_unit_model import PUBLIC_MODELS, WORK_ROOT, BarIndex, _proto_animfiles  # noqa: E402
from aom_unit_vfx import idle_vfx_anchors, write_idle_vfx  # noqa: E402

ROOT = SCRIPT_DIR.parent
CATALOG = ROOT / "src" / "data" / "locale" / "pt" / "unidades_aom.json"
MODELS = ROOT / "src" / "data" / "unit_models.json"


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    modeled = json.loads(MODELS.read_text(encoding="utf-8"))
    cache = ROOT / "tools" / "aom-extracted"
    stub = {name: {} for name in load_proto_name_set(cache)}
    animfiles = _proto_animfiles(cache)
    bars = BarIndex(resolve_game_dir(None), DEFAULT_CRYBAR, WORK_ROOT)
    entries: dict[str, list] = {}
    for row in catalog:
        unit_id = row.get("id")
        if str(unit_id) not in modeled:
            continue
        proto = resolve_proto_name(match_catalog_to_proto(row) or "", stub)
        anim = animfiles.get(proto or "")
        if not proto or not anim:
            continue
        glb = PUBLIC_MODELS / Path(modeled[str(unit_id)]).name
        try:
            anchors = idle_vfx_anchors(bars, anim, glb)
        except (RuntimeError, FileNotFoundError, OSError, ValueError) as exc:
            print(f"  falhou {unit_id} {row.get('nome')}: {exc}")
            continue
        if not anchors:
            continue
        entries[str(unit_id)] = anchors
        kinds = ", ".join(sorted({item["kind"] for item in anchors}))
        print(f"{unit_id} {row.get('nome')}: {len(anchors)} ({kinds})".encode("ascii", "replace").decode("ascii"))
    write_idle_vfx(entries)
    print(f"\n{len(entries)} unidades em {ROOT / 'src' / 'data' / 'unit_idle_vfx.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
