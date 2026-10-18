#!/usr/bin/env python3
import json
from pathlib import Path

rows = json.loads(
    Path(
        r"d:\ProjetosLeo\AGE PROJECTS\aprendendo-age\src\data\locale\pt\construcoes.json"
    ).read_text(encoding="utf-8")
)
for r in rows:
    p = r.get("panteao") or ""
    if "Asteca" in str(p) or "Aztec" in str(p):
        print(f"id={r.get('id')} | {r.get('ingles')} / {r.get('nome')}")
