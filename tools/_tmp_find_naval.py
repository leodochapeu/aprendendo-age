#!/usr/bin/env python3
import json
from pathlib import Path

pt = json.loads(
    Path(
        r"d:\ProjetosLeo\AGE PROJECTS\aprendendo-age\src\data\locale\pt\unidades_aom.json"
    ).read_text(encoding="utf-8")
)

keys = (
    "settler",
    "aldeão",
    "aldeao",
    "canoe",
    "canoa",
    "fishing",
    "trireme",
    "transport",
    "arrow",
    "siege ship",
    "fire ship",
    "pentekonter",
    "villager",
)

for u in pt:
    ing = (u.get("ingles") or "").lower()
    nome = (u.get("nome") or "").lower()
    blob = f"{ing} {nome}"
    if any(k in blob for k in keys):
        p = u.get("panteao")
        if isinstance(p, list) and p:
            pid = p[0].get("id")
        elif isinstance(p, dict):
            pid = p.get("id")
        else:
            pid = None
        print(f"id={u['id']} pant={pid} | {u.get('ingles')} / {u.get('nome')}")
