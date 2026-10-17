"""
Gera o campo editorial `beneficia` a partir dos efeitos do techtree.

Padrão observado no catálogo:
  :icone: <highlight-COR>Nome</highlight-COR> (:attr1::attr2:)
  :icone1: <highlight-COR>A</highlight-COR>+:icone2: <highlight-COR>B</highlight-COR> (:attrs:)
  <highlight-orange>+Dano</highlight-orange>   (armas genéricas)
  <highlight-brown>:hackarmor:</highlight-brown><highlight-brown>Anti-cortante</highlight-brown>
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from collections import OrderedDict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from aom_proto_maps import UNIT_TYPE_ICON
from aom_string_table import parse_string_table
from aom_tech_extractor import is_exportable_tech
from aom_unit_extractor import icon_token_from_path, unit_icon_token

# --- categorias abstratas -------------------------------------------------

ABSTRACT_SUBJECTS: dict[str, dict[str, str]] = {
    "AbstractInfantry": {
        "pt": "Infantaria",
        "en": "Infantry",
        "icon": "aomr_type_infantry_icon",
        "color": "red",
    },
    "LogicalTypeMeleeInfantry": {
        "pt": "Infantaria",
        "en": "Infantry",
        "icon": "aomr_type_infantry_icon",
        "color": "red",
    },
    "AbstractArcher": {
        "pt": "Artilharia",
        "en": "Ranged",
        "icon": "aomr_type_archer_icon",
        "color": "blue",
    },
    "AbstractCavalry": {
        "pt": "Cavalaria",
        "en": "Cavalry",
        "icon": "aomr_type_cavalry_icon",
        "color": "teal",
    },
    "AbstractSiegeWeapon": {
        "pt": "Cerco",
        "en": "Siege",
        "icon": "aomr_type_siege_weapon_icon",
        "color": "orange",
    },
    "AbstractShip": {
        "pt": "Navio",
        "en": "Ship",
        "icon": "aomr_type_ship_icon",
        "color": "blue",
    },
    "Ship": {
        "pt": "Navio",
        "en": "Ship",
        "icon": "aomr_type_ship_icon",
        "color": "blue",
    },
    "HumanSoldier": {
        "pt": "Soldado humano",
        "en": "Human Soldier",
        "icon": "aomr_type_human_soldier_icon",
        "color": "red",
    },
    "Hero": {
        "pt": "Herói",
        "en": "Hero",
        "icon": "aomr_type_hero_icon",
        "color": "yellow",
    },
    "AbstractHero": {
        "pt": "Herói",
        "en": "Hero",
        "icon": "aomr_type_hero_icon",
        "color": "yellow",
    },
    "MythUnit": {
        "pt": "MU",
        "en": "MU",
        "icon": "aomr_type_myth_unit_icon",
        "color": "pink",
    },
    "AbstractMythUnit": {
        "pt": "MU",
        "en": "MU",
        "icon": "aomr_type_myth_unit_icon",
        "color": "pink",
    },
    "Villager": {
        "pt": "Aldeão",
        "en": "Villager",
        "icon": "aomr_type_villager_icon",
        "color": "blue",
    },
    "AbstractVillager": {
        "pt": "Aldeão",
        "en": "Villager",
        "icon": "aomr_type_villager_icon",
        "color": "blue",
    },
    "Building": {
        "pt": "Construção",
        "en": "Building",
        "icon": "aomr_type_building_icon",
        "color": "gray",
    },
    "AbstractBuilding": {
        "pt": "Construção",
        "en": "Building",
        "icon": "aomr_type_building_icon",
        "color": "gray",
    },
    "AbstractTower": {
        "pt": "Torre",
        "en": "Tower",
        "icon": "aomr_type_tower_icon",
        "color": "gray",
    },
    "AbstractWall": {
        "pt": "Muro",
        "en": "Wall",
        "icon": "aomr_type_wall_icon",
        "color": "brown",
    },
    "AbstractFarm": {
        "pt": "Fazenda",
        "en": "Farm",
        "icon": "aomr_farm_icon",
        "color": "teal",
    },
    "Farm": {
        "pt": "Fazenda",
        "en": "Farm",
        "icon": "aomr_farm_icon",
        "color": "teal",
    },
    "Herdable": {
        "pt": "Criação",
        "en": "Livestock",
        "icon": "aomr_cow_icon",
        "color": "red",
    },
    "AbstractTrap": {
        "pt": "Armadilha",
        "en": "Trap",
        "icon": "aomr_type_building_icon",
        "color": "orange",
    },
    "SentryTower": {
        "pt": "Torre",
        "en": "Tower",
        "icon": "aomr_type_tower_icon",
        "color": "gray",
    },
    "EconomicUpgraded": {
        "pt": "Aldeão",
        "en": "Villager",
        "icon": "aomr_type_villager_icon",
        "color": "blue",
    },
    "AbstractTemple": {
        "pt": "Templo",
        "en": "Temple",
        "icon": "aomr_type_building_icon",
        "color": "gray",
    },
    "AbstractTeixiptla": {
        "pt": "Teixiptla",
        "en": "Teixiptla",
        "icon": "aomr_type_hero_icon",
        "color": "yellow",
    },
    "WarriorPriest": {
        "pt": "Sacerdote de Guerra",
        "en": "Warrior Priest",
        "icon": "aomr_warrior_priest_hero_icon",
        "color": "yellow",
    },
    "Livestock": {
        "pt": "Criação",
        "en": "Livestock",
        "icon": "aomr_cow_icon",
        "color": "red",
    },
    "LogicalTypeValidCosmicGuardSacrifice": {
        "pt": "Unidades",
        "en": "Units",
        "icon": "aomr_type_human_soldier_icon",
        "color": "red",
    },
}

# Protos auxiliares/aura — não entram como sujeito principal
SKIP_TARGETS = frozenset(
    {
        "Player",
        "SpikeTrapAura",
        "SmokeTrapAura",
        "ThePeachBlossomSpring",
        "ChanequeIdol",
    }
)

ARMORY_GENERIC_TARGETS = frozenset(
    {"HumanSoldier", "Hero", "Ship", "Building", "AbstractShip"}
)

# Subtipos → ícone de atributo (parênteses)
SUBTYPE_ATTR_ICON: dict[str, str] = {
    "Hitpoints": "aomr_hit_points_icon",
    "MaximumVelocity": "aomr_speed_icon",
    "TrainPoints": "aomr_time_icon",
    "BuildPoints": "aomr_time_icon",
    "ResearchPoints": "aomr_time_icon",
    "LOS": "los_icon_aoe3de",
    "MaximumRange": "rangeicon",
    "MinimumRange": "rangeicon",
    "WorkRate": None,  # resolvido por resource/unittype
    "WorkRateSpecific": None,
    "CarryCapacity": None,
    "Cost": None,
    "Damage": None,  # resolvido por damagetype
    "Damagebonus": None,  # resolvido por unittype do bônus
    "ArmorVulnerability": None,  # resolvido por armortype
    "ActionEnable": None,
    "Enable": None,
    "PopulationCap": "aomr_population_provision_icon",
    "ModifyRate": None,
}

DAMAGE_TYPE_ICON = {
    "Hack": "hackdamage",
    "Pierce": "piercedamage",
    "Crush": "crushdamage",
    "Divine": "aomr_divine_damage_icon",
}

ARMOR_TYPE_ICON = {
    "Hack": "hackarmor",
    "Pierce": "piercearmor",
    "Crush": "crusharmor",
}

RESOURCE_ICON = {
    "Food": "foodaom",
    "Wood": "woodaom",
    "Gold": "goldaom",
    "Favor": "favoraom",
}

# Cores por papel inferido do proto (quando unidade específica)
ROLE_COLOR = {
    "Infantaria": "red",
    "Artilharia": "blue",
    "Cavalaria": "teal",
    "Herói": "yellow",
    "Unidade mítica": "pink",
    "Arma de cerco": "orange",
    "Navio": "blue",
    "Aldeão": "blue",
}


@dataclass
class Subject:
    key: str
    icon: str
    nome_pt: str
    nome_en: str
    color: str
    kind: str  # abstract | unit | building | special


@dataclass
class TechEffectSummary:
    subjects: list[Subject] = field(default_factory=list)
    attr_icons: list[str] = field(default_factory=list)
    subtypes: set[str] = field(default_factory=set)
    armor_types: set[str] = field(default_factory=set)
    damage_types: set[str] = field(default_factory=set)
    resources: set[str] = field(default_factory=set)
    damagebonus_types: set[str] = field(default_factory=set)
    is_weapon_line: bool = False
    is_armor_hack: bool = False
    is_armor_pierce: bool = False


def _text(node: ET.Element | None, tag: str, default: str = "") -> str:
    if node is None:
        return default
    child = node.find(tag)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def load_proto_index(proto_path: Path) -> dict[str, ET.Element]:
    tree = ET.parse(proto_path)
    return {
        unit.get("name"): unit
        for unit in tree.getroot().findall("unit")
        if unit.get("name")
    }


def load_tech_nodes(techtree_path: Path) -> dict[str, ET.Element]:
    tree = ET.parse(techtree_path)
    return {
        tech.get("name"): tech
        for tech in tree.getroot().findall("tech")
        if tech.get("name") and is_exportable_tech(tech)
    }


def infer_role_color(unit: ET.Element | None) -> str:
    if unit is None:
        return "red"
    types = {node.text.strip() for node in unit.findall("unittype") if node.text}
    if "MythUnit" in types or "AbstractMythUnit" in types:
        return "pink"
    if "Hero" in types or "AbstractHero" in types:
        return "yellow"
    if "AbstractCavalry" in types:
        return "teal"
    if "AbstractArcher" in types or "Ranged" in types:
        return "blue"
    if "AbstractSiegeWeapon" in types:
        return "orange"
    if "AbstractShip" in types or "Ship" in types:
        return "blue"
    if "Villager" in types:
        return "blue"
    if "Building" in types or "BuildingClass" in types:
        return "gray"
    return "red"


def resolve_subject(
    proto: str,
    *,
    proto_units: dict[str, ET.Element],
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    catalog_by_proto: dict[str, dict[str, Any]] | None = None,
) -> Subject | None:
    if not proto or proto in SKIP_TARGETS:
        return None
    if proto.startswith("LogicalType") and proto not in ABSTRACT_SUBJECTS:
        return None
    if proto in ABSTRACT_SUBJECTS:
        meta = ABSTRACT_SUBJECTS[proto]
        return Subject(
            key=proto,
            icon=meta["icon"],
            nome_pt=meta["pt"],
            nome_en=meta["en"],
            color=meta["color"],
            kind="abstract",
        )

    catalog = (catalog_by_proto or {}).get(proto)
    unit = proto_units.get(proto)
    display_id = _text(unit, "displaynameid") if unit is not None else ""
    nome_pt = (
        (catalog or {}).get("nome")
        or strings_pt.get(display_id)
        or strings_en.get(display_id)
        or proto
    )
    nome_en = (
        (catalog or {}).get("ingles")
        or strings_en.get(display_id)
        or proto
    )
    icon = (catalog or {}).get("icon") or ""
    if not icon and unit is not None:
        icon = unit_icon_token(_text(unit, "icon")) or icon_token_from_path(
            _text(unit, "icon")
        )
    color = infer_role_color(unit)
    kind = "building" if unit is not None and any(
        (n.text or "").strip() in {"Building", "BuildingClass"}
        for n in unit.findall("unittype")
    ) else "unit"
    # Aura / projectile leftovers
    if proto.endswith("Aura") or proto.startswith("Projectile"):
        return None
    return Subject(
        key=proto,
        icon=icon or "aomr_type_human_soldier_icon",
        nome_pt=nome_pt,
        nome_en=nome_en,
        color=color,
        kind=kind,
    )


def _add_subject(
    subjects: "OrderedDict[str, Subject]",
    subject: Subject | None,
) -> None:
    if subject is None:
        return
    # Dedup visual (AbstractFarm vs Farm)
    for existing in subjects.values():
        if existing.icon == subject.icon and existing.nome_pt == subject.nome_pt:
            return
    subjects[subject.key] = subject


def collect_effect_summary(
    tech: ET.Element,
    *,
    proto_units: dict[str, ET.Element],
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    catalog_by_proto: dict[str, dict[str, Any]] | None = None,
) -> TechEffectSummary:
    summary = TechEffectSummary()
    subjects: "OrderedDict[str, Subject]" = OrderedDict()
    techtypes = {node.text.strip() for node in tech.findall("techtype") if node.text}
    is_armory = any(t.startswith("Armory") for t in techtypes)

    def resolve(proto: str) -> Subject | None:
        return resolve_subject(
            proto,
            proto_units=proto_units,
            strings_pt=strings_pt,
            strings_en=strings_en,
            catalog_by_proto=catalog_by_proto,
        )

    # Comandos do Grande Templo (devotioncost, sem effects Data)
    for devotion in tech.findall("devotioncost"):
        dtype = devotion.get("devotiontype") or ""
        if dtype:
            _add_subject(subjects, resolve(dtype))
            if dtype == "Livestock":
                summary.resources.add("Food")
            if dtype == "WarriorPriest":
                summary.subtypes.add("Devotion")
            summary.attr_icons  # placeholder
            summary.subtypes.add("Devotion")

    for effect in tech.findall("./effects/effect"):
        if effect.get("type") != "Data":
            continue
        subtype = effect.get("subtype") or ""
        summary.subtypes.add(subtype)

        armor = effect.get("armortype")
        if armor:
            summary.armor_types.add(armor)
        dtype = effect.get("damagetype")
        if dtype:
            summary.damage_types.add(dtype)

        # Bounty / favor no Player
        if subtype == "BountyResourceEarningMultiplier":
            res = effect.get("resourcetype") or "Favor"
            if res in RESOURCE_ICON:
                summary.resources.add(res)

        resource = effect.get("resource") or effect.get("unittype")
        if subtype in {
            "WorkRate",
            "WorkRateSpecific",
            "CarryCapacity",
            "Cost",
            "CostBuildingTechs",
        } and resource:
            if resource in RESOURCE_ICON:
                summary.resources.add(resource)

        if subtype == "WorkRate" and effect.get("unittype") == "AbstractFarm":
            summary.resources.add("Food")
            _add_subject(subjects, resolve("Farm"))

        if subtype == "Damagebonus":
            bonus_type = effect.get("unittype")
            if bonus_type:
                summary.damagebonus_types.add(bonus_type)

        if subtype == "ModifySpawn":
            spawn = effect.get("proto")
            if spawn:
                _add_subject(subjects, resolve(spawn))

        for target in effect.findall("target"):
            ttype = target.get("type")
            if ttype == "Player":
                continue
            if ttype != "ProtoUnit":
                continue
            proto = (target.text or "").strip()
            _add_subject(subjects, resolve(proto))

    color_rank = {
        "pink": 0,
        "yellow": 1,
        "red": 2,
        "blue": 3,
        "teal": 4,
        "orange": 5,
        "brown": 6,
        "gray": 7,
        "purple": 8,
    }
    summary.subjects = sorted(
        subjects.values(),
        key=lambda s: (color_rank.get(s.color, 9), s.nome_pt),
    )

    subject_keys = {s.key for s in summary.subjects}
    only_generic = bool(subject_keys) and subject_keys <= ARMORY_GENERIC_TARGETS
    if is_armory or only_generic:
        if (
            subject_keys >= {"HumanSoldier", "Hero"}
            and "Damage" in summary.subtypes
            and not summary.armor_types
        ):
            summary.is_weapon_line = True
        if summary.armor_types == {"Hack"} and "ArmorVulnerability" in summary.subtypes:
            summary.is_armor_hack = True
        if summary.armor_types == {"Pierce"} and "ArmorVulnerability" in summary.subtypes:
            summary.is_armor_pierce = True

    attrs: list[str] = []
    seen: set[str] = set()

    def add(icon: str | None) -> None:
        if icon and icon not in seen:
            seen.add(icon)
            attrs.append(icon)

    for subtype in summary.subtypes:
        if subtype == "Damage":
            if summary.damage_types:
                for dt in sorted(summary.damage_types):
                    add(DAMAGE_TYPE_ICON.get(dt, "hackdamage"))
            else:
                add("hackdamage")
        elif subtype == "ArmorVulnerability":
            for at in sorted(summary.armor_types):
                add(ARMOR_TYPE_ICON.get(at, "hackarmor"))
        elif subtype == "Damagebonus":
            for bt in sorted(summary.damagebonus_types):
                meta = ABSTRACT_SUBJECTS.get(bt)
                if meta:
                    add(meta["icon"])
                else:
                    add(UNIT_TYPE_ICON.get(bt, "aomr_type_myth_unit_icon"))
        elif subtype in {
            "WorkRate",
            "WorkRateSpecific",
            "CarryCapacity",
            "Cost",
            "CostBuildingTechs",
            "BountyResourceEarningMultiplier",
        }:
            for res in sorted(summary.resources):
                add(RESOURCE_ICON.get(res))
            if subtype == "WorkRate" and not summary.resources:
                add("foodaom")
        elif subtype == "Devotion":
            add("favoraom")
        elif subtype == "ModifySpawn":
            continue
        else:
            add(SUBTYPE_ATTR_ICON.get(subtype))

    if summary.subtypes <= {"TrainPoints", "BuildPoints", "ResearchPoints"}:
        attrs = ["aomr_time_icon"]

    # Só recurso (ex.: Flowery Wars)
    if not summary.subjects and summary.resources:
        for res in sorted(summary.resources):
            add(RESOURCE_ICON.get(res))

    summary.attr_icons = attrs
    return summary


def highlight(text: str, color: str) -> str:
    return f"<highlight-{color}>{text}</highlight-{color}>"


def format_subject(subject: Subject, *, locale: str) -> str:
    nome = subject.nome_en if locale == "en" else subject.nome_pt
    # Myth units / specific: wrap icon inside highlight when pink/yellow style comum
    if subject.kind == "unit" and subject.color in {"pink", "yellow"} and subject.icon:
        return (
            f"{highlight(':' + subject.icon + ':', subject.color)}"
            f"{highlight(nome, subject.color)}"
        )
    if subject.icon:
        return f":{subject.icon}: {highlight(nome, subject.color)}"
    return highlight(nome, subject.color)


def format_parens(attr_icons: list[str]) -> str:
    if not attr_icons:
        return ""
    # Bônus de tipo usa & entre ícones distintos de dano/tipo (padrão Divine Judgment)
    if len(attr_icons) == 2 and any("type_" in a or "myth" in a for a in attr_icons):
        return "(" + "&".join(f":{a}:" for a in attr_icons) + ")"
    return "(" + "".join(f":{a}:" for a in attr_icons) + ")"


def _resource_beneficia(resource: str, *, locale: str) -> str:
    icon = RESOURCE_ICON[resource]
    labels = {
        "Food": ("Comida", "Food", "red"),
        "Wood": ("Madeira", "Wood", "brown"),
        "Gold": ("Ouro", "Gold", "yellow"),
        "Favor": ("Favor", "Favor", "yellow"),
    }
    pt, en, color = labels[resource]
    nome = en if locale == "en" else pt
    return f":{icon}: {highlight(nome, color)}"


def build_beneficia(summary: TechEffectSummary, *, locale: str) -> str:
    if summary.is_weapon_line:
        return highlight("+Dano" if locale != "en" else "+Damage", "orange")
    if summary.is_armor_hack:
        label = "Anti-cortante" if locale != "en" else "Hack Armor"
        return f"{highlight(':hackarmor:', 'brown')}{highlight(label, 'brown')}"
    if summary.is_armor_pierce:
        label = "Anti-perfurante" if locale != "en" else "Pierce Armor"
        return f"{highlight(':piercearmor:', 'brown')}{highlight(label, 'brown')}"

    subjects = summary.subjects
    if not subjects:
        if summary.resources:
            return _resource_beneficia(next(iter(sorted(summary.resources))), locale=locale)
        return ""

    display = subjects[:3]
    parts = [format_subject(s, locale=locale) for s in display]
    body = "+".join(parts) if len(parts) > 1 else parts[0]

    parens = format_parens(summary.attr_icons)
    if parens:
        return f"{body} {parens}"
    return body


def index_catalog_units_by_protoish(
    units: list[dict[str, Any]],
    proto_units: dict[str, ET.Element],
    strings_en: dict[str, str],
) -> dict[str, dict[str, Any]]:
    """Tenta associar linhas do catálogo a proto names via inglês / display name."""
    by_english: dict[str, dict[str, Any]] = {}
    for row in units:
        ingles = (row.get("ingles") or "").strip().lower()
        if ingles:
            by_english[ingles] = row
            # remove age prefixes Medium/Heavy/Champion
            for prefix in ("medium ", "heavy ", "champion "):
                if ingles.startswith(prefix):
                    by_english[ingles[len(prefix) :]] = row

    out: dict[str, dict[str, Any]] = {}
    for proto, unit in proto_units.items():
        display_id = _text(unit, "displaynameid")
        en = strings_en.get(display_id, "").strip().lower()
        if en and en in by_english:
            out[proto] = by_english[en]
            continue
        # proto camel → words
        spaced = re.sub(r"(?<!^)([A-Z])", r" \1", proto).replace("_", " ").strip().lower()
        if spaced in by_english:
            out[proto] = by_english[spaced]
    return out


def generate_beneficia_for_tech(
    tech: ET.Element,
    *,
    locale: str,
    proto_units: dict[str, ET.Element],
    strings_pt: dict[str, str],
    strings_en: dict[str, str],
    catalog_by_proto: dict[str, dict[str, Any]] | None = None,
) -> str:
    summary = collect_effect_summary(
        tech,
        proto_units=proto_units,
        strings_pt=strings_pt,
        strings_en=strings_en,
        catalog_by_proto=catalog_by_proto,
    )
    return build_beneficia(summary, locale=locale)
