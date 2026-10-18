#!/usr/bin/env python3
"""Remapeia IDs do catálogo AoM: Panteão → Era → Categoria → Heróis/Míticas;
cercos terrestres e barcos no fim. Atualiza JSON + renomeia GLBs/techs."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PT_PATH = ROOT / "src/data/locale/pt/unidades_aom.json"
EN_PATH = ROOT / "src/data/locale/en/unidades_aom.json"
MODELS_PATH = ROOT / "src/data/unit_models.json"
TECHS_PATH = ROOT / "src/data/unit_model_techs.json"
BATTLE_PATH = ROOT / "src/data/unidades_aom_battle_results.json"
MODELS_DIR = ROOT / "public/assets/unit-models"
TECH_DIR = MODELS_DIR / "tech"
MAP_OUT = ROOT / "tools/_tmp_id_remap.json"
ORDER_OUT = ROOT / "tools/_tmp_unit_order_new.txt"

SHIP_TYPES = {
    "Navio",
    "Ship",
    "Flecheiro",
    "Arrow Ship",
    "Combate curto-alcance",
    "Close-combat Ship",
    "Navio-cerco",
    "Siege Ship",
}
SIEGE_TYPES = {"Cerco", "Siege"}
HERO_TYPES = {"Herói", "Hero"}
MYTH_TYPES = {"Unidade mítica", "Mythic"}
INF_TYPES = {"Infantaria", "Infantry"}
CAV_TYPES = {"Cavalaria", "Cavalry"}
ARCH_TYPES = {"Artilharia", "Archer"}
SCOUT_TYPES = {"Batedor", "Scout"}
VILL_TYPES = {"Aldeão", "Villager"}

# Dentro da seção principal (não cerco/barco)
CAT_RANK = {
    "villager": 0,
    "infantry": 1,
    "cavalry": 2,
    "archer": 3,
    "scout": 4,
    "hero": 5,
    "myth": 6,
    "other": 7,
}

# Subtipos de barco
SHIP_RANK = {
    "flecheiro": 0,
    "melee": 1,
    "siege": 2,
    "other": 3,
}


def tipos_set(u: dict) -> set[str]:
    return {t.get("type", "") for t in (u.get("tipo") or []) if t.get("type")}


def pant_id(u: dict) -> int:
    return int((u.get("panteao") or [{}])[0].get("id") or 99)


def era_id(u: dict) -> int:
    return int((u.get("era") or [{}])[0].get("id") or 99)


def is_ship(tipos: set[str]) -> bool:
    return bool(tipos & SHIP_TYPES)


def is_land_siege(tipos: set[str]) -> bool:
    return bool(tipos & SIEGE_TYPES) and not is_ship(tipos)


def section(tipos: set[str]) -> int:
    if is_land_siege(tipos):
        return 1
    if is_ship(tipos):
        return 2
    return 0


def category(u: dict, tipos: set[str]) -> str:
    """Categoria dentro da seção principal (ou subtipo em cerco/barco)."""
    ingles = (u.get("ingles") or "").strip()

    # Oráculo base fica colado ao Oráculo (Herói)
    if ingles == "Oracle":
        return "hero"

    if section(tipos) == 1:
        return "siege"
    if section(tipos) == 2:
        if "Flecheiro" in tipos or "Arrow Ship" in tipos:
            return "flecheiro"
        if "Combate curto-alcance" in tipos or "Close-combat Ship" in tipos:
            return "melee"
        if "Navio-cerco" in tipos or "Siege Ship" in tipos:
            return "siege"
        return "other"

    if tipos & HERO_TYPES:
        return "hero"
    if tipos & MYTH_TYPES:
        return "myth"
    if tipos & INF_TYPES:
        return "infantry"
    if tipos & CAV_TYPES:
        return "cavalry"
    if tipos & ARCH_TYPES:
        return "archer"
    if tipos & SCOUT_TYPES:
        return "scout"
    if tipos & VILL_TYPES:
        return "villager"
    return "other"


def cat_rank_for(sec: int, cat: str) -> int:
    if sec == 0:
        return CAT_RANK.get(cat, 99)
    if sec == 2:
        return SHIP_RANK.get(cat, 99)
    return 0


def family_key(ingles: str) -> str:
    """Agrupa formas (Nezha, Lykaon, Oracle, Murmillo Hero, etc.)."""
    base = re.sub(r"\s*\([^)]*\)\s*", "", ingles).strip()
    return base.casefold()


def form_order(ingles: str) -> int:
    """Ordem estável dentro da família (Child < Youth < base < Wolf < Hero)."""
    low = ingles.casefold()
    if "(child)" in low or "(criança)" in low:
        return 0
    if "(youth)" in low or "(jovem)" in low:
        return 1
    if "(villager)" in low or "(aldeão)" in low:
        return 2
    # Forma base (Oracle, Cheiroballista, Murmillo…) antes de Wolf/Hero
    if "(" not in ingles:
        return 3
    if "(wolf)" in low or "(lobo)" in low:
        return 4
    if "(hero)" in low or "(herói)" in low or "(heroína)" in low:
        return 5
    return 6


def sort_key(u: dict):
    tipos = tipos_set(u)
    sec = section(tipos)
    cat = category(u, tipos)
    ingles = (u.get("ingles") or "").strip()
    return (
        sec,
        pant_id(u),
        era_id(u),
        cat_rank_for(sec, cat),
        family_key(ingles),
        form_order(ingles),
        ingles.casefold(),
        u["id"],  # desempate estável pelo ID antigo
    )


def rewrite_tech_urls(obj, old_id: int, new_id: int):
    old = f"/assets/unit-models/tech/{old_id}/"
    new = f"/assets/unit-models/tech/{new_id}/"
    if isinstance(obj, dict):
        return {k: rewrite_tech_urls(v, old_id, new_id) for k, v in obj.items()}
    if isinstance(obj, list):
        return [rewrite_tech_urls(v, old_id, new_id) for v in obj]
    if isinstance(obj, str) and old in obj:
        return obj.replace(old, new)
    return obj


def two_phase_rename(pairs: list[tuple[Path, Path]]) -> None:
    """Renomeia evitando colisões: src → tmp → dst."""
    tmp_pairs: list[tuple[Path, Path, Path]] = []
    for i, (src, dst) in enumerate(pairs):
        if not src.exists():
            continue
        if src.resolve() == dst.resolve():
            continue
        tmp = src.with_name(f"__remap_tmp_{i}__{src.name}")
        src.rename(tmp)
        tmp_pairs.append((tmp, dst, src))

    for tmp, dst, _src in tmp_pairs:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            if dst.is_dir():
                shutil.rmtree(dst)
            else:
                dst.unlink()
        tmp.rename(dst)


def main() -> None:
    pt = json.loads(PT_PATH.read_text(encoding="utf-8"))
    en = json.loads(EN_PATH.read_text(encoding="utf-8"))
    models = json.loads(MODELS_PATH.read_text(encoding="utf-8"))
    techs = json.loads(TECHS_PATH.read_text(encoding="utf-8"))
    battles = json.loads(BATTLE_PATH.read_text(encoding="utf-8"))

    en_by_id = {u["id"]: u for u in en}
    if {u["id"] for u in pt} != set(en_by_id):
        raise SystemExit("PT/EN IDs diverge")

    ordered = sorted(pt, key=sort_key)
    old_to_new: dict[int, int] = {}
    for new_id, u in enumerate(ordered, start=1):
        old_to_new[u["id"]] = new_id

    MAP_OUT.write_text(
        json.dumps({str(k): v for k, v in sorted(old_to_new.items())}, indent=2)
        + "\n",
        encoding="utf-8",
    )

    # Preview da nova ordem
    lines = []
    for u in ordered:
        oid = u["id"]
        nid = old_to_new[oid]
        tipos = ",".join(sorted(tipos_set(u)))
        sec = section(tipos_set(u))
        cat = category(u, tipos_set(u))
        lines.append(
            f"{nid:3d} (old {oid:3d})\t{u.get('ingles')}\tpant={pant_id(u)}\tera={era_id(u)}"
            f"\tsec={sec}\tcat={cat}\ttipo={tipos}"
        )
    ORDER_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # Catálogos
    new_pt = []
    new_en = []
    for u in ordered:
        oid = u["id"]
        nid = old_to_new[oid]
        pu = dict(u)
        pu["id"] = nid
        new_pt.append(pu)
        eu = dict(en_by_id[oid])
        eu["id"] = nid
        new_en.append(eu)

    # Models
    new_models: dict[str, str] = {}
    model_renames: list[tuple[Path, Path]] = []
    for oid_s, url in models.items():
        oid = int(oid_s)
        if oid not in old_to_new:
            continue
        nid = old_to_new[oid]
        # /assets/unit-models/{id}-{slug}.glb
        m = re.match(r"^/assets/unit-models/(\d+)-(.+)$", url)
        if not m:
            new_models[str(nid)] = url
            continue
        slug = m.group(2)
        new_url = f"/assets/unit-models/{nid}-{slug}"
        new_models[str(nid)] = new_url
        src = MODELS_DIR / f"{oid}-{slug}"
        dst = MODELS_DIR / f"{nid}-{slug}"
        if src.exists():
            model_renames.append((src, dst))

    # Techs
    new_techs: dict[str, object] = {}
    tech_renames: list[tuple[Path, Path]] = []
    for oid_s, tech in techs.items():
        oid = int(oid_s)
        if oid not in old_to_new:
            continue
        nid = old_to_new[oid]
        new_techs[str(nid)] = rewrite_tech_urls(tech, oid, nid)
        src = TECH_DIR / str(oid)
        dst = TECH_DIR / str(nid)
        if src.exists():
            tech_renames.append((src, dst))

    # Battles
    new_battles = []
    for row in battles:
        r = dict(row)
        aid = r.get("attacker_id")
        did = r.get("defender_id")
        if aid in old_to_new:
            r["attacker_id"] = old_to_new[aid]
        if did in old_to_new:
            r["defender_id"] = old_to_new[did]
        new_battles.append(r)

    # Persist JSON first (before renames so we can dry-run inspect)
    PT_PATH.write_text(json.dumps(new_pt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    EN_PATH.write_text(json.dumps(new_en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MODELS_PATH.write_text(
        json.dumps(new_models, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    TECHS_PATH.write_text(
        json.dumps(new_techs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    BATTLE_PATH.write_text(
        json.dumps(new_battles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    two_phase_rename(model_renames)
    two_phase_rename(tech_renames)

    # Sanity
    lykaon = [u for u in new_pt if "Lykaon" in (u.get("ingles") or "")]
    oracle = [u for u in new_pt if (u.get("ingles") or "").startswith("Oracle")]
    siege_ids = [u["id"] for u in new_pt if is_land_siege(tipos_set(u))]
    ship_ids = [u["id"] for u in new_pt if is_ship(tipos_set(u))]
    print(f"remapped {len(old_to_new)} units -> 1..{len(ordered)}")
    print(f"Lykaon: {[(u['id'], u['ingles']) for u in lykaon]}")
    print(f"Oracle: {[(u['id'], u['ingles']) for u in oracle]}")
    print(f"Siege IDs: {siege_ids[0]}..{siege_ids[-1]} ({len(siege_ids)})")
    print(f"Ship IDs: {ship_ids[0]}..{ship_ids[-1]} ({len(ship_ids)})")
    print(f"models renamed: {len(model_renames)}, tech dirs: {len(tech_renames)}")
    print(f"order preview: {ORDER_OUT}")


if __name__ == "__main__":
    main()
