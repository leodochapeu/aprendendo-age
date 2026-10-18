"""Lê a pose de um .tma (BTMA) do AoM Retold e devolve o esqueleto no espaço do glTF.

A translação da trilha é um deslocamento em relação à pose de bind, no eixo local
do osso. A rotação é um delta que o jogo aplica conjugado. O espelhamento em X
converte a mão esquerda do jogo para o glTF.
"""

from __future__ import annotations

import struct

_INV_SQRT2 = 0.70710678118
_Q64_SCALE = _INV_SQRT2 / 524287.0
_Q32_SCALE = _INV_SQRT2 / 511.0


def pose_worlds(data: bytes, frame: int = 0) -> dict[str, list[list[float]]]:
    """Nome do osso (minúsculo) -> matriz mundo 4x4, já no espaço do GLB."""
    try:
        bones, tracks = _parse(data)
    except (struct.error, UnicodeError, ValueError, IndexError):
        return {}
    if not bones:
        return {}
    locals_ = [_posed_local(bone, tracks.get(bone["name"].lower()), frame) for bone in bones]
    worlds = _worlds(locals_, [bone["parent"] for bone in bones])
    return {bone["name"].lower(): _flip_x(worlds[index]) for index, bone in enumerate(bones)}


def _parse(data: bytes) -> tuple[list[dict], dict[str, tuple]]:
    if data[:4] != b"BTMA":
        raise ValueError("TMA sem assinatura BTMA")
    offset = 8
    if data[offset : offset + 2] == b"DP":
        offset += 2
        block = struct.unpack_from("<i", data, offset)[0]
        offset += 4 + block
    num_tracks = struct.unpack_from("<I", data, offset)[0]
    offset += 12  # tracks, frames, duration
    offset += 24  # bbox
    num_bones = struct.unpack_from("<I", data, offset)[0]
    offset += 8  # bones, controllers
    if num_bones > 2000 or num_tracks > 2000:
        raise ValueError("TMA grande demais")
    bones: list[dict] = []
    for _ in range(num_bones):
        name, offset = _utf16(data, offset)
        parent = struct.unpack_from("<i", data, offset)[0]
        offset += 4
        local, offset = _floats(data, offset, 16)
        offset += 128  # bind pose + inverse bind, 32 floats
        bones.append({"name": name, "parent": parent, "local": _mat_columns(local)})
    tracks: dict[str, tuple] = {}
    for _ in range(num_tracks):
        name, offset = _utf16(data, offset)
        offset += 1  # track version
        translation_enc, rotation_enc, scale_enc = data[offset], data[offset + 1], data[offset + 2]
        offset += 3
        keyframes = struct.unpack_from("<i", data, offset)[0]
        offset += 4
        translation, offset = _block(data, offset, translation_enc)
        rotation, offset = _block(data, offset, rotation_enc)
        _scale, offset = _block(data, offset, scale_enc)
        tracks[name.lower()] = (translation_enc, rotation_enc, keyframes, translation, rotation)
    return bones, tracks


def _utf16(data: bytes, offset: int) -> tuple[str, int]:
    count = struct.unpack_from("<i", data, offset)[0]
    offset += 4
    if count < 0 or count > 5000:
        raise ValueError("nome de osso inválido")
    nbytes = count * 2
    text = data[offset : offset + nbytes].decode("utf-16le").rstrip("\x00")
    return text, offset + nbytes


def _floats(data: bytes, offset: int, count: int) -> tuple[list[float], int]:
    return list(struct.unpack_from("<" + "f" * count, data, offset)), offset + 4 * count


def _block(data: bytes, offset: int, encoding: int) -> tuple[bytes, int]:
    if encoding == 0:
        return data[offset : offset + 16], offset + 16
    size = struct.unpack_from("<i", data, offset)[0]
    offset += 4
    if size < 0 or offset + size > len(data):
        raise ValueError("bloco de trilha inválido")
    return data[offset : offset + size], offset + size


def _mat_columns(vals: list[float]) -> list[list[float]]:
    return [[vals[col * 4 + row] for col in range(4)] for row in range(4)]


def _mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    return [[sum(a[row][k] * b[k][col] for k in range(4)) for col in range(4)] for row in range(4)]


def _flip_x(matrix: list[list[float]]) -> list[list[float]]:
    mirror = [[-1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]]
    return _mul(mirror, _mul(matrix, mirror))


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


def _mat_quat(matrix: list[list[float]]) -> tuple[float, float, float, float]:
    trace = matrix[0][0] + matrix[1][1] + matrix[2][2]
    if trace > 0:
        scale = (trace + 1.0) ** 0.5 * 2
        w = 0.25 * scale
        x = (matrix[2][1] - matrix[1][2]) / scale
        y = (matrix[0][2] - matrix[2][0]) / scale
        z = (matrix[1][0] - matrix[0][1]) / scale
    elif matrix[0][0] > matrix[1][1] and matrix[0][0] > matrix[2][2]:
        scale = (1 + matrix[0][0] - matrix[1][1] - matrix[2][2]) ** 0.5 * 2
        w = (matrix[2][1] - matrix[1][2]) / scale
        x = 0.25 * scale
        y = (matrix[0][1] + matrix[1][0]) / scale
        z = (matrix[0][2] + matrix[2][0]) / scale
    elif matrix[1][1] > matrix[2][2]:
        scale = (1 + matrix[1][1] - matrix[0][0] - matrix[2][2]) ** 0.5 * 2
        w = (matrix[0][2] - matrix[2][0]) / scale
        x = (matrix[0][1] + matrix[1][0]) / scale
        y = 0.25 * scale
        z = (matrix[1][2] + matrix[2][1]) / scale
    else:
        scale = (1 + matrix[2][2] - matrix[0][0] - matrix[1][1]) ** 0.5 * 2
        w = (matrix[1][0] - matrix[0][1]) / scale
        x = (matrix[0][2] + matrix[2][0]) / scale
        y = (matrix[1][2] + matrix[2][1]) / scale
        z = 0.25 * scale
    return (x, y, z, w)


def _qmul(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    )


def _rotate(q: tuple[float, float, float, float], v: tuple[float, float, float]) -> tuple[float, float, float]:
    matrix = _quat_matrix(*q)
    return (
        matrix[0][0] * v[0] + matrix[0][1] * v[1] + matrix[0][2] * v[2],
        matrix[1][0] * v[0] + matrix[1][1] * v[1] + matrix[1][2] * v[2],
        matrix[2][0] * v[0] + matrix[2][1] * v[1] + matrix[2][2] * v[2],
    )


def _sample(track: tuple, frame: int) -> tuple[tuple[float, float, float], tuple[float, float, float, float]]:
    translation_enc, rotation_enc, keyframes, translation, rotation = track
    frame = min(max(frame, 0), max(keyframes - 1, 0))
    if translation_enc == 1 and (frame + 1) * 12 <= len(translation):
        delta_t = struct.unpack_from("<fff", translation, frame * 12)
    elif len(translation) >= 12:
        delta_t = struct.unpack_from("<fff", translation[:12])
    else:
        delta_t = (0.0, 0.0, 0.0)
    if rotation_enc == 3 and (frame + 1) * 8 <= len(rotation):
        delta_q = _smallest(struct.unpack_from("<Q", rotation, frame * 8)[0], 19, _Q64_SCALE, 60, 0xF)
    elif rotation_enc == 2 and (frame + 1) * 4 <= len(rotation):
        delta_q = _smallest(struct.unpack_from("<I", rotation, frame * 4)[0], 9, _Q32_SCALE, 30, 3)
    elif rotation_enc == 1 and (frame + 1) * 16 <= len(rotation):
        delta_q = struct.unpack_from("<ffff", rotation, frame * 16)
    elif len(rotation) >= 16:
        delta_q = struct.unpack_from("<ffff", rotation[:16])
    else:
        delta_q = (0.0, 0.0, 0.0, 1.0)
    return delta_t, delta_q


def _smallest(packed: int, magnitude_bits: int, scale: float, index_shift: int, index_mask: int) -> tuple[float, float, float, float]:
    index = (packed >> index_shift) & index_mask
    if index > 3:
        index = 3
    comps = [0.0, 0.0, 0.0, 0.0]
    bits = packed
    width = magnitude_bits + 1
    for component in (3, 2, 1, 0):
        if component == index:
            continue
        magnitude = bits & ((1 << magnitude_bits) - 1)
        negative = (bits >> magnitude_bits) & 1
        value = magnitude * scale
        comps[component] = -value if negative else value
        bits >>= width
    rest = 1.0 - sum(value * value for value in comps)
    comps[index] = rest ** 0.5 if rest > 0 else 0.0
    return (comps[0], comps[1], comps[2], comps[3])


def _posed_local(bone: dict, track: tuple | None, frame: int) -> list[list[float]]:
    base = bone["local"]
    if track is None:
        return base
    delta_t, delta_q = _sample(track, frame)
    bind_t = (base[0][3], base[1][3], base[2][3])
    bind_q = _mat_quat(base)
    rotated = _rotate(bind_q, delta_t)
    cx, cy, cz, cw = delta_q
    posed_q = _qmul(bind_q, (-cx, -cy, -cz, cw))
    matrix = _quat_matrix(*posed_q)
    matrix[0][3] = bind_t[0] + rotated[0]
    matrix[1][3] = bind_t[1] + rotated[1]
    matrix[2][3] = bind_t[2] + rotated[2]
    return matrix


def _worlds(locals_: list[list[list[float]]], parents: list[int]) -> list[list[list[float]]]:
    worlds: list[list[list[float]] | None] = [None] * len(locals_)

    def world(index: int) -> list[list[float]]:
        cached = worlds[index]
        if cached is not None:
            return cached
        parent = parents[index]
        local = locals_[index]
        worlds[index] = local if parent < 0 else _mul(world(parent), local)
        return worlds[index]

    for index in range(len(locals_)):
        world(index)
    return [item for item in worlds if item is not None]
