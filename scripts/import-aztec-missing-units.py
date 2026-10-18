#!/usr/bin/env python3
"""
Importa unidades astecas ausentes (civil/naval/herói/summons) para unidades_aom.json.

Exemplos:
  python scripts/import-aztec-missing-units.py --dry-run
  python scripts/import-aztec-missing-units.py --write
"""

from __future__ import annotations

import argparse
import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CACHE_DIR  # noqa: E402
from aom_proto_maps import ERA_FROM_TOKEN  # noqa: E402
from aom_unit_extractor import extract_units  # noqa: E402
from aom_unit_merge import TIPO_LABEL_EN, _normalize_number  # noqa: E402

CACHE = Path(DEFAULT_CACHE_DIR)
PT_UNITS = ROOT / "src" / "data" / "locale" / "pt" / "unidades_aom.json"
EN_UNITS = ROOT / "src" / "data" / "locale" / "en" / "unidades_aom.json"
PT_CONS = ROOT / "src" / "data" / "locale" / "pt" / "construcoes.json"
EN_CONS = ROOT / "src" / "data" / "locale" / "en" / "construcoes.json"
PT_DEUSES = ROOT / "src" / "data" / "locale" / "pt" / "deuses_aom.json"
EN_DEUSES = ROOT / "src" / "data" / "locale" / "en" / "deuses_aom.json"
TOKEN_MAP = ROOT / "src" / "data" / "token_asset_map.json"

PANTHEON = {"id": 7, "nome": "Asteca :aomr_pantheon_azteca_icon:"}

# proto → (god_id|None, god_nome|None, era_id, ingles_override|None, nome_pt_override|None)
AZTEC_MISSING: dict[str, tuple[int | None, str | None, int, str | None, str | None]] = {
    "VillagerAztec": (None, None, 1, None, None),
    "ArrowCanoe": (None, None, 2, None, None),
    "TepoztliCanoe": (None, None, 2, None, None),
    "AtlatlSiegeCanoe": (None, None, 2, None, None),
    "FishingShipAztec": (None, None, 1, "Fishing Ship (Aztec)", "Navio Pesqueiro"),
    "TransportShipAztec": (None, None, 2, "Transport Ship (Aztec)", "Navio de Transporte"),
    "CaravanAztec": (None, None, 3, None, None),
    "TeixiptlaHuitz": (
        84,
        "Huitzilopochtli",
        2,
        "Teixiptla (Huitzilopochtli)",
        "Ixiptla (Huitzilopochtli)",
    ),
    "TeixiptlaTezca": (
        83,
        "Tezcatlipoca",
        2,
        "Teixiptla (Tezcatlipoca)",
        "Ixiptla (Tezcatlipoca)",
    ),
    "TeixiptlaQuetz": (
        82,
        "Quetzalcoatl",
        2,
        "Teixiptla (Quetzalcoatl)",
        "Ixiptla (Quetzalcoatl)",
    ),
    "LargeScorpion": (85, "Malinalxochitl", 2, None, None),
    "Tlacanexquimilli": (92, "Xolotl", 4, None, None),
    "AnacondaCoatlicue": (89, "Coatlicue", 3, None, None),
}

BUILDING_IDS_AZTEC = {
    "TownCenter": 9,
    "VillageCenter": 9,
    "CitadelCenter": 9,
    "Temple": 12,
    "Dock": 79,
    "GreatTemple": 77,
    "WarHut": 74,
    "NoblesHut": 75,
    "Market": 80,
    "Calpulli": 10,
}

BUILDING_NAMES_PT = {
    "TownCenter": "Centro Urbano (Asteca)",
    "VillageCenter": "Centro da Aldeia (Asteca)",
    "CitadelCenter": "Cidadela (Asteca)",
    "Temple": "Templo (Asteca)",
    "Dock": "Doca (Asteca)",
    "GreatTemple": "Grande Templo",
    "WarHut": "Cabana de Guerra",
    "NoblesHut": "Cabana do Nobre",
    "Market": "Mercado (Asteca)",
    "Calpulli": "Calpulli",
}

BUILDING_NAMES_EN = {
    "TownCenter": "Town Center (Aztec)",
    "VillageCenter": "Village Center (Aztec)",
    "CitadelCenter": "Citadel Center (Aztec)",
    "Temple": "Temple (Aztec)",
    "Dock": "Dock (Aztec)",
    "GreatTemple": "Great Temple",
    "WarHut": "War Hut",
    "NoblesHut": "Noble's Hut",
    "Market": "Market (Aztec)",
    "Calpulli": "Calpulli",
}

ICON_URLS = {
    "aomr_villager_aztec_icon": "/assets/und_villagers/AoMR_Villager_Aztec_icon.webp",
    "aomr_arrow_canoe_icon": "/assets/unit_humans/unit_aztec/arrow_canoe_icon.webp",
    "aomr_tepoztli_canoe_icon": "/assets/unit_humans/unit_aztec/tepoztli_canoe_icon.webp",
    "aomr_atlatl_siege_canoe_icon": "/assets/unit_humans/unit_aztec/atlatl_siege_canoe_icon.webp",
    "aomr_fishing_ship_aztec_icon": "/assets/unit_humans/unit_aztec/fishing_ship_aztec_icon.webp",
    "aomr_transport_ship_aztec_icon": "/assets/unit_humans/unit_aztec/transport_ship_aztec_icon.webp",
    "aomr_caravan_aztec_icon": "/assets/unit_humans/unit_aztec/caravan_aztec_icon.webp",
    "aomr_teixiptla_huitz_icon": "/assets/unit_humans/unit_aztec/teixiptla_huitz_icon.webp",
    "aomr_teixiptla_tezca_icon": "/assets/unit_humans/unit_aztec/teixiptla_tezca_icon.webp",
    "aomr_teixiptla_quetz_icon": "/assets/unit_humans/unit_aztec/teixiptla_quetz_icon.webp",
    "aomr_large_scorpion_icon": "/assets/unit_humans/unit_aztec/large_scorpion_icon.webp",
    "aomr_tlacanexquimilli_icon": "/assets/unit_humans/unit_aztec/tlacanexquimilli_icon.webp",
    "aomr_anaconda_icon": "/assets/unit_humans/unit_aztec/anaconda_icon.webp",
}

TIPO_OVERRIDES: dict[str, list[dict[str, str]]] = {
    "VillagerAztec": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "ArrowCanoe": [
        {"type": "Navio", "icon": "aomr_type_ship_icon"},
        {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
    ],
    "TepoztliCanoe": [{"type": "Navio", "icon": "aomr_type_ship_icon"}],
    "AtlatlSiegeCanoe": [
        {"type": "Navio", "icon": "aomr_type_ship_icon"},
        {"type": "Artilharia", "icon": "aomr_type_archer_icon"},
    ],
    "FishingShipAztec": [{"type": "Navio", "icon": "aomr_type_ship_icon"}],
    "TransportShipAztec": [{"type": "Navio", "icon": "aomr_type_ship_icon"}],
    "CaravanAztec": [{"type": "Aldeão", "icon": "aomr_type_villager_icon"}],
    "AnacondaCoatlicue": [
        {"type": "Unidade mítica", "icon": "aomr_type_myth_unit_icon"}
    ],
}

ERA_LABEL_EN = {
    "Archaic": "Archaic",
    "Classical": "Classical",
    "Heroic": "Heroic",
    "Mythic": "Mythic",
    "Titan": "Titan",
}


def era_entry(era_id: int, *, locale: str) -> dict[str, Any]:
    token_by_id = {meta["id"]: token for token, meta in ERA_FROM_TOKEN.items()}
    token = token_by_id[era_id]
    meta = ERA_FROM_TOKEN[token]
    label = ERA_LABEL_EN.get(token, meta["nome"]) if locale == "en" else meta["nome"]
    return {"id": meta["id"], "nome": f"{label} :{meta['icon']}:"}


def localize_tipo(tipo: list[dict[str, Any]] | None, *, locale: str) -> list[dict[str, Any]]:
    if not tipo:
        return []
    if locale != "en":
        return deepcopy(tipo)
    out = []
    for item in tipo:
        mapped = deepcopy(item)
        label = mapped.get("type")
        if isinstance(label, str) and label in TIPO_LABEL_EN:
            mapped["type"] = TIPO_LABEL_EN[label]
        elif label == "Aldeão":
            mapped["type"] = "Villager"
        elif label == "Navio":
            mapped["type"] = "Ship"
        out.append(mapped)
    return out


def resolve_construcao(
    extracted: list[dict[str, Any]] | None,
    *,
    locale: str,
) -> list[dict[str, Any]]:
    if not extracted:
        return []
    names = BUILDING_NAMES_EN if locale == "en" else BUILDING_NAMES_PT
    # Prefer TownCenter for villagers; Dock for ships; Market for caravan
    preferred = ["TownCenter", "Dock", "Market", "Temple", "GreatTemple", "WarHut", "NoblesHut"]
    by_proto = {item.get("proto"): item for item in extracted if item.get("proto")}
    ordered_protos: list[str] = []
    for proto in preferred:
        if proto in by_proto and proto not in ordered_protos:
            ordered_protos.append(proto)
    for proto in by_proto:
        if proto not in ordered_protos:
            ordered_protos.append(proto)

    out: list[dict[str, Any]] = []
    for proto in ordered_protos:
        # Villager: only TownCenter
        if "Villager" in str(extracted) and proto != "TownCenter":
            # handled below via proto filter on caller side
            pass
        building_id = BUILDING_IDS_AZTEC.get(proto)
        nome = names.get(proto) or by_proto[proto].get("nome") or proto
        row: dict[str, Any] = {"nome": nome}
        if building_id is not None:
            row["id"] = building_id
        out.append(row)
    return out


def resolve_construcao_for_proto(
    proto: str,
    extracted: list[dict[str, Any]] | None,
    *,
    locale: str,
) -> list[dict[str, Any]]:
    if proto == "VillagerAztec":
        names = BUILDING_NAMES_EN if locale == "en" else BUILDING_NAMES_PT
        return [{"nome": names["TownCenter"], "id": BUILDING_IDS_AZTEC["TownCenter"]}]
    if proto in {
        "ArrowCanoe",
        "TepoztliCanoe",
        "AtlatlSiegeCanoe",
        "FishingShipAztec",
        "TransportShipAztec",
    }:
        names = BUILDING_NAMES_EN if locale == "en" else BUILDING_NAMES_PT
        return [{"nome": names["Dock"], "id": BUILDING_IDS_AZTEC["Dock"]}]
    if proto == "CaravanAztec":
        names = BUILDING_NAMES_EN if locale == "en" else BUILDING_NAMES_PT
        return [{"nome": names["Market"], "id": BUILDING_IDS_AZTEC["Market"]}]
    if proto.startswith("Teixiptla"):
        # Converted from Warrior Priest / major hero — Temple
        names = BUILDING_NAMES_EN if locale == "en" else BUILDING_NAMES_PT
        return [{"nome": names["Temple"], "id": BUILDING_IDS_AZTEC["Temple"]}]
    return resolve_construcao(extracted, locale=locale)


def next_catalog_id(rows: list[dict[str, Any]]) -> int:
    ids = [int(r["id"]) for r in rows if r.get("id") is not None]
    return (max(ids) + 1) if ids else 1


def catalog_has_unit(rows: list[dict[str, Any]], ingles: str) -> dict[str, Any] | None:
    wanted = ingles.strip().lower()
    for row in rows:
        if (row.get("ingles") or "").strip().lower() == wanted:
            return row
    return None


def build_row(
    extracted: dict[str, Any],
    *,
    locale: str,
    unit_id: int,
    god_id: int | None,
    god_name: str | None,
    era_id: int,
    proto: str,
    ingles_override: str | None,
    nome_pt_override: str | None,
) -> dict[str, Any]:
    tipo = TIPO_OVERRIDES.get(proto) or extracted.get("tipo") or []
    ingles = ingles_override or extracted.get("ingles") or extracted.get("proto_name")
    if locale == "en":
        nome = ingles_override or extracted.get("ingles") or extracted.get("proto_name")
    else:
        nome = nome_pt_override or extracted.get("nome") or ingles

    row: dict[str, Any] = {
        "id": unit_id,
        "nome": nome,
        "ingles": ingles,
        "tipo": localize_tipo(tipo, locale=locale),
        "panteao": [deepcopy(PANTHEON)],
        "era": [era_entry(era_id, locale=locale)],
        "multiplicador": deepcopy(extracted.get("multiplicador") or []),
        "pontos_de_vida": _normalize_number(extracted.get("pontos_de_vida")),
        "velocidade_de_ataque_atk_s": _normalize_number(
            extracted.get("velocidade_de_ataque_atk_s")
        ),
        "dps": _normalize_number(extracted.get("dps")),
        "armadura_anticorte": _normalize_number(extracted.get("armadura_anticorte")),
        "armadura_antiperfurante": _normalize_number(
            extracted.get("armadura_antiperfurante")
        ),
        "construcao": resolve_construcao_for_proto(
            proto, extracted.get("construcao"), locale=locale
        ),
        "comida": _normalize_number(extracted.get("comida") or 0),
        "madeira": _normalize_number(extracted.get("madeira") or 0),
        "ouro": _normalize_number(extracted.get("ouro") or 0),
        "favor": _normalize_number(extracted.get("favor") or 0),
        "custo_total": _normalize_number(extracted.get("custo_total") or 0),
        "populacao": _normalize_number(extracted.get("populacao") or 0),
        "tempo_treinamento": _normalize_number(extracted.get("tempo_treinamento") or 0),
        "velocidade_movimento": _normalize_number(
            extracted.get("velocidade_movimento") or 0
        ),
        "icon": extracted.get("icon"),
    }

    for field in (
        "dano_cortante",
        "dano_perfurante",
        "dano_contusao",
        "dano_divino",
        "alcance",
    ):
        if field in extracted:
            row[field] = _normalize_number(extracted[field])

    if extracted.get("max_range"):
        row["alcance"] = _normalize_number(extracted["max_range"])

    if god_id is not None and god_name:
        row["god_dono"] = [{"id": god_id, "nome": god_name}]

    if proto.startswith("Teixiptla"):
        row["fraco_contra"] = None
    elif "MythUnit" in str(extracted.get("unit_types") or []) or proto in {
        "LargeScorpion",
        "Tlacanexquimilli",
        "AnacondaCoatlicue",
    }:
        row["fraco_contra"] = "Herói :aomr_type_hero_icon:"

    return row


def ensure_token_map(icons: set[str], *, dry_run: bool = False) -> int:
    mapping = json.loads(TOKEN_MAP.read_text(encoding="utf-8"))
    changes = 0
    for icon in sorted(icons):
        url = ICON_URLS.get(icon)
        if not url:
            print(f"  aviso: sem URL mapeada para {icon}")
            continue
        path = ROOT / "public" / Path(url.lstrip("/"))
        if not path.exists():
            print(f"  aviso: arquivo ausente {path}")
            continue
        if mapping.get(icon) != url:
            mapping[icon] = url
            changes += 1
    if changes and not dry_run:
        TOKEN_MAP.write_text(
            json.dumps(mapping, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changes


def update_deuses_exclusivas(
    deuses_path: Path,
    unit_refs_by_god: dict[int, list[dict[str, Any]]],
    *,
    dry_run: bool,
) -> int:
    if not deuses_path.exists():
        return 0
    rows = json.loads(deuses_path.read_text(encoding="utf-8"))
    updated = 0
    for row in rows:
        god_id = row.get("id")
        if god_id not in unit_refs_by_god:
            continue
        refs = unit_refs_by_god[god_id]
        existing = row.get("unidades_exclusivas") or []
        existing_ids = {item.get("id") for item in existing if isinstance(item, dict)}
        changed = False
        for ref in refs:
            if ref["id"] in existing_ids:
                continue
            existing.append(deepcopy(ref))
            changed = True
        if changed:
            row["unidades_exclusivas"] = existing
            updated += 1
    if updated and not dry_run:
        deuses_path.write_text(
            json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return updated


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", default=str(CACHE))
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args()

    cache = Path(args.cache_dir)
    pt_rows = json.loads(PT_UNITS.read_text(encoding="utf-8"))
    en_rows = json.loads(EN_UNITS.read_text(encoding="utf-8"))
    next_id = next_catalog_id(pt_rows)

    added: list[str] = []
    skipped: list[str] = []
    icons: set[str] = set()
    unit_refs_by_god: dict[int, list[dict[str, Any]]] = {}
    id_by_proto: dict[str, int] = {}

    for proto, (god_id, god_name, era_id, ingles_ov, nome_pt_ov) in AZTEC_MISSING.items():
        extracted_list = extract_units(
            cache,
            only_unit=proto,
            construcoes_path=PT_CONS,
        )
        if not extracted_list:
            print(f"sem extract: {proto}")
            continue
        extracted = extracted_list[0]
        ingles = ingles_ov or extracted.get("ingles") or proto

        existing = catalog_has_unit(pt_rows, ingles)
        if existing:
            skipped.append(f"{proto} (já no catálogo id={existing.get('id')})")
            continue

        unit_id = next_id
        next_id += 1

        pt_row = build_row(
            extracted,
            locale="pt",
            unit_id=unit_id,
            god_id=god_id,
            god_name=god_name,
            era_id=era_id,
            proto=proto,
            ingles_override=ingles_ov,
            nome_pt_override=nome_pt_ov,
        )
        extracted_en = extract_units(
            cache,
            only_unit=proto,
            construcoes_path=EN_CONS,
        )[0]
        en_row = build_row(
            extracted_en,
            locale="en",
            unit_id=unit_id,
            god_id=god_id,
            god_name=god_name,
            era_id=era_id,
            proto=proto,
            ingles_override=ingles_ov,
            nome_pt_override=nome_pt_ov,
        )

        pt_rows.append(pt_row)
        en_rows.append(en_row)
        added.append(f"add {proto} id={unit_id} | {pt_row['nome']}")

        if pt_row.get("icon"):
            icons.add(pt_row["icon"])
        id_by_proto[proto] = unit_id
        if god_id is not None:
            unit_refs_by_god.setdefault(god_id, []).append(
                {"id": unit_id, "nome": pt_row["nome"]}
            )

        print(
            f"+ {proto:22} id={unit_id:3} | {pt_row['nome']:32} | "
            f"era={era_id} god={god_name or '-'} icon={pt_row.get('icon')}"
        )

    print(f"\nAdicionadas: {len(added)}")
    print(f"Puladas: {len(skipped)}")
    for s in skipped:
        print(f"  - {s}")

    map_changes = ensure_token_map(icons, dry_run=args.dry_run)
    print(f"token_asset_map: {map_changes} alterações")

    en_refs: dict[int, list[dict[str, Any]]] = {}
    for proto, (god_id, _gname, _era, _i, _n) in AZTEC_MISSING.items():
        if god_id is None or proto not in id_by_proto:
            continue
        en_name = next(
            (r["nome"] for r in en_rows if r.get("id") == id_by_proto[proto]),
            proto,
        )
        en_refs.setdefault(god_id, []).append(
            {"id": id_by_proto[proto], "nome": en_name}
        )

    deuses_pt = update_deuses_exclusivas(
        PT_DEUSES, unit_refs_by_god, dry_run=args.dry_run
    )
    deuses_en = update_deuses_exclusivas(
        EN_DEUSES, en_refs, dry_run=args.dry_run
    )
    print(f"deuses unidades_exclusivas: PT={deuses_pt} EN={deuses_en}")

    if args.dry_run:
        print("\nDry-run — nenhum arquivo escrito.")
        return 0

    PT_UNITS.write_text(
        json.dumps(pt_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    EN_UNITS.write_text(
        json.dumps(en_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("\nArquivos atualizados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
