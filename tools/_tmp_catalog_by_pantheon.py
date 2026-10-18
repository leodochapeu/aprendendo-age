#!/usr/bin/env python3
import json
from pathlib import Path

pt = json.loads(
    Path(
        r"d:\ProjetosLeo\AGE PROJECTS\aprendendo-age\src\data\locale\pt\unidades_aom.json"
    ).read_text(encoding="utf-8")
)
names = {
    1: "Grego",
    2: "Egípcio",
    3: "Nórdico",
    4: "Atlante",
    5: "Chinês",
    6: "Japonês",
    7: "Asteca",
}
for pid in range(1, 8):
    rows = []
    for u in pt:
        p = u.get("panteao")
        if isinstance(p, list) and p and p[0].get("id") == pid:
            rows.append(u)
        elif isinstance(p, dict) and p.get("id") == pid:
            rows.append(u)
    print(f"\n=== {names[pid]} ({len(rows)}) ===")
    for u in sorted(rows, key=lambda x: x["id"]):
        print(f"  {u['id']:3} {u.get('ingles')}")
