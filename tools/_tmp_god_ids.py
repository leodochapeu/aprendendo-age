#!/usr/bin/env python3
import json
from pathlib import Path

rows = json.loads(
    Path(
        r"d:\ProjetosLeo\AGE PROJECTS\aprendendo-age\src\data\locale\pt\deuses_aom.json"
    ).read_text(encoding="utf-8")
)
for r in rows:
    if r.get("nome") in {
        "Huitzilopochtli",
        "Tezcatlipoca",
        "Quetzalcoatl",
        "Coatlicue",
    }:
        print(f"id={r['id']} nome={r['nome']} ingles={r.get('ingles')}")
