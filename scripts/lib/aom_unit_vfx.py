"""Pontos de efeito da pose parada, no mesmo espaço do GLB.

Entra o que o jogo liga no Idle: fogo, brilho, fumaça e olhos.
Ataque, bênção, cura, nascimento, espuma, esteira e armas com tecnologia ficam de fora.
"""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_unit_model import (
    BarIndex,
    _bone_translation,
    _identity,
    _mat_from_gltf,
    _mat_mul,
    _posed_bone_worlds,
    _quat_matrix,
    _tag,
    ensure_model_glb,
    load_anim_xml,
    models_in_anim,
    read_accessor,
    read_glb,
    resolve_visual_root,
)

ROOT = Path(__file__).resolve().parents[2]
VFX_PATH = ROOT / "src" / "data" / "unit_idle_vfx.json"

# Caminho do efeito, sem extensão, e o tipo de partícula da página.
ALLOW: dict[str, str] = {
    "glow/wretch_ring": "ring",
    "glow/wretch_smoke": "aura",
    "fire/qi_lin/qi_lin_trailfire": "fire",
    "fire/qi_lin/qilin_glowing_eyes": "eyes",
    "fire/qi_lin/qi_lin_headfire": "fire",
    "fire/phoenix/flame_phoenix": "fire",
    "fire/phoenix/flame_phoenix_wing": "fire",
    "fire/phoenix/flame_phoenix_player_color": "fire",
    "fire/phoenix/flame_phoenix_wing_player_color": "fire",
    "fire/phoenix/flame_phoenix_egg": "fire",
    "fire/fire_giant/flame_fire_giant_limb": "fire",
    "fire/fire_giant/flame_fire_giant_flameout": "fire",
    "fire/zhu_que/flame_zhu_que_tail_player_color": "fire",
    "fire/zhu_que/flame_zhu_que_wing_player_color": "fire",
    "fire/zhu_que/zhu_que_fire_head": "fire",
    "fire/bai_hu_tailfire": "fire",
    "fire/fire_wanyudo": "fire",
    "fire/fire_generic_tiny_1": "fire",
    "fire/ne_zha/ne_zha_fire_ring": "ring",
    "fire/fire_siphon/fire_siphon_mouth_flame": "fire",
    "fire/sky_lantern/lighting_trail": "fire",
    "fire/damage_fire_a": "fire",
    "objects/onmoraki/onmoraki_aura": "aura",
    "units/jorogumo/jorogumo_aura": "aura",
    "units/jorogumo/jorogumo_lantern": "glow",
    "glow/umibozu_eye_smoke": "smoke",
    "glow/umibozu_sparkles": "glow",
    "glow/umibozu_sparkles2": "glow",
    "glow/umibozu_sparkles3": "glow",
    "objects/kitsune/kitsune_eyes": "eyes",
    "objects/kitsune/kitsune_tail": "glow",
    "objects/kitsune/kitsune_trails": "fire",
    "godpowers/fafnir_effects/fafnir_gas_fin": "gas",
    "godpowers/fafnir_effects/fafnir_gas_main": "gas",
    "snow/frost_giant/frost_giant_vapor_mist": "mist",
    "snow/frost_giant/frost_giant_vapor_mist_small": "mist",
    "units/einhari/einhari_axe": "glow",
    "units/einhari/einhari_eyes": "eyes",
    "units/einhari/einhari_horns": "glow",
    "glow/valkyrie": "aura",
    "units/drauger_aura": "aura",
    "units/draugr_bow": "glow",
    "objects/lampades/lampades_staff_glow": "glow",
    "objects/automaton/automaton_glow": "glow",
    "units/manticore/manticore_eyes": "eyes",
    "units/manticore/manticore_tail": "glow",
    "objects/mummy/mummy_flies": "flies",
    "objects/mummy/minion_flies": "flies",
    "objects/shade/shade_cloud": "smoke",
    "godpowers/corrupted_ground/soul_guide_flame": "fire",
    "glow/raiju_body_lightning_base": "lightning",
    "objects/ya_zi/yazi_eye_glow": "eyes",
}

# Efeitos genéricos que só valem dentro do modelo certo.
SOURCE_NEEDS: dict[str, tuple[str, ...]] = {
    "fire/damage_fire_a": ("sky_lantern",),
    "fire/fire_generic_tiny_1": ("asura",),
}

# Fração da altura da malha. Olho fica pequeno; aura cobre o corpo.
SIZE_OF = {
    "eyes": 0.045,
    "glow": 0.08,
    "ring": 0.09,
    "fire": 0.11,
    "smoke": 0.2,
    "mist": 0.18,
    "gas": 0.18,
    "aura": 0.32,
    "lightning": 0.1,
    "flies": 0.14,
}

TINT_OF = {
    "fire": "#ff9a3c",
    "eyes": "#fff4d2",
    "glow": "#ffe2a0",
    "ring": "#f3f6ff",
    "smoke": "#8b919c",
    "mist": "#d5eef8",
    "gas": "#8ed07a",
    "aura": "#e7d3a1",
    "lightning": "#d6ecff",
    "flies": "#2a2e28",
}

CAP = {
    "fire": 0.4,
    "lightning": 0.35,
    "aura": 1.1,
}

FILE_TINT = {
    "units/drauger_aura": "#9ecf8a",
    "objects/onmoraki/onmoraki_aura": "#6d5f86",
    "units/jorogumo/jorogumo_aura": "#7dba86",
    "glow/valkyrie": "#ffe3a6",
    "objects/shade/shade_cloud": "#b7bec8",
    "glow/wretch_smoke": "#7dba86",
    "glow/wretch_ring": "#f7f9ff",
}


def _key(path: str) -> str:
    low = path.replace("\\", "/").strip().lower()
    if low.endswith(".pkfx"):
        low = low[:-5]
    return low


def _anim_name(elem: ET.Element) -> str:
    return " ".join((elem.text or "").split()).lower()


def _is_rest(name: str) -> bool:
    token = name.split()[0] if name else ""
    if any(token.startswith(prefix) for prefix in ("attack", "death", "birth", "walk", "run", "flail", "ranged")):
        return False
    return token.startswith("idle") or token in {"bored", "hover", "fly", "pace", "float"}


def _file_of(elem: ET.Element) -> str | None:
    kind = (elem.get("type") or "").lower()
    if _tag(elem) == "tag" and kind == "particles":
        return (elem.get("popcornfxname") or "").replace("\\", "/").strip() or None
    if _tag(elem) == "assetreference" and kind in {"popcornfx", "tmcomposite"}:
        for child in elem:
            if _tag(child) == "file" and child.text and child.text.strip():
                return child.text.replace("\\", "/").strip()
    return None


def _visuals(elem: ET.Element, techs: tuple[str, ...], out: list[tuple[tuple[str, ...], str]]) -> None:
    tag = _tag(elem)
    logic = (elem.get("type") or "").lower()
    if tag == "logic" and logic == "tech":
        for child in elem:
            name = _tag(child)
            _visuals(child, techs if name == "none" else techs + (name,), out)
        return
    if tag == "logic" and logic == "cinematic":
        for child in elem:
            if _tag(child) == "normal":
                _visuals(child, techs, out)
        return
    if tag == "nullvisual":
        return
    found = _file_of(elem)
    if found:
        out.append((techs, found))
    if tag in {"anim", "attachment"}:
        return
    for child in elem:
        if _tag(child) in {"anim", "attachment"}:
            continue
        _visuals(child, techs, out)


def _blocked(path: str) -> bool:
    return any(word in path for word in ("death", "attack", "birth", "cinematic", "igc", "props"))


def _classify(path: str, label: str) -> str | None:
    """Tipo da partícula. Chama e relâmpago de arma ficam de fora."""
    if "titan" in path or "flaming_weapons" in path or "lightning_weapons" in path:
        return None
    if _blocked(path):
        return None
    kind = ALLOW.get(path)
    if kind:
        return kind
    return None


def _wanted(root: ET.Element, source: str) -> list[tuple[str, str, str, tuple[str, ...]]]:
    """(rótulo, tipo, caminho, tecnologias) dos efeitos ligados no Idle."""
    found: list[tuple[str, str, str, tuple[str, ...]]] = []
    for child in root:
        if _tag(child) != "attachment":
            continue
        anims = [_anim_name(anim) for anim in child if _tag(anim) == "anim"]
        if not any(_is_rest(name) for name in anims):
            continue
        label = " ".join((child.text or "").split()) or "anexo"
        visuals: list[tuple[tuple[str, ...], str]] = []
        for node in child:
            if _tag(node) == "component":
                _visuals(node, (), visuals)
        for techs, path in visuals:
            key = _key(path)
            classified = _classify(key, label)
            if classified is None or techs:
                continue
            kind = classified
            needs = SOURCE_NEEDS.get(key)
            if needs and not any(part in source.lower() for part in needs):
                continue
            found.append((label, kind, key, techs))
    return found


def _attaches(root: ET.Element) -> dict[str, list[str]]:
    points: dict[str, list[str]] = {}
    for node in root.iter():
        if _tag(node) != "attach":
            continue
        name = (node.get("name") or "").strip().lower()
        point = (node.get("attachpoint") or "").strip()
        if not name or not point or point.lower() == "bonethatdoesntexist":
            continue
        bucket = points.setdefault(name, [])
        if point not in bucket:
            bucket.append(point)
    return points


def _includes(bars: BarIndex, root: ET.Element, depth: int = 0) -> list[ET.Element]:
    if depth > 1:
        return []
    nested: list[ET.Element] = []
    seen: set[str] = set()
    for node in root.iter():
        if _tag(node) != "include" or not node.text:
            continue
        path = node.text.replace("\\", "/").strip()
        if path.lower() in seen:
            continue
        seen.add(path.lower())
        try:
            child = load_anim_xml(bars, path)
        except (RuntimeError, FileNotFoundError, ET.ParseError, OSError):
            continue
        if child is None:
            continue
        nested.append(child)
        nested.extend(_includes(bars, child, depth + 1))
    return nested


def _local_matrix(node: dict[str, Any]) -> list[list[float]]:
    if node.get("matrix"):
        return _mat_from_gltf(node["matrix"])
    rotation = node.get("rotation")
    matrix = _quat_matrix(*(float(value) for value in rotation)) if rotation else _identity()
    translation = node.get("translation") or (0.0, 0.0, 0.0)
    matrix[0][3], matrix[1][3], matrix[2][3] = (float(translation[0]), float(translation[1]), float(translation[2]))
    return matrix


def _parents(gltf: dict[str, Any]) -> dict[int, int]:
    found: dict[int, int] = {}
    for index, node in enumerate(gltf.get("nodes") or []):
        for child in node.get("children") or []:
            found[int(child)] = index
    return found


def _world_of(
    gltf: dict[str, Any],
    worlds: dict[int, list[list[float]]] | None,
    index: int,
    parents: dict[int, int],
    cache: dict[int, list[list[float]]],
) -> list[list[float]]:
    if index in cache:
        return cache[index]
    if worlds and index in worlds:
        cache[index] = worlds[index]
        return worlds[index]
    local = _local_matrix((gltf.get("nodes") or [])[index])
    parent = parents.get(index)
    world = local if parent is None else _mat_mul(_world_of(gltf, worlds, parent, parents, cache), local)
    cache[index] = world
    return world


def _bone_point(
    gltf: dict[str, Any],
    worlds: dict[int, list[list[float]]] | None,
    name: str,
    parents: dict[int, int],
    cache: dict[int, list[list[float]]],
) -> tuple[float, float, float] | None:
    found = _bone_translation(gltf, worlds, name)
    if found is not None:
        return found
    target = name.lower()
    nodes = gltf.get("nodes") or []
    for index, node in enumerate(nodes):
        node_name = (node.get("name") or "").lower()
        short = node_name.split(":")[-1]
        if node_name == target or short == target or node_name.endswith(":" + target) or node_name.endswith("_" + target):
            matrix = _world_of(gltf, worlds, index, parents, cache)
            return (matrix[0][3], matrix[1][3], matrix[2][3])
    return None


def _hint_points(
    gltf: dict[str, Any],
    worlds: dict[int, list[list[float]]] | None,
    kind: str,
) -> list[tuple[float, float, float]]:
    hints = {
        "eyes": ("eye",),
        "fire": ("flame", "fire", "head", "mouth", "tail", "wing"),
        "glow": ("eye", "staff", "lantern", "horn", "tail"),
        "ring": ("ring",),
    }.get(kind, ())
    if not hints or not worlds:
        return []
    points: list[tuple[float, float, float]] = []
    for index, node in enumerate(gltf.get("nodes") or []):
        if index not in worlds:
            continue
        node_name = (node.get("name") or "").lower()
        if not any(hint in node_name for hint in hints):
            continue
        matrix = worlds[index]
        points.append((matrix[0][3], matrix[1][3], matrix[2][3]))
        if len(points) >= 8:
            break
    return points


def _fallback(kind: str, worlds: dict[int, list[list[float]]] | None) -> list[tuple[float, float, float]]:
    if not worlds:
        return []
    pts = [(matrix[0][3], matrix[1][3], matrix[2][3]) for matrix in worlds.values()]
    ys = [point[1] for point in pts]
    lo, hi = min(ys), max(ys)
    span = max(hi - lo, 0.4)
    cx = sum(point[0] for point in pts) / len(pts)
    cz = sum(point[2] for point in pts) / len(pts)
    if kind == "eyes":
        y = lo + span * 0.9
        gap = max(span * 0.025, 0.04)
        return [(cx - gap, y, cz), (cx + gap, y, cz)]
    if kind in {"fire", "glow", "ring", "lightning"}:
        return [(cx, lo + span * 0.72, cz)]
    return [(cx, lo + span * 0.55, cz)]


def _mesh_height(glb_path: Path | None) -> float | None:
    if glb_path is None or not glb_path.exists():
        return None
    gltf, blob = read_glb(glb_path)
    lo = hi = None
    for mesh in gltf.get("meshes") or []:
        for prim in mesh.get("primitives") or []:
            index = (prim.get("attributes") or {}).get("POSITION")
            if index is None:
                continue
            acc = gltf["accessors"][index]
            bounds = acc.get("min"), acc.get("max")
            if bounds[0] and bounds[1]:
                y0, y1 = bounds[0][1], bounds[1][1]
            else:
                values = read_accessor(gltf, blob, index)
                if not values:
                    continue
                y0 = min(point[1] for point in values)
                y1 = max(point[1] for point in values)
            lo = y0 if lo is None else min(lo, y0)
            hi = y1 if hi is None else max(hi, y1)
    if lo is None or hi is None:
        return None
    return max(hi - lo, 0.4)


def idle_vfx_anchors(bars: BarIndex, anim_relative: str, glb_path: Path | None = None) -> list[dict[str, Any]]:
    root = load_anim_xml(bars, anim_relative)
    if root is None:
        return []
    trees = [root, *_includes(bars, root)]
    wanted: list[tuple[str, str, str, tuple[str, ...]]] = []
    attaches: dict[str, list[str]] = {}
    for tree in trees:
        wanted.extend(_wanted(tree, anim_relative))
        for name, points in _attaches(tree).items():
            bucket = attaches.setdefault(name, [])
            for point in points:
                if point not in bucket:
                    bucket.append(point)
    if not wanted:
        return []

    visual = resolve_visual_root(bars, root)
    models = models_in_anim(visual)
    gltf = None
    worlds = None
    if models:
        body = ensure_model_glb(bars, models[0])
        if body is not None:
            gltf, blob = read_glb(body)
            worlds = _posed_bone_worlds(bars, visual, gltf, blob)

    height = _mesh_height(glb_path)
    if height is None and worlds:
        ys = [matrix[1][3] for matrix in worlds.values()]
        height = max(max(ys) - min(ys), 0.4)
    height = height or 1.8
    parents = _parents(gltf) if gltf is not None else {}
    cache: dict[int, list[list[float]]] = {}

    anchors: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for label, kind, key, techs in wanted:
        points: list[tuple[float, float, float]] = []
        if gltf is not None:
            for point_name in attaches.get(label.lower(), []):
                found = _bone_point(gltf, worlds, point_name, parents, cache)
                if found is not None:
                    points.append(found)
            if not points and not techs:
                points = _hint_points(gltf, worlds, kind)
        if not points:
            points = _fallback(kind, worlds)
        size = round(min(max(height * SIZE_OF.get(kind, 0.1), 0.05), CAP.get(kind, 1.4)), 3)
        tint = FILE_TINT.get(key, TINT_OF.get(kind, "#ffffff"))
        for point in points:
            marker = (kind, techs, round(point[0] * 40), round(point[1] * 40), round(point[2] * 40))
            if marker in seen:
                continue
            seen.add(marker)
            anchor: dict[str, Any] = {
                "kind": kind,
                "at": [round(point[0], 3), round(point[1], 3), round(point[2], 3)],
                "size": size,
                "tint": tint,
            }
            if techs:
                anchor["techs"] = list(techs)
            anchors.append(anchor)
    return anchors


def write_idle_vfx(entries: dict[str, list[dict[str, Any]]]) -> None:
    VFX_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def merge_idle_vfx(unit_id: int, anchors: list[dict[str, Any]]) -> None:
    current: dict[str, list[dict[str, Any]]] = {}
    if VFX_PATH.exists():
        current = json.loads(VFX_PATH.read_text(encoding="utf-8"))
    key = str(unit_id)
    if anchors:
        current[key] = anchors
    else:
        current.pop(key, None)
    write_idle_vfx(current)
