from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_proto_maps import ERA_FROM_TOKEN, PANTHEON_TEMPLE_NOME, SECONDARY_TEMPLE_PROTOS
from aom_string_table import parse_string_table
from aom_unit_extractor import (
    detect_pantheon,
    ensure_bar_extracted,
    icon_token_from_path,
    is_alt_temple,
)

RESOURCE_FIELD = {
    "Food": "comida",
    "Wood": "madeira",
    "Gold": "ouro",
    "Favor": "favor",
}

TECH_ICON_TOKEN_OVERRIDES = {
    # Alguns caminhos internos do jogo não correspondem aos nomes dos assets públicos.
    "aomr_hunting_equipment_icon": "aomr_survival_equipment_icon",
    "aomr_empyrean_speed_icon": "aomr_empyrian_speed_icon",
    "aomr_qilins_blessing_icon": "aomr_qilin_27s_blessing_icon",
    "aomr_xuanyuans_bloodline_icon": "aomr_xuanyuan_27s_bloodline_icon",
    "aomr_leizus_silk_icon": "aomr_leizu_27s_silk_icon",
    "aomr_thunderous_prescence_icon": "aomr_thunderous_presence_icon",
    "aomr_seaside_infiltration_icon": "aomr_seaside_infiltrators_icon",
}


def tech_icon_token(icon_path: str) -> str:
    token = icon_token_from_path(icon_path)
    return TECH_ICON_TOKEN_OVERRIDES.get(token, token)


BUILDING_PROTO_TO_ENGLISH = {
    "MilitaryAcademy": "Military Academy",
    "ArcheryRange": "Archery Range",
    "SiegeWorks": "Siege Works",
    "MigdolStronghold": "Migdol Stronghold",
    "WarCamp": "War Camp",
    "MachineWorkshop": "Machine Workshop",
    "LumberCamp": "Lumber Camp",
    "MiningCamp": "Mining Camp",
    "EconomicGuild": "Economic Guild",
    "Storehouse": "Storehouse",
    "Granary": "Granary",
    "Armory": "Armory",
    "Temple": "Temple",
    "Dock": "Dock",
    "Fortress": "Fortress",
    "Barracks": "Barracks",
    "Stable": "Stable",
    "Palace": "Palace",
    "Longhouse": "Longhouse",
    "Manor": "Manor",
    "Shrine": "Shrine",
    "Watermill": "Watermill",
    "Calpulli": "Calpulli",
    "WarHut": "War Hut",
    "NoblesHut": "Noble's Hut",
    "GreatTemple": "Great Temple",
    "SentryTower": "Sentry Tower",
}

SECONDARY_RESEARCH_BUILDINGS = frozenset(
    {
        "OxCart",
        "Lure",
        "Silo",
        "DwarvenArmory",
        "CalpulliLivestockPen",
        "CalpulliLumberOutpost",
        "CalpulliCraftWorkshop",
        *SECONDARY_TEMPLE_PROTOS,
    }
)

TECH_AGE_TOKEN = {
    "ArchaicAge": "Archaic",
    "ClassicalAge": "Classical",
    "HeroicAge": "Heroic",
    "MythicAge": "Mythic",
    "TitanAge": "Titan",
}


def _text(node: ET.Element | None, tag: str, default: str = "") -> str:
    if node is None:
        return default
    child = node.find(tag)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def _float(value: str | None, default: float = 0.0) -> float:
    if not value:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def is_exportable_tech(tech: ET.Element) -> bool:
    flags = {node.text.strip() for node in tech.findall("flag") if node.text}
    if "AgeTech" in flags or "AgeUpgrade" in flags:
        return False
    display = _text(tech, "displaynameid")
    return display.startswith("STR_TECH_")


def parse_proto_units(proto_path: Path) -> dict[str, ET.Element]:
    tree = ET.parse(proto_path)
    return {
        unit.get("name"): unit
        for unit in tree.getroot().findall("unit")
        if unit.get("name")
    }


def parse_tech_nodes(techtree_path: Path) -> dict[str, ET.Element]:
    tree = ET.parse(techtree_path)
    out: dict[str, ET.Element] = {}
    for tech in tree.getroot().findall("tech"):
        name = tech.get("name")
        if name and is_exportable_tech(tech):
            out[name] = tech
    return out


def parse_tech_researchers(proto_units: dict[str, ET.Element]) -> dict[str, list[str]]:
    researchers: dict[str, list[str]] = {}
    for building_name, building in proto_units.items():
        # `<command>` também referencia techs (ex.: GreatTempleArrivalOfTheGods*).
        names = [
            node.text.strip()
            for tag in ("tech", "command")
            for node in building.findall(tag)
            if node.text and node.text.strip()
        ]
        if not names:
            continue
        for tech_name in names:
            researchers.setdefault(tech_name, []).append(building_name)
    return researchers


def filter_research_buildings(building_protos: list[str]) -> list[str]:
    seen: set[str] = set()
    filtered: list[str] = []
    for proto in building_protos:
        if proto in SECONDARY_RESEARCH_BUILDINGS or is_alt_temple(proto):
            continue
        if proto in seen:
            continue
        seen.add(proto)
        filtered.append(proto)
    return filtered


def load_construcoes_rows(construcoes_path: Path) -> list[dict[str, Any]]:
    if not construcoes_path.exists():
        return []
    return json.loads(construcoes_path.read_text(encoding="utf-8"))


def index_construcoes_by_english(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        english = row.get("ingles")
        if not english:
            continue
        index.setdefault(english, []).append(row)
    for proto, english in BUILDING_PROTO_TO_ENGLISH.items():
        if english in index:
            index.setdefault(proto, index[english])
    return index


def resolve_building_entries(
    building_proto: str,
    building: ET.Element | None,
    *,
    construcoes_index: dict[str, list[dict[str, Any]]],
    pantheon_ids: set[int] | None,
) -> list[dict[str, Any]]:
    if building_proto == "Temple":
        if pantheon_ids:
            return [
                {
                    "proto": "Temple",
                    "id": pantheon_id,
                    "nome": PANTHEON_TEMPLE_NOME.get(pantheon_id, "Templo"),
                }
                for pantheon_id in sorted(pantheon_ids)
                if pantheon_id in PANTHEON_TEMPLE_NOME
            ]
        return [
            {
                "proto": "Temple",
                "id": pantheon_id,
                "nome": nome,
            }
            for pantheon_id, nome in sorted(PANTHEON_TEMPLE_NOME.items())
        ]

    english = BUILDING_PROTO_TO_ENGLISH.get(building_proto, building_proto)
    candidates = list(construcoes_index.get(english, []))
    if not candidates and english != building_proto:
        candidates = list(construcoes_index.get(building_proto, []))

    if pantheon_ids:
        by_pantheon = [
            row
            for row in candidates
            if row.get("panteao_id") in pantheon_ids
        ]
        if by_pantheon:
            candidates = by_pantheon
        elif candidates:
            # Não usar Armaria Grega etc. quando o panteão pedido não tem entrada.
            return [{"proto": building_proto, "nome": english}]

    if len(candidates) > 1 and building is not None:
        pantheon = detect_pantheon(building)
        if pantheon:
            by_detected = [
                row for row in candidates if row.get("panteao_id") == pantheon["id"]
            ]
            if by_detected:
                candidates = by_detected

    if not candidates:
        return [{"proto": building_proto, "nome": english}]

    return [
        {
            "proto": building_proto,
            "id": row.get("id"),
            "nome": row.get("nome", english),
        }
        for row in candidates
    ]


def parse_tech_era(tech: ET.Element) -> list[dict[str, Any]]:
    tech_age = _text(tech, "techage")
    token = TECH_AGE_TOKEN.get(tech_age)
    if not token:
        match = re.match(r"^(Archaic|Classical|Heroic|Mythic|Titan)Age", tech_age)
        token = match.group(1) if match else ""
    meta = ERA_FROM_TOKEN.get(token)
    if not meta:
        return []
    return [{"id": meta["id"], "nome": f"{meta['nome']} :{meta['icon']}:"}]


def parse_tech_costs(tech: ET.Element) -> dict[str, int]:
    costs: dict[str, int] = {}
    for cost in tech.findall("cost"):
        resource = cost.get("resourcetype")
        field = RESOURCE_FIELD.get(resource or "")
        if not field:
            continue
        costs[field] = int(round(_float(cost.text)))
    return costs


def lookup_tech_name(
    tech: ET.Element,
    *,
    strings_en: dict[str, str],
    strings_pt: dict[str, str],
) -> tuple[str, str]:
    display_id = _text(tech, "displaynameid")
    english = strings_en.get(display_id, "")
    portuguese = strings_pt.get(display_id, english)
    return portuguese, english


def extract_tech_record(
    tech_name: str,
    tech: ET.Element,
    *,
    strings_en: dict[str, str],
    strings_pt: dict[str, str],
    researchers: dict[str, list[str]],
    proto_units: dict[str, ET.Element],
    construcoes_index: dict[str, list[dict[str, Any]]],
    pantheon_ids: set[int] | None = None,
) -> dict[str, Any]:
    nome_pt, nome_en = lookup_tech_name(
        tech,
        strings_en=strings_en,
        strings_pt=strings_pt,
    )
    building_protos = filter_research_buildings(researchers.get(tech_name, []))
    construcao_origem: list[dict[str, Any]] = []
    seen_keys: set[tuple[Any, str]] = set()

    for building_proto in building_protos:
        building = proto_units.get(building_proto)
        for entry in resolve_building_entries(
            building_proto,
            building,
            construcoes_index=construcoes_index,
            pantheon_ids=pantheon_ids,
        ):
            key = (entry.get("id"), entry.get("nome", ""))
            if key in seen_keys:
                continue
            seen_keys.add(key)
            item = {"nome": entry["nome"]}
            if entry.get("id") is not None:
                item["id"] = entry["id"]
            item["proto"] = entry.get("proto", building_proto)
            construcao_origem.append(item)

    record: dict[str, Any] = {
        "proto_name": tech_name,
        "nome": nome_pt or tech_name,
        "ingles": nome_en or tech_name,
        "icon": tech_icon_token(_text(tech, "icon")),
        "tempo_s": int(round(_float(_text(tech, "researchpoints")))),
        "eras": parse_tech_era(tech),
        "construcao_origem": construcao_origem,
    }
    record.update(parse_tech_costs(tech))
    return record


def rebuild_construcao_origem(
    tech_name: str,
    *,
    cache_dir: Path,
    construcoes_path: Path,
    pantheon_ids: set[int] | None = None,
) -> list[dict[str, Any]]:
    proto_path = cache_dir / "gameplay" / "proto.xml"
    proto_units = parse_proto_units(proto_path)
    researchers = parse_tech_researchers(proto_units)
    construcoes_rows = load_construcoes_rows(construcoes_path)
    construcoes_index = index_construcoes_by_english(construcoes_rows)

    building_protos = filter_research_buildings(researchers.get(tech_name, []))
    construcao_origem: list[dict[str, Any]] = []
    seen_keys: set[tuple[Any, str]] = set()

    for building_proto in building_protos:
        building = proto_units.get(building_proto)
        for entry in resolve_building_entries(
            building_proto,
            building,
            construcoes_index=construcoes_index,
            pantheon_ids=pantheon_ids,
        ):
            key = (entry.get("id"), entry.get("nome", ""))
            if key in seen_keys:
                continue
            seen_keys.add(key)
            item = {"nome": entry["nome"]}
            if entry.get("id") is not None:
                item["id"] = entry["id"]
            item["proto"] = entry.get("proto", building_proto)
            construcao_origem.append(item)

    return construcao_origem


def extract_techs(
    cache_dir: Path,
    *,
    only_tech: str | None = None,
    construcoes_path: Path | None = None,
    pantheon_ids: set[int] | None = None,
) -> list[dict[str, Any]]:
    proto_path = cache_dir / "gameplay" / "proto.xml"
    techtree_path = cache_dir / "gameplay" / "techtree.xml"
    strings_en_path = cache_dir / "strings" / "English" / "string_table.txt"
    strings_pt_path = cache_dir / "strings" / "PortugueseBrazil" / "string_table.txt"

    for required in (proto_path, techtree_path, strings_en_path, strings_pt_path):
        if not required.exists():
            raise FileNotFoundError(
                f"Arquivo ausente: {required}. Rode a extração do Data.bar primeiro."
            )

    strings_en = parse_string_table(strings_en_path)
    strings_pt = parse_string_table(strings_pt_path)
    proto_units = parse_proto_units(proto_path)
    tech_nodes = parse_tech_nodes(techtree_path)
    researchers = parse_tech_researchers(proto_units)
    construcoes_rows = load_construcoes_rows(construcoes_path or Path())
    construcoes_index = index_construcoes_by_english(construcoes_rows)

    records: list[dict[str, Any]] = []
    for tech_name, tech in sorted(tech_nodes.items()):
        if only_tech and tech_name.lower() != only_tech.lower():
            continue
        records.append(
            extract_tech_record(
                tech_name,
                tech,
                strings_en=strings_en,
                strings_pt=strings_pt,
                researchers=researchers,
                proto_units=proto_units,
                construcoes_index=construcoes_index,
                pantheon_ids=pantheon_ids,
            )
        )
    return records
