# Pipeline de tecnologias (AoM Retold)

Extrai custos, tempo, era, ícone e prédios de pesquisa do jogo para `tecnologias.json`.

## Requisitos

- Age of Mythology: Retold instalado (Steam)
- `tools/crybar/cli/crybar.exe` ([CryBarEditor](https://github.com/CryShana/CryBarEditor))

## Scripts

| Comando npm | Script | Função |
|-------------|--------|--------|
| `npm run data:extract-tecnologias` | `extract-tecnologias-aom.py` | Extrai do `Data.bar` / cache |
| `npm run data:merge-tecnologias` | `merge-tecnologias-aom.py` | Atualiza PT e EN no catálogo |
| — | `fill-tecnologias-beneficia.py` | Gera `beneficia` (ícone + nome) a partir dos efeitos |
| — | `sync-tech-icons-aom.py` | Exporta ícones WebP + `token_asset_map.json` |

## Uso

```bash
# Comparar uma tecnologia com o catálogo
python scripts/extract-tecnologias-aom.py --compare "Hand Axe"
python scripts/extract-tecnologias-aom.py --compare CopperWeapons

# Simular merge
python scripts/merge-tecnologias-aom.py --tech "Hand Axe" --dry-run
python scripts/merge-tecnologias-aom.py --index 0-9 --dry-run

# Gravar alterações
python scripts/merge-tecnologias-aom.py --tech "Hand Axe",Sarissa --write

# Preencher beneficia (ex.: astecas id=7, só vazios)
python scripts/fill-tecnologias-beneficia.py --pantheon-id 7 --only-empty --dry-run
python scripts/fill-tecnologias-beneficia.py --pantheon-id 7 --only-empty --write
```

## Campos

**Preservados no merge:** `beneficia`, `campo`, `tipo`, `panteoes`, `god_especifico`, `god_dono`

**Atualizados do jogo:** `nome`, `ingles`, `comida`, `madeira`, `ouro`, `favor`, `tempo_s`, `eras`, `icon`, `construcao_origem` (IDs preservados quando possível)

## Aliases de matching

Alguns nomes do catálogo divergem do proto no jogo:

- `Survival Equipment` → `HuntingEquipment`
- `Medium/Heavy/Champion Ranged Soldiers` → `MediumArchers` / etc.
- `Heavy/Champion Elephants` → `HeavyWarElephants` / `ChampionWarElephants`
- `Heavy/Champion Chariots` → `HeavyChariotArchers` / `ChampionChariotArchers`
- `Argive Patronage` → `ArgivePatronageZeus`
- `Empyrian Speed` → `EmpyreanSpeed`

Apostrofos codificados (`&#x27;`, `%27`) são decodificados automaticamente.

## Locale EN

No merge em inglês, apenas `nome` (display EN), custos, `tempo_s`, `eras`, `icon` e `construcao_origem` são atualizados. Textos editoriais (`tipo`, `beneficia`, `campo`) permanecem como estão.
