#!/usr/bin/env python3
"""
Exporta ícones de tecnologias do UITextureCache.bar para public/assets/techs/
e atualiza token_asset_map.json.

Exemplos:
  python scripts/sync-tech-icons-aom.py --culture aztec --write
  python scripts/sync-tech-icons-aom.py --culture aztec --dry-run
  python scripts/sync-tech-icons-aom.py --culture chinese,japanese --write
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import (  # noqa: E402
    DEFAULT_CACHE_DIR,
    DEFAULT_CRYBAR,
    DEFAULT_GAME_DIR,
    resolve_game_dir,
)
from aom_tech_icons import (  # noqa: E402
    collect_tech_icons_from_catalog,
    collect_tech_icons_from_techtree,
    sync_tech_icons,
)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-dir", default=str(DEFAULT_GAME_DIR))
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    parser.add_argument(
        "--culture",
        default="aztec",
        help="Culturas do caminho do ícone (ex.: aztec,chinese). Use 'all' para todas.",
    )
    parser.add_argument(
        "--pantheon-id",
        type=int,
        default=None,
        help="Se informado, limita aos tokens presentes no catálogo PT com esse panteão.",
    )
    parser.add_argument("--force", action="store_true")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--write", action="store_true")
    args = parser.parse_args()

    game_dir = resolve_game_dir(args.game_dir)
    cache_dir = Path(args.cache_dir)
    techtree = cache_dir / "gameplay" / "techtree.xml"
    if not techtree.exists():
        print(f"techtree ausente: {techtree}")
        return 1

    if args.culture.strip().lower() == "all":
        cultures = None
    else:
        cultures = {part.strip().lower() for part in args.culture.split(",") if part.strip()}

    if args.pantheon_id is not None:
        catalog = ROOT / "src" / "data" / "locale" / "pt" / "tecnologias.json"
        tokens = collect_tech_icons_from_catalog(
            catalog,
            techtree,
            pantheon_id=args.pantheon_id,
        )
        # Ainda filtra por culture se o path existir
        if cultures is not None:
            tokens = {
                t: p
                for t, p in tokens.items()
                if p and any(f"/{c}/" in p.replace("\\", "/").lower() for c in cultures)
            }
    else:
        tokens = collect_tech_icons_from_techtree(techtree, cultures=cultures)

    print(f"Ícones a sincronizar: {len(tokens)}")
    result = sync_tech_icons(
        tokens,
        game_dir=game_dir,
        crybar_exe=Path(args.crybar),
        dry_run=args.dry_run,
        force=args.force,
    )

    print(f"  exportados: {len(result['exported'])}")
    print(f"  já existiam: {len(result['skipped'])}")
    print(f"  faltando no BAR: {len(result['missing'])}")
    print(f"  sem path: {len(result['no_path'])}")
    print(f"  token_asset_map: {len(result['map_changes'])} alterações")

    if result["missing"]:
        print("\nMissing:")
        for entry in result["missing"][:30]:
            print(f"  - {entry}")
    if result["no_path"]:
        print("\nSem path no techtree:")
        for token in result["no_path"][:20]:
            print(f"  - {token}")
    if args.dry_run:
        print("\nDry-run — nenhum arquivo escrito.")
    else:
        print("\nArquivos atualizados.")
        if result["exported"][:5]:
            print("Exemplos exportados:")
            for name in result["exported"][:5]:
                print(f"  - {name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
