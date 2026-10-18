#!/usr/bin/env python3
"""
Preenche descricao_resumida, descricao_avancada e habilidades em unidades_aom.json
a partir do proto/strings do jogo — sem alterar stats, nomes ou tipos.
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
from aom_unit_extractor import extract_units  # noqa: E402
from aom_unit_merge import (  # noqa: E402
    index_extracted_by_proto,
    match_catalog_to_proto,
    parse_id_range,
    resolve_proto_name,
    save_catalog,
    supplement_extracted_index,
)


def locale_path(locale: str) -> Path:
    return ROOT / "src" / "data" / "locale" / locale / "unidades_aom.json"


def apply_texts(
    row: dict[str, Any],
    extracted: dict[str, Any],
    *,
    locale: str,
) -> dict[str, dict[str, Any]]:
    before = {
        "descricao_resumida": row.get("descricao_resumida"),
        "descricao_avancada": row.get("descricao_avancada"),
        "habilidades": deepcopy(row.get("habilidades")),
        "historia": row.get("historia"),
    }

    if locale == "en":
        resumida = (extracted.get("descricao_resumida_en") or "").strip()
        avancada = (extracted.get("descricao_avancada_en") or "").strip()
        habilidades = extracted.get("habilidades_en") or []
        historia = (extracted.get("historia_en") or "").strip()
    else:
        resumida = (extracted.get("descricao_resumida_pt") or "").strip()
        avancada = (extracted.get("descricao_avancada_pt") or "").strip()
        habilidades = extracted.get("habilidades_pt") or []
        historia = (extracted.get("historia_pt") or "").strip()

    if resumida:
        row["descricao_resumida"] = resumida
    else:
        row.pop("descricao_resumida", None)

    if avancada and avancada != resumida:
        row["descricao_avancada"] = avancada
    else:
        row.pop("descricao_avancada", None)

    if habilidades:
        row["habilidades"] = deepcopy(habilidades)
    else:
        row.pop("habilidades", None)

    if historia:
        row["historia"] = historia
    else:
        row.pop("historia", None)

    after = {
        "descricao_resumida": row.get("descricao_resumida"),
        "descricao_avancada": row.get("descricao_avancada"),
        "habilidades": deepcopy(row.get("habilidades")),
        "historia": row.get("historia"),
    }
    changes: dict[str, dict[str, Any]] = {}
    for key in before:
        if before[key] != after[key]:
            changes[key] = {"before": before[key], "after": after[key]}
    return changes


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ids", default="1-272", help="IDs do catálogo (padrão: 1-272)")
    parser.add_argument("--locale", choices=("pt", "en", "both"), default="both")
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    if not args.dry_run and not args.write:
        print("Use --dry-run ou --write.", file=sys.stderr)
        return 1

    id_filter = parse_id_range(args.ids) or set()
    cache_dir = Path(args.cache_dir).resolve()
    construcoes_pt = ROOT / "src" / "data" / "locale" / "pt" / "construcoes.json"

    extracted_rows = extract_units(cache_dir, construcoes_path=construcoes_pt)
    extracted_index = index_extracted_by_proto(extracted_rows)
    catalog_pt_path = locale_path("pt")
    supplement_extracted_index(
        extracted_index,
        catalog_path=catalog_pt_path,
        cache_dir=cache_dir,
        construcoes_path=construcoes_pt,
        id_filter=id_filter,
        unit_filter=None,
    )

    locales = ["pt", "en"] if args.locale == "both" else [args.locale]
    for locale in locales:
        path = locale_path(locale)
        catalog = json.loads(path.read_text(encoding="utf-8"))
        updated = 0
        missing: list[str] = []
        for row in catalog:
            rid = row.get("id")
            if rid not in id_filter:
                continue
            catalog_name = match_catalog_to_proto(row) or ""
            proto = resolve_proto_name(catalog_name, extracted_index)
            if not proto:
                missing.append(str(row.get("ingles") or rid))
                continue
            extracted = extracted_index.get(proto) or {}
            changes = apply_texts(row, extracted, locale=locale)
            if changes:
                updated += 1
                if args.dry_run:
                    print(f"[{locale}] id={rid} {row.get('ingles')} proto={proto}")
                    for field, ch in changes.items():
                        print(f"  {field}:")
                        print(f"    -> {json.dumps(ch['after'], ensure_ascii=False)[:200]}")

        print(f"\n{path}")
        print(f"  atualizadas: {updated}")
        if missing:
            print(f"  sem proto: {', '.join(missing[:20])}")
        if args.write:
            save_catalog(path, catalog)
            print("  gravado.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
