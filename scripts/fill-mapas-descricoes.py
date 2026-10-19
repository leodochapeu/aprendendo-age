#!/usr/bin/env python3
"""
Preenche descricao_resumida e historia em mapas.json a partir do jogo
(STR_MAP_*_DESC e STR_MAP_*_DESC_LOAD) — sem alterar pools/origem.
"""
from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import (  # noqa: E402
    DEFAULT_CACHE_DIR,
    DEFAULT_CRYBAR,
    DEFAULT_GAME_DIR,
    resolve_game_dir,
)
from aom_map_extractor import extract_maps  # noqa: E402
from aom_unit_abilities import clean_game_string  # noqa: E402
from aom_unit_extractor import ensure_bar_extracted  # noqa: E402


def _key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).casefold()


def locale_path(locale: str) -> Path:
    return ROOT / "src" / "data" / "locale" / locale / "mapas.json"


def apply_texts(
    row: dict[str, Any],
    extracted: dict[str, Any],
    *,
    locale: str,
) -> dict[str, dict[str, Any]]:
    before = {
        "descricao_resumida": row.get("descricao_resumida"),
        "historia": row.get("historia"),
    }
    if locale == "en":
        short = clean_game_string(extracted.get("descricao_en") or "")
        long = clean_game_string(extracted.get("descricao_detalhada_en") or "")
    else:
        short = clean_game_string(extracted.get("descricao_pt") or "")
        long = clean_game_string(extracted.get("descricao_detalhada_pt") or "")

    if short:
        row["descricao_resumida"] = short
    else:
        row.pop("descricao_resumida", None)

    # História = load details, se diferente do curto
    if long and long != short:
        row["historia"] = long
    elif long and not short:
        row["historia"] = long
    else:
        row.pop("historia", None)

    after = {
        "descricao_resumida": row.get("descricao_resumida"),
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
    parser.add_argument("--game-dir", default=str(DEFAULT_GAME_DIR))
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    parser.add_argument("--locale", choices=("pt", "en", "both"), default="both")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    if not args.dry_run and not args.write:
        print("Use --dry-run ou --write.", file=sys.stderr)
        return 1

    game_dir = resolve_game_dir(args.game_dir)
    cache_dir = Path(args.cache_dir).resolve()
    crybar = Path(args.crybar).resolve()

    try:
        ensure_bar_extracted(game_dir=game_dir, cache_dir=cache_dir, crybar_exe=crybar)
        extracted_rows = extract_maps(
            game_dir=game_dir, cache_dir=cache_dir, crybar_exe=crybar
        )
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    by_key: dict[str, dict[str, Any]] = {}
    for row in extracted_rows:
        for field in ("icon", "nome_en", "nome_pt", "map_id"):
            value = row.get(field)
            if value:
                by_key[_key(str(value))] = row

    locales = ["pt", "en"] if args.locale == "both" else [args.locale]
    for locale in locales:
        path = locale_path(locale)
        catalog = json.loads(path.read_text(encoding="utf-8"))
        updated = 0
        missing: list[str] = []
        for row in catalog:
            candidates = (row.get("icon"), row.get("ingles"), row.get("nome"))
            extracted = next(
                (by_key[_key(str(v))] for v in candidates if v and _key(str(v)) in by_key),
                None,
            )
            if not extracted:
                missing.append(str(row.get("ingles") or row.get("nome")))
                continue
            changes = apply_texts(row, extracted, locale=locale)
            if changes:
                updated += 1
                if args.dry_run:
                    print(f"[{locale}] {row.get('ingles')}")
                    for field, ch in changes.items():
                        preview = json.dumps(ch["after"], ensure_ascii=False)[:160]
                        print(f"  {field}: {preview}")

        print(f"\n{path}")
        print(f"  atualizadas: {updated}")
        if missing:
            print(f"  sem match: {', '.join(missing[:15])}")
        if args.write:
            path.write_text(
                json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print("  gravado.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
