#!/usr/bin/env python3
"""
Gera o GLB estático de cada unidade do catálogo a partir dos modelos do AoM Retold.

O viewer da página de detalhes só precisa girar o arquivo. Malha, textura e
acessórios (arma, escudo, elmo) já vão unidos na pose de bind.

Exemplos:
  python scripts/extract-unit-models-aom.py --unit Hoplite --preview
  python scripts/extract-unit-models-aom.py --ids 1-20
  python scripts/extract-unit-models-aom.py --all
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / "lib"))

from aom_game_paths import DEFAULT_CACHE_DIR, DEFAULT_CRYBAR, resolve_game_dir  # noqa: E402
from aom_unit_extractor import ensure_bar_extracted  # noqa: E402
from aom_unit_merge import (  # noqa: E402
    load_catalog,
    load_proto_name_set,
    match_catalog_to_proto,
    parse_id_range,
    parse_unit_filter,
    resolve_proto_name,
)
from aom_unit_model import (  # noqa: E402
    MANIFEST_PATH,
    PUBLIC_MODELS,
    WORK_ROOT,
    BarIndex,
    _proto_animfiles,
    bake_unit_glb,
    render_preview,
)


def _slug(proto: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in proto)
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-") or "unit"


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai modelos 3D das unidades do AoM Retold")
    parser.add_argument("--game-dir", default=None)
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--crybar", default=str(DEFAULT_CRYBAR))
    parser.add_argument("--unit", help="Nome do catálogo ou proto, separado por vírgula")
    parser.add_argument("--ids", help="ID(s) do catálogo: 1,2 ou 1-20")
    parser.add_argument("--all", action="store_true", help="Todas as unidades do catálogo")
    parser.add_argument("--force", action="store_true", help="Regera GLBs que já existem")
    parser.add_argument("--force-extract", action="store_true")
    parser.add_argument("--preview", action="store_true", help="Grava um PNG de conferência do primeiro modelo")
    args = parser.parse_args()

    if not args.all and not args.unit and not args.ids:
        print("Informe --unit, --ids ou --all.", file=sys.stderr)
        return 1

    game_dir = resolve_game_dir(args.game_dir)
    cache_dir = Path(args.cache_dir).resolve()
    crybar = Path(args.crybar).resolve()
    try:
        ensure_bar_extracted(
            game_dir=game_dir,
            cache_dir=cache_dir,
            crybar_exe=crybar,
            force=args.force_extract,
        )
    except FileNotFoundError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    catalog = load_catalog(ROOT_CATALOG)
    proto_names = load_proto_name_set(cache_dir)
    stub = {name: {} for name in proto_names}
    animfiles = _proto_animfiles(cache_dir)
    unit_filter = parse_unit_filter(args.unit)
    id_filter = parse_id_range(args.ids)
    normalized_units = {name.lower() for name in unit_filter} if unit_filter else None

    selected = []
    for row in catalog:
        if id_filter is not None and row.get("id") not in id_filter:
            continue
        catalog_name = match_catalog_to_proto(row) or ""
        if normalized_units is not None and catalog_name.lower() not in normalized_units and (row.get("nome") or "").lower() not in normalized_units:
            continue
        proto = resolve_proto_name(catalog_name, stub)
        if not proto:
            print(f"  sem proto: {row.get('id')} {catalog_name}")
            continue
        anim = animfiles.get(proto)
        if not anim:
            print(f"  sem animfile: {proto}")
            continue
        selected.append((row, proto, anim))

    if not selected:
        print("Nenhuma unidade selecionada.", file=sys.stderr)
        return 1

    print(f"Indexando arquivos do jogo ({len(selected)} unidades)...")
    bars = BarIndex(game_dir, crybar, WORK_ROOT)
    PUBLIC_MODELS.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    if MANIFEST_PATH.exists() and (args.unit or args.ids) and not args.all:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    ok = 0
    preview_done = False
    for index, (row, proto, anim) in enumerate(selected, start=1):
        unit_id = str(row["id"])
        filename = f"{unit_id}-{_slug(proto)}.glb"
        dest = PUBLIC_MODELS / filename
        print(f"[{index}/{len(selected)}] {proto} -> {filename}")
        if dest.exists() and not args.force:
            manifest[unit_id] = f"/assets/unit-models/{filename}"
            ok += 1
            continue
        try:
            info = bake_unit_glb(bars, anim, dest)
        except Exception as exc:  # noqa: BLE001 — uma unidade ruim não para o lote
            print(f"  falhou: {exc}")
            continue
        manifest[unit_id] = f"/assets/unit-models/{filename}"
        ok += 1
        print(f"  {info['model']} anexos={', '.join(info['attachments']) or '-'} ({info['bytes']} bytes)")
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if args.preview and not preview_done:
            preview = dest.with_suffix(".preview.png")
            render_preview(dest, preview)
            print(f"  preview: {preview}")
            preview_done = True

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{ok}/{len(selected)} modelos em {PUBLIC_MODELS}")
    print(f"manifesto: {MANIFEST_PATH}")
    return 0 if ok else 1


ROOT_CATALOG = Path(__file__).resolve().parents[1] / "src" / "data" / "locale" / "pt" / "unidades_aom.json"


if __name__ == "__main__":
    raise SystemExit(main())
