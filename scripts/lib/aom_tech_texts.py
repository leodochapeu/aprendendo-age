"""Extrai descrições (LR / história) e formata linhas de `campo` a partir do techtree."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any

from aom_tech_beneficia import (
    RESOURCE_ICON,
    resolve_subject,
)
from aom_unit_abilities import camel_to_snake_upper, clean_game_string

RESOURCE_LABEL = {
    "Food": {"pt": "Comida", "en": "Food"},
    "Wood": {"pt": "Madeira", "en": "Wood"},
    "Gold": {"pt": "Ouro", "en": "Gold"},
    "Favor": {"pt": "Favor", "en": "Favor"},
}

ACTION_LABEL = {
    "Gather": {"pt": "Coletar", "en": "Gather"},
    "AutoGatherFood": {"pt": "Coleta automática", "en": "Auto Gather"},
    "Build": {"pt": "Construir", "en": "Build"},
    "Repair": {"pt": "Reparar", "en": "Repair"},
}


def _text(node: ET.Element | None, tag: str, default: str = "") -> str:
    if node is None:
        return default
    child = node.find(tag)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def history_candidates(proto_name: str) -> list[str]:
    compact = re.sub(r"[^A-Za-z0-9]", "", proto_name).upper()
    snake = camel_to_snake_upper(proto_name)
    keys = [
        f"STR_HISTORY_TECHS_{compact}",
        f"STR_HISTORY_TECHS_{snake}",
        f"STR_HISTORY_TECHS_{proto_name.upper()}",
    ]
    out: list[str] = []
    seen: set[str] = set()
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out


def resolve_tech_history(
    proto_name: str,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
) -> tuple[str, str]:
    for sid in history_candidates(proto_name):
        en = clean_game_string(strings_en.get(sid, ""))
        if not en:
            continue
        pt = clean_game_string(strings_pt.get(sid, en))
        return pt, en
    return "", ""


def resolve_tech_rollover(
    tech: ET.Element,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
) -> tuple[str, str]:
    rid = _text(tech, "rollovertextid")
    if not rid:
        return "", ""
    en = clean_game_string(strings_en.get(rid, ""))
    pt = clean_game_string(strings_pt.get(rid, en))
    return pt, en


def _format_dotnet(template: str, *args: Any) -> str:
    def repl(match: re.Match[str]) -> str:
        idx = int(match.group(1))
        spec = match.group(2) or ""
        if idx >= len(args):
            return match.group(0)
        val = args[idx]
        if isinstance(val, (int, float)) and spec:
            if "00" in spec:
                return f"{float(val):.2f}".replace(".", ",")
            # {n:0.} → inteiro
            return str(int(round(float(val))))
        return str(val)

    return re.sub(r"\{(\d+)(?::([^}]*))?\}", repl, template)


def _relativity_mode(amount: float, relativity: str) -> tuple[str, float]:
    rel = (relativity or "Absolute").strip()
    if rel == "BasePercent":
        if amount >= 1:
            return "INCREASE", (amount - 1.0) * 100.0
        return "DECREASE", (1.0 - amount) * 100.0
    if rel in {"Assign", "Set"}:
        return "SET", amount
    return "ADD", amount


def _resource_name(raw: str, locale: str) -> str:
    meta = RESOURCE_LABEL.get(raw)
    if not meta:
        return raw
    return meta["en" if locale == "en" else "pt"]


def _action_name(raw: str, locale: str) -> str:
    meta = ACTION_LABEL.get(raw)
    if not meta:
        return raw
    return meta["en" if locale == "en" else "pt"]


def _subject_label(
    proto: str,
    *,
    locale: str,
    proto_units: dict[str, ET.Element],
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    catalog_by_proto: dict[str, dict[str, Any]] | None,
) -> str:
    subject = resolve_subject(
        proto,
        proto_units=proto_units,
        strings_pt=strings_pt,
        strings_en=strings_en,
        catalog_by_proto=catalog_by_proto,
    )
    if not subject:
        return proto
    nome = subject.nome_en if locale == "en" else subject.nome_pt
    if subject.icon:
        return f":{subject.icon}: {nome}"
    return nome


def format_effect_line(
    effect: ET.Element,
    *,
    locale: str,
    strings: dict[str, str],
    proto_units: dict[str, ET.Element],
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    catalog_by_proto: dict[str, dict[str, Any]] | None,
) -> str | None:
    if effect.get("type") != "Data":
        return None
    subtype = (effect.get("subtype") or "").strip()
    if not subtype:
        return None

    try:
        amount = float(effect.get("amount") or "0")
    except ValueError:
        amount = 0.0
    relativity = effect.get("relativity") or "Absolute"
    mode, display_amount = _relativity_mode(amount, relativity)

    targets = [
        (t.text or "").strip()
        for t in effect.findall("target")
        if t.get("type") == "ProtoUnit" and (t.text or "").strip()
    ]
    if not targets:
        # Player-wide effects
        subject = "Player" if locale == "en" else "Jogador"
    else:
        subject = _subject_label(
            targets[0],
            locale=locale,
            proto_units=proto_units,
            strings_pt=strings_pt,
            strings_en=strings_en,
            catalog_by_proto=catalog_by_proto,
        )

    resource = effect.get("resource") or effect.get("unittype") or effect.get("resourcetype") or ""
    action = effect.get("action") or ""
    armor = effect.get("armortype") or ""
    damage = effect.get("damagetype") or ""

    key = f"STR_EFFECT_{subtype.upper()}_{mode}"
    template = strings.get(key, "")

    # Fallbacks for common subtypes with different arg layouts
    if subtype == "WorkRate" and template:
        action_label = _action_name(action, locale) if action else ("Work" if locale == "en" else "Trabalho")
        res_label = _resource_name(resource, locale) if resource else ""
        line = _format_dotnet(template, subject, action_label, res_label, display_amount)
    elif subtype == "CarryCapacity" and template:
        res_label = _resource_name(resource, locale) if resource else ""
        if mode == "ADD":
            line = _format_dotnet(template, subject, display_amount, res_label)
        else:
            line = _format_dotnet(template, subject, res_label, display_amount)
    elif subtype == "Hitpoints" and template:
        line = _format_dotnet(template, subject, display_amount)
    elif subtype == "Damage" and template:
        # often {0}: Damage +{1}%
        line = _format_dotnet(template, subject, display_amount)
    elif subtype == "ArmorVulnerability" and template:
        line = _format_dotnet(template, subject, armor or damage or "?", display_amount)
    elif template:
        # Generic try: subject, amount, resource
        try:
            line = _format_dotnet(template, subject, display_amount, resource or armor or damage)
        except Exception:
            line = f"{subject}: {subtype} {display_amount:g}"
    else:
        # No template — compact fallback
        pct = f"{display_amount:g}%" if relativity == "BasePercent" else f"{display_amount:g}"
        sign = "+" if mode == "INCREASE" else ""
        extra = f" ({resource})" if resource else ""
        line = f"{subject}: {subtype}{extra} {sign}{pct}"

    # Append resource icon when relevant
    icon = RESOURCE_ICON.get(resource, "")
    if icon and f":{icon}:" not in line:
        line = f"{line} :{icon}:"
    return line.strip()


def generate_campo_lines(
    tech: ET.Element,
    *,
    locale: str,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    proto_units: dict[str, ET.Element],
    catalog_by_proto: dict[str, dict[str, Any]] | None = None,
) -> list[str]:
    strings = strings_en if locale == "en" else strings_pt
    lines: list[str] = []
    seen: set[str] = set()
    for effect in tech.findall("./effects/effect"):
        line = format_effect_line(
            effect,
            locale=locale,
            strings=strings,
            proto_units=proto_units,
            strings_pt=strings_pt,
            strings_en=strings_en,
            catalog_by_proto=catalog_by_proto,
        )
        if not line or line in seen:
            continue
        seen.add(line)
        lines.append(line)
    return lines


def extract_tech_texts(
    proto_name: str,
    tech: ET.Element,
    *,
    locale: str,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    proto_units: dict[str, ET.Element],
    catalog_by_proto: dict[str, dict[str, Any]] | None = None,
    fill_campo: bool = True,
) -> dict[str, Any]:
    resumida_pt, resumida_en = resolve_tech_rollover(tech, strings_pt, strings_en)
    hist_pt, hist_en = resolve_tech_history(proto_name, strings_pt, strings_en)
    out: dict[str, Any] = {
        "descricao_resumida_pt": resumida_pt,
        "descricao_resumida_en": resumida_en,
        "historia_pt": hist_pt,
        "historia_en": hist_en,
    }
    if fill_campo:
        out["campo_pt"] = generate_campo_lines(
            tech,
            locale="pt",
            strings_pt=strings_pt,
            strings_en=strings_en,
            proto_units=proto_units,
            catalog_by_proto=catalog_by_proto,
        )
        out["campo_en"] = generate_campo_lines(
            tech,
            locale="en",
            strings_pt=strings_pt,
            strings_en=strings_en,
            proto_units=proto_units,
            catalog_by_proto=catalog_by_proto,
        )
    return out
