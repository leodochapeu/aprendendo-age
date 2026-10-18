#!/usr/bin/env python3
"""Importa ícones de habilidades (paths com abilities/) para public/assets/others."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import (  # noqa: E402
    DEFAULT_CRYBAR,
    DEFAULT_GAME_DIR,
    UI_TEXTURE_CACHE_BAR,
    resolve_game_dir,
)
from aom_relic_icons import icon_path_to_dds_entry, png_to_webp  # noqa: E402
from aom_unit_abilities import icon_token_from_path, parse_protounit_commands  # noqa: E402

TOKEN_MAP = ROOT / "src" / "data" / "token_asset_map.json"
ASSETS_DIR = ROOT / "public" / "assets" / "others"
CACHE = ROOT / "tools" / "aom-extracted"


def token_filename(token: str) -> str:
    stem = token.removeprefix("aomr_")
    parts = [p for p in stem.split("_") if p]
    pretty = "AoMR_" + "_".join(p[:1].upper() + p[1:] for p in parts)
    if not pretty.lower().endswith("icon"):
        pretty += "_icon"
    return f"{pretty}.webp"


def export_icon(
    *,
    icon_path: str,
    dest_webp: Path,
    game_dir: Path,
    crybar_exe: Path,
) -> str:
    if dest_webp.exists():
        return "skipped"
    texture_bar = game_dir / UI_TEXTURE_CACHE_BAR
    if not texture_bar.exists():
        return "missing-bar"
    temp_dir = ROOT / "tools" / ".ability-icon-export"
    shutil.rmtree(temp_dir, ignore_errors=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    dds_entry = icon_path_to_dds_entry(icon_path)
    result = subprocess.run(
        [
            str(crybar_exe),
            "bar",
            "export",
            str(texture_bar),
            dds_entry,
            "-o",
            str(temp_dir),
            "--decompress",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return "missing"
    dds_files = list(temp_dir.rglob("*.dds"))
    if not dds_files:
        return "missing"
    convert = subprocess.run(
        [str(crybar_exe), "convert", "dds-to-png", str(dds_files[0])],
        capture_output=True,
        text=True,
    )
    if convert.returncode != 0:
        return "missing"
    png_files = list(dds_files[0].parent.glob("*.png"))
    if not png_files:
        return "missing"
    dest_webp.parent.mkdir(parents=True, exist_ok=True)
    try:
        png_to_webp(pngs := png_files[0], dest_webp)
    except Exception:
        return "missing"
    _ = pngs
    return "exported"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--game-dir", default=str(DEFAULT_GAME_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    args = parser.parse_args()

    cmds = parse_protounit_commands(CACHE / "gameplay" / "proto_unit_commands.xml")
    wanted: dict[str, str] = {}
    for meta in cmds.values():
        path = meta.get("icon") or ""
        if "abilit" not in path.lower():
            continue
        token = icon_token_from_path(path)
        if token:
            wanted[token] = path

    # Prefer tokens already referenced in catalog
    catalog_tokens: set[str] = set()
    for locale in ("pt", "en"):
        rows = json.loads(
            (ROOT / "src/data/locale" / locale / "unidades_aom.json").read_text(encoding="utf-8")
        )
        for row in rows:
            for hab in row.get("habilidades") or []:
                tok = (hab.get("icon") or "").strip()
                if tok:
                    catalog_tokens.add(tok)

    focus = {t: p for t, p in wanted.items() if t in catalog_tokens} or wanted
    print(f"icons to consider: {len(focus)} (catalog refs={len(catalog_tokens)})")

    if not args.write:
        for t, p in sorted(focus.items()):
            print(f"  {t} <- {p}")
        print("dry-run; passe --write para importar")
        return 0

    game_dir = resolve_game_dir(args.game_dir)
    crybar = Path(args.crybar)
    mapping = json.loads(TOKEN_MAP.read_text(encoding="utf-8")) if TOKEN_MAP.exists() else {}
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    stats = {"exported": 0, "skipped": 0, "missing": 0}
    for token, path in sorted(focus.items()):
        dest = ASSETS_DIR / token_filename(token)
        url = f"/assets/others/{dest.name}"
        status = export_icon(
            icon_path=path,
            dest_webp=dest,
            game_dir=game_dir,
            crybar_exe=crybar,
        )
        if status == "exported" or (status == "skipped" and dest.exists()):
            mapping[token] = url
            stats["exported" if status == "exported" else "skipped"] += 1
            print(f"  {status} {token} -> {url}")
        else:
            stats["missing"] += 1
            print(f"  {status} {token} ({path})")

    TOKEN_MAP.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
