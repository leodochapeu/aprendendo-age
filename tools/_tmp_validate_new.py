#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
pt = json.loads((ROOT / "src/data/locale/pt/unidades_aom.json").read_text(encoding="utf-8"))
en = json.loads((ROOT / "src/data/locale/en/unidades_aom.json").read_text(encoding="utf-8"))
token = json.loads((ROOT / "src/data/token_asset_map.json").read_text(encoding="utf-8"))

pt_by = {r["id"]: r for r in pt}
en_by = {r["id"]: r for r in en}

for uid in range(183, 196):
    p = pt_by[uid]
    e = en_by[uid]
    icon = p.get("icon")
    mapped = token.get(icon)
    path_ok = False
    if mapped:
        path_ok = (ROOT / "public" / mapped.lstrip("/")).exists()
    print(
        f"id={uid} PT={p['nome']!r} EN={e['nome']!r} ingles={p['ingles']!r} "
        f"icon={icon} map={bool(mapped)} file={path_ok} "
        f"favor={p.get('favor')} hp={p.get('pontos_de_vida')} "
        f"god={p.get('god_dono')}"
    )

# missing campaign skipped count
print("\nOK: multiplayer/trainable Aztec units covered; campaign heroes intentionally skipped.")
