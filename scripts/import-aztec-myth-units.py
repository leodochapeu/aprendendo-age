#!/usr/bin/env python3
"""
Importa unidades míticas astecas ausentes para unidades_aom.json (PT/EN).

Exemplos:
  python scripts/import-aztec-myth-units.py --dry-run
  python scripts/import-aztec-myth-units.py --write
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

# Proto treinável / relevante → (god_id|None, god_nome|None, era_id)
AZTEC_MYTH_UNITS: dict[str, tuple[int | None, str | None, int]] = {
    "Chaneque": (86, "Huehuecóyotl", 2),
    "CentzonTotochtin": (87, "Patecatl", 2),
    "Maquizcoatl": (85, "Malinalxochitl", 2),
    "ObsidianButterfly": (88, "Itzpapalotl", 3),
    "Ayotochtli": (89, "Coatlicue", 3),
    "Tzitzimitl": (90, "Coyolxauhqui", 3),
    "Axolotl": (None, None, 3),  # naval compartilhada (HeroicAgeAztec)
    "Ahuizotl": (91, "Tlaloc", 4),
    "SoulGuide": (92, "Xolotl", 4),
    "Tunkuluchu": (93, "Mictlantecuhtli", 4),
    "Quinametzin": (None, None, 4),  # já no catálogo; atualiza se pedido
    "TitanCipactli": (None, None, 5),
}

BUILDING_IDS_AZTEC = {
    "Temple": 12,
    "Dock": 79,
    "GreatTemple": 77,
}

ICON_URLS = {
    "aomr_chaneque_icon": "/assets/unit_humans/unit_aztec/chaneque_icon.webp",
    "aomr_centzon_icon": "/assets/unit_humans/unit_aztec/centzon_icon.webp",
    "aomr_maquizcoatl_icon": "/assets/unit_humans/unit_aztec/maquizcoatl_icon.webp",
    "aomr_obsidian_butterfly_icon": "/assets/unit_humans/unit_aztec/obsidian_butterfly_icon.webp",
    "aomr_ayotochtli_icon": "/assets/unit_humans/unit_aztec/ayotochtli_icon.webp",
    "aomr_tzitzimitl_icon": "/assets/unit_humans/unit_aztec/tzitzimitl_icon.webp",
    "aomr_axolotl_icon": "/assets/unit_humans/unit_aztec/axolotl_icon.webp",
    "aomr_ahuizotl_icon": "/assets/unit_humans/unit_aztec/ahuizotl_icon.webp",
    "aomr_soul_guide_icon": "/assets/unit_humans/unit_aztec/soul_guide_icon.webp",
    "aomr_tunkuluchu_icon": "/assets/unit_humans/unit_aztec/tunkuluchu_icon.webp",
    "aomr_quinametzin_icon": "/assets/unit_humans/unit_aztec/quinametzin_icon.webp",
    "aomr_titan_cipactli_icon": "/assets/unit_humans/unit_aztec/titan_cipactli_icon.webp",
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
        out.append(mapped)
    return out


def resolve_construcao(
    extracted: list[dict[str, Any]] | None,
    *,
    locale: str,
) -> list[dict[str, Any]]:
    if not extracted:
        return []
    out: list[dict[str, Any]] = []
    for item in extracted:
        proto = item.get("proto") or ""
        building_id = BUILDING_IDS_AZTEC.get(proto)
        if proto == "Temple":
            nome = "Templo (Asteca)" if locale == "pt" else "Temple (Aztec)"
        elif proto == "Dock":
            nome = "Doca (Asteca)" if locale == "pt" else "Dock (Aztec)"
        elif proto == "GreatTemple":
            nome = "Grande Templo" if locale == "pt" else "Great Temple"
        else:
            nome = item.get("nome") or proto
        row: dict[str, Any] = {"nome": nome}
        if building_id is not None:
            row["id"] = building_id
        out.append(row)
    return out


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
) -> dict[str, Any]:
    nome = extracted.get("ingles") if locale == "en" else extracted.get("nome")
    row: dict[str, Any] = {
        "id": unit_id,
        "nome": nome or extracted.get("proto_name"),
        "ingles": extracted.get("ingles") or extracted.get("proto_name"),
        "tipo": localize_tipo(extracted.get("tipo"), locale=locale),
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
        "construcao": resolve_construcao(extracted.get("construcao"), locale=locale),
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
        "fraco_contra": "Herói :aomr_type_hero_icon:",
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
        # extractor may use dano_contusao; catalog sometimes uses dano_contundente
    if "dano_contusao" in row and "dano_contundente" not in row:
        # keep both naming styles used in project: prefer existing Quinametzin style
        pass

    if extracted.get("max_range"):
        row["alcance"] = _normalize_number(extracted["max_range"])

    if god_id is not None and god_name:
        row["god_dono"] = [{"id": god_id, "nome": god_name}]

    # Titan display name
    if extracted.get("proto_name") == "TitanCipactli":
        row["nome"] = "Titã (Cipactli)" if locale == "pt" else "Titan (Cipactli)"
        row["ingles"] = "Titan (Cipactli)"

    return row


def ensure_token_map(icons: set[str], *, dry_run: bool = False) -> int:
    mapping = json.loads(TOKEN_MAP.read_text(encoding="utf-8"))
    changes = 0
    for icon in sorted(icons):
        url = ICON_URLS.get(icon)
        if not url:
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
    parser.add_argument(
        "--include-existing",
        action="store_true",
        help="Também reprocessa Quinametzin já presente",
    )
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

    for proto, (god_id, god_name, era_id) in AZTEC_MYTH_UNITS.items():
        extracted_list = extract_units(
            cache,
            only_unit=proto,
            construcoes_path=PT_CONS,
        )
        if not extracted_list:
            print(f"sem extract: {proto}")
            continue
        extracted = extracted_list[0]
        ingles = extracted.get("ingles") or proto
        if proto == "TitanCipactli":
            ingles = "Titan (Cipactli)"

        existing = catalog_has_unit(pt_rows, ingles) or catalog_has_unit(
            pt_rows, extracted.get("ingles") or ""
        )
        if existing and not args.include_existing:
            skipped.append(f"{proto} (já no catálogo id={existing.get('id')})")
            continue

        unit_id = int(existing["id"]) if existing else next_id
        if not existing:
            next_id += 1

        pt_row = build_row(
            extracted,
            locale="pt",
            unit_id=unit_id,
            god_id=god_id,
            god_name=god_name,
            era_id=era_id,
        )
        # EN extract for building names / english display
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
        )
        # Keep PT construcao names on PT row (already set)
        if existing:
            for rows, new_row in ((pt_rows, pt_row), (en_rows, en_row)):
                for i, row in enumerate(rows):
                    if row.get("id") != unit_id:
                        continue
                    for field in (
                        "counter_de",
                        "categoria",
                        "forte_contra",
                        "fraco_contra",
                        "forca_atributos",
                    ):
                        if field in row:
                            new_row[field] = row[field]
                    rows[i] = new_row
                    break
            added.append(f"update {proto} id={unit_id} | {pt_row['nome']}")
        else:
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
            f"+ {proto:22} id={unit_id:3} | {pt_row['nome']:28} | "
            f"era={era_id} god={god_name or '-'} icon={pt_row.get('icon')}"
        )

    print(f"\nAdicionadas/atualizadas: {len(added)}")
    print(f"Puladas: {len(skipped)}")
    for s in skipped:
        print(f"  - {s}")

    map_changes = ensure_token_map(icons, dry_run=args.dry_run)
    print(f"token_asset_map: {map_changes} alterações")

    en_refs: dict[int, list[dict[str, Any]]] = {}
    for proto, (god_id, _gname, _era) in AZTEC_MYTH_UNITS.items():
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
