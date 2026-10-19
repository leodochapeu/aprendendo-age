from __future__ import annotations

import html
from copy import deepcopy
from pathlib import Path
from typing import Any

from aom_building_extractor import resolve_building_icon
from aom_unit_merge import (
    _compact_key,
    _normalize_number,
    load_catalog,
    parse_id_range,
    save_catalog,
)

PRESERVED_FIELDS = frozenset(
    {
        "id",
        "nome",
        "tipo",
        "panteao",
        "panteao_id",
        "era",
        "era_id",
        "tecnologias",
        "tecnologias_ids",
        "tecnologias_id",
        "unidades",
        "unidades_ids",
        "unidades_id",
        "ingles",
        "descricao_resumida",
        "descricao_avancada",
        "historia",
    }
)

BUILDING_CATALOG_ALIASES = {
    "Wooden Wall": "WallShort",
    "Wall": "WallShort",
    "Wooden Gate": "WallGate",
    "OX": "OxCartBuilding",
    # O proto "Shrine" é o santuário de campanha. A ficha é o japonês da Miko.
    "Shrine": "ShrineJapanese",
}

STAT_FIELDS = (
    "pontos_de_vida",
    "dano_cortante",
    "dano_perfurante",
    "dano_contusao",
    "alcance",
    "velocidade_de_ataque_atk_s",
    "dps",
    "armadura_anticorte",
    "armadura_antiperfurante",
    "armadura_anticontusao",
    "madeira",
    "ouro",
    "guarnicao",
    "custo",
    "tempo_construir_segundos",
    "no_projeteis",
    "icon",
)

DAMAGE_FIELDS = ("dano_cortante", "dano_perfurante", "dano_contusao")


def decode_catalog_name(value: str) -> str:
    return html.unescape(value.replace("%27", "'").replace("%26", "&")).strip()


def match_catalog_to_building(catalog_row: dict[str, Any]) -> str:
    return decode_catalog_name(
        (catalog_row.get("ingles") or catalog_row.get("nome") or "").strip()
    )


def _catalog_name_candidates(catalog_name: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def add(value: str) -> None:
        value = decode_catalog_name(value)
        if value and value not in seen:
            seen.add(value)
            out.append(value)

    add(catalog_name)
    add(BUILDING_CATALOG_ALIASES.get(catalog_name, ""))

    # "Wonder (Zeus)", "Village Center (Greek)" → base name before " ("
    if " (" in catalog_name and catalog_name.endswith(")"):
        base = catalog_name[: catalog_name.rfind(" (")].strip()
        add(base)
        add(BUILDING_CATALOG_ALIASES.get(base, ""))

    return out


def resolve_proto_name(
    catalog_name: str,
    extracted_index: dict[str, dict[str, Any]],
) -> str | None:
    if not catalog_name:
        return None

    compact_index = {_compact_key(proto): proto for proto in extracted_index}

    for candidate in _catalog_name_candidates(catalog_name):
        aliased = BUILDING_CATALOG_ALIASES.get(candidate)
        if aliased and aliased in extracted_index:
            return aliased

        if candidate in extracted_index:
            return candidate

        resolved = compact_index.get(_compact_key(candidate))
        if resolved:
            return resolved

    return None


def index_extracted_by_proto(
    extracted_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    return {row["proto_name"]: row for row in extracted_rows if row.get("proto_name")}


def load_building_name_set(cache_dir: Path) -> set[str]:
    from aom_building_extractor import parse_proto_buildings

    return set(parse_proto_buildings(cache_dir / "gameplay" / "proto.xml"))


def supplement_extracted_index(
    extracted_index: dict[str, dict[str, Any]],
    *,
    catalog_path: Path,
    cache_dir: Path,
    id_filter: set[int] | None,
    building_filter: set[str] | None,
) -> int:
    rows = load_catalog(catalog_path)
    building_names = load_building_name_set(cache_dir)
    stub_index = {name: {} for name in building_names}
    normalized_filter = (
        {name.lower() for name in building_filter} if building_filter is not None else None
    )
    pending: set[str] = set()

    for row in rows:
        if id_filter is not None and row.get("id") not in id_filter:
            continue
        catalog_name = match_catalog_to_building(row)
        if normalized_filter is not None:
            if catalog_name.lower() not in normalized_filter:
                continue
        if resolve_proto_name(catalog_name, extracted_index):
            continue
        resolved = resolve_proto_name(catalog_name, stub_index)
        if resolved:
            pending.add(resolved)

    if not pending:
        return 0

    from aom_building_extractor import extract_buildings

    added = 0
    for proto in sorted(pending):
        extracted_rows = extract_buildings(cache_dir, only_building=proto)
        if extracted_rows:
            extracted_index[proto] = extracted_rows[0]
            added += 1
    return added


def build_merged_row(
    existing: dict[str, Any],
    extracted: dict[str, Any],
) -> dict[str, Any]:
    merged = deepcopy(existing)
    pantheon_id = existing.get("panteao_id")

    for field in STAT_FIELDS:
        if field == "icon":
            icon = resolve_building_icon(extracted, pantheon_id)
            if icon:
                merged["icon"] = icon
            continue
        if field in extracted:
            merged[field] = _normalize_number(extracted[field])

    for field in DAMAGE_FIELDS:
        if field in extracted:
            merged[field] = _normalize_number(extracted[field])
        elif field in merged and field not in extracted:
            del merged[field]

    for field in STAT_FIELDS:
        if field in merged and field != "icon":
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


def parse_building_filter(value: str | None) -> set[str] | None:
    if not value:
        return None
    return {decode_catalog_name(part.strip()) for part in value.split(",") if part.strip()}


def merge_catalog_file(
    catalog_path: Path,
    extracted_index: dict[str, dict[str, Any]],
    *,
    building_filter: set[str] | None = None,
    id_filter: set[int] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    rows = load_catalog(catalog_path)
    updated_rows: list[dict[str, Any]] = []
    report: list[dict[str, Any]] = []
    missing: list[str] = []

    normalized_filter = (
        {name.lower() for name in building_filter} if building_filter is not None else None
    )

    for row in rows:
        catalog_name = match_catalog_to_building(row)
        if normalized_filter is not None:
            if catalog_name.lower() not in normalized_filter:
                updated_rows.append(row)
                continue
        elif id_filter is not None and row.get("id") not in id_filter:
            updated_rows.append(row)
            continue

        resolved_proto = resolve_proto_name(catalog_name, extracted_index)
        extracted = extracted_index.get(resolved_proto or "") if resolved_proto else None
        if not extracted:
            missing.append(catalog_name or f"id={row.get('id')}")
            updated_rows.append(row)
            continue

        merged = build_merged_row(row, extracted)
        changes = diff_fields(row, merged)
        if changes:
            report.append(
                {
                    "id": row.get("id"),
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
