#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

from aom_game_paths import DEFAULT_CACHE_DIR
from aom_unit_extractor import extract_units
from aom_unit_merge import index_extracted_by_proto, resolve_proto_name

CACHE = Path(DEFAULT_CACHE_DIR)
SKIP_SUBSTR = (
    "Cheat",
    "SPC",
    "CG",
    "Mutant",
    "Idol",
    "Rabbits",
    "Injured",
    "Wounded",
    "Run",
    "Snakeless",
    "Carrying",
    "Dismounted",
    "Jaguar",
    "Elixir",
    "Leg",
)


def should_skip(name: str) -> bool:
    if name.startswith("Super") or name.startswith("Teixiptla"):
        return True
    return any(s in name for s in SKIP_SUBSTR)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    cons = ROOT / "src" / "data" / "locale" / "pt" / "construcoes.json"
    extracted_list = extract_units(CACHE, construcoes_path=cons)
    index = index_extracted_by_proto(extracted_list)

    def is_aztec(row: dict) -> bool:
        p = row.get("panteao")
        if isinstance(p, dict):
            return p.get("id") == 7
        if isinstance(p, list):
            return any(isinstance(x, dict) and x.get("id") == 7 for x in p)
        return False

    game = {
        u["proto_name"]: u
        for u in extracted_list
        if is_aztec(u) and u.get("proto_name")
    }

    pt = json.loads(
        (ROOT / "src" / "data" / "locale" / "pt" / "unidades_aom.json").read_text(
            encoding="utf-8"
        )
    )
    cat = [u for u in pt if is_aztec(u)]

    print("=== CATALOGO AZTECA ===")
    for u in sorted(cat, key=lambda x: x["id"]):
        proto = resolve_proto_name(u.get("ingles") or "", index)
        print(
            f"{u['id']:3} | {u.get('nome'):30} | tipo={u.get('tipo')} | "
            f"proto={proto} | hp={u.get('pontos_de_vida')} "
            f"pierce={u.get('pierce_atk')} crush={u.get('crush_atk')} "
            f"hack={u.get('hack_atk')}"
        )

    matched_protos: set[str] = set()
    for u in cat:
        p = resolve_proto_name(u.get("ingles") or "", index)
        if p:
            matched_protos.add(p)

    print("\n=== JOGO exportavel relevant (sem variantes) ===")
    for n, u in sorted(game.items(), key=lambda x: x[0]):
        if should_skip(n):
            continue
        mark = "OK" if n in matched_protos else "MISS"
        print(
            f"[{mark}] {n:32} | {u.get('ingles'):28} | "
            f"tipo={u.get('tipo')} era={u.get('era')} "
            f"food={u.get('comida')} wood={u.get('madeira')} "
            f"gold={u.get('ouro')} favor={u.get('favor')} "
            f"train={[c.get('proto') for c in (u.get('construcao') or [])]}"
        )


if __name__ == "__main__":
    main()
