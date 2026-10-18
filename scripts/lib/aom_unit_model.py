"""Extrai a malha 3D de uma unidade do AoM Retold e grava um GLB estático.

O proto aponta um animfile. Esse XML referencia o TMModel (malha .tmm) e os
acessórios (lança, escudo, elmo). O CryBar converte TMM para GLB sem textura;
aqui a cor base (DDT) entra no GLB e o esqueleto vai para o primeiro quadro
da animação Idle, para o site só girar o modelo.
"""

from __future__ import annotations

import io
import json
import re
import struct
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from PIL import Image

from aom_game_paths import DEFAULT_CACHE_DIR, DEFAULT_CRYBAR, resolve_game_dir
from aom_tma import _flip_x, pose_worlds as tma_pose_worlds

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_MODELS = ROOT / "public" / "assets" / "unit-models"
MANIFEST_PATH = ROOT / "src" / "data" / "unit_models.json"
WORK_ROOT = ROOT / "tools" / ".unit-model-cache"

COMPONENT = {
    5120: ("b", 1),
    5121: ("B", 1),
    5122: ("h", 2),
    5123: ("H", 2),
    5125: ("I", 4),
    5126: ("f", 4),
}
TYPE_COUNT = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
SKIP_TAGS = {"cinematic", "attachment"}
HAND_RETARGET = {
    "weaponright": "mixamorig:RightHand",
    "weaponleft": "mixamorig:LeftHand",
    "shield": "mixamorig:LeftHand",
    "prop_r": "mixamorig:RightHand",
    "prop_l": "mixamorig:LeftHand",
}
# Projéteis e marcas de passo não ficam na mão na pose parada.
PROJECTILE_ATTACHMENTS = {
    "arrow",
    "arrows",
    "javelin",
    "boulder",
    "flaming",
    "footprint",
    "footprint_left",
    "footprint_right",
}
# Ferramenta de construção. Só entra se a unidade não tiver arma de combate.
TOOL_ATTACHMENTS = {"hammer", "pickaxe", "tool", "mallet"}


def _tag(elem: ET.Element) -> str:
    return elem.tag.split("}")[-1].lower()


def _run(crybar: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(crybar), *args],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def _json_from_crybar(proc: subprocess.CompletedProcess[str]) -> Any:
    text = proc.stdout or ""
    start = text.find("[")
    if start < 0:
        start = text.find("{")
    if start < 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "crybar sem JSON")
    return json.loads(text[start:])


def _safe_key(relative: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "_", relative.replace("\\", "/").lower()).strip("_")


class BarIndex:
    """Índice path -> (arquivo .bar, path original) para achar malha, XML e textura."""

    def __init__(self, game_dir: Path, crybar: Path, cache_dir: Path) -> None:
        self.game_dir = game_dir
        self.crybar = crybar
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        art = game_dir / "game" / "art"
        modelcache = game_dir / "game" / "modelcache"
        self.meta = self._load("meta", [modelcache / "ArtModelCacheMeta.bar"])
        data_bars = sorted(modelcache.glob("ArtModelCacheModelData*.bar"))
        self.data = self._load("data", data_bars)
        art_bars = [
            path
            for path in sorted(art.glob("Art*.bar"))
            if "Texture" not in path.name and "Model" not in path.name
        ]
        self.art = self._load("art", art_bars)
        texture_bars = sorted(art.glob("Art*Textures.bar"))
        anim_bars = sorted(modelcache.glob("ArtModelCacheAnimation*.bar"))
        self.anims = self._load(
            "anim",
            anim_bars,
            keep=lambda path: path.lower().endswith(".tma"),
        )
        self.basecolors = self._load(
            "albedo",
            texture_bars,
            keep=lambda path: path.lower().endswith(".ddt")
            and ("basecolor" in path.lower() or "metalmask" in path.lower()),
        )

    def _load(
        self,
        name: str,
        bars: list[Path],
        keep: Any = None,
    ) -> dict[str, tuple[str, str]]:
        cache_path = self.cache_dir / f"index-{name}.json"
        signature = [
            [str(path), path.stat().st_mtime_ns, path.stat().st_size] for path in bars if path.exists()
        ]
        if cache_path.exists():
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            if cached.get("signature") == signature:
                return {key: (bar, original) for key, bar, original in cached["rows"]}

        rows: list[list[str]] = []
        index: dict[str, tuple[str, str]] = {}
        for bar in bars:
            if not bar.exists():
                continue
            proc = _run(self.crybar, ["bar", "list", str(bar), "--json", "-q"])
            if proc.returncode != 0:
                raise RuntimeError(f"falha ao listar {bar.name}: {proc.stderr.strip()}")
            for entry in _json_from_crybar(proc):
                original = entry.get("Path") or entry.get("path") or ""
                if not original:
                    continue
                if keep is not None and not keep(original):
                    continue
                key = original.replace("\\", "/").lower()
                index.setdefault(key, (str(bar), original))
                rows.append([key, str(bar), original])
        cache_path.write_text(
            json.dumps({"signature": signature, "rows": rows}, ensure_ascii=False),
            encoding="utf-8",
        )
        return index

    def find(self, index: dict[str, tuple[str, str]], relative: str) -> tuple[str, str] | None:
        rel = relative.replace("\\", "/").strip().lstrip("/")
        low = rel.lower()
        keys = [low]
        if not low.endswith(".xmb"):
            keys.append(f"{low}.xmb")
            if not low.endswith(".xml"):
                keys.append(f"{low}.xml.xmb")
        for key in keys:
            hit = index.get(key)
            if hit:
                return hit
        return None


def _export(crybar: Path, bar: str, entry: str, dest: Path, *, convert: bool = False) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    args = ["bar", "export", bar, entry, "-o", str(dest), "--flat", "-q"]
    if convert:
        args.append("--convert")
    proc = _run(crybar, args)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or f"export falhou: {entry}")
    name = Path(entry).name
    candidates = [
        dest / name,
        dest / re.sub(r"\.xmb$", "", name, flags=re.I),
        dest / re.sub(r"\.xmb$", ".xml", name, flags=re.I),
    ]
    for path in candidates:
        if path.exists():
            return path
    files = [path for path in dest.iterdir() if path.is_file()]
    if len(files) == 1:
        return files[0]
    raise FileNotFoundError(f"export de {entry} não gerou arquivo em {dest}")


def _convert_tmm(crybar: Path, tmm_path: Path, glb_path: Path) -> None:
    proc = _run(crybar, ["convert", "tmm-to-glb", str(tmm_path), "-o", str(glb_path), "-q"])
    if proc.returncode != 0 or not glb_path.exists():
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or f"tmm-to-glb falhou: {tmm_path.name}")


def _convert_ddt(crybar: Path, ddt_path: Path, png_path: Path) -> None:
    proc = _run(crybar, ["convert", "ddt-to-png", str(ddt_path), "-o", str(png_path), "-q"])
    if proc.returncode != 0 or not png_path.exists():
        raise RuntimeError(proc.stderr.strip() or f"ddt-to-png falhou: {ddt_path.name}")


def load_anim_xml(bars: BarIndex, relative: str) -> ET.Element | None:
    hit = bars.find(bars.art, relative)
    if hit is None:
        return None
    dest = WORK_ROOT / "xml" / _safe_key(relative)
    xml_path = dest / "anim.xml"
    if not xml_path.exists():
        exported = _export(bars.crybar, hit[0], hit[1], dest, convert=True)
        if exported.suffix.lower() == ".xmb":
            proc = _run(bars.crybar, ["convert", "xmb-to-xml", str(exported), "-o", str(xml_path), "-q"])
            if proc.returncode != 0:
                raise RuntimeError(proc.stderr.strip() or "xmb-to-xml falhou")
        else:
            xml_path.write_bytes(exported.read_bytes())
    return ET.parse(xml_path).getroot()


def _iter_model_files(elem: ET.Element):
    if _tag(elem) in SKIP_TAGS:
        return
    if _tag(elem) == "assetreference" and (elem.get("type") or "").lower() == "tmmodel":
        for child in elem:
            if _tag(child) == "file" and child.text and child.text.strip():
                yield child.text.replace("\\", "/").strip()
                return
        return
    for child in list(elem):
        yield from _iter_model_files(child)


def _pick_model(files: list[str]) -> str | None:
    for path in files:
        low = path.lower()
        if "_igc" in low or "/igc/" in low:
            continue
        return path
    return files[0] if files else None


def _visual_scope(root: ET.Element) -> ET.Element:
    """Unidades com corpo masculino/feminino guardam a malha no primeiro submodel."""
    for child in root:
        if _tag(child) == "submodel":
            return child
    return root


def models_in_anim(root: ET.Element) -> list[str]:
    found: list[str] = []
    scope_root = _visual_scope(root)
    components = [child for child in scope_root if _tag(child) == "component"]
    scopes = components or [scope_root]
    for scope in scopes:
        picked = _pick_model(list(_iter_model_files(scope)))
        if picked and picked not in found:
            found.append(picked)
    return found


def _attachment_sources(root: ET.Element) -> list[tuple[str, str | ET.Element]]:
    """Include externo ou o próprio bloco, quando a malha está escrita nele."""
    found: list[tuple[str, str | ET.Element]] = []
    for child in _visual_scope(root):
        if _tag(child) != "attachment":
            continue
        name = (child.text or "").strip()
        if not name:
            continue
        include = ""
        for sub in child:
            if _tag(sub) == "include" and sub.text:
                include = sub.text.replace("\\", "/").strip()
        if include:
            found.append((name, include))
        elif any(_tag(sub) == "component" for sub in child):
            found.append((name, child))
    return found


def _socket_name(gltf: dict[str, Any], root: ET.Element, attachment_name: str) -> str:
    """O soquete no esqueleto pode ter outro nome (BattleAxe) que o do acessório (Weapon)."""
    target = attachment_name.lower()
    point = ""
    for elem in root.iter():
        if _tag(elem) != "attach" or (elem.get("name") or "").lower() != target:
            continue
        point = (elem.get("attachpoint") or "").strip()
        if point:
            break
    if point and _has_attachment_node(gltf, point):
        return point
    return attachment_name


def _has_attachment_node(gltf: dict[str, Any], name: str) -> bool:
    target = name.lower()
    for node in gltf.get("nodes") or []:
        if (node.get("name") or "").lower() != target:
            continue
        kind = ((node.get("extras") or {}).get("crybar") or {}).get("node_type")
        if kind == "attachment":
            return True
    return False


def ensure_model_glb(bars: BarIndex, model_path: str) -> Path | None:
    base = model_path.replace("\\", "/").strip().lstrip("/")
    if base.lower().endswith(".tmm"):
        base = base[:-4]
    tmm_hit = bars.meta.get(f"{base.lower()}.tmm")
    data_hit = bars.data.get(f"{base.lower()}.tmm.data")
    if tmm_hit is None or data_hit is None:
        return None
    dest = WORK_ROOT / "glb" / _safe_key(base)
    glb_path = dest / f"{Path(base).name}.glb"
    if glb_path.exists():
        return glb_path
    dest.mkdir(parents=True, exist_ok=True)
    tmm_file = _export(bars.crybar, tmm_hit[0], tmm_hit[1], dest)
    data_file = _export(bars.crybar, data_hit[0], data_hit[1], dest)
    expected_data = tmm_file.with_name(tmm_file.name + ".data")
    if data_file != expected_data:
        expected_data.write_bytes(data_file.read_bytes())
    _convert_tmm(bars.crybar, tmm_file, glb_path)
    return glb_path


_VARIANT_WORDS = {"igc", "upgrade", "pirate", "arrow", "older", "spc", "icon"}


def _score_albedo(filename: str, stem: str, material: str) -> int | None:
    """Quanto o arquivo combina com o modelo. Variantes (igc, upgrade, flecha) perdem."""
    if not filename.startswith(stem):
        return None
    rest = filename[len(stem) :]
    if rest and rest[0] not in "_.":
        return None
    rest = rest.lstrip("_")
    if rest.endswith(".ddt"):
        rest = rest[:-4]
    if rest.endswith("basecolor"):
        score = 100
        core = rest[: -len("basecolor")].rstrip("_")
    elif rest.endswith("metalmask"):
        score = 10
        core = rest[: -len("metalmask")].rstrip("_")
    else:
        return None
    tokens = [token for token in core.split("_") if token]
    if not tokens:
        return score + 40
    if tokens == [material]:
        return score + 50
    if material in tokens:
        score += 20
        extras = [token for token in tokens if token != material]
        if any(token in _VARIANT_WORDS for token in extras):
            score -= 30
        return score
    return score - 25


def _find_basecolor(bars: BarIndex, model_path: str, material_name: str) -> tuple[str, str] | None:
    base = model_path.replace("\\", "/").strip().lstrip("/")
    if base.lower().endswith(".tmm"):
        base = base[:-4]
    folder = base.rsplit("/", 1)[0].lower() + "/" if "/" in base else ""
    stem = base.rsplit("/", 1)[-1].lower()
    material = re.sub(r"[^a-z0-9]", "", material_name.lower()) or "mata"
    best: tuple[int, tuple[str, str]] | None = None
    fallback: tuple[int, tuple[str, str]] | None = None
    hint = stem.split("_")[-1]
    for key, hit in bars.basecolors.items():
        if folder and not key.startswith(folder):
            continue
        filename = key.rsplit("/", 1)[-1]
        score = _score_albedo(filename, stem, material)
        if score is not None and (best is None or score > best[0]):
            best = (score, hit)
        if score is None and hint and len(hint) >= 4 and hint in filename and "basecolor" in filename:
            if fallback is None or len(filename) < fallback[0]:
                fallback = (len(filename), hit)
    if best is not None:
        return best[1]
    return None if fallback is None else fallback[1]


def ensure_texture(bars: BarIndex, model_path: str, material_name: str) -> bytes | None:
    hit = _find_basecolor(bars, model_path, material_name)
    if hit is None:
        return None
    dest = WORK_ROOT / "tex" / _safe_key(hit[1])
    png_path = dest / "color.png"
    if not png_path.exists():
        exported = _export(bars.crybar, hit[0], hit[1], dest)
        if exported.suffix.lower() == ".ddt":
            _convert_ddt(bars.crybar, exported, png_path)
        elif exported.suffix.lower() == ".png":
            png_path.write_bytes(exported.read_bytes())
        else:
            _convert_ddt(bars.crybar, exported, png_path)
    return _image_bytes(png_path)


def _image_bytes(png_path: Path) -> bytes:
    with Image.open(png_path) as image:
        image = image.convert("RGBA")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        alpha = image.getchannel("A")
        lo, hi = alpha.getextrema()
        has_alpha = lo < 250
        buffer = io.BytesIO()
        if has_alpha:
            image.save(buffer, format="PNG", optimize=True)
        else:
            image.convert("RGB").save(buffer, format="JPEG", quality=82, optimize=True)
        return buffer.getvalue()


def read_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    data = path.read_bytes()
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20 : 20 + json_len])
    bin_off = 20 + json_len
    bin_len = struct.unpack_from("<I", data, bin_off)[0]
    blob = data[bin_off + 8 : bin_off + 8 + bin_len]
    return gltf, blob


def read_accessor(gltf: dict[str, Any], blob: bytes, index: int) -> list[Any]:
    acc = gltf["accessors"][index]
    if "bufferView" not in acc:
        return []
    view = gltf["bufferViews"][acc["bufferView"]]
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    ctype, csize = COMPONENT[acc["componentType"]]
    width = TYPE_COUNT[acc["type"]]
    stride = view.get("byteStride") or csize * width
    out: list[Any] = []
    for i in range(acc["count"]):
        vals = struct.unpack_from("<" + ctype * width, blob, start + i * stride)
        out.append(vals[0] if width == 1 else vals)
    return out


def _mat_mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]


def _mat_from_gltf(vals: tuple[float, ...] | list[float]) -> list[list[float]]:
    return [[float(vals[c * 4 + r]) for c in range(4)] for r in range(4)]


def _invert4(m: list[list[float]]) -> list[list[float]]:
    aug = [list(row) + [1.0 if i == j else 0.0 for j in range(4)] for i, row in enumerate(m)]
    for col in range(4):
        pivot = max(range(col, 4), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < 1e-12:
            raise ValueError("matriz singular")
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col]
        for j in range(8):
            aug[col][j] /= div
        for row in range(4):
            if row == col:
                continue
            factor = aug[row][col]
            for j in range(8):
                aug[row][j] -= factor * aug[col][j]
    return [row[4:] for row in aug]


def _identity() -> list[list[float]]:
    return [[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]]


def _quat_matrix(x: float, y: float, z: float, w: float) -> list[list[float]]:
    xx, yy, zz = x * x, y * y, z * z
    xy, xz, yz = x * y, x * z, y * z
    wx, wy, wz = w * x, w * y, w * z
    return [
        [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0.0],
        [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0.0],
        [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]


def _node_local(node: dict[str, Any]) -> list[list[float]]:
    if "matrix" in node:
        return _mat_from_gltf(node["matrix"])
    t = node.get("translation") or [0.0, 0.0, 0.0]
    r = node.get("rotation") or [0.0, 0.0, 0.0, 1.0]
    s = node.get("scale") or [1.0, 1.0, 1.0]
    rotation = _quat_matrix(float(r[0]), float(r[1]), float(r[2]), float(r[3]))
    scale = [[s[0], 0, 0, 0], [0, s[1], 0, 0], [0, 0, s[2], 0], [0, 0, 0, 1]]
    translation = [[1, 0, 0, t[0]], [0, 1, 0, t[1]], [0, 0, 1, t[2]], [0, 0, 0, 1]]
    return _mat_mul(translation, _mat_mul(rotation, scale))


def _mat_from_3x4(vals: list[float]) -> list[list[float]]:
    if len(vals) < 12:
        return _identity()
    return [
        [float(vals[0]), float(vals[1]), float(vals[2]), float(vals[3])],
        [float(vals[4]), float(vals[5]), float(vals[6]), float(vals[7])],
        [float(vals[8]), float(vals[9]), float(vals[10]), float(vals[11])],
        [0.0, 0.0, 0.0, 1.0],
    ]


def _transform_point(m: list[list[float]], x: float, y: float, z: float) -> tuple[float, float, float]:
    return (
        m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3],
        m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3],
        m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3],
    )


def _transform_normal(inv: list[list[float]], x: float, y: float, z: float) -> tuple[float, float, float]:
    nx = inv[0][0] * x + inv[1][0] * y + inv[2][0] * z
    ny = inv[0][1] * x + inv[1][1] * y + inv[2][1] * z
    nz = inv[0][2] * x + inv[1][2] * y + inv[2][2] * z
    length = (nx * nx + ny * ny + nz * nz) ** 0.5 or 1.0
    return (nx / length, ny / length, nz / length)


def _det3(m: list[list[float]]) -> float:
    a, b, c = m[0][:3]
    d, e, f = m[1][:3]
    g, h, i = m[2][:3]
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)


def _bind_worlds(gltf: dict[str, Any], blob: bytes) -> dict[int, list[list[float]]]:
    skins = gltf.get("skins") or []
    if not skins:
        return {}
    skin = skins[0]
    ibms = read_accessor(gltf, blob, skin["inverseBindMatrices"])
    worlds: dict[int, list[list[float]]] = {}
    for joint_index, node_index in enumerate(skin["joints"]):
        worlds[node_index] = _invert4(_mat_from_gltf(ibms[joint_index]))
    return worlds


def _node_by_name(gltf: dict[str, Any], name: str) -> int | None:
    target = name.lower()
    for index, node in enumerate(gltf.get("nodes") or []):
        if (node.get("name") or "").lower() == target:
            return index
    return None


def _attachment_node_index(gltf: dict[str, Any], name: str) -> int | None:
    """O osso e o soquete às vezes têm o mesmo nome. O soquete é quem carrega a peça."""
    target = name.lower()
    fallback = None
    for index, node in enumerate(gltf.get("nodes") or []):
        if (node.get("name") or "").lower() != target:
            continue
        kind = ((node.get("extras") or {}).get("crybar") or {}).get("node_type")
        if kind == "attachment":
            return index
        if fallback is None:
            fallback = index
    return fallback


def _placeholder_bone(world: list[list[float]]) -> bool:
    """WeaponRight/Shield nascem num ponto provisório (y=1.5, z=1), longe da mão."""
    x, y, z = world[0][3], world[1][3], world[2][3]
    return abs(x) < 0.4 and abs(y - 1.5) < 0.3 and abs(z - 1.0) < 0.4


def _parent_index(gltf: dict[str, Any], node_index: int) -> int | None:
    for index, node in enumerate(gltf.get("nodes") or []):
        if node_index in (node.get("children") or []):
            return index
    return None


def socket_matrix(
    gltf: dict[str, Any],
    blob: bytes,
    attachment_name: str,
    bone_worlds: dict[int, list[list[float]]] | None = None,
) -> list[list[float]] | None:
    nodes = gltf.get("nodes") or []
    target = _attachment_node_index(gltf, attachment_name)
    if target is None:
        return None
    node = nodes[target]
    extras = node.get("extras") or {}
    cry = ((extras.get("crybar") or {}).get("node_type") == "attachment")
    local = _identity()
    if cry:
        index = (extras.get("crybar") or {}).get("index")
        root_extras = ((nodes[0].get("extras") or {}).get("crybar") or {}).get("tmm") or {}
        attachments = root_extras.get("attachments") or []
        if isinstance(index, int) and 0 <= index < len(attachments):
            # A matriz do jogo é canhota. O mesmo espelho em X dos ossos deixa a peça em pé.
            local = _flip_x(_mat_from_3x4(attachments[index].get("local_matrix") or []))
    parent = _parent_index(gltf, target)
    worlds = bone_worlds if bone_worlds is not None else _bind_worlds(gltf, blob)
    if parent is not None:
        parent_name = (nodes[parent].get("name") or "").lower()
        short = parent_name.split(":")[-1]
        retarget = HAND_RETARGET.get(short)
        if retarget and parent in worlds and _placeholder_bone(worlds[parent]):
            hand = _node_by_name(gltf, retarget)
            if hand is not None and hand in worlds:
                parent = hand
        if parent in worlds:
            return _mat_mul(worlds[parent], local)
    return local


def apply_matrix(prims: list[dict[str, Any]], matrix: list[list[float]]) -> list[dict[str, Any]]:
    inv = _invert4(matrix)
    flip = _det3(matrix) < 0
    moved: list[dict[str, Any]] = []
    for prim in prims:
        indices = list(prim["indices"])
        if flip and indices:
            swapped: list[int] = []
            for index in range(0, len(indices) - 2, 3):
                swapped.extend((indices[index + 1], indices[index], indices[index + 2]))
            indices = swapped
        moved.append(
            {
                **prim,
                "positions": [_transform_point(matrix, *point) for point in prim["positions"]],
                "normals": [_transform_normal(inv, *normal) for normal in prim["normals"]],
                "indices": indices,
            }
        )
    return moved


def _mesh_primitives(
    gltf: dict[str, Any],
    blob: bytes,
    transform: list[list[float]],
) -> list[dict[str, Any]]:
    nodes = gltf.get("nodes") or []
    children: dict[int, list[int]] = {}
    child_set: set[int] = set()
    for index, node in enumerate(nodes):
        kids = list(node.get("children") or [])
        children[index] = kids
        child_set.update(kids)
    roots = [index for index in range(len(nodes)) if index not in child_set] or [0]
    flip = _det3(transform) < 0
    found: list[dict[str, Any]] = []

    def walk(index: int, parent: list[list[float]]) -> None:
        node = nodes[index]
        world = _mat_mul(parent, _node_local(node))
        mesh_index = node.get("mesh")
        if mesh_index is not None:
            mesh = gltf["meshes"][mesh_index]
            for prim in mesh.get("primitives") or []:
                attrs = prim.get("attributes") or {}
                if "POSITION" not in attrs or "indices" not in prim:
                    continue
                positions = read_accessor(gltf, blob, attrs["POSITION"])
                normals = read_accessor(gltf, blob, attrs["NORMAL"]) if "NORMAL" in attrs else []
                uvs = read_accessor(gltf, blob, attrs["TEXCOORD_0"]) if "TEXCOORD_0" in attrs else []
                indices = [int(v) for v in read_accessor(gltf, blob, prim["indices"])]
                local_inv = _invert4(world)
                moved_pos = [_transform_point(world, *p[:3]) for p in positions]
                if normals and len(normals) == len(positions):
                    moved_nrm = [_transform_normal(local_inv, *n[:3]) for n in normals]
                else:
                    moved_nrm = [(0.0, 1.0, 0.0)] * len(positions)
                moved_uv = [((uv[0], uv[1]) if uv else (0.0, 0.0)) for uv in (uvs or [])]
                if len(moved_uv) != len(moved_pos):
                    moved_uv = [(0.0, 0.0)] * len(moved_pos)
                if flip:
                    indices = [
                        indices[i + 1] if i % 3 == 0 else indices[i - 1] if i % 3 == 1 else indices[i]
                        for i in range(len(indices) - len(indices) % 3)
                    ]
                material_index = prim.get("material")
                material_name = "matA"
                if material_index is not None:
                    material_name = (gltf.get("materials") or [{}])[material_index].get("name") or "matA"
                found.append(
                    {
                        "positions": moved_pos,
                        "normals": moved_nrm,
                        "uvs": moved_uv,
                        "indices": indices,
                        "material": material_name,
                        "material_index": material_index if material_index is not None else 0,
                    }
                )
        for kid in children.get(index, []):
            walk(kid, world)

    for root in roots:
        walk(root, transform)
    return found


def _skinned_primitives(
    gltf: dict[str, Any],
    blob: bytes,
    bone_worlds: dict[int, list[list[float]]],
) -> list[dict[str, Any]]:
    """Aplica a pose nos vértices. A malha crua já está na pose de bind."""
    skins = gltf.get("skins") or []
    if not skins:
        return []
    skin = skins[0]
    inverse_binds = [_mat_from_gltf(matrix) for matrix in read_accessor(gltf, blob, skin["inverseBindMatrices"])]
    joints = skin.get("joints") or []
    identity = _identity()
    skin_mats: list[list[list[float]]] = []
    for joint, inverse in zip(joints, inverse_binds):
        pose = bone_worlds.get(joint, identity)
        skin_mats.append(_mat_mul(pose, inverse))
    inverse_skins = [_invert4(matrix) for matrix in skin_mats]
    found: list[dict[str, Any]] = []
    for node in gltf.get("nodes") or []:
        mesh_index = node.get("mesh")
        if mesh_index is None:
            continue
        mesh = gltf["meshes"][mesh_index]
        for prim in mesh.get("primitives") or []:
            attrs = prim.get("attributes") or {}
            if "POSITION" not in attrs or "JOINTS_0" not in attrs or "WEIGHTS_0" not in attrs or "indices" not in prim:
                continue
            positions = read_accessor(gltf, blob, attrs["POSITION"])
            normals = read_accessor(gltf, blob, attrs["NORMAL"]) if "NORMAL" in attrs else []
            uvs = read_accessor(gltf, blob, attrs["TEXCOORD_0"]) if "TEXCOORD_0" in attrs else []
            joint_ids = read_accessor(gltf, blob, attrs["JOINTS_0"])
            weights = read_accessor(gltf, blob, attrs["WEIGHTS_0"])
            indices = [int(value) for value in read_accessor(gltf, blob, prim["indices"])]
            moved: list[tuple[float, float, float]] = []
            moved_normals: list[tuple[float, float, float]] = []
            for index, point in enumerate(positions):
                ids = joint_ids[index]
                weight_row = weights[index]
                x = y = z = 0.0
                nx = ny = nz = 0.0
                normal = normals[index][:3] if normals else (0.0, 1.0, 0.0)
                for slot in range(4):
                    weight = float(weight_row[slot])
                    if weight <= 0:
                        continue
                    joint = int(ids[slot])
                    if joint < 0 or joint >= len(skin_mats):
                        continue
                    px, py, pz = _transform_point(skin_mats[joint], *point[:3])
                    x += weight * px
                    y += weight * py
                    z += weight * pz
                    nnx, nny, nnz = _transform_normal(inverse_skins[joint], *normal)
                    nx += weight * nnx
                    ny += weight * nny
                    nz += weight * nnz
                moved.append((x, y, z))
                moved_normals.append((nx, ny, nz))
            moved_uvs = [((uv[0], uv[1]) if uv else (0.0, 0.0)) for uv in (uvs or [])]
            if len(moved_uvs) != len(moved):
                moved_uvs = [(0.0, 0.0)] * len(moved)
            material_index = prim.get("material")
            material_name = "matA"
            if material_index is not None:
                material_name = (gltf.get("materials") or [{}])[material_index].get("name") or "matA"
            found.append(
                {
                    "positions": moved,
                    "normals": moved_normals,
                    "uvs": moved_uvs,
                    "indices": indices,
                    "material": material_name,
                    "material_index": material_index if material_index is not None else 0,
                }
            )
    return found


def _pack_image(raw: bytes) -> tuple[bytes, str]:
    if raw[:2] == b"\xff\xd8":
        return raw, "image/jpeg"
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        return raw, "image/png"
    return raw, "application/octet-stream"


def write_static_glb(prims: list[dict[str, Any]], dest: Path) -> None:
    blob = bytearray()
    buffer_views: list[dict[str, Any]] = []
    accessors: list[dict[str, Any]] = []
    images: list[dict[str, Any]] = []
    textures: list[dict[str, Any]] = []
    materials: list[dict[str, Any]] = []
    primitives: list[dict[str, Any]] = []
    image_keys: dict[bytes, int] = {}

    def align(n: int = 4) -> None:
        while len(blob) % n:
            blob.append(0)

    def push_bytes(data: bytes, target: int) -> int:
        align(4)
        offset = len(blob)
        blob.extend(data)
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": target})
        return len(buffer_views) - 1

    def push_vec(values: list[tuple[float, ...]], width: int, acc_type: str) -> int:
        raw = b"".join(struct.pack("<" + "f" * width, *row[:width]) for row in values)
        view = push_bytes(raw, 34962)
        flat = [coord for row in values for coord in row[:width]]
        mins = [min(flat[i::width]) for i in range(width)] if flat else [0] * width
        maxs = [max(flat[i::width]) for i in range(width)] if flat else [0] * width
        acc: dict[str, Any] = {
            "bufferView": view,
            "componentType": 5126,
            "count": len(values),
            "type": acc_type,
        }
        if acc_type == "VEC3":
            acc["min"] = mins
            acc["max"] = maxs
        accessors.append(acc)
        return len(accessors) - 1

    for prim in prims:
        if not prim["positions"] or not prim["indices"]:
            continue
        pos = push_vec(prim["positions"], 3, "VEC3")
        nrm = push_vec(prim["normals"], 3, "VEC3")
        uv = push_vec(prim["uvs"], 2, "VEC2")
        index_max = max(prim["indices"])
        if index_max < 65535:
            raw = struct.pack("<" + "H" * len(prim["indices"]), *prim["indices"])
            component = 5123
        else:
            raw = struct.pack("<" + "I" * len(prim["indices"]), *prim["indices"])
            component = 5125
        view = push_bytes(raw, 34963)
        accessors.append(
            {
                "bufferView": view,
                "componentType": component,
                "count": len(prim["indices"]),
                "type": "SCALAR",
            }
        )
        idx = len(accessors) - 1
        material_slot = 0
        image = prim.get("image")
        if isinstance(image, (bytes, bytearray)) and image:
            key = bytes(image)
            if key not in image_keys:
                payload, mime = _pack_image(key)
                align(4)
                offset = len(blob)
                blob.extend(payload)
                buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(payload)})
                images.append({"bufferView": len(buffer_views) - 1, "mimeType": mime})
                textures.append({"source": len(images) - 1, "sampler": 0})
                materials.append(
                    {
                        "doubleSided": True,
                        "pbrMetallicRoughness": {
                            "baseColorTexture": {"index": len(textures) - 1},
                            "metallicFactor": 0.05,
                            "roughnessFactor": 0.85,
                        },
                    }
                )
                image_keys[key] = len(materials) - 1
            material_slot = image_keys[key]
        else:
            if not materials or "baseColorTexture" in materials[0].get("pbrMetallicRoughness", {}):
                materials.append(
                    {
                        "doubleSided": True,
                        "pbrMetallicRoughness": {
                            "baseColorFactor": [0.72, 0.64, 0.52, 1],
                            "metallicFactor": 0.05,
                            "roughnessFactor": 0.9,
                        },
                    }
                )
            material_slot = len(materials) - 1
        primitives.append(
            {
                "attributes": {"POSITION": pos, "NORMAL": nrm, "TEXCOORD_0": uv},
                "indices": idx,
                "material": material_slot,
            }
        )

    if not primitives:
        raise ValueError("malha vazia")

    gltf = {
        "asset": {"version": "2.0", "generator": "aprendendo-age"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": primitives}],
        "materials": materials,
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": buffer_views,
        "accessors": accessors,
    }
    if textures:
        gltf["textures"] = textures
        gltf["images"] = images
        gltf["samplers"] = [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}]

    payload = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(payload) % 4:
        payload += b" "
    while len(blob) % 4:
        blob.append(0)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as handle:
        handle.write(b"glTF")
        handle.write(struct.pack("<I", 2))
        handle.write(struct.pack("<I", 12 + 8 + len(payload) + 8 + len(blob)))
        handle.write(struct.pack("<II", len(payload), 0x4E4F534A))
        handle.write(payload)
        handle.write(struct.pack("<II", len(blob), 0x004E4942))
        handle.write(blob)


def _proto_animfiles(cache_dir: Path) -> dict[str, str]:
    proto_path = cache_dir / "gameplay" / "proto.xml"
    root = ET.parse(proto_path).getroot()
    mapping: dict[str, str] = {}
    for unit in root.findall("unit"):
        name = unit.get("name")
        anim = unit.find("animfile")
        if name and anim is not None and anim.text:
            mapping[name] = anim.text.replace("\\", "/").strip()
    return mapping


def resolve_visual_root(bars: BarIndex, root: ET.Element, depth: int = 0) -> ET.Element:
    """Alguns animfiles só apontam para outro XML (submodel include)."""
    if depth > 4 or models_in_anim(root):
        return root
    scope = _visual_scope(root)
    for child in scope:
        if _tag(child) != "include" or not child.text:
            continue
        try:
            nested = load_anim_xml(bars, child.text.replace("\\", "/").strip())
        except (RuntimeError, FileNotFoundError, ET.ParseError, OSError):
            continue
        if nested is None:
            continue
        resolved = resolve_visual_root(bars, nested, depth + 1)
        if models_in_anim(resolved):
            return resolved
    return root


def _idle_clip(root: ET.Element) -> str | None:
    """A Idle às vezes está no submodel (corpo masculino/feminino), não na raiz."""
    scopes = [_visual_scope(root)]
    if scopes[0] is not root:
        scopes.append(root)
    for scope in scopes:
        for child in scope.iter():
            if _tag(child) != "anim":
                continue
            label = (child.text or child.get("name") or "").strip().lower()
            if label != "idle":
                continue
            fallback = ""
            for sub in child.iter():
                if _tag(sub) != "file" or not sub.text:
                    continue
                path = sub.text.replace("\\", "/").strip()
                low = path.lower()
                if "_igc" not in low and "/igc/" not in low:
                    return path
                if not fallback:
                    fallback = path
            if fallback:
                return fallback
    return None


def _ensure_tma(bars: BarIndex, relative: str) -> Path | None:
    base = relative.replace("\\", "/").strip().lstrip("/")
    if not base.lower().endswith(".tma"):
        base = f"{base}.tma"
    hit = bars.find(bars.anims, base)
    if hit is None:
        return None
    dest = WORK_ROOT / "tma" / _safe_key(base)
    tma_path = dest / Path(base).name
    if tma_path.exists():
        return tma_path
    dest.mkdir(parents=True, exist_ok=True)
    exported = _export(bars.crybar, hit[0], hit[1], dest)
    if exported != tma_path and exported.exists():
        tma_path.write_bytes(exported.read_bytes())
    return tma_path if tma_path.exists() else None


def _posed_bone_worlds(
    bars: BarIndex,
    root: ET.Element,
    gltf: dict[str, Any],
    blob: bytes,
) -> dict[int, list[list[float]]] | None:
    """Mundo de cada junta no primeiro quadro da Idle. None mantém a pose de bind."""
    clip = _idle_clip(root)
    if not clip:
        return None
    tma_path = _ensure_tma(bars, clip)
    if tma_path is None:
        return None
    named = tma_pose_worlds(tma_path.read_bytes())
    if not named:
        return None
    bind = _bind_worlds(gltf, blob)
    posed = dict(bind)
    matched: set[int] = set()
    nodes = gltf.get("nodes") or []
    for index, node in enumerate(nodes):
        name = (node.get("name") or "").lower()
        if index in bind and name in named:
            posed[index] = named[name]
            matched.add(index)
    if len(matched) < 3:
        return None
    _carry_unposed(nodes, bind, posed, matched)
    _seat_weapon_shaft(nodes, posed)
    return posed


def _carry_unposed(
    nodes: list[dict[str, Any]],
    bind: dict[int, list[list[float]]],
    posed: dict[int, list[list[float]]],
    matched: set[int],
) -> None:
    """Juntas sem trilha (dedos, twist) seguem o pai, em vez de ficar na pose aberta."""
    parents: dict[int, int] = {}
    for index, node in enumerate(nodes):
        for child in node.get("children") or []:
            parents[child] = index
    pending = [index for index in bind if index not in matched]
    for _ in range(8):
        if not pending:
            return
        stuck: list[int] = []
        for index in pending:
            parent = parents.get(index)
            if parent is None or parent not in posed or parent in stuck or parent in pending:
                stuck.append(index)
                continue
            local = _mat_mul(_invert4(bind[parent]), bind[index])
            posed[index] = _mat_mul(posed[parent], local)
        if len(stuck) == len(pending):
            return
        pending = stuck


def _seat_weapon_shaft(nodes: list[dict[str, Any]], posed: dict[int, list[list[float]]]) -> None:
    """Encosta o cabo na mão quando a lâmina é que está no osso.

    A Idle às vezes deixa a origem da arma (a lâmina) bem acima da mão, com o
    cabo passando ao lado. Trazer a origem até a mão enfia o cabo no chão.
    Aqui o osso só anda de lado, e só nesse caso, para o cabo cruzar a mão.
    """
    hands = {"weaponright": "mixamorig:righthand", "weaponleft": "mixamorig:lefthand"}
    by_name = {
        (node.get("name") or "").lower(): index
        for index, node in enumerate(nodes)
        if index in posed
    }
    for index, node in enumerate(nodes):
        if index not in posed:
            continue
        short = (node.get("name") or "").lower().split(":")[-1]
        hand_index = by_name.get(hands.get(short) or "")
        if hand_index is None:
            continue
        weapon = posed[index]
        hand = posed[hand_index]
        axis = (weapon[0][1], weapon[1][1], weapon[2][1])
        length = (axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2) ** 0.5 or 1.0
        axis = (axis[0] / length, axis[1] / length, axis[2] / length)
        delta = tuple(hand[row][3] - weapon[row][3] for row in range(3))
        along = delta[0] * axis[0] + delta[1] * axis[1] + delta[2] * axis[2]
        if abs(along) < 0.45:
            continue
        side = tuple(delta[i] - along * axis[i] for i in range(3))
        side_len = (side[0] ** 2 + side[1] ** 2 + side[2] ** 2) ** 0.5
        if side_len < 0.08 or side_len > 0.3:
            continue
        moved = [row[:] for row in weapon]
        for row in range(3):
            moved[row][3] += side[row]
        posed[index] = moved


def _textured_mesh(bars: BarIndex, model_path: str, transform: list[list[float]]) -> list[dict[str, Any]]:
    glb_path = ensure_model_glb(bars, model_path)
    if glb_path is None:
        return []
    gltf, blob = read_glb(glb_path)
    prims = _mesh_primitives(gltf, blob, transform)
    for prim in prims:
        prim["image"] = ensure_texture(bars, model_path, prim["material"])
    return prims


def visual_primitives(bars: BarIndex, root: ET.Element, depth: int = 0) -> tuple[list[dict[str, Any]], list[str]]:
    """Malha no espaço do anim: corpo e peças já encaixadas nos soquetes."""
    if depth > 3:
        return [], []
    root = resolve_visual_root(bars, root)
    model_paths = models_in_anim(root)
    if not model_paths:
        return [], []

    body_glb = ensure_model_glb(bars, model_paths[0])
    if body_glb is None:
        return [], []
    body_gltf, body_blob = read_glb(body_glb)
    bone_worlds = _posed_bone_worlds(bars, root, body_gltf, body_blob)
    if bone_worlds is None:
        prims = _mesh_primitives(body_gltf, body_blob, _identity())
    else:
        prims = _skinned_primitives(body_gltf, body_blob, bone_worlds)
        if not prims:
            prims = _mesh_primitives(body_gltf, body_blob, _identity())
    for prim in prims:
        prim["image"] = ensure_texture(bars, model_paths[0], prim["material"])
    for extra in model_paths[1:]:
        prims.extend(_textured_mesh(bars, extra, _identity()))
    if not prims:
        return [], []

    attachments = _attachment_sources(root)
    has_weapon = any(name.lower() == "weapon" for name, _source in attachments)
    attached: list[str] = []
    for name, source in attachments:
        low = name.lower()
        if low in PROJECTILE_ATTACHMENTS:
            continue
        if has_weapon and low in TOOL_ATTACHMENTS:
            continue
        if isinstance(source, str):
            try:
                included = load_anim_xml(bars, source)
            except (RuntimeError, FileNotFoundError, ET.ParseError, OSError):
                continue
        else:
            included = source
        if included is None:
            continue
        matrix = socket_matrix(body_gltf, body_blob, _socket_name(body_gltf, root, name), bone_worlds)
        if matrix is None:
            continue
        child_prims, _child_names = visual_primitives(bars, included, depth + 1)
        if not child_prims:
            continue
        prims.extend(apply_matrix(child_prims, matrix))
        attached.append(name)
    return prims, attached


def bake_unit_glb(
    bars: BarIndex,
    anim_relative: str,
    dest: Path,
) -> dict[str, Any]:
    root = load_anim_xml(bars, anim_relative)
    if root is None:
        raise FileNotFoundError(f"animfile não encontrado: {anim_relative}")
    prims, attached = visual_primitives(bars, root)
    if not prims:
        raise FileNotFoundError(f"sem TMModel em {anim_relative}")
    write_static_glb(prims, dest)
    return {
        "model": models_in_anim(resolve_visual_root(bars, root))[0],
        "attachments": attached,
        "bytes": dest.stat().st_size,
    }


def _material_images(gltf: dict[str, Any], blob: bytes) -> dict[int, Image.Image]:
    images: dict[int, Image.Image] = {}
    for mat_index, material in enumerate(gltf.get("materials") or []):
        tex_index = ((material.get("pbrMetallicRoughness") or {}).get("baseColorTexture") or {}).get("index")
        if tex_index is None:
            continue
        source = gltf["textures"][tex_index]["source"]
        image_def = gltf["images"][source]
        view = gltf["bufferViews"][image_def["bufferView"]]
        start = view.get("byteOffset", 0)
        raw = blob[start : start + view["byteLength"]]
        images[mat_index] = Image.open(io.BytesIO(raw)).convert("RGBA")
    return images


def render_preview(glb_path: Path, png_path: Path, size: int = 420) -> None:
    """Desenha duas vistas (frente e 3/4) para conferir pose e textura."""
    gltf, blob = read_glb(glb_path)
    prims = _mesh_primitives(gltf, blob, _identity())
    by_material = _material_images(gltf, blob)
    images: list[Image.Image | None] = [by_material.get(prim.get("material_index", 0)) for prim in prims]

    points: list[tuple[float, float, float]] = []
    for prim in prims:
        points.extend(prim["positions"])
    if not points:
        return
    min_y = min(p[1] for p in points)
    max_y = max(p[1] for p in points)
    cx = sum(p[0] for p in points) / len(points)
    cz = sum(p[2] for p in points) / len(points)
    height = max(max_y - min_y, 0.01)
    scale = (size * 0.82) / height

    canvas = Image.new("RGB", (size * 2, size), (18, 20, 27))
    pixels = canvas.load()

    def project(x: float, y: float, z: float, yaw: float, origin_x: int) -> tuple[float, float, float]:
        cos_y = __import__("math").cos(yaw)
        sin_y = __import__("math").sin(yaw)
        rx = (x - cx) * cos_y + (z - cz) * sin_y
        rz = -(x - cx) * sin_y + (z - cz) * cos_y
        sx = origin_x + size / 2 + rx * scale
        sy = size * 0.92 - (y - min_y) * scale
        return sx, sy, rz

    for yaw, origin in ((3.1416, 0), (3.1416 + 0.7, size)):
        zbuf = [1e9] * (size * size)
        tris: list[tuple[float, Any]] = []
        for prim_index, prim in enumerate(prims):
            pos = prim["positions"]
            uvs = prim["uvs"]
            inds = prim["indices"]
            for t in range(0, len(inds) - 2, 3):
                ia, ib, ic = inds[t], inds[t + 1], inds[t + 2]
                pa = project(*pos[ia], yaw, origin)
                pb = project(*pos[ib], yaw, origin)
                pc = project(*pos[ic], yaw, origin)
                depth = (pa[2] + pb[2] + pc[2]) / 3
                tris.append((depth, (prim_index, pa, pb, pc, uvs[ia], uvs[ib], uvs[ic])))
        tris.sort(key=lambda item: item[0], reverse=True)
        for _depth, (prim_index, pa, pb, pc, ua, ub, uc) in tris:
            image = images[prim_index]
            min_x = max(origin, int(min(pa[0], pb[0], pc[0])))
            max_x = min(origin + size - 1, int(max(pa[0], pb[0], pc[0])) + 1)
            min_sy = max(0, int(min(pa[1], pb[1], pc[1])))
            max_sy = min(size - 1, int(max(pa[1], pb[1], pc[1])) + 1)
            area = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pc[0] - pa[0]) * (pb[1] - pa[1])
            if abs(area) < 1e-6:
                continue
            for sy in range(min_sy, max_sy + 1):
                for sx in range(min_x, max_x + 1):
                    w0 = (pb[0] - sx) * (pc[1] - sy) - (pc[0] - sx) * (pb[1] - sy)
                    w1 = (pc[0] - sx) * (pa[1] - sy) - (pa[0] - sx) * (pc[1] - sy)
                    w2 = (pa[0] - sx) * (pb[1] - sy) - (pb[0] - sx) * (pa[1] - sy)
                    if (w0 >= 0 and w1 >= 0 and w2 >= 0) or (w0 <= 0 and w1 <= 0 and w2 <= 0):
                        z = (w0 * pa[2] + w1 * pb[2] + w2 * pc[2]) / area
                        slot = sy * size + (sx - origin)
                        if z >= zbuf[slot]:
                            continue
                        zbuf[slot] = z
                        b0, b1, b2 = w0 / area, w1 / area, w2 / area
                        if image is None:
                            pixels[sx, sy] = (180, 160, 130)
                            continue
                        u = b0 * ua[0] + b1 * ub[0] + b2 * uc[0]
                        v = b0 * ua[1] + b1 * ub[1] + b2 * uc[1]
                        # glTF: V = 0 no topo da imagem.
                        px = int(u * (image.width - 1)) % image.width
                        py = int(v * (image.height - 1)) % image.height
                        pixels[sx, sy] = image.getpixel((px, py))[:3]
    png_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(png_path)


def game_paths() -> tuple[Path, Path, Path]:
    return resolve_game_dir(None), DEFAULT_CACHE_DIR, DEFAULT_CRYBAR
