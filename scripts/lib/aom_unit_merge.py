from __future__ import annotations

import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from copy import deepcopy
from pathlib import Path
from typing import Any

PRESERVED_FIELDS = frozenset(
    {
        "id",
        "counter_de",
        "categoria",
        "forte_contra",
        "fraco_contra",
        "forca_atributos",
    }
)

DAMAGE_FIELDS = (
    "dano_cortante",
    "dano_perfurante",
    "dano_contusao",
    "dano_divino",
)

STAT_FIELDS = (
    "pontos_de_vida",
    "velocidade_de_ataque_atk_s",
    "dps",
    "armadura_anticorte",
    "armadura_antiperfurante",
    "comida",
    "madeira",
    "ouro",
    "favor",
    "custo_total",
    "populacao",
    "tempo_treinamento",
    "velocidade_movimento",
    "icon",
)

LOCALIZED_FIELDS = (
    "tipo",
    "multiplicador",
    "panteao",
    "era",
    "construcao",
)

# O extrator usa rótulos PT; no catálogo EN alguns tipos históricos diferem.
TIPO_LABEL_EN = {
    "Unidade mítica": "Mythic",
    "Arma de cerco": "Cerco",
    "Herói": "Hero",
}

# Classes geridas pelo extrator. Qualquer outro rótulo em `tipo` é editorial
# (ex.: Curandeiro✨, Batedor, Voador) e deve ser preservado no merge.
EXTRACTED_TIPO_LABELS = frozenset(
    {
        "Infantaria",
        "Artilharia",
        "Cavalaria",
        "Arma de cerco",
        "Cerco",
        "Navio",
        "Unidade mítica",
        "Mythic",
        "Herói",
        "Hero",
        "Aldeão",
    }
)

COMBAT_TIPO_LABELS = frozenset(
    {
        "Infantaria",
        "Artilharia",
        "Cavalaria",
        "Arma de cerco",
        "Cerco",
        "Navio",
    }
)

BUILDING_PROTO_ALIASES = {
    "MilitaryAcademy": "Military Academy",
    "ArcheryRange": "Archery Range",
    "SiegeWorks": "Siege Works",
    "MigdolStronghold": "Migdol Stronghold",
    "WarCamp": "War Camp",
    "MachineWorkshop": "Machine Workshop",
}

# Nomes do catálogo (campo `ingles`) que divergem do proto name no jogo.
CATALOG_PROTO_ALIASES = {
    "Toxote": "Toxotes",
    "Hypapist": "Hypaspist",
    "Berserker": "Berserk",
    "Huscarl": "Huskarl",
    "Minotauro": "Minotaur",
    "Centauro": "Centaur",
    "Ciclope": "Cyclops",
    "Esfinge": "Sphinx",
    "Valquíria": "Valkyrie",
    "Valquiria": "Valkyrie",
    "Prometeus": "Promethean",
    "Autômato": "Automaton",
    "Automato": "Automaton",
    "Oracle (Hero)": "OracleHero",
    "Murmillo (Hero)": "MurmilloHero",
    "Katapeltes (Hero)": "KatapeltesHero",
    "Turma (Hero)": "TurmaHero",
    "Cheiroballista (Hero)": "CheiroballistaHero",
    "Contarius (Hero)": "ContariusHero",
    "Arcus (Hero)": "ArcusHero",
    "Shade of Hades": "HadesShade",
    "Onmyyoji": "Onmyoji",
    "Onmyyoji (Hero)": "Onmyoji",
    "Harpy": "HarpyMyth",
    "Lykaon": "LykaonVillager",
    "Lykaon (Villager)": "LykaonVillager",
    "Lykaon (Wolf)": "LykaonWolf",
    "Licaão (Aldeão)": "LykaonVillager",
    "Licaão (Lobo)": "LykaonWolf",
    "King Midas": "Midas",
    "Quimchim Spy": "QuimichinSpy",
    "Otontin Smasher": "Otontin",
    "Wanyūdō": "Wanyudo",
    "Settler": "VillagerAztec",
    "Fishing Ship (Aztec)": "FishingShipAztec",
    "Transport Ship (Aztec)": "TransportShipAztec",
    "Teixiptla (Huitzilopochtli)": "TeixiptlaHuitz",
    "Teixiptla (Tezcatlipoca)": "TeixiptlaTezca",
    "Teixiptla (Quetzalcoatl)": "TeixiptlaQuetz",
    "Anaconda": "AnacondaCoatlicue",
    "Pochtecatl Caravan": "CaravanAztec",
    "Titan (Cerberus)": "TitanCerberus",
    "Titan (Egyptian)": "TitanBird",
    "Titan (Ymir)": "TitanYmir",
    "Titan (Atlantean)": "TitanAtlantean",
    "Titan (Xing Tian)": "TitanXingTian",
    "Titan (Yamata no Orochi)": "TitanYamataNoOrochi",
    "Gullinbursti": "GullinburstiClassical",
    "Dwarf": "VillagerDwarf",
    "Citizen": "VillagerAtlantean",
    "Nezha (Child)": "NezhaChild",
    "Nezha (Youth)": "NezhaYouth",
    "Nezha (Hero)": "Nezha",
}


def _compact_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", stripped.lower())


def _normalize_number(value: Any) -> Any:
    if isinstance(value, bool):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def load_catalog(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_catalog(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def load_building_id_map(construcoes_path: Path) -> dict[str, int]:
    if not construcoes_path.exists():
        return {}
    data = json.loads(construcoes_path.read_text(encoding="utf-8"))
    mapping: dict[str, int] = {}
    for row in data:
        row_id = row.get("id")
        if row_id is None:
            continue
        english = row.get("ingles")
        nome = row.get("nome")
        if english:
            mapping[english] = row_id
            mapping[english.replace(" ", "")] = row_id
        if nome:
            mapping[nome] = row_id
    for proto, english in BUILDING_PROTO_ALIASES.items():
        if english in mapping:
            mapping.setdefault(proto, mapping[english])
    return mapping


def index_extracted_by_proto(
    extracted_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    return {row["proto_name"]: row for row in extracted_rows if row.get("proto_name")}


def match_catalog_to_proto(catalog_row: dict[str, Any]) -> str | None:
    english = (catalog_row.get("ingles") or "").strip()
    if english:
        return english
    nome = (catalog_row.get("nome") or "").strip()
    return nome or None


def _catalog_name_candidates(catalog_name: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def add(value: str) -> None:
        value = value.strip()
        if value and value not in seen:
            seen.add(value)
            out.append(value)

    add(catalog_name)
    add(CATALOG_PROTO_ALIASES.get(catalog_name, ""))

    hero_suffix = " (Hero)"
    if catalog_name.endswith(hero_suffix):
        base = catalog_name[: -len(hero_suffix)].strip()
        add(base)
        add(f"{base}Hero")
        add(base.replace(" ", "") + "Hero")

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

        aliased = CATALOG_PROTO_ALIASES.get(candidate)
        if aliased and aliased in extracted_index:
            return aliased

        resolved = compact_index.get(_compact_key(candidate))
        if resolved:
            return resolved

    return None


def load_proto_name_set(cache_dir: Path) -> set[str]:
    proto_path = cache_dir / "gameplay" / "proto.xml"
    tree = ET.parse(proto_path)
    return {
        unit.get("name")
        for unit in tree.getroot().findall("unit")
        if unit.get("name")
    }


def supplement_extracted_index(
    extracted_index: dict[str, dict[str, Any]],
    *,
    catalog_path: Path,
    cache_dir: Path,
    construcoes_path: Path,
    id_filter: set[int] | None,
    unit_filter: set[str] | None,
) -> int:
    rows = load_catalog(catalog_path)
    proto_names = load_proto_name_set(cache_dir)
    stub_index = {name: {} for name in proto_names}
    normalized_unit_filter = (
        {name.lower() for name in unit_filter} if unit_filter is not None else None
    )
    to_extract: set[str] = set()

    for row in rows:
        if id_filter is not None and row.get("id") not in id_filter:
            continue
        catalog_name = match_catalog_to_proto(row) or ""
        if normalized_unit_filter is not None:
            if catalog_name.lower() not in normalized_unit_filter:
                continue
        if resolve_proto_name(catalog_name, extracted_index):
            continue
        resolved = resolve_proto_name(catalog_name, stub_index)
        if resolved:
            to_extract.add(resolved)

    if not to_extract:
        return 0

    from aom_unit_extractor import extract_units

    added = 0
    for proto in sorted(to_extract):
        extracted_rows = extract_units(
            cache_dir,
            only_unit=proto,
            construcoes_path=construcoes_path,
        )
        if extracted_rows:
            extracted_index[proto] = extracted_rows[0]
            added += 1
    return added


def localize_tipo(
    extracted_tipo: list[dict[str, Any]] | None,
    *,
    locale: str,
) -> list[dict[str, Any]] | None:
    if not extracted_tipo:
        return extracted_tipo
    if locale.lower() != "en":
        return deepcopy(extracted_tipo)
    localized: list[dict[str, Any]] = []
    for item in extracted_tipo:
        mapped = deepcopy(item)
        label = mapped.get("type")
        if isinstance(label, str) and label in TIPO_LABEL_EN:
            mapped["type"] = TIPO_LABEL_EN[label]
        localized.append(mapped)
    return localized


def merge_tipo(
    existing: list[dict[str, Any]] | None,
    extracted_tipo: list[dict[str, Any]] | None,
    *,
    locale: str,
) -> list[dict[str, Any]] | None:
    """Sincroniza classes do jogo e preserva tags editoriais (Curandeiro, Batedor...)."""
    localized = localize_tipo(extracted_tipo, locale=locale)
    if not localized:
        return existing

    merged = deepcopy(localized)
    seen = {item.get("type") for item in merged if item.get("type")}
    extracted_combat = {label for label in seen if label in COMBAT_TIPO_LABELS}
    existing_labels = {
        item.get("type") for item in (existing or []) if item.get("type")
    }

    for item in existing or []:
        label = item.get("type")
        if not label or label in seen:
            continue
        if label not in EXTRACTED_TIPO_LABELS:
            # Editorial puro (Curandeiro✨, Batedor, Voador...).
            merged.append(deepcopy(item))
            seen.add(label)
            continue
        # Combate secundário já curado (ex.: Turma Artilharia+Cavalaria).
        if (
            label in COMBAT_TIPO_LABELS
            and extracted_combat
            and extracted_combat <= existing_labels
        ):
            merged.append(deepcopy(item))
            seen.add(label)
    return merged


def merge_entity_refs(
    existing: list[dict[str, Any]] | None,
    extracted: list[dict[str, Any]] | None,
) -> list[dict[str, Any]] | None:
    if not extracted:
        return existing
    ext = extracted[0]
    if existing:
        current = existing[0]
        return [
            {
                "id": current.get("id", ext.get("id")),
                "nome": ext.get("nome", current.get("nome")),
            }
        ]
    if ext.get("id") is not None:
        return [{"id": ext["id"], "nome": ext["nome"]}]
    return [{"nome": ext["nome"]}]


def merge_construcao(
    existing: list[dict[str, Any]] | None,
    extracted: list[dict[str, Any]] | None,
    building_ids: dict[str, int],
) -> list[dict[str, Any]] | None:
    if not extracted:
        return existing
    existing = existing or []
    merged: list[dict[str, Any]] = []
    for index, ext in enumerate(extracted):
        prior = existing[index] if index < len(existing) else {}
        proto = ext.get("proto", "")
        nome = prior.get("nome") or ext.get("nome")
        building_id = (
            prior.get("id")
            or building_ids.get(proto)
            or building_ids.get(nome or "")
        )
        item: dict[str, Any] = {"nome": nome}
        if building_id is not None:
            item["id"] = building_id
        merged.append(item)
    return merged


def build_merged_row(
    existing: dict[str, Any],
    extracted: dict[str, Any],
    *,
    locale: str,
    building_ids: dict[str, int],
) -> dict[str, Any]:
    merged = deepcopy(existing)
    locale_key = locale.lower()

    if locale_key == "en":
        merged["nome"] = extracted.get("ingles") or extracted.get("nome") or merged.get("nome")
    else:
        merged["nome"] = extracted.get("nome") or merged.get("nome")

    merged["ingles"] = extracted.get("ingles") or merged.get("ingles")

    for field in STAT_FIELDS:
        if field in extracted:
            merged[field] = deepcopy(extracted[field])

    for field in DAMAGE_FIELDS:
        if field in extracted:
            merged[field] = _normalize_number(extracted[field])
        elif field in merged:
            del merged[field]

    if locale_key != "en":
        merged["tipo"] = merge_tipo(
            existing.get("tipo"),
            extracted.get("tipo"),
            locale=locale_key,
        )
        merged["multiplicador"] = deepcopy(
            extracted.get("multiplicador") or merged.get("multiplicador")
        )
        merged["panteao"] = merge_entity_refs(
            existing.get("panteao"),
            extracted.get("panteao"),
        )
        merged["era"] = merge_entity_refs(existing.get("era"), extracted.get("era"))
        merged["construcao"] = merge_construcao(
            existing.get("construcao"),
            extracted.get("construcao"),
            building_ids,
        )
    else:
        # EN preserva textos editoriais de panteão/era/construção/multiplicador,
        # mas sincroniza `tipo` (com rótulos EN históricos como Mythic/Hero/Cerco)
        # e mantém tags editoriais como Curandeiro/Batedor.
        merged["tipo"] = merge_tipo(
            existing.get("tipo"),
            extracted.get("tipo"),
            locale=locale_key,
        )

    for field in STAT_FIELDS:
        if field in merged:
            if isinstance(merged[field], list):
                continue
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


def parse_unit_filter(value: str | None) -> set[str] | None:
    if not value:
        return None
    return {part.strip() for part in value.split(",") if part.strip()}


def parse_id_range(value: str | None) -> set[int] | None:
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
    unit_filter: set[str] | None = None,
    id_filter: set[int] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    rows = load_catalog(catalog_path)
    building_ids = load_building_id_map(construcoes_path)
    updated_rows: list[dict[str, Any]] = []
    report: list[dict[str, Any]] = []
    missing: list[str] = []

    normalized_unit_filter = (
        {u.lower() for u in unit_filter} if unit_filter is not None else None
    )

    for row in rows:
        proto = match_catalog_to_proto(row)
        if normalized_unit_filter is not None:
            if not proto or proto.lower() not in normalized_unit_filter:
                updated_rows.append(row)
                continue
        elif id_filter is not None and row.get("id") not in id_filter:
            updated_rows.append(row)
            continue

        if normalized_unit_filter is not None or id_filter is not None:
            catalog_name = proto or f"id={row.get('id')}"
            resolved_proto = resolve_proto_name(proto or "", extracted_index)
            extracted = (
                extracted_index.get(resolved_proto or "")
                if resolved_proto
                else None
            )
            if not extracted:
                missing.append(catalog_name)
                updated_rows.append(row)
                continue
            merged = build_merged_row(
                row,
                extracted,
                locale=locale,
                building_ids=building_ids,
            )
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
            continue

        updated_rows.append(row)

    if not dry_run:
        save_catalog(catalog_path, updated_rows)

    return {
        "path": str(catalog_path),
        "updated": len(report),
        "missing": missing,
        "report": report,
    }
