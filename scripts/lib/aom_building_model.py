"""Malha estática de uma construção: era, deus e o prédio já concluído."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from aom_unit_model import (
    BarIndex,
    _export,
    _identity,
    _mat_from_3x4,
    _tag,
    _textured_mesh,
    load_anim_xml,
    submodel_map,
    write_static_glb,
)

AGE_TAGS = {
    1: "archaicage",
    2: "classicalage",
    3: "heroicage",
    4: "mythicage",
}
AGE_ORDER = ("archaicage", "classicalage", "heroicage", "mythicage")
PANTHEON_CULTURE = {
    1: "greek",
    2: "egyptian",
    3: "norse",
    4: "atlantean",
    5: "chinese",
    6: "japanese",
    7: "aztec",
}


def anim_for(unit: ET.Element, culture: str | None) -> str | None:
    plain: str | None = None
    fallback: str | None = None
    for node in unit.findall("animfile"):
        text = (node.text or "").replace("\\", "/").strip()
        if not text:
            continue
        node_culture = (node.get("culture") or "").strip()
        if culture and node_culture == culture:
            return text
        if not node_culture and plain is None:
            plain = text
        if fallback is None:
            fallback = text
    if culture:
        return plain or fallback
    return plain or fallback


def select_visual(
    bars: BarIndex,
    root: ET.Element,
    age: str | None,
    civ: str | None,
) -> str | None:
    return _walk(bars, root, age, civ, submodel_map(root), 0)


def _walk(
    bars: BarIndex,
    elem: ET.Element | None,
    age: str | None,
    civ: str | None,
    subs: dict[str, ET.Element],
    depth: int,
) -> str | None:
    if elem is None or depth > 24:
        return None
    tag = _tag(elem)
    kind = (elem.get("type") or "").lower()
    if tag == "logic":
        chosen = _logic_child(elem, kind, age, civ)
        return _walk(bars, chosen, age, civ, subs, depth + 1)
    if tag == "submodelref":
        ref = (elem.get("ref") or "").strip().lower()
        sub = subs.get(ref)
        include = _include_text(sub) if sub is not None else ""
        if include:
            nested = load_anim_xml(bars, include)
            if nested is not None:
                return _walk(bars, nested, age, civ, submodel_map(nested), depth + 1)
        return _walk(bars, sub, age, civ, subs, depth + 1)
    if tag == "include" and elem.text:
        nested = load_anim_xml(bars, elem.text.replace("\\", "/").strip())
        if nested is None:
            return None
        return _walk(bars, nested, age, civ, submodel_map(nested), depth + 1)
    if tag == "assetreference" and kind in {"tmcomposite", "tmmodel"}:
        return _file_text(elem)
    if tag in {"anim", "attachment", "attach"}:
        return None
    # Submodelos são só alvos de submodelref. O primeiro da lista não pode
    # vencer o ramo Civ/Age/Variation que escolhe qual deles usar.
    fallback_submodel: ET.Element | None = None
    for child in elem:
        if _tag(child) == "submodel":
            if fallback_submodel is None:
                fallback_submodel = child
            continue
        found = _walk(bars, child, age, civ, subs, depth + 1)
        if found:
            return found
    if fallback_submodel is not None:
        return _walk(bars, fallback_submodel, age, civ, subs, depth + 1)
    return None


def _logic_child(elem: ET.Element, kind: str, age: str | None, civ: str | None) -> ET.Element | None:
    children = list(elem)
    if not children:
        return None
    if kind == "age":
        wanted = age or AGE_ORDER[-1]
        for child in children:
            if _tag(child) == wanted:
                return child
        ages = [child for child in children if _tag(child) in AGE_ORDER]
        return ages[-1] if ages else children[-1]
    if kind == "buildingcompletion":
        for child in children:
            if _tag(child) == "p100":
                return child
        return children[-1]
    if kind == "civ":
        if civ:
            for child in children:
                if _tag(child) == civ:
                    return child
        return children[0]
    if kind == "tech":
        for child in children:
            if _tag(child) == "none":
                return child
        return children[0]
    if kind == "variation":
        return children[0]
    return children[0]


def _include_text(elem: ET.Element) -> str:
    for child in elem:
        if _tag(child) == "include" and child.text:
            return child.text.replace("\\", "/").strip()
    return ""


def _file_text(elem: ET.Element) -> str | None:
    for child in elem:
        if _tag(child) == "file" and child.text and child.text.strip():
            return child.text.replace("\\", "/").strip()
    return None


def _composite_hit(bars: BarIndex, path: str) -> tuple[str, str] | None:
    rel = path.replace("\\", "/").strip().lstrip("/")
    low = rel.lower()
    if low.endswith(".composite"):
        low = low[: -len(".composite")]
    for key in (f"{low}.composite", f"game/art/{low}.composite"):
        hit = bars.art.get(key)
        if hit:
            return hit
    return None


def _load_composite(bars: BarIndex, path: str) -> dict[str, Any] | None:
    hit = _composite_hit(bars, path)
    if hit is None:
        return None
    dest = bars.cache_dir / "composite" / path.replace("\\", "/").replace("/", "_").lower()
    raw_path = dest / "model.composite"
    if not raw_path.exists():
        exported = _export(bars.crybar, hit[0], hit[1], dest)
        raw_path.write_bytes(exported.read_bytes())
    raw = raw_path.read_bytes()
    start = raw.find(b"{")
    if start < 0:
        return None
    data, _end = json.JSONDecoder().raw_decode(raw[start:].decode("utf-8", "replace"))
    return data if isinstance(data, dict) else None


def visual_primitives(bars: BarIndex, path: str) -> list[dict[str, Any]]:
    composite = _load_composite(bars, path)
    prims: list[dict[str, Any]] = []
    if composite is not None:
        for entity in composite.get("entities") or []:
            if entity.get("type") != "model":
                continue
            ref = str(entity.get("model_ref") or "").replace("\\", "/").strip()
            if not ref or "damaged" in ref.lower():
                continue
            matrix = _mat_from_3x4(entity.get("local_transform") or [])
            prims.extend(_textured_mesh(bars, ref, matrix))
    if prims:
        return prims
    return _textured_mesh(bars, path, _identity())


def bake_building_glb(
    bars: BarIndex,
    anim_relative: str,
    dest: Path,
    *,
    era_id: int | None,
    civ: str | None,
) -> dict[str, Any]:
    root = load_anim_xml(bars, anim_relative)
    if root is None:
        raise FileNotFoundError(f"animfile não encontrado: {anim_relative}")
    age = AGE_TAGS.get(era_id or 0)
    visual = select_visual(bars, root, age, civ)
    if not visual:
        raise FileNotFoundError(f"sem malha concluída em {anim_relative}")
    prims = visual_primitives(bars, visual)
    if not prims:
        raise FileNotFoundError(f"sem TMModel em {visual}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    write_static_glb(prims, dest)
    return {"visual": visual, "bytes": dest.stat().st_size}
