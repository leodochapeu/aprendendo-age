from __future__ import annotations

PANTHEON_FROM_PATH = {
    "greek": {"id": 1, "nome": "Grego", "icon": "aomr_pantheon_greeks_icon"},
    "egyptian": {"id": 2, "nome": "Egípcio", "icon": "aomr_pantheon_egyptians_icon"},
    "norse": {"id": 3, "nome": "Nórdico", "icon": "aomr_pantheon_norse_icon"},
    "atlantean": {"id": 4, "nome": "Atlante", "icon": "aomr_pantheon_atlanteans_icon"},
    "chinese": {"id": 5, "nome": "Chinês", "icon": "aomr_pantheon_chinese_icon"},
    "japanese": {"id": 6, "nome": "Japonês", "icon": "aomr_pantheon_japanese_icon"},
    "aztec": {"id": 7, "nome": "Asteca", "icon": "aomr_pantheon_azteca_icon"},
}

ERA_FROM_TOKEN = {
    "Archaic": {"id": 1, "nome": "Arcaica", "icon": "aomr_archaic_age_icon"},
    "Classical": {"id": 2, "nome": "Clássica", "icon": "aomr_classical_age_icon"},
    "Heroic": {"id": 3, "nome": "Heróica", "icon": "aomr_heroic_age_icon"},
    "Mythic": {"id": 4, "nome": "Mítica", "icon": "aomr_mythic_age_icon"},
    "Titan": {"id": 5, "nome": "Titã", "icon": "aomr_titan_age_icon"},
}

DAMAGE_BONUS_TYPE_PT = {
    "AbstractInfantry": "Infantaria",
    "AbstractArcher": "Artilharia",
    "AbstractCavalry": "Cavalaria",
    "AbstractSiegeWeapon": "Arma de cerco",
    "AbstractShip": "Navio",
    "HumanSoldier": "Soldado humano",
    "MythUnit": "Unidade mítica",
    "Hero": "Herói",
    "Building": "Construção",
    "AbstractBuilding": "Construção",
    "AbstractWall": "Muralha",
    "AbstractTower": "Torre",
    "Villager": "Aldeão",
    "AbstractFlyingUnit": "Unidade voadora",
}

UNIT_TYPE_ICON = {
    "Infantaria": "aomr_type_infantry_icon",
    "Artilharia": "aomr_type_archer_icon",
    "Cavalaria": "aomr_type_cavalry_icon",
    "Navio": "aomr_type_ship_icon",
    "Unidade mítica": "aomr_type_myth_unit_icon",
    "Herói": "aomr_type_hero_icon",
    "Arma de cerco": "aomr_type_siege_weapon_icon",
    "Cerco": "aomr_type_siege_weapon_icon",
    "Aldeão": "aomr_type_villager_icon",
    "Batedor": "aomr_type_scout_icon",
    "Scout": "aomr_type_scout_icon",
    "Navio": "aomr_type_ship_icon",
    "Ship": "aomr_type_ship_icon",
    "Flecheiro": "aomr_type_archer_ship_icon",
    "Archer Ship": "aomr_type_archer_ship_icon",
    "Combate curto-alcance": "aomr_type_close_combat_ship_icon",
    "Close Combat Ship": "aomr_type_close_combat_ship_icon",
    "Navio-cerco": "aomr_type_siege_ship_icon",
    "Siege Ship": "aomr_type_siege_ship_icon",
}

# Templos de campanha/cenário — ignorados; usa-se apenas o proto `Temple`.
SECONDARY_TEMPLE_PROTOS = frozenset(
    {
        "TempleOvergrown",
        "TempleOfKronos",
        "TempleOfTheGods",
        "TempleOfDemeter",
        "TempleChineseSPC",
    }
)

PANTHEON_TEMPLE_NOME = {
    1: "Templo (Grego)",
    2: "Templo (Egípcio)",
    3: "Templo (Nórdico)",
    4: "Templo (Atlante)",
    5: "Templo (Chinês)",
    6: "Templo (Japonês)",
    7: "Templo (Asteca)",
}

DAMAGE_TYPE_FIELD = {
    "Hack": "dano_cortante",
    "Pierce": "dano_perfurante",
    "Crush": "dano_contusao",
    "Divine": "dano_divino",
}

ARMOR_TYPE_FIELD = {
    "Hack": "armadura_anticorte",
    "Pierce": "armadura_antiperfurante",
    "Crush": "armadura_anticontusao",
}
