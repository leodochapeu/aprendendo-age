from __future__ import annotations

import html
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from copy import deepcopy
from pathlib import Path
from typing import Any

from aom_unit_merge import (
    _compact_key,
    _normalize_number,
    load_building_id_map,
    load_catalog,
    save_catalog,
)

PRESERVED_FIELDS = frozenset(
    {
        "beneficia",
        "campo",
        "tipo",
        "panteoes",
        "god_especifico",
        "god_dono",
    }
)

UPDATED_FIELDS = (
    "nome",
    "ingles",
    "comida",
    "madeira",
    "ouro",
    "favor",
    "tempo_s",
    "eras",
    "icon",
    "construcao_origem",
)

TECH_CATALOG_ALIASES = {
    "Survival Equipment": "HuntingEquipment",
    "Medium Ranged Soldiers": "MediumArchers",
    "Heavy Ranged Soldiers": "HeavyArchers",
    "Champion Ranged Soldiers": "ChampionArchers",
    "Heavy Elephants": "HeavyWarElephants",
    "Champion Elephants": "ChampionWarElephants",
    "Heavy Chariots": "HeavyChariotArchers",
    "Champion Chariots": "ChampionChariotArchers",
    "Argive Patronage": "ArgivePatronageZeus",
    "Empyrian Speed": "EmpyreanSpeed",
    "Divine Judgment": "DivineJudgement",
    "Crenellations (Aztec)": "CrenellationsAztec",
    "Arrival of the Gods (Huitzilopochtli)": "GreatTempleArrivalOfTheGodsHuitzilopochtli",
    "Arrival of the Gods (Tezcatlipoca)": "GreatTempleArrivalOfTheGodsTezcatlipoca",
    "Arrival of the Gods (Quetzalcoatl)": "GreatTempleArrivalOfTheGodsQuetzalcoatl",
}


def decode_catalog_name(value: str) -> str:
    normalized = html.unescape(value.replace("%27", "'").replace("%26", "&"))
    return normalized.strip()


def parse_catalog_pantheon_ids(panteoes: Any) -> set[int] | None:
    if panteoes is None or panteoes == "Geral":
        return None
    if isinstance(panteoes, str):
        return None
    ids: set[int] = set()
    for item in panteoes:
        if isinstance(item, dict) and item.get("id") is not None:
            ids.add(int(item["id"]))
    return ids or None


def match_catalog_to_tech(catalog_row: dict[str, Any]) -> str:
    return decode_catalog_name((catalog_row.get("ingles") or catalog_row.get("nome") or "").strip())


def _catalog_name_candidates(catalog_name: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def add(value: str) -> None:
        value = decode_catalog_name(value)
        if value and value not in seen:
            seen.add(value)
            out.append(value)

    add(catalog_name)
    add(TECH_CATALOG_ALIASES.get(catalog_name, ""))

    return out


def resolve_proto_name(
    catalog_name: str,
    extracted_index: dict[str, dict[str, Any]],
) -> str | None:
    if not catalog_name:
        return None

    compact_index = {_compact_key(proto): proto for proto in extracted_index}

    for candidate in _catalog_name_candidates(catalog_name):
        if candidate in extracted_index:
            return candidate

        aliased = TECH_CATALOG_ALIASES.get(candidate)
        if aliased and aliased in extracted_index:
            return aliased

        resolved = compact_index.get(_compact_key(candidate))
        if resolved:
            return resolved

    return None


def index_extracted_by_proto(
    extracted_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    return {row["proto_name"]: row for row in extracted_rows if row.get("proto_name")}


def load_tech_name_set(cache_dir: Path) -> set[str]:
    techtree_path = cache_dir / "gameplay" / "techtree.xml"
    tree = ET.parse(techtree_path)
    from aom_tech_extractor import is_exportable_tech

    return {
        tech.get("name")
        for tech in tree.getroot().findall("tech")
        if tech.get("name") and is_exportable_tech(tech)
    }


def supplement_extracted_index(
    extracted_index: dict[str, dict[str, Any]],
    *,
    catalog_path: Path,
    cache_dir: Path,
    construcoes_path: Path,
    tech_filter: set[str] | None,
    index_filter: set[int] | None,
) -> int:
    rows = load_catalog(catalog_path)
    tech_names = load_tech_name_set(cache_dir)
    stub_index = {name: {} for name in tech_names}
    normalized_tech_filter = (
        {name.lower() for name in tech_filter} if tech_filter is not None else None
    )
    pending: dict[str, set[int] | None] = {}

    for index, row in enumerate(rows):
        if index_filter is not None and index not in index_filter:
            continue
        catalog_name = match_catalog_to_tech(row)
        if normalized_tech_filter is not None:
            if catalog_name.lower() not in normalized_tech_filter:
                continue
        if resolve_proto_name(catalog_name, extracted_index):
            continue
        resolved = resolve_proto_name(catalog_name, stub_index)
        if resolved:
            pending.setdefault(resolved, parse_catalog_pantheon_ids(row.get("panteoes")))

    if not pending:
        return 0

    from aom_tech_extractor import extract_techs

    added = 0
    for proto, pantheon_ids in sorted(pending.items()):
        extracted_rows = extract_techs(
            cache_dir,
            only_tech=proto,
            construcoes_path=construcoes_path,
            pantheon_ids=pantheon_ids,
        )
        if not extracted_rows:
            continue
        extracted_index[proto] = extracted_rows[0]
        added += 1
    return added


def merge_construcao_origem(
    existing: list[dict[str, Any]] | None,
    extracted: list[dict[str, Any]] | None,
    building_ids: dict[str, int],
) -> list[dict[str, Any]] | None:
    if not extracted:
        return existing

    existing = existing or []
    by_id = {row.get("id"): row for row in existing if row.get("id") is not None}
    by_nome = {row.get("nome"): row for row in existing if row.get("nome")}

    merged: list[dict[str, Any]] = []
    for ext in extracted:
        nome = ext.get("nome", "")
        proto = ext.get("proto", "")
        prior = by_nome.get(nome) or (
            by_id.get(ext.get("id")) if ext.get("id") is not None else None
        )
        # Só completa id pelo mapa global se o extract já trouxe id
        # (evita Armory grega/japonesa em techs aztecas sem Armaria no catálogo).
        building_id = (prior or {}).get("id") or ext.get("id")
        if building_id is None and proto and proto not in (
            "Armory",
            "Temple",
            "Dock",
            "Market",
            "SentryTower",
        ):
            building_id = building_ids.get(proto) or building_ids.get(nome)
        item: dict[str, Any] = {"nome": nome}
        if building_id is not None:
            item["id"] = building_id
        merged.append(item)
    return merged


def merge_eras(
    existing: list[dict[str, Any]] | None,
    extracted: list[dict[str, Any]] | None,
) -> list[dict[str, Any]] | None:
    if not extracted:
        return existing
    if existing:
        merged: list[dict[str, Any]] = []
        for index, ext in enumerate(extracted):
            prior = existing[index] if index < len(existing) else {}
            merged.append(
                {
                    "id": prior.get("id", ext.get("id")),
                    "nome": ext.get("nome", prior.get("nome")),
                }
            )
        return merged
    return deepcopy(extracted)


def build_merged_row(
    existing: dict[str, Any],
    extracted: dict[str, Any],
    *,
    locale: str,
    building_ids: dict[str, int],
) -> dict[str, Any]:
    merged = deepcopy(existing)
    locale_key = locale.lower()

    # Aliases disambiguam techs com o mesmo display name do jogo
    # (ex.: Arrival of the Gods / Crenellations Aztec).
    catalog_ingles = decode_catalog_name((existing.get("ingles") or "").strip())
    preserve_display_name = catalog_ingles in TECH_CATALOG_ALIASES

    if not preserve_display_name:
        if locale_key == "en":
            merged["nome"] = extracted.get("ingles") or extracted.get("nome") or merged.get("nome")
        else:
            merged["nome"] = extracted.get("nome") or merged.get("nome")

        merged["ingles"] = extracted.get("ingles") or merged.get("ingles")

    for field in ("comida", "madeira", "ouro", "favor", "tempo_s", "icon"):
        if field in extracted:
            merged[field] = _normalize_number(extracted[field])

    if locale_key != "en":
        merged["eras"] = merge_eras(existing.get("eras"), extracted.get("eras"))

    merged["construcao_origem"] = merge_construcao_origem(
        existing.get("construcao_origem"),
        extracted.get("construcao_origem"),
        building_ids,
    )

    for field in ("comida", "madeira", "ouro", "favor", "tempo_s"):
        if field in merged:
            merged[field] = _normalize_number(merged[field])

    return merged


def diff_fields(before: dict[str, Any], after: dict[str, Any]) -> dict[str, dict[str, Any]]:
    changes: dict[str, dict[str, Any]] = {}
    keys = set(before) | set(after)
    for key in sorted(keys):
        if key in PRESERVED_FIELDS:
            continue
        old = before.get(key)
        new = after.get(key)
        if old != new:
            changes[key] = {"before": old, "after": new}
    return changes


def parse_tech_filter(value: str | None) -> set[str] | None:
    if not value:
        return None
    return {decode_catalog_name(part.strip()) for part in value.split(",") if part.strip()}


def parse_index_range(value: str | None) -> set[int] | None:
    if not value:
        return None
    out: set[int] = set()
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        range_match = re.fullmatch(r"(\d+)\s*-\s*(\d+)", part)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2))
            if end < start:
                start, end = end, start
            out.update(range(start, end + 1))
            continue
        out.add(int(part))
    return out


def merge_catalog_file(
    catalog_path: Path,
    extracted_index: dict[str, dict[str, Any]],
    *,
    locale: str,
    construcoes_path: Path,
    cache_dir: Path | None = None,
    tech_filter: set[str] | None = None,
    index_filter: set[int] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    rows = load_catalog(catalog_path)
    building_ids = load_building_id_map(construcoes_path)
    updated_rows: list[dict[str, Any]] = []
    report: list[dict[str, Any]] = []
    missing: list[str] = []

    normalized_tech_filter = (
        {name.lower() for name in tech_filter} if tech_filter is not None else None
    )

    for index, row in enumerate(rows):
        catalog_name = match_catalog_to_tech(row)
        if normalized_tech_filter is not None:
            if catalog_name.lower() not in normalized_tech_filter:
                updated_rows.append(row)
                continue
        elif index_filter is not None and index not in index_filter:
            updated_rows.append(row)
            continue

        resolved_proto = resolve_proto_name(catalog_name, extracted_index)
        extracted = extracted_index.get(resolved_proto or "") if resolved_proto else None
        if not extracted:
            missing.append(catalog_name or f"index={index}")
            updated_rows.append(row)
            continue

        extracted_for_row = deepcopy(extracted)
        pantheon_ids = parse_catalog_pantheon_ids(row.get("panteoes"))
        if cache_dir is not None and resolved_proto:
            from aom_tech_extractor import rebuild_construcao_origem

            extracted_for_row["construcao_origem"] = rebuild_construcao_origem(
                resolved_proto,
                cache_dir=cache_dir,
                construcoes_path=construcoes_path,
                pantheon_ids=pantheon_ids,
            )

        merged = build_merged_row(
            row,
            extracted_for_row,
            locale=locale,
            building_ids=building_ids,
        )
        changes = diff_fields(row, merged)
        if changes:
            report.append(
                {
                    "index": index,
                    "proto": resolved_proto,
                    "catalog_name": catalog_name,
                    "nome": row.get("nome"),
                    "changes": changes,
                }
            )
        updated_rows.append(merged)

    if not dry_run:
        save_catalog(catalog_path, updated_rows)

    return {
        "path": str(catalog_path),
        "updated": len(report),
        "missing": missing,
        "report": report,
    }
