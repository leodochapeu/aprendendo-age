#!/usr/bin/env python3
import json
from pathlib import Path

pt = json.loads(
    Path(
        r"d:\ProjetosLeo\AGE PROJECTS\aprendendo-age\src\data\locale\pt\unidades_aom.json"
    ).read_text(encoding="utf-8")
)
for u in pt:
    tipos = u.get("tipo") or []
    labels = [t.get("type") for t in tipos if isinstance(t, dict)]
    if not any("Herói" in str(x) or "Hero" in str(x) for x in labels):
        continue
    p = u.get("panteao")
    if isinstance(p, list) and p:
        pid = p[0].get("id")
        pn = p[0].get("nome")
    else:
        pid, pn = None, None
    print(f"id={u['id']} pant={pid} | {u.get('ingles')} / {u.get('nome')} | {labels}")
