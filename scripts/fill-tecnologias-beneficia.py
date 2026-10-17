#!/usr/bin/env python3
"""
Preenche o campo editorial `beneficia` das tecnologias a partir do techtree.

Exemplos:
  python scripts/fill-tecnologias-beneficia.py --pantheon-id 7 --dry-run
  python scripts/fill-tecnologias-beneficia.py --pantheon-id 7 --write
  python scripts/fill-tecnologias-beneficia.py --tech "Wings of the South,Flint Weapons" --write
  python scripts/fill-tecnologias-beneficia.py --pantheon-id 7 --only-empty --write
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CACHE_DIR  # noqa: E402
from aom_string_table import parse_string_table  # noqa: E402
from aom_tech_beneficia import (  # noqa: E402
    generate_beneficia_for_tech,
    index_catalog_units_by_protoish,
    load_proto_index,
    load_tech_nodes,
)
from aom_tech_merge import (  # noqa: E402
    TECH_CATALOG_ALIASES,
    decode_catalog_name,
    resolve_proto_name,
)


def locale_paths(locale: str) -> tuple[Path, Path]:
    base = ROOT / "src" / "data" / "locale" / locale.lower()
    return base / "tecnologias.json", base / "unidades_aom.json"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--pantheon-id", type=int, default=None)
    parser.add_argument("--tech", default=None, help="Nomes EN separados por vírgula")
    parser.add_argument(
        "--only-empty",
        action="store_true",
        help="Só preenche quando beneficia está vazio/ausente",
    )
    parser.add_argument(
        "--locale",
        default="pt,en",
        help="Locales a atualizar (default: pt,en)",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args()

    cache = Path(args.cache_dir)
    proto_units = load_proto_index(cache / "gameplay" / "proto.xml")
    tech_nodes = load_tech_nodes(cache / "gameplay" / "techtree.xml")
    strings_en = parse_string_table(cache / "strings" / "English" / "string_table.txt")
    strings_pt = parse_string_table(
        cache / "strings" / "PortugueseBrazil" / "string_table.txt"
    )

    tech_filter = None
    if args.tech:
        tech_filter = {
            decode_catalog_name(part.strip()).lower()
            for part in args.tech.split(",")
            if part.strip()
        }

    stub_index = {name: {} for name in tech_nodes}

    locales = [part.strip().lower() for part in args.locale.split(",") if part.strip()]
    for locale in locales:
        tech_path, units_path = locale_paths(locale)
        rows = json.loads(tech_path.read_text(encoding="utf-8"))
        units = (
            json.loads(units_path.read_text(encoding="utf-8"))
            if units_path.exists()
            else []
        )
        catalog_by_proto = index_catalog_units_by_protoish(units, proto_units, strings_en)

        updated = 0
        skipped = 0
        missing_proto = 0
        empty_result = 0
        report: list[tuple[str, str, str]] = []

        for row in rows:
            catalog_name = decode_catalog_name(
                (row.get("ingles") or row.get("nome") or "").strip()
            )
            if tech_filter is not None and catalog_name.lower() not in tech_filter:
                continue

            if args.pantheon_id is not None:
                pants = row.get("panteoes")
                if not isinstance(pants, list):
                    continue
                ids = [p.get("id") for p in pants if isinstance(p, dict)]
                if args.pantheon_id not in ids:
                    continue

            existing = (row.get("beneficia") or "").strip()
            if args.only_empty and existing:
                skipped += 1
                continue

            proto = resolve_proto_name(catalog_name, stub_index)
            if not proto:
                # fallback: alias direto / compact via TECH_CATALOG_ALIASES values
                aliased = TECH_CATALOG_ALIASES.get(catalog_name)
                proto = aliased if aliased in tech_nodes else None
            if not proto or proto not in tech_nodes:
                missing_proto += 1
                continue

            beneficia = generate_beneficia_for_tech(
                tech_nodes[proto],
                locale=locale,
                proto_units=proto_units,
                strings_pt=strings_pt,
                strings_en=strings_en,
                catalog_by_proto=catalog_by_proto,
            )
            if not beneficia:
                empty_result += 1
                continue
            if beneficia == existing:
                skipped += 1
                continue

            report.append((catalog_name, existing, beneficia))
            row["beneficia"] = beneficia
            updated += 1

        print(f"\n{tech_path}")
        print(f"  atualizadas: {updated}")
        print(f"  iguais/puladas: {skipped}")
        print(f"  sem proto: {missing_proto}")
        print(f"  sem beneficia gerado: {empty_result}")
        for name, before, after in report[:25]:
            print(f"  - {name}")
            print(f"      antes:  {before or '(vazio)'}")
            print(f"      depois: {after}")
        if len(report) > 25:
            print(f"  ... +{len(report) - 25} outras")

        if args.write:
            tech_path.write_text(
                json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

    if args.dry_run:
        print("\nDry-run — nenhum arquivo escrito.")
    else:
        print("\nArquivos atualizados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
