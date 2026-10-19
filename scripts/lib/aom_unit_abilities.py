"""Extrai descrições (SR/LR) e habilidades de unidades a partir de strings + proto."""
from __future__ import annotations

import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_game_paths import DEFAULT_CRYBAR, DEFAULT_GAME_DIR, UI_TEXTURE_CACHE_BAR, resolve_game_dir

# Protoactions genéricos de combate — não são habilidades de unidade.
SKIP_PROTOACTION_NAMES = frozenset(
    {
        "HandAttack",
        "RangedAttack",
        "ChargedRangedAttack",
        "ChargedHandAttack",
        "BuildingAttack",
        "BuckAttack",
        "Heal",
        "Convert",
        "Pickup",
        "Dropoff",
        "Gather",
        "Build",
        "Repair",
        "AutoGather",
    }
)

SACRED_HANDS_ID = "STR_ABILITY_SACRED_HANDS"
SACRED_HANDS_LR = "STR_ABILITY_SACRED_HANDS_LR"

SKIP_ABILITY_KEY_PARTS = (
    "NOTIFICATION",
    "BUSHIDO",
    "AMBUSH_ATTACK_HIDDEN",
    "AMBUSH_ATTACK_OPEN",
)


def camel_to_snake_upper(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).upper()


def clean_game_string(text: str) -> str:
    if not text:
        return ""
    # Remove markup de ícone do jogo: <icon="(22)(...)">
    text = re.sub(r'<icon\s*=\s*"[^"]*"\s*/?>', "", text, flags=re.I)
    text = text.replace('\\"', '"').replace("\\n", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def ability_base_keys(proto_name: str) -> list[str]:
    snake = camel_to_snake_upper(proto_name)
    keys = [
        f"STR_ABILITY_{snake}",
        f"STR_ABILITY_{proto_name.upper()}",
    ]
    # OracleHero → ORACLE; MurmilloHero → MURMILLO (raro ter habilidade no herói base)
    if proto_name.endswith("Hero") and len(proto_name) > 4:
        base = proto_name[: -len("Hero")]
        keys.append(f"STR_ABILITY_{camel_to_snake_upper(base)}")
    # dedupe
    out: list[str] = []
    seen: set[str] = set()
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out


def collect_ability_string_ids(
    proto_name: str,
    unit: ET.Element,
    ability_name_ids: set[str],
) -> list[str]:
    """IDs STR_ABILITY_* associados à unidade (ordem estável)."""
    found: list[str] = []
    seen: set[str] = set()

    def add(sid: str) -> None:
        if not sid or sid in seen:
            return
        if not sid.startswith("STR_ABILITY_"):
            return
        if any(part in sid for part in SKIP_ABILITY_KEY_PARTS):
            return
        if sid.endswith("_LR"):
            return
        if sid not in ability_name_ids:
            return
        seen.add(sid)
        found.append(sid)

    # 1) stringid em protoactions
    for pa in unit.findall("protoaction"):
        name_el = pa.find("name")
        if name_el is None:
            continue
        sid = (name_el.get("stringid") or "").strip()
        if sid:
            add(sid)

    # 2) chave exata + prefixo STR_ABILITY_{PROTO}_*
    for base in ability_base_keys(proto_name):
        add(base)
        prefix = base + "_"
        for sid in sorted(ability_name_ids):
            if sid.startswith(prefix):
                add(sid)

    return found


def icon_token_from_path(icon_path: str) -> str:
    """resources\\...\\lykaon_feral_surge_ability_icon.png → aomr_lykaon_feral_surge_ability_icon"""
    if not icon_path:
        return ""
    base = icon_path.replace("\\", "/").split("/")[-1]
    stem = re.sub(r"\.(png|webp|jpg|dds)$", "", base, flags=re.I)
    stem = re.sub(r"[^a-z0-9]+", "_", stem.lower()).strip("_")
    if not stem:
        return ""
    if not stem.startswith("aomr_"):
        stem = f"aomr_{stem}"
    return stem


def _compact_ability_key(value: str) -> str:
    cleaned = value.lower().replace("ability", "").replace("icon", "")
    return re.sub(r"[^a-z0-9]", "", cleaned)


def load_ability_icon_index(
    *,
    cache_dir: Path | None = None,
    game_dir: Path | str | None = None,
    crybar_exe: Path | None = None,
    refresh: bool = False,
) -> dict[str, str]:
    """stem → caminho .png no UITextureCache (ex.: einheri_ability_icon → resources/.../einheri_ability_icon.png)."""
    cache_file = (cache_dir / "ability_icon_paths.json") if cache_dir else None
    if cache_file and cache_file.exists() and not refresh:
        try:
            data = json.loads(cache_file.read_text(encoding="utf-8"))
            if isinstance(data, dict) and data:
                return {str(k): str(v) for k, v in data.items()}
        except (OSError, json.JSONDecodeError):
            pass

    game = resolve_game_dir(str(game_dir) if game_dir else str(DEFAULT_GAME_DIR))
    crybar = Path(crybar_exe) if crybar_exe else DEFAULT_CRYBAR
    bar = game / UI_TEXTURE_CACHE_BAR
    if not crybar.exists() or not bar.exists():
        return {}

    result = subprocess.run(
        [str(crybar), "bar", "list", str(bar), "--json", "--filter", "**/abilities/**"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        return {}

    try:
        entries = json.loads(result.stdout or "[]")
    except json.JSONDecodeError:
        return {}

    index: dict[str, str] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        path = str(entry.get("Path") or "").replace("\\", "/")
        if not path:
            continue
        stem = Path(path).stem.lower()
        if path.lower().endswith(".dds"):
            path = path[:-4] + ".png"
        index[stem] = path

    if cache_file and index:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(
            json.dumps(index, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return index


def resolve_ability_icon_path(
    sid: str,
    proto_name: str,
    icon_index: dict[str, str],
) -> str:
    """Resolve caminho de ícone para um STR_ABILITY_* a partir do índice do texture bar."""
    if not icon_index or not sid:
        return ""
    key = sid.removeprefix("STR_ABILITY_").lower()
    proto_key = camel_to_snake_upper(proto_name).lower() if proto_name else ""
    candidates: list[str] = [f"{key}_ability_icon", f"{key}_ability", key]
    parts = key.split("_")
    if len(parts) >= 2:
        candidates.append("_".join(parts[:-1]) + "_ability_" + parts[-1] + "_icon")
        candidates.append("_".join(parts[:-1]) + "_ability_" + parts[-1])
    if proto_key and key.startswith(proto_key + "_"):
        rest = key[len(proto_key) + 1 :]
        candidates.append(f"{proto_key}_ability_{rest}_icon")
    if proto_key:
        candidates.append(f"{proto_key}_ability_icon")

    for cand in candidates:
        if cand in icon_index:
            return icon_index[cand]

    by_compact: dict[str, str] = {}
    for stem, path in icon_index.items():
        by_compact.setdefault(_compact_ability_key(stem), path)
    for probe in (key, proto_key):
        if probe and _compact_ability_key(probe) in by_compact:
            return by_compact[_compact_ability_key(probe)]
    return ""


def unit_is_hero(unit: ET.Element) -> bool:
    types = {node.text.strip() for node in unit.findall("unittype") if node.text}
    return "Hero" in types


def parse_protounit_commands(path: Path) -> dict[str, dict[str, str]]:
    """name → {icon, displaynameid, rollovertextid, shortrollovertextid}"""
    if not path.exists():
        return {}
    tree = ET.parse(path)
    out: dict[str, dict[str, str]] = {}
    for node in tree.getroot().findall("protounitcommand"):
        name_el = node.find("name")
        if name_el is None or not name_el.text:
            continue
        name = name_el.text.strip()

        def t(tag: str) -> str:
            child = node.find(tag)
            return (child.text or "").strip() if child is not None else ""

        out[name] = {
            "icon": t("icon"),
            "displaynameid": t("displaynameid"),
            "rollovertextid": t("rollovertextid"),
            "shortrollovertextid": t("shortrollovertextid"),
        }
    return out


def commands_for_unit(
    proto_name: str,
    unit: ET.Element,
    commands_by_name: dict[str, dict[str, str]],
) -> list[tuple[str, dict[str, str]]]:
    """Comandos da unidade + comandos cujo nome começa com o proto (ex.: LykaonVillagerToWolf)."""
    result: list[tuple[str, dict[str, str]]] = []
    seen: set[str] = set()

    def add(cmd_name: str) -> None:
        if cmd_name in seen:
            return
        meta = commands_by_name.get(cmd_name)
        if not meta:
            return
        seen.add(cmd_name)
        result.append((cmd_name, meta))

    for cmd in unit.findall("command"):
        if cmd.text:
            add(cmd.text.strip())

    for cmd_name in commands_by_name:
        if cmd_name.startswith(proto_name) and (
            "To" in cmd_name or cmd_name.lower().endswith("ability") or "Ability" in cmd_name
        ):
            add(cmd_name)
        # LykaonVillagerToWolf / LykaonWolfToVillager
        if proto_name in cmd_name and cmd_name != proto_name:
            dn = commands_by_name[cmd_name].get("displaynameid", "")
            if dn.startswith("STR_ABILITY_"):
                add(cmd_name)

    return result


def build_habilidades(
    proto_name: str,
    unit: ET.Element,
    *,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    ability_name_ids: set[str],
    commands_by_name: dict[str, dict[str, str]],
    ability_icon_index: dict[str, str] | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Retorna (habilidades_pt, habilidades_en)."""
    pt_list: list[dict[str, str]] = []
    en_list: list[dict[str, str]] = []
    seen_names: set[str] = set()
    icon_index = ability_icon_index or {}

    def icon_for_sid(sid: str, fallback_path: str = "") -> str:
        if fallback_path:
            token = icon_token_from_path(fallback_path)
            if token:
                return token
        path = resolve_ability_icon_path(sid, proto_name, icon_index)
        return icon_token_from_path(path) if path else ""

    def push(nome_pt: str, nome_en: str, desc_pt: str, desc_en: str, icon: str) -> None:
        nome_pt = clean_game_string(nome_pt)
        nome_en = clean_game_string(nome_en)
        desc_pt = clean_game_string(desc_pt)
        desc_en = clean_game_string(desc_en)
        if not nome_pt and not nome_en:
            return
        key = (nome_en or nome_pt).casefold()
        if key in seen_names:
            return
        seen_names.add(key)
        row_pt: dict[str, str] = {"nome": nome_pt or nome_en}
        row_en: dict[str, str] = {"nome": nome_en or nome_pt}
        if desc_pt or desc_en:
            row_pt["descricao"] = desc_pt or desc_en
            row_en["descricao"] = desc_en or desc_pt
        if icon:
            row_pt["icon"] = icon
            row_en["icon"] = icon
        pt_list.append(row_pt)
        en_list.append(row_en)

    # Comandos com STR_ABILITY (Lykaon etc.) — prioridade (têm ícone)
    for _cmd_name, meta in commands_for_unit(proto_name, unit, commands_by_name):
        dn = meta.get("displaynameid") or ""
        lr = meta.get("rollovertextid") or ""
        if not dn.startswith("STR_ABILITY_"):
            continue
        icon = icon_for_sid(dn, meta.get("icon", ""))
        push(
            strings_pt.get(dn, strings_en.get(dn, "")),
            strings_en.get(dn, ""),
            strings_pt.get(lr, strings_en.get(lr, "")) if lr else "",
            strings_en.get(lr, "") if lr else "",
            icon,
        )

    for sid in collect_ability_string_ids(proto_name, unit, ability_name_ids):
        lr = sid + "_LR"
        push(
            strings_pt.get(sid, strings_en.get(sid, "")),
            strings_en.get(sid, ""),
            strings_pt.get(lr, strings_en.get(lr, "")),
            strings_en.get(lr, ""),
            icon_for_sid(sid),
        )

    # Heróis: Mãos Sagradas (pegar relíquias)
    if unit_is_hero(unit) and SACRED_HANDS_ID in ability_name_ids:
        push(
            strings_pt.get(SACRED_HANDS_ID, strings_en.get(SACRED_HANDS_ID, "")),
            strings_en.get(SACRED_HANDS_ID, ""),
            strings_pt.get(SACRED_HANDS_LR, strings_en.get(SACRED_HANDS_LR, "")),
            strings_en.get(SACRED_HANDS_LR, ""),
            icon_for_sid(SACRED_HANDS_ID),
        )

    return pt_list, en_list


def history_string_candidates(proto_name: str) -> list[str]:
    """Possíveis IDs STR_HISTORY_UNITS_* para um proto."""
    if not proto_name:
        return []
    bases = [proto_name]
    for suffix in (
        "Villager",
        "Wolf",
        "Hero",
        "Child",
        "Youth",
        "Classical",
        "Archaic",
        "Heroic",
        "Mythic",
        "Starting",
    ):
        if proto_name.endswith(suffix) and len(proto_name) > len(suffix):
            bases.append(proto_name[: -len(suffix)])

    # Titãs com ID de história próprio / por panteão
    if proto_name.startswith("Titan") and len(proto_name) > 5:
        pantheon_map = {
            "TitanAtlantean": "TitanAtlantean",
            "TitanXingTian": "TitanChinese",
            "TitanYamataNoOrochi": "TitanYamataNoOrochi",
            "TitanCipactli": "TitanAztec",
        }
        mapped = pantheon_map.get(proto_name)
        if mapped:
            bases.append(mapped)

    keys: list[str] = []
    seen: set[str] = set()
    for base in bases:
        for form in (base.upper(), camel_to_snake_upper(base), re.sub(r"[^A-Za-z0-9]", "", base).upper()):
            sid = f"STR_HISTORY_UNITS_{form}"
            if sid not in seen:
                seen.add(sid)
                keys.append(sid)
    return keys


def resolve_history_text(
    proto_name: str,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
) -> tuple[str, str]:
    for sid in history_string_candidates(proto_name):
        en = clean_game_string(strings_en.get(sid, ""))
        if not en:
            continue
        pt = clean_game_string(strings_pt.get(sid, en))
        return pt, en
    return "", ""


def extract_unit_texts_and_abilities(
    proto_name: str,
    unit: ET.Element,
    *,
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    ability_name_ids: set[str],
    commands_by_name: dict[str, dict[str, str]],
    ability_icon_index: dict[str, str] | None = None,
) -> dict[str, Any]:
    sr_id = _child_text(unit, "shortrollovertextid")
    lr_id = _child_text(unit, "rollovertextid")
    sr_pt = clean_game_string(strings_pt.get(sr_id, strings_en.get(sr_id, "")))
    sr_en = clean_game_string(strings_en.get(sr_id, ""))
    lr_pt = clean_game_string(strings_pt.get(lr_id, strings_en.get(lr_id, "")))
    lr_en = clean_game_string(strings_en.get(lr_id, ""))

    hab_pt, hab_en = build_habilidades(
        proto_name,
        unit,
        strings_pt=strings_pt,
        strings_en=strings_en,
        ability_name_ids=ability_name_ids,
        commands_by_name=commands_by_name,
        ability_icon_index=ability_icon_index,
    )
    hist_pt, hist_en = resolve_history_text(proto_name, strings_pt, strings_en)

    return {
        "descricao_resumida_pt": sr_pt,
        "descricao_resumida_en": sr_en,
        "descricao_avancada_pt": lr_pt,
        "descricao_avancada_en": lr_en,
        "habilidades_pt": hab_pt,
        "habilidades_en": hab_en,
        "historia_pt": hist_pt,
        "historia_en": hist_en,
    }


def _child_text(unit: ET.Element, tag: str) -> str:
    child = unit.find(tag)
    if child is None or child.text is None:
        return ""
    return child.text.strip()


def index_ability_name_ids(strings: dict[str, str]) -> set[str]:
    return {
        k
        for k in strings
        if k.startswith("STR_ABILITY_")
        and not k.endswith("_LR")
        and not any(part in k for part in SKIP_ABILITY_KEY_PARTS)
    }
