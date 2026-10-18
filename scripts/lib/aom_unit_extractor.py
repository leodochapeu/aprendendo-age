from __future__ import annotations

import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from aom_proto_maps import (
    ARMOR_TYPE_FIELD,
    DAMAGE_BONUS_TYPE_PT,
    DAMAGE_TYPE_FIELD,
    ERA_FROM_TOKEN,
    PANTHEON_FROM_PATH,
    PANTHEON_TEMPLE_NOME,
    SECONDARY_TEMPLE_PROTOS,
    UNIT_TYPE_ICON,
)
from aom_string_table import parse_string_table
from aom_game_paths import BAR_ENTRIES
from aom_unit_abilities import (
    extract_unit_texts_and_abilities,
    index_ability_name_ids,
    parse_protounit_commands,
)

MILITARY_UNIT_TYPES = {
    "MilitaryUnit",
    "AbstractInfantry",
    "AbstractArcher",
    "AbstractCavalry",
    "HumanSoldier",
    "Ranged",
    "LogicalTypeMeleeInfantry",
    "LogicalTypeLandMilitary",
    "Hero",
    "AbstractHero",
    "MythUnit",
    "AbstractMythUnit",
}

PRIMARY_ROLE_TYPES = [
    ("AbstractInfantry", "Infantaria"),
    ("LogicalTypeMeleeInfantry", "Infantaria"),
    # Navais antes de Ranged/Artilharia — barcos flecheiros carregam Ranged no proto.
    ("AbstractArcherShip", "Flecheiro"),
    ("AbstractCloseCombatShip", "Combate curto-alcance"),
    ("AbstractSiegeShip", "Navio-cerco"),
    ("AbstractShip", "Navio"),
    ("AbstractArcher", "Artilharia"),
    ("Ranged", "Artilharia"),
    ("AbstractCavalry", "Cavalaria"),
    ("AbstractSiegeWeapon", "Cerco"),
    ("AbstractMythUnit", "Unidade mítica"),
    ("MythUnit", "Unidade mítica"),
    ("Hero", "Herói"),
    ("AbstractHero", "Herói"),
    ("Villager", "Aldeão"),
]

MYTH_UNIT_TYPE = "Unidade mítica"
HERO_UNIT_TYPE = "Herói"

# Tipos do proto que definem uma unidade mítica. No jogo, uma unidade mítica de
# ataque à distância também carrega `Ranged`/`AbstractArcher`, então o papel de
# combate (Artilharia) precisa conviver com a classificação "Unidade mítica".
MYTH_UNIT_TOKENS = ("AbstractMythUnit", "MythUnit")

# Idem para heróis: Hersir, Godi e conversões atlantes `(Herói)` também têm
# Infantaria/Artilharia/Cavalaria no proto e precisam manter ambas as tags.
HERO_UNIT_TOKENS = ("Hero", "AbstractHero")


def _text(node: ET.Element | None, tag: str, default: str = "") -> str:
    if node is None:
        return default
    child = node.find(tag)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def _float(value: str | None, default: float = 0.0) -> float:
    if not value:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def detect_pantheon(unit: ET.Element) -> dict[str, Any] | None:
    for field in ("icon", "animfile", "soundsetfile"):
        raw = _text(unit, field).lower().replace("/", "\\")
        for key, meta in PANTHEON_FROM_PATH.items():
            if f"\\{key}\\" in raw or raw.startswith(f"{key}\\"):
                return meta
    return None


def detect_primary_role(unit_types: set[str]) -> str | None:
    for token, label in PRIMARY_ROLE_TYPES:
        if token in unit_types:
            return label
    return None


SHIP_SUBTYPE_ROLES = frozenset(
    {"Flecheiro", "Combate curto-alcance", "Navio-cerco"}
)


def detect_roles(unit_types: set[str]) -> list[str]:
    """Papel de combate principal + classificações mítica/herói quando aplicável.

    Unidades míticas de ataque à distância (ex.: Centauro, Qilin, Troll, Draugr,
    Wadjet) e heróis com papel humano (ex.: Hersir, Godi, Murmilo (Herói))
    mantêm o papel de combate e ganham também a classificação secundária.

    Navios militares: Navio + subtipo (Flecheiro / Combate curto-alcance / Navio-cerco).
    """
    roles: list[str] = []
    primary = detect_primary_role(unit_types)
    if primary in SHIP_SUBTYPE_ROLES:
        roles.append("Navio")
        roles.append(primary)
    elif primary:
        roles.append(primary)

    is_myth = any(token in unit_types for token in MYTH_UNIT_TOKENS)
    if is_myth and MYTH_UNIT_TYPE not in roles:
        roles.append(MYTH_UNIT_TYPE)

    is_hero = any(token in unit_types for token in HERO_UNIT_TOKENS)
    if is_hero and HERO_UNIT_TYPE not in roles:
        roles.append(HERO_UNIT_TYPE)

    return roles


def icon_token_from_path(icon_path: str) -> str:
    base = Path(icon_path.replace("\\", "/")).name
    stem = re.sub(r"_icon\.(png|webp|jpg)$", "", base, flags=re.I)
    stem = re.sub(r"[^a-z0-9]+", "_", stem.lower()).strip("_")
    return f"aomr_{stem}_icon" if stem else ""


UNIT_ICON_TOKEN_OVERRIDES = {
    # Alguns caminhos internos do jogo não correspondem aos nomes dos assets públicos.
    "aomr_einheri_icon": "aomr_einherjar_icon",
    "aomr_hades_shade_icon": "aomr_shade_of_hades_icon",
    "aomr_harpy_icon": "aomr_harpy_demeter_icon",
    "aomr_quimchin_spy_icon": "aomr_quimchim_spy_icon",
    "aomr_warrior_priest_icon": "aomr_warrior_priest_hero_icon",
    "aomr_otontin_icon": "aomr_medium_otontin_smasher_icon",
    "aomr_shorn_one_icon": "aomr_medium_shorn_one_icon",
}


def unit_icon_token(icon_path: str) -> str:
    token = icon_token_from_path(icon_path)
    return UNIT_ICON_TOKEN_OVERRIDES.get(token, token)


def is_alt_temple(proto: str) -> bool:
    return proto != "Temple" and (
        proto in SECONDARY_TEMPLE_PROTOS or proto.startswith("Temple")
    )


def filter_trainer_buildings(trainer_protos: list[str]) -> list[str]:
    if not trainer_protos:
        return []

    if "Temple" in trainer_protos:
        non_temple = [
            proto
            for proto in trainer_protos
            if proto != "Temple"
            and proto not in SECONDARY_TEMPLE_PROTOS
            and not is_alt_temple(proto)
        ]
        return non_temple + ["Temple"]

    return [
        proto
        for proto in trainer_protos
        if proto not in SECONDARY_TEMPLE_PROTOS and not is_alt_temple(proto)
    ]


def resolve_building_display_name(
    building_proto: str,
    pantheon: dict[str, Any] | None,
    building_names: dict[str, str],
) -> str:
    if building_proto == "Temple" and pantheon:
        return PANTHEON_TEMPLE_NOME.get(
            pantheon["id"],
            building_names.get("Temple", "Templo"),
        )
    return building_names.get(building_proto, building_proto)


def parse_proto_units(proto_path: Path) -> dict[str, ET.Element]:
    tree = ET.parse(proto_path)
    root = tree.getroot()
    units: dict[str, ET.Element] = {}
    for unit in root.findall("unit"):
        name = unit.get("name")
        if name:
            units[name] = unit
    return units


def parse_trainers(proto_units: dict[str, ET.Element]) -> dict[str, list[str]]:
    trainers: dict[str, list[str]] = {}
    for building_name, building in proto_units.items():
        unit_types = {node.text.strip() for node in building.findall("unittype") if node.text}
        if "Building" not in unit_types:
            continue
        for train in building.findall("train"):
            if train.text:
                trainers.setdefault(train.text.strip(), []).append(building_name)
    return trainers


def parse_age_enables(techtree_path: Path) -> dict[str, list[str]]:
    tree = ET.parse(techtree_path)
    enables: dict[str, list[str]] = {}
    for tech in tree.getroot().findall("tech"):
        flags = {node.text.strip() for node in tech.findall("flag") if node.text}
        if "AgeTech" not in flags:
            continue
        tech_name = tech.get("name", "")
        age_match = re.match(r"^(Archaic|Classical|Heroic|Mythic|Titan)Age", tech_name)
        if not age_match:
            continue
        age_label = age_match.group(1)
        for effect in tech.findall("./effects/effect"):
            if effect.get("type") != "Data":
                continue
            if effect.get("subtype") != "Enable":
                continue
            target = effect.find("target")
            if target is None or target.get("type") != "ProtoUnit":
                continue
            if target.text:
                enables.setdefault(target.text.strip(), []).append(age_label)
    return enables


def _element_amount(node: ET.Element) -> float:
    if node.get("value") is not None:
        return _float(node.get("value"))
    return _float(node.text)


def parse_attack(unit: ET.Element) -> dict[str, Any]:
    best: dict[str, Any] = {}
    for action in unit.findall("protoaction"):
        action_name = _text(action, "name")
        if action_name not in {"HandAttack", "RangedAttack", "SiegeAttack", "ShipAttack"}:
            continue
        rof = _float(_text(action, "rof"), 1.0)
        damages: dict[str, float] = {}
        for dmg in action.findall("damage"):
            dtype = dmg.get("type")
            if dtype:
                damages[dtype] = _element_amount(dmg)
        bonuses = []
        for bonus in action.findall("damagebonus"):
            btype = bonus.get("type", "")
            bonuses.append(
                {
                    "type": DAMAGE_BONUS_TYPE_PT.get(btype, btype),
                    "proto_type": btype,
                    "icon": UNIT_TYPE_ICON.get(
                        DAMAGE_BONUS_TYPE_PT.get(btype, ""), ""
                    ),
                    "value": _element_amount(bonus),
                }
            )
        candidate = {
            "action": action_name,
            "rof": rof,
            "damages": damages,
            "bonuses": bonuses,
            "maxrange": _float(_text(action, "maxrange")),
        }
        if not best or sum(candidate["damages"].values()) >= sum(best["damages"].values()):
            best = candidate
    return best


def parse_costs(unit: ET.Element) -> dict[str, float]:
    costs = {"comida": 0.0, "madeira": 0.0, "ouro": 0.0, "favor": 0.0}
    mapping = {
        "Food": "comida",
        "Wood": "madeira",
        "Gold": "ouro",
        "Favor": "favor",
    }
    for cost in unit.findall("cost"):
        key = mapping.get(cost.get("resourcetype", ""), "")
        if key:
            costs[key] = _element_amount(cost)
    return costs


def parse_armor(unit: ET.Element) -> dict[str, float]:
    armor: dict[str, float] = {}
    for node in unit.findall("armor"):
        field = ARMOR_TYPE_FIELD.get(node.get("type", ""), "")
        if field:
            armor[field] = round(_element_amount(node) * 100, 2)
    return armor


def is_exportable_unit(unit: ET.Element) -> bool:
    unit_types = {node.text.strip() for node in unit.findall("unittype") if node.text}
    if "Unit" not in unit_types:
        return False
    if "Building" in unit_types or "Wall" in unit_types:
        return False
    if unit_types & MILITARY_UNIT_TYPES:
        return True
    if "Villager" in unit_types and _float(_text(unit, "maxhitpoints")) > 0:
        return True
    return False


def format_era(age_token: str) -> dict[str, Any]:
    meta = ERA_FROM_TOKEN[age_token]
    return {
        "token": age_token,
        "id": meta["id"],
        "nome": f"{meta['nome']} :{meta['icon']}:",
    }


def format_pantheon(meta: dict[str, Any]) -> list[dict[str, Any]]:
    return [{"id": meta["id"], "nome": f"{meta['nome']} :{meta['icon']}:"}]


def format_tipo(roles: str | list[str] | None) -> list[dict[str, str]]:
    if not roles:
        return []
    if isinstance(roles, str):
        roles = [roles]
    return [
        {"type": role, "icon": UNIT_TYPE_ICON.get(role, "")}
        for role in roles
        if role
    ]


def format_multiplicador(bonuses: list[dict[str, Any]]) -> list[dict[str, str]]:
    out = []
    for bonus in bonuses:
        value = bonus.get("value")
        if value in (None, "", 0):
            continue
        text = str(value)
        if isinstance(value, float):
            text = f"{value:g}"
        out.append(
            {
                "type": bonus["type"],
                "icon": bonus.get("icon", ""),
                "value": text,
            }
        )
    return out


def extract_unit_record(
    name: str,
    unit: ET.Element,
    *,
    strings_en: dict[str, str],
    strings_pt: dict[str, str],
    trainers: dict[str, list[str]],
    age_enables: dict[str, list[str]],
    building_names_pt: dict[str, str],
    ability_name_ids: set[str] | None = None,
    commands_by_name: dict[str, dict[str, str]] | None = None,
) -> dict[str, Any]:
    unit_types = {node.text.strip() for node in unit.findall("unittype") if node.text}
    pantheon = detect_pantheon(unit)
    roles = detect_roles(unit_types)
    attack = parse_attack(unit)
    costs = parse_costs(unit)
    armor = parse_armor(unit)
    hp = _float(_text(unit, "maxhitpoints"))
    rof = attack.get("rof", 0.0)
    primary_damage = 0.0
    primary_damage_field = ""
    for dtype, amount in attack.get("damages", {}).items():
        field = DAMAGE_TYPE_FIELD.get(dtype)
        if field and amount > 0:
            primary_damage = amount
            primary_damage_field = field
            break
    dps = round(primary_damage * rof, 4) if rof else primary_damage

    display_id = _text(unit, "displaynameid")
    nome_pt = strings_pt.get(display_id, name)
    nome_en = strings_en.get(display_id, name)

    ages = age_enables.get(name, [])
    era = format_era(ages[0]) if ages else None

    trainer_buildings = filter_trainer_buildings(trainers.get(name, []))
    construcao = []
    for building_proto in trainer_buildings:
        display = resolve_building_display_name(
            building_proto,
            pantheon,
            building_names_pt,
        )
        construcao.append({"proto": building_proto, "nome": display})

    record: dict[str, Any] = {
        "proto_name": name,
        "nome": nome_pt,
        "ingles": nome_en,
        "displaynameid": display_id,
        "tipo": format_tipo(roles),
        "panteao": format_pantheon(pantheon) if pantheon else [],
        "era": [era] if era else [],
        "multiplicador": format_multiplicador(attack.get("bonuses", [])),
        "pontos_de_vida": int(hp) if hp.is_integer() else hp,
        "velocidade_de_ataque_atk_s": rof,
        "dps": dps,
        "comida": int(costs["comida"]) if costs["comida"].is_integer() else costs["comida"],
        "madeira": int(costs["madeira"]) if costs["madeira"].is_integer() else costs["madeira"],
        "ouro": int(costs["ouro"]) if costs["ouro"].is_integer() else costs["ouro"],
        "favor": int(costs["favor"]) if costs["favor"].is_integer() else costs["favor"],
        "custo_total": int(sum(costs.values())) if sum(costs.values()).is_integer() else sum(costs.values()),
        "populacao": int(_float(_text(unit, "populationcount"))),
        "tempo_treinamento": _float(_text(unit, "trainpoints")),
        "velocidade_movimento": _float(_text(unit, "maxvelocity")),
        "construcao": construcao,
        "icon": unit_icon_token(_text(unit, "icon")),
        "unit_types": sorted(unit_types),
        "attack_action": attack.get("action", ""),
        "max_range": attack.get("maxrange", 0.0),
    }
    texts = extract_unit_texts_and_abilities(
        name,
        unit,
        strings_pt=strings_pt,
        strings_en=strings_en,
        ability_name_ids=ability_name_ids or set(),
        commands_by_name=commands_by_name or {},
    )
    record.update(texts)
    # aliases legados
    record["descricao_curta_pt"] = texts.get("descricao_resumida_pt", "")
    record["descricao_curta_en"] = texts.get("descricao_resumida_en", "")
    if primary_damage_field:
        record[primary_damage_field] = primary_damage
    record.update(armor)
    return record


def load_building_name_map(construcoes_path: Path) -> dict[str, str]:
    if not construcoes_path.exists():
        return {}
    data = json.loads(construcoes_path.read_text(encoding="utf-8"))
    mapping: dict[str, str] = {}
    for row in data:
        english = row.get("ingles")
        nome = row.get("nome")
        if english and nome:
            mapping.setdefault(english.replace(" ", ""), nome)
            mapping.setdefault(english, nome)
    proto_aliases = {
        "MilitaryAcademy": "Military Academy",
        "ArcheryRange": "Archery Range",
        "Dock": "Dock",
        "Temple": "Temple",
        "Fortress": "Fortress",
        "Armory": "Armory",
        "Market": "Market",
        "House": "House",
        "Stable": "Stable",
        "Barracks": "Barracks",
        "SiegeWorks": "Siege Works",
        "Palace": "Palace",
        "MigdolStronghold": "Migdol Stronghold",
        "Longhouse": "Longhouse",
        "Manor": "Manor",
        "Shrine": "Shrine",
        "WarCamp": "War Camp",
        "MachineWorkshop": "Machine Workshop",
    }
    for proto, english in proto_aliases.items():
        if english in mapping:
            mapping.setdefault(proto, mapping[english])
    mapping.setdefault("MilitaryAcademy", "Academia Militar")
    mapping.setdefault("ArcheryRange", "Campo de Arqueiros")
    mapping.setdefault("Stable", "Estábulo")
    return mapping


def extract_units(
    cache_dir: Path,
    *,
    only_unit: str | None = None,
    construcoes_path: Path | None = None,
) -> list[dict[str, Any]]:
    proto_path = cache_dir / "gameplay" / "proto.xml"
    techtree_path = cache_dir / "gameplay" / "techtree.xml"
    strings_en_path = cache_dir / "strings" / "English" / "string_table.txt"
    strings_pt_path = cache_dir / "strings" / "PortugueseBrazil" / "string_table.txt"

    for required in (proto_path, techtree_path, strings_en_path, strings_pt_path):
        if not required.exists():
            raise FileNotFoundError(f"Arquivo ausente: {required}. Rode a extração do Data.bar primeiro.")

    strings_en = parse_string_table(strings_en_path)
    strings_pt = parse_string_table(strings_pt_path)
    proto_units = parse_proto_units(proto_path)
    trainers = parse_trainers(proto_units)
    age_enables = parse_age_enables(techtree_path)
    building_names = load_building_name_map(construcoes_path or Path())
    ability_name_ids = index_ability_name_ids(strings_en)
    commands_by_name = parse_protounit_commands(cache_dir / "gameplay" / "proto_unit_commands.xml")

    records: list[dict[str, Any]] = []
    for name, unit in sorted(proto_units.items()):
        if only_unit and name.lower() != only_unit.lower():
            continue
        if only_unit or is_exportable_unit(unit):
            records.append(
                extract_unit_record(
                    name,
                    unit,
                    strings_en=strings_en,
                    strings_pt=strings_pt,
                    trainers=trainers,
                    age_enables=age_enables,
                    building_names_pt=building_names,
                    ability_name_ids=ability_name_ids,
                    commands_by_name=commands_by_name,
                )
            )
    return records


def ensure_bar_extracted(
    *,
    game_dir: Path,
    cache_dir: Path,
    crybar_exe: Path,
    force: bool = False,
) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    marker = cache_dir / ".extracted.json"
    data_bar = game_dir / "game" / "data" / "Data.bar"
    if not data_bar.exists():
        raise FileNotFoundError(f"Data.bar não encontrado em {data_bar}")

    expected_files = [
        cache_dir / Path(entry.replace(".XMB", ""))
        for entry in BAR_ENTRIES
    ]
    if not force and all(path.exists() for path in expected_files):
        return

    if not crybar_exe.exists():
        raise FileNotFoundError(
            f"crybar.exe não encontrado em {crybar_exe}. "
            "Baixe CryBar.Cli em https://github.com/CryShana/CryBarEditor/releases "
            "e extraia para aprendendo-age/tools/crybar/cli/crybar.exe"
        )

    cmd = [
        str(crybar_exe),
        "bar",
        "export",
        str(data_bar),
        *BAR_ENTRIES,
        "-o",
        str(cache_dir),
        "--decompress",
        "--convert",
    ]
    subprocess.run(cmd, check=True)
    marker.write_text(
        json.dumps(
            {"data_bar": str(data_bar), "entries": len(BAR_ENTRIES)},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
