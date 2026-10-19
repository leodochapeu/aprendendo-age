"""Extrai descrições (SR/LR) e história de construções a partir do proto + strings."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any

from aom_unit_abilities import camel_to_snake_upper, clean_game_string
from aom_unit_extractor import _text


def history_string_candidates(proto_name: str) -> list[str]:
    """Possíveis IDs STR_HISTORY_BLD_* / STR_HISTORY_UNITS_* para um proto de prédio."""
    if not proto_name:
        return []
    forms: list[str] = []
    seen: set[str] = set()
    for form in (
        camel_to_snake_upper(proto_name),
        re.sub(r"[^A-Za-z0-9]", "", proto_name).upper(),
        proto_name.upper(),
    ):
        if form and form not in seen:
            seen.add(form)
            forms.append(form)

    keys: list[str] = []
    for form in forms:
        for prefix in ("STR_HISTORY_BLD_", "STR_HISTORY_UNITS_"):
            sid = f"{prefix}{form}"
            if sid not in keys:
                keys.append(sid)
    return keys


def resolve_building_history(
    proto_name: str,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
) -> tuple[str, str]:
    for sid in history_string_candidates(proto_name):
        en = clean_game_string(strings_en.get(sid, ""))
        if not en:
            continue
        pt = clean_game_string(strings_pt.get(sid, en))
        return pt, en
    return "", ""


def extract_building_texts(
    proto_name: str,
    unit: ET.Element,
    *,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
) -> dict[str, Any]:
    sr_id = _text(unit, "shortrollovertextid")
    lr_id = _text(unit, "rollovertextid")
    sr_pt = clean_game_string(strings_pt.get(sr_id, strings_en.get(sr_id, "")))
    sr_en = clean_game_string(strings_en.get(sr_id, ""))
    lr_pt = clean_game_string(strings_pt.get(lr_id, strings_en.get(lr_id, "")))
    lr_en = clean_game_string(strings_en.get(lr_id, ""))
    hist_pt, hist_en = resolve_building_history(proto_name, strings_pt, strings_en)

    return {
        "descricao_resumida_pt": sr_pt,
        "descricao_resumida_en": sr_en,
        "descricao_avancada_pt": lr_pt,
        "descricao_avancada_en": lr_en,
        "historia_pt": hist_pt,
        "historia_en": hist_en,
    }
