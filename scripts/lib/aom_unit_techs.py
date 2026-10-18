"""Peças 3D por tecnologia: linha (uma por evolução) e armaria (acumulam)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from aom_unit_model import (
    PROJECTILE_ATTACHMENTS,
    PUBLIC_MODELS,
    ROOT,
    TOOL_ATTACHMENTS,
    BarIndex,
    _attachment_sources,
    _body_component,
    _select_model,
    _tech_tags,
    load_anim_xml,
    resolve_visual_root,
    visual_primitives,
    write_static_glb,
)

TECH_MANIFEST_PATH = ROOT / "src" / "data" / "unit_model_techs.json"
CATALOG_PATH = ROOT / "src" / "data" / "locale" / "pt" / "tecnologias.json"

# A tag do XML às vezes não é o nome em inglês da tecnologia, só a ideia.
TAG_CATALOG = {
    "mediumarchers": "mediumrangedsoldiers",
    "heavyarchers": "heavyrangedsoldiers",
    "championarchers": "championrangedsoldiers",
    "mediumrangedsoldier": "mediumrangedsoldiers",
    "heavyrangedsoldier": "heavyrangedsoldiers",
    "championrangedsoldier": "championrangedsoldiers",
}

ARMORY = {
    "copperweapons": ("weapons", 1),
    "bronzeweapons": ("weapons", 2),
    "ironweapons": ("weapons", 3),
    "flintweapons": ("weapons", 1),
    "jadeweapons": ("weapons", 2),
    "obsidianweapons": ("weapons", 3),
    "copperarmor": ("armor", 1),
    "bronzearmor": ("armor", 2),
    "ironarmor": ("armor", 3),
    "featheredarmor": ("armor", 1),
    "ceremonialarmor": ("armor", 2),
    "sacredarmor": ("armor", 3),
    "coppershields": ("shields", 1),
    "bronzeshields": ("shields", 2),
    "ironshields": ("shields", 3),
    "featheredshields": ("shields", 1),
    "ceremonialshields": ("shields", 2),
    "sacredshields": ("shields", 3),
}

ARMORY_ORDER = ("weapons", "armor", "shields")
_LINE_PREFIX = (
    ("conscript", 3),
    ("champion", 6),
    ("medium", 2),
    ("heavy", 4),
    ("elite", 5),
    ("levy", 1),
)
ICON_MAP_PATH = ROOT / "src" / "data" / "token_asset_map.json"


def _catalog_tags() -> set[str]:
    rows = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    found: set[str] = set()
    for row in rows:
        ingles = row.get("ingles") or ""
        tag = re.sub(r"[^a-z]", "", ingles.lower())
        if tag:
            found.add(tag)
        icon_key = _icon_key(row.get("icon") or "")
        if icon_key:
            found.add(icon_key)
    return found


def _icon_key(token: str) -> str:
    core = token.lower()
    if core.startswith("aomr_"):
        core = core[5:]
    if core.endswith("_icon"):
        core = core[: -len("_icon")]
    return re.sub(r"[^a-z]", "", core)


def _icon_tags() -> set[str]:
    data = json.loads(ICON_MAP_PATH.read_text(encoding="utf-8"))
    return {_icon_key(key) for key in data if isinstance(key, str)}


def _known_tags() -> set[str]:
    return _catalog_tags() | _icon_tags()


def _catalog_key(tag: str) -> str:
    return TAG_CATALOG.get(tag, tag)


def _line_info(tag: str) -> tuple[str, int] | None:
    for prefix, rank in sorted(_LINE_PREFIX, key=lambda item: len(item[0]), reverse=True):
        if tag.startswith(prefix) and len(tag) > len(prefix):
            return tag[len(prefix) :], rank
    return None


def _classify(tag: str, known: set[str]) -> tuple[str, str, int] | None:
    """(id do grupo, line|armory, rank) se a tecnologia tem ícone no catálogo."""
    catalog = _catalog_key(tag)
    if catalog not in known and tag not in known:
        return None
    if tag in ARMORY:
        group, rank = ARMORY[tag]
        return group, "armory", rank
    info = _line_info(tag)
    if info is None:
        return None
    if catalog not in known and tag not in known:
        return None
    return f"line:{info[0]}", "line", info[1]


def _gather(bars: BarIndex, root: Any, depth: int = 0) -> set[str]:
    if depth > 3:
        return set()
    if depth == 0:
        root = resolve_visual_root(bars, root)
    found = _tech_tags(_body_component(root))
    sources = _attachment_sources(root)
    has_weapon = any(name.lower() == "weapon" for name, _source in sources)
    for name, source in sources:
        low = name.lower()
        if low in PROJECTILE_ATTACHMENTS or (has_weapon and low in TOOL_ATTACHMENTS):
            continue
        if isinstance(source, str):
            try:
                included = load_anim_xml(bars, source)
            except (RuntimeError, FileNotFoundError, OSError):
                continue
        else:
            included = source
        if included is None:
            continue
        found |= _gather(bars, included, depth + 1)
    return found


def _parts(bars: BarIndex, root: Any) -> list[tuple[str, Any]]:
    root = resolve_visual_root(bars, root)
    parts: list[tuple[str, Any]] = [("body", root)]
    sources = _attachment_sources(root)
    has_weapon = any(name.lower() == "weapon" for name, _source in sources)
    for name, source in sources:
        low = name.lower()
        if low in PROJECTILE_ATTACHMENTS or (has_weapon and low in TOOL_ATTACHMENTS):
            continue
        if isinstance(source, str):
            try:
                included = load_anim_xml(bars, source)
            except (RuntimeError, FileNotFoundError, OSError):
                continue
        else:
            included = source
        if included is None:
            continue
        parts.append((name, included))
    return parts


def _combos(tags: set[str], known: set[str]) -> list[tuple[str, ...]]:
    grouped: dict[str, list[tuple[int, str]]] = {}
    for tag in tags:
        info = _classify(tag, known)
        if info is None:
            continue
        group, _kind, rank = info
        grouped.setdefault(group, []).append((rank, tag))
    axes: list[list[tuple[str, ...]]] = []
    for options in grouped.values():
        ordered = [tag for _rank, tag in sorted(options)]
        axes.append([()] + [(tag,) for tag in ordered])
    combos: list[tuple[str, ...]] = [()]
    for axis in axes:
        combos = [prev + extra for prev in combos for extra in axis]
    return combos


def _safe(text: str) -> str:
    cleaned = re.sub(r"[^a-z0-9+.-]", "", text.lower())
    return cleaned or "base"


def bake_unit_techs(
    bars: BarIndex,
    anim_relative: str,
    unit_id: int,
    force: bool = False,
) -> dict[str, Any] | None:
    """Grava as peças que cada tecnologia troca e devolve os botões da unidade."""
    root = load_anim_xml(bars, anim_relative)
    if root is None:
        return None
    known = _known_tags()
    tags = _gather(bars, root)
    useful = {tag for tag in tags if _classify(tag, known)}
    if not useful:
        return None

    parts = _parts(bars, root)
    baked: dict[tuple[str, str], str] = {}
    piece_entries: dict[str, list[dict[str, Any]]] = {}
    changed: set[str] = set()

    for part, part_root in parts:
        local_tags = _tech_tags(_body_component(resolve_visual_root(bars, part_root))) & useful
        combos = _combos(local_tags, known)
        resolved: list[tuple[tuple[str, ...], str | None]] = []
        for combo in combos:
            path = _select_model(_body_component(resolve_visual_root(bars, part_root)), set(combo))
            resolved.append((combo, path))
        by_combo = {combo: path for combo, path in resolved}
        for combo, path in resolved:
            for index, tag in enumerate(combo):
                without = combo[:index] + combo[index + 1 :]
                if by_combo.get(without) != path:
                    changed.add(tag)

        entries: list[dict[str, Any]] = []
        for combo, path in resolved:
            if not path:
                continue
            key = (part.lower(), path.lower())
            if key not in baked:
                filename = f"{_safe(part)}-{_safe('+'.join(combo) or 'base')}.glb"
                dest = PUBLIC_MODELS / "tech" / str(unit_id) / filename
                url = f"/assets/unit-models/tech/{unit_id}/{filename}"
                prims: list[dict[str, Any]] = []
                if not dest.exists() or force:
                    try:
                        prims, _names = visual_primitives(
                            bars,
                            root,
                            techs=set(combo),
                            only="body" if part == "body" else part,
                        )
                    except (RuntimeError, FileNotFoundError, OSError, ValueError):
                        prims = []
                    if prims:
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        write_static_glb(prims, dest)
                        baked[key] = url
                    else:
                        baked[key] = ""
                else:
                    baked[key] = url
            url = baked.get(key) or ""
            if not url:
                continue
            requires = sorted(combo)
            if any(item["requires"] == requires and item["url"] == url for item in entries):
                continue
            entries.append({"requires": requires, "url": url})
        if entries:
            piece_entries[part.lower()] = entries

    option_tags = [tag for tag in sorted(changed) if _classify(tag, known)]
    if not option_tags or not piece_entries:
        return None

    grouped: dict[str, dict[str, Any]] = {}
    for tag in option_tags:
        info = _classify(tag, known)
        if info is None:
            continue
        group, kind, rank = info
        bucket = grouped.setdefault(group, {"id": group, "kind": kind, "options": []})
        bucket["options"].append({"tag": tag, "catalog": _catalog_key(tag), "rank": rank})
    groups = sorted(grouped.values(), key=lambda group: (0 if group["kind"] == "line" else 1, ARMORY_ORDER.index(group["id"]) if group["id"] in ARMORY_ORDER else 9, group["id"]))
    for group in groups:
        group["options"].sort(key=lambda option: option["rank"])
    return {"groups": groups, "pieces": piece_entries}


def merge_tech_manifest(updates: dict[str, dict[str, Any] | None], replace_ids: set[str]) -> None:
    current: dict[str, Any] = {}
    if TECH_MANIFEST_PATH.exists():
        current = json.loads(TECH_MANIFEST_PATH.read_text(encoding="utf-8"))
    for unit_id in replace_ids:
        current.pop(unit_id, None)
    for unit_id, entry in updates.items():
        if entry:
            current[unit_id] = entry
    TECH_MANIFEST_PATH.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
