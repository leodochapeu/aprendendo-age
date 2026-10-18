#!/usr/bin/env python3
"""Restaura nomes/tipos editoriais sobrescritos pelo merge."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PT = ROOT / "src/data/locale/pt/unidades_aom.json"
EN = ROOT / "src/data/locale/en/unidades_aom.json"

FIXES = {
    183: {
        "pt": {
            "tipo": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
            "construcao": [{"nome": "Centro Urbano (Asteca)", "id": 9}],
        },
        "en": {
            "tipo": [{"type": "Villager", "icon": "aomr_type_villager_icon"}],
            "construcao": [{"nome": "Town Center (Aztec)", "id": 9}],
        },
    },
    184: {
        "pt": {
            "tipo": [
                {"type": "Navio", "icon": "aomr_type_ship_icon"},
                {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
            ]
        },
        "en": {
            "tipo": [
                {"type": "Ship", "icon": "aomr_type_ship_icon"},
                {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
            ]
        },
    },
    186: {
        "pt": {
            "tipo": [
                {"type": "Navio", "icon": "aomr_type_ship_icon"},
                {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
            ]
        },
        "en": {
            "tipo": [
                {"type": "Ship", "icon": "aomr_type_ship_icon"},
                {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
            ]
        },
    },
    187: {
        "pt": {"ingles": "Fishing Ship (Aztec)"},
        "en": {
            "ingles": "Fishing Ship (Aztec)",
            "nome": "Fishing Ship (Aztec)",
        },
    },
    188: {
        "pt": {"ingles": "Transport Ship (Aztec)"},
        "en": {
            "ingles": "Transport Ship (Aztec)",
            "nome": "Transport Ship (Aztec)",
        },
    },
    190: {
        "pt": {
            "nome": "Ixiptla (Huitzilopochtli)",
            "ingles": "Teixiptla (Huitzilopochtli)",
        },
        "en": {
            "nome": "Teixiptla (Huitzilopochtli)",
            "ingles": "Teixiptla (Huitzilopochtli)",
        },
    },
    191: {
        "pt": {
            "nome": "Ixiptla (Tezcatlipoca)",
            "ingles": "Teixiptla (Tezcatlipoca)",
        },
        "en": {
            "nome": "Teixiptla (Tezcatlipoca)",
            "ingles": "Teixiptla (Tezcatlipoca)",
        },
    },
    192: {
        "pt": {
            "nome": "Ixiptla (Quetzalcoatl)",
            "ingles": "Teixiptla (Quetzalcoatl)",
        },
        "en": {
            "nome": "Teixiptla (Quetzalcoatl)",
            "ingles": "Teixiptla (Quetzalcoatl)",
        },
    },
}


def apply(path: Path, locale: str) -> int:
    rows = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    by_id = {r["id"]: r for r in rows}
    for unit_id, locales in FIXES.items():
        row = by_id.get(unit_id)
        if not row:
            continue
        patch = locales[locale]
        for key, value in patch.items():
            if row.get(key) != value:
                row[key] = value
                changed += 1
    path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return changed


def main() -> None:
    pt = apply(PT, "pt")
    en = apply(EN, "en")
    print(f"campos restaurados: PT={pt} EN={en}")


if __name__ == "__main__":
    main()
