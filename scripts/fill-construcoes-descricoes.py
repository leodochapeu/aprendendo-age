#!/usr/bin/env python3
"""
Preenche descricao_resumida, descricao_avancada e historia em construcoes.json
a partir do proto/strings do jogo — sem alterar stats, nomes ou tipos.
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

from aom_building_extractor import parse_proto_buildings  # noqa: E402
from aom_building_merge import (  # noqa: E402
    match_catalog_to_building,
    resolve_proto_name,
)
from aom_building_texts import extract_building_texts  # noqa: E402
from aom_game_paths import DEFAULT_CACHE_DIR  # noqa: E402
from aom_string_table import parse_string_table  # noqa: E402


def locale_path(locale: str) -> Path:
    return ROOT / "src" / "data" / "locale" / locale / "construcoes.json"


def apply_texts(
    row: dict[str, Any],
    texts: dict[str, Any],
    *,
    locale: str,
) -> dict[str, dict[str, Any]]:
    before = {
        "descricao_resumida": row.get("descricao_resumida"),
        "descricao_avancada": row.get("descricao_avancada"),
        "historia": row.get("historia"),
    }

    if locale == "en":
        resumida = (texts.get("descricao_resumida_en") or "").strip()
        avancada = (texts.get("descricao_avancada_en") or "").strip()
        historia = (texts.get("historia_en") or "").strip()
    else:
        resumida = (texts.get("descricao_resumida_pt") or "").strip()
        avancada = (texts.get("descricao_avancada_pt") or "").strip()
        historia = (texts.get("historia_pt") or "").strip()

    if resumida:
        row["descricao_resumida"] = resumida
    else:
        row.pop("descricao_resumida", None)

    if avancada and avancada != resumida:
        row["descricao_avancada"] = avancada
    else:
        row.pop("descricao_avancada", None)

    if historia and historia not in {resumida, avancada}:
        row["historia"] = historia
    else:
        row.pop("historia", None)

    after = {
        "descricao_resumida": row.get("descricao_resumida"),
        "descricao_avancada": row.get("descricao_avancada"),
        "historia": row.get("historia"),
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
    parser.add_argument("--locale", choices=("pt", "en", "both"), default="both")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    if not args.dry_run and not args.write:
        print("Use --dry-run ou --write.", file=sys.stderr)
        return 1

    cache_dir = Path(args.cache_dir).resolve()
    proto_path = cache_dir / "gameplay" / "proto.xml"
    strings_en_path = cache_dir / "strings" / "English" / "string_table.txt"
    strings_pt_path = cache_dir / "strings" / "PortugueseBrazil" / "string_table.txt"
    for required in (proto_path, strings_en_path, strings_pt_path):
        if not required.exists():
            print(f"Arquivo ausente: {required}", file=sys.stderr)
            return 1

    strings_en = parse_string_table(strings_en_path)
    strings_pt = parse_string_table(strings_pt_path)
    buildings = parse_proto_buildings(proto_path)
    # Índice só com nomes de proto para resolve_proto_name
    stub_index = {name: {} for name in buildings}

    locales = ["pt", "en"] if args.locale == "both" else [args.locale]
    for locale in locales:
        path = locale_path(locale)
        catalog = json.loads(path.read_text(encoding="utf-8"))
        updated = 0
        missing: list[str] = []

        for row in catalog:
            catalog_name = match_catalog_to_building(row)
            proto = resolve_proto_name(catalog_name, stub_index)
            if not proto or proto not in buildings:
                missing.append(str(row.get("ingles") or row.get("nome")))
                continue
            texts = extract_building_texts(
                proto,
                buildings[proto],
                strings_pt=strings_pt,
                strings_en=strings_en,
            )
            changes = apply_texts(row, texts, locale=locale)
            if changes:
                updated += 1
                if args.dry_run:
                    print(f"[{locale}] {catalog_name} proto={proto}")
                    for field, ch in changes.items():
                        preview = json.dumps(ch["after"], ensure_ascii=False)[:160]
                        print(f"  {field}: {preview}")

        print(f"\n{path}")
        print(f"  atualizadas: {updated}")
        if missing:
            print(f"  sem proto: {len(missing)} — {', '.join(missing[:12])}")
        if args.write:
            path.write_text(
                json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print("  gravado.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
