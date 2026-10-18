"""Peças 3D por tecnologia: linha, armaria e upgrades de unidade mítica."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_unit_model import (
    GATHER_ATTACHMENTS,
    PROJECTILE_ATTACHMENTS,
    PUBLIC_MODELS,
    ROOT,
    BarIndex,
    _attachment_sources,
    _body_component,
    _select_model,
    _tag,
    _tech_tags,
    direct_tech_component,
    load_anim_xml,
    resolve_visual_root,
    selected_material_variant,
    submodel_map,
    visual_primitives,
    write_static_glb,
)

TECHTREE_PATH = ROOT / "tools" / "aom-extracted" / "gameplay" / "techtree.xml"

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
    ("elite", 7),
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


def _myth_table() -> dict[str, tuple[str, int]]:
    """tag -> (grupo da cadeia, nível). Ombro de Talos fica no mesmo grupo que Mão de Talos."""
    cached = getattr(_myth_table, "value", None)
    if cached is not None:
        return cached
    if not TECHTREE_PATH.exists():
        _myth_table.value = {}  # type: ignore[attr-defined]
        return {}
    root = ET.parse(TECHTREE_PATH).getroot()
    prereqs: dict[str, list[str]] = {}
    for tech in root.findall("tech"):
        kinds = [(child.text or "").strip() for child in tech if _tag(child) == "techtype"]
        if "MythUnitUpgrade" not in kinds:
            continue
        tag = re.sub(r"[^a-z0-9]", "", (tech.get("name") or "").lower())
        if not tag:
            continue
        required: list[str] = []
        for block in tech.findall("prereqs"):
            for child in block:
                if _tag(child) == "techstatus" and child.text:
                    required.append(re.sub(r"[^a-z0-9]", "", child.text.lower()))
        prereqs[tag] = required

    def chain_root(tag: str, seen: set[str]) -> str:
        if tag in seen:
            return tag
        seen.add(tag)
        for item in prereqs.get(tag, []):
            if item in prereqs:
                return chain_root(item, seen)
        return tag

    def chain_rank(tag: str, seen: set[str]) -> int:
        if tag in seen:
            return 1
        seen.add(tag)
        for item in prereqs.get(tag, []):
            if item in prereqs:
                return chain_rank(item, set()) + 1
        return 1

    table = {tag: (f"myth:{chain_root(tag, set())}", chain_rank(tag, set())) for tag in prereqs}
    _myth_table.value = table  # type: ignore[attr-defined]
    return table


def _classify(tag: str, known: set[str], myth: dict[str, tuple[str, int]] | None = None) -> tuple[str, str, int] | None:
    """(id do grupo, line|armory|myth, rank) se a tecnologia tem ícone no catálogo."""
    catalog = _catalog_key(tag)
    if catalog not in known and tag not in known:
        return None
    if tag in ARMORY:
        group, rank = ARMORY[tag]
        return group, "armory", rank
    table = _myth_table() if myth is None else myth
    if tag in table:
        group, rank = table[tag]
        return group, "myth", rank
    info = _line_info(tag)
    if info is None:
        return None
    return f"line:{info[0]}", "line", info[1]


def _model_component(bars: BarIndex, node: Any) -> Any:
    """O seletor de submodel fica no anim original; o corpo comum, depois do include."""
    selector = direct_tech_component(node)
    if selector is not None:
        return selector
    return _body_component(resolve_visual_root(bars, node))


def _gather(bars: BarIndex, root: Any, depth: int = 0) -> set[str]:
    if depth > 3:
        return set()
    selector = direct_tech_component(root) if depth == 0 else None
    if depth == 0:
        root = resolve_visual_root(bars, root)
    found = _tech_tags(_body_component(root))
    if selector is not None:
        found |= _tech_tags(selector)
    sources = _attachment_sources(root)
    for name, source in sources:
        low = name.lower()
        if low in PROJECTILE_ATTACHMENTS or low in GATHER_ATTACHMENTS:
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


def _load_attachment(bars: BarIndex, source: str | Any) -> Any | None:
    if isinstance(source, str):
        try:
            return load_anim_xml(bars, source)
        except (RuntimeError, FileNotFoundError, OSError):
            return None
    return source


def _anim_attaches(root: Any, label: str) -> set[str]:
    found: set[str] = set()
    for elem in root.iter():
        if _tag(elem) != "anim":
            continue
        name = (elem.text or elem.get("name") or "").strip().lower()
        if name != label:
            continue
        for child in elem:
            if _tag(child) != "attach":
                continue
            attach = (child.get("name") or child.text or "").strip().lower()
            if attach:
                found.add(attach)
    return found


def _stance_split(root: Any) -> tuple[set[str], set[str]] | None:
    """Armas da pose parada contra as do ataque à distância, quando não convivem."""
    idle = _anim_attaches(root, "idle")
    ranged = _anim_attaches(root, "rangedattack")
    melee_only = idle - ranged
    ranged_only = ranged - idle
    pierce = ranged_only & {"bow", "javelin", "rangedweapon"}
    if "weapon" in melee_only and pierce:
        return melee_only, ranged_only
    return None


def _attachment_stance(owner: Any, name: str) -> str | None:
    split = _stance_split(owner)
    if split is None:
        return None
    low = name.lower()
    if low in split[0]:
        return "hack"
    if low in split[1]:
        return "pierce"
    return None


def _parts(bars: BarIndex, root: Any) -> list[tuple[tuple[str, ...], Any, str | None]]:
    """Corpo e cada anexo, inclusive a arma que está dentro do cavaleiro."""

    def walk(node: Any, prefix: tuple[str, ...], depth: int) -> list[tuple[tuple[str, ...], Any, str | None]]:
        if depth > 3:
            return []
        found: list[tuple[tuple[str, ...], Any, str | None]] = []
        if not prefix:
            found.append((("body",), node, None))
        sources = _attachment_sources(node)
        for name, source in sources:
            low = name.lower()
            stance = _attachment_stance(node, name)
            if low in GATHER_ATTACHMENTS:
                continue
            if low in PROJECTILE_ATTACHMENTS and not (low == "javelin" and stance == "pierce"):
                continue
            included = _load_attachment(bars, source)
            if included is None:
                continue
            path = prefix + (name,)
            found.append((path, included, stance))
            found.extend(walk(included, path, depth + 1))
        return found

    start = root if direct_tech_component(root) is not None else resolve_visual_root(bars, root)
    return walk(start, (), 0)


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
    parts = _parts(bars, root)
    has_stance = any(stance for _path, _node, stance in parts)
    if not useful and not has_stance:
        return None

    nested = {path for path, _node, _stance in parts}
    myth = set(_myth_table())
    baked: dict[tuple[str, str, int], str] = {}
    piece_entries: dict[str, list[dict[str, Any]]] = {}
    changed: set[str] = set()

    for part, part_root, part_stance in parts:
        component = _model_component(bars, part_root)
        subs = submodel_map(part_root)
        local_tags = _tech_tags(component) & useful
        combos = _combos(local_tags, known)

        def appearance(combo: tuple[str, ...]) -> tuple[str | None, int]:
            active = set(combo)
            path = _select_model(component, active, bars, subs)
            variant = selected_material_variant(component, active, myth) if path and active & myth else 0
            return path, variant

        resolved = [(combo, appearance(combo)) for combo in combos]
        by_combo = {combo: sig for combo, sig in resolved}
        for combo, sig in resolved:
            for index, tag in enumerate(combo):
                without = combo[:index] + combo[index + 1 :]
                previous = by_combo.get(without)
                if previous == sig:
                    continue
                if previous is None or previous[0] != sig[0] or tag in myth:
                    changed.add(tag)

        part_key = "-".join(part).lower()
        has_child = any(len(other) > len(part) and other[: len(part)] == part for other in nested)
        only: str | tuple[str, ...] = "body" if part == ("body",) else part + ("body",)
        entries: list[dict[str, Any]] = []
        for combo, (path, variant) in resolved:
            if not path:
                continue
            key = (part_key, path.lower(), variant)
            if key not in baked:
                slice_mark = "-slice" if has_child or len(part) > 1 else ""
                variant_mark = f"-v{variant}" if variant else ""
                filename = f"{_safe(part_key)}{slice_mark}-{_safe('+'.join(combo) or 'base')}{variant_mark}.glb"
                dest = PUBLIC_MODELS / "tech" / str(unit_id) / filename
                url = f"/assets/unit-models/tech/{unit_id}/{filename}"
                prims: list[dict[str, Any]] = []
                if not dest.exists() or force:
                    try:
                        prims, _names = visual_primitives(
                            bars,
                            root,
                            techs=set(combo),
                            only=only,
                            texture_variant=variant,
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
            if any(item["requires"] == requires and item.get("stance") == part_stance and item["url"] == url for item in entries):
                continue
            entry: dict[str, Any] = {"requires": requires, "url": url}
            if part_stance:
                entry["stance"] = part_stance
            entries.append(entry)
        if entries:
            piece_entries[part_key] = entries

    option_tags: list[str] = []
    for tag in sorted(changed):
        info = _classify(tag, known)
        if info is None:
            continue
        if info[1] == "myth" and not _piece_changes(tag, piece_entries):
            continue
        option_tags.append(tag)
    if not piece_entries or (not option_tags and not has_stance):
        return None

    grouped: dict[str, dict[str, Any]] = {}
    for tag in option_tags:
        info = _classify(tag, known)
        if info is None:
            continue
        group, kind, rank = info
        bucket = grouped.setdefault(group, {"id": group, "kind": kind, "options": []})
        bucket["options"].append({"tag": tag, "catalog": _catalog_key(tag), "rank": rank})
    kind_order = {"line": 0, "armory": 1, "myth": 2}
    groups = sorted(
        grouped.values(),
        key=lambda group: (
            kind_order.get(group["kind"], 3),
            ARMORY_ORDER.index(group["id"]) if group["id"] in ARMORY_ORDER else 9,
            group["id"],
        ),
    )
    for group in groups:
        group["options"].sort(key=lambda option: option["rank"])
    result: dict[str, Any] = {"groups": groups, "pieces": piece_entries}
    if has_stance:
        result["stance"] = True
    return result


def _piece_changes(tag: str, pieces: dict[str, list[dict[str, Any]]]) -> bool:
    """O botão só aparece se alguma peça gravada troca de arquivo ao marcar a tag."""
    for entries in pieces.values():
        for item in entries:
            if tag not in item["requires"]:
                continue
            without = [req for req in item["requires"] if req != tag]
            base = next((other for other in entries if other["requires"] == without), None)
            if base is None or base["url"] != item["url"]:
                return True
    return False


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
