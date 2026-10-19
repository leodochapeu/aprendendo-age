#!/usr/bin/env python3
"""
Preenche descricao_resumida, historia e (se vazio) campo das tecnologias
a partir do techtree + strings do jogo.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CACHE_DIR  # noqa: E402
from aom_string_table import parse_string_table  # noqa: E402
from aom_tech_beneficia import (  # noqa: E402
    index_catalog_units_by_protoish,
    load_proto_index,
    load_tech_nodes,
)
from aom_tech_merge import (  # noqa: E402
    match_catalog_to_tech,
    resolve_proto_name,
)
from aom_tech_texts import extract_tech_texts  # noqa: E402


def locale_path(locale: str) -> Path:
    return ROOT / "src" / "data" / "locale" / locale / "tecnologias.json"


def units_path(locale: str) -> Path:
    return ROOT / "src" / "data" / "locale" / locale / "unidades_aom.json"


def apply_texts(
    row: dict[str, Any],
    texts: dict[str, Any],
    *,
    locale: str,
    only_empty_campo: bool,
) -> dict[str, dict[str, Any]]:
    before = {
        "descricao_resumida": row.get("descricao_resumida"),
        "historia": row.get("historia"),
        "campo": list(row.get("campo") or []),
    }

    if locale == "en":
        resumida = (texts.get("descricao_resumida_en") or "").strip()
        historia = (texts.get("historia_en") or "").strip()
        campo_new = texts.get("campo_en") or []
    else:
        resumida = (texts.get("descricao_resumida_pt") or "").strip()
        historia = (texts.get("historia_pt") or "").strip()
        campo_new = texts.get("campo_pt") or []

    if resumida:
        row["descricao_resumida"] = resumida
    else:
        row.pop("descricao_resumida", None)

    if historia and historia != resumida:
        row["historia"] = historia
    else:
        row.pop("historia", None)

    existing_campo = row.get("campo") or []
    if campo_new and (not existing_campo or not only_empty_campo):
        if not existing_campo:
            row["campo"] = list(campo_new)

    after = {
        "descricao_resumida": row.get("descricao_resumida"),
        "historia": row.get("historia"),
        "campo": list(row.get("campo") or []),
    }
    return {
        k: {"before": before[k], "after": after[k]}
        for k in before
        if before[k] != after[k]
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--locale", default="pt,en")
    parser.add_argument(
        "--only-empty-campo",
        action="store_true",
        default=True,
        help="Só preenche campo quando estiver vazio (padrão)",
    )
    parser.add_argument(
        "--overwrite-campo",
        action="store_true",
        help="Também regenera campo já preenchido",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    if not args.dry_run and not args.write:
        print("Use --dry-run ou --write.", file=sys.stderr)
        return 1

    only_empty = not args.overwrite_campo
    cache = Path(args.cache_dir)
    tech_nodes = load_tech_nodes(cache / "gameplay" / "techtree.xml")
    proto_units = load_proto_index(cache / "gameplay" / "proto.xml")
    strings_en = parse_string_table(cache / "strings" / "English" / "string_table.txt")
    strings_pt = parse_string_table(
        cache / "strings" / "PortugueseBrazil" / "string_table.txt"
    )

    # index stub for resolve
    tech_index = {name: {} for name in tech_nodes}

    locales = [part.strip() for part in args.locale.split(",") if part.strip()]
    for locale in locales:
        path = locale_path(locale)
        catalog = json.loads(path.read_text(encoding="utf-8"))
        units = json.loads(units_path(locale).read_text(encoding="utf-8"))
        catalog_by_proto = index_catalog_units_by_protoish(units, proto_units, strings_en)

        updated = 0
        missing = 0
        for row in catalog:
            name = match_catalog_to_tech(row)
            proto = resolve_proto_name(name, tech_index)
            if not proto or proto not in tech_nodes:
                missing += 1
                continue
            texts = extract_tech_texts(
                proto,
                tech_nodes[proto],
                locale=locale,
                strings_pt=strings_pt,
                strings_en=strings_en,
                proto_units=proto_units,
                catalog_by_proto=catalog_by_proto,
                fill_campo=True,
            )
            changes = apply_texts(
                row, texts, locale=locale, only_empty_campo=only_empty
            )
            if changes:
                updated += 1
                if args.dry_run and updated <= 8:
                    print(f"[{locale}] {row.get('ingles') or row.get('nome')} proto={proto}")
                    for field, ch in changes.items():
                        preview = json.dumps(ch["after"], ensure_ascii=False)[:180]
                        print(f"  {field}: {preview}")

        print(f"\n{path}")
        print(f"  atualizadas: {updated}")
        print(f"  sem proto: {missing}")
        if args.write:
            path.write_text(
                json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print("  gravado.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
