from __future__ import annotations

import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_game_paths import UI_TEXTURE_CACHE_BAR
from aom_relic_icons import icon_path_to_dds_entry, png_to_webp, token_to_asset_filename
from aom_tech_extractor import is_exportable_tech, tech_icon_token
from aom_unit_extractor import icon_token_from_path

ROOT = Path(__file__).resolve().parents[2]
TECHS_ASSETS_DIR = ROOT / "public" / "assets" / "techs"
TOKEN_MAP_PATH = ROOT / "src" / "data" / "token_asset_map.json"

PANTHEON_SUBDIR = {
    "aztec": "techs_aztec",
    "chinese": "techs_chinese",
    "japanese": "techs_japanese",
    "greek": "techs_greek",
    "egyptian": "techs_egyptian",
    "norse": "techs_norse",
    "atlantean": "techs_atlantean",
}


def pantheon_from_icon_path(icon_path: str) -> str | None:
    normalized = icon_path.replace("\\", "/").lower()
    match = re.search(r"resources/([a-z]+)/", normalized)
    if not match:
        return None
    culture = match.group(1)
    if culture in PANTHEON_SUBDIR:
        return culture
    return None


def asset_subdir_for_icon(icon_path: str) -> str:
    culture = pantheon_from_icon_path(icon_path)
    if culture:
        return PANTHEON_SUBDIR[culture]
    return ""


def token_to_public_url(token: str, *, icon_path: str = "") -> str:
    filename = token_to_asset_filename(token)
    subdir = asset_subdir_for_icon(icon_path)
    if subdir:
        return f"/assets/techs/{subdir}/{filename}"
    return f"/assets/techs/{filename}"


def collect_tech_icons_from_techtree(
    techtree_path: Path,
    *,
    cultures: set[str] | None = None,
) -> dict[str, str]:
    """token -> icon_path no jogo."""
    tree = ET.parse(techtree_path)
    tokens: dict[str, str] = {}
    for tech in tree.getroot().findall("tech"):
        if not is_exportable_tech(tech):
            continue
        icon_el = tech.find("icon")
        icon_path = (icon_el.text or "").strip() if icon_el is not None else ""
        if not icon_path:
            continue
        culture = pantheon_from_icon_path(icon_path)
        if cultures is not None:
            if culture not in cultures:
                continue
        token = tech_icon_token(icon_path) or icon_token_from_path(icon_path)
        if token:
            tokens[token] = icon_path
    return tokens


def collect_tech_icons_from_catalog(
    catalog_path: Path,
    techtree_path: Path,
    *,
    pantheon_id: int | None = None,
) -> dict[str, str]:
    """Cruza ícones do catálogo com caminhos do techtree."""
    from_tree = collect_tech_icons_from_techtree(techtree_path)
    # Invert path stem -> token for fallback
    by_token = dict(from_tree)

    if not catalog_path.exists():
        return by_token if pantheon_id is None else {}

    rows = json.loads(catalog_path.read_text(encoding="utf-8"))
    wanted: dict[str, str] = {}
    for row in rows:
        if pantheon_id is not None:
            pants = row.get("panteoes")
            if not isinstance(pants, list):
                continue
            ids = [p.get("id") for p in pants if isinstance(p, dict)]
            if pantheon_id not in ids:
                continue
        token = (row.get("icon") or "").strip()
        if not token:
            continue
        icon_path = by_token.get(token)
        if icon_path:
            wanted[token] = icon_path
        else:
            # Token no catálogo sem match no techtree — ainda tenta path sintético
            wanted[token] = ""
    return wanted


def update_token_asset_map(
    tokens: dict[str, str],
    *,
    dry_run: bool = False,
) -> list[tuple[str, str]]:
    mapping: dict[str, str] = {}
    if TOKEN_MAP_PATH.exists():
        mapping = json.loads(TOKEN_MAP_PATH.read_text(encoding="utf-8"))

    changes: list[tuple[str, str]] = []
    for token, icon_path in sorted(tokens.items()):
        url = token_to_public_url(token, icon_path=icon_path)
        if mapping.get(token) != url:
            changes.append((token, url))
            mapping[token] = url

    if changes and not dry_run:
        TOKEN_MAP_PATH.write_text(
            json.dumps(mapping, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changes


def _export_one(
    *,
    texture_bar: Path,
    crybar_exe: Path,
    dds_entry: str,
    dest_webp: Path,
    temp_dir: Path,
) -> bool:
    shutil.rmtree(temp_dir, ignore_errors=True)
    temp_dir.mkdir(parents=True, exist_ok=True)

    export = subprocess.run(
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
    if export.returncode != 0:
        return False

    dds_files = list(temp_dir.rglob("*.dds"))
    if not dds_files:
        return False

    convert = subprocess.run(
        [str(crybar_exe), "convert", "dds-to-png", str(dds_files[0])],
        capture_output=True,
        text=True,
    )
    if convert.returncode != 0:
        return False

    png_files = list(dds_files[0].parent.glob("*.png"))
    if not png_files:
        return False

    dest_webp.parent.mkdir(parents=True, exist_ok=True)
    png_to_webp(png_files[0], dest_webp)
    return True


def sync_tech_icons(
    tokens: dict[str, str],
    *,
    game_dir: Path,
    crybar_exe: Path,
    dry_run: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    texture_bar = game_dir / UI_TEXTURE_CACHE_BAR
    if not texture_bar.exists():
        raise FileNotFoundError(f"UITextureCache.bar não encontrado em {texture_bar}")
    if not crybar_exe.exists():
        raise FileNotFoundError(f"crybar.exe não encontrado em {crybar_exe}")

    exported: list[str] = []
    skipped: list[str] = []
    missing: list[str] = []
    no_path: list[str] = []
    temp_dir = ROOT / "tools" / ".tech-icon-export"

    for token, icon_path in sorted(tokens.items()):
        if not icon_path:
            no_path.append(token)
            continue

        filename = token_to_asset_filename(token)
        subdir = asset_subdir_for_icon(icon_path)
        dest_webp = (
            TECHS_ASSETS_DIR / subdir / filename
            if subdir
            else TECHS_ASSETS_DIR / filename
        )

        if dest_webp.exists() and not force:
            skipped.append(str(dest_webp.relative_to(TECHS_ASSETS_DIR)))
            continue

        dds_entry = icon_path_to_dds_entry(icon_path)
        if dry_run:
            exported.append(str(dest_webp.relative_to(TECHS_ASSETS_DIR)))
            continue

        ok = _export_one(
            texture_bar=texture_bar,
            crybar_exe=crybar_exe,
            dds_entry=dds_entry,
            dest_webp=dest_webp,
            temp_dir=temp_dir,
        )
        if ok:
            exported.append(str(dest_webp.relative_to(TECHS_ASSETS_DIR)))
        else:
            missing.append(dds_entry)

    map_changes = update_token_asset_map(
        {t: p for t, p in tokens.items() if p},
        dry_run=dry_run,
    )
    shutil.rmtree(temp_dir, ignore_errors=True)
    return {
        "total_tokens": len(tokens),
        "exported": exported,
        "skipped": skipped,
        "missing": missing,
        "no_path": no_path,
        "map_changes": map_changes,
    }
