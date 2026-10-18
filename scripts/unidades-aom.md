# Extração e merge de unidades (AoM Retold)

Scripts para ler stats de unidades direto do jogo e atualizar `src/data/locale/*/unidades_aom.json`.

## Pré-requisitos

1. **Age of Mythology: Retold** instalado (Steam).
2. **CryBar CLI** em `aprendendo-age/tools/crybar/cli/crybar.exe`.
   - Download: [CryBarEditor releases](https://github.com/CryShana/CryBarEditor/releases) → `CryBar.Cli-*.zip`
   - Extrair `crybar.exe` para a pasta acima.

Caminho padrão do jogo (Windows):

```text
E:\SteamLibrary\steamapps\common\Age of Mythology Retold
```

Outro caminho: variável de ambiente `AOM_GAME_DIR` ou flag `--game-dir`.

Os dados extraídos ficam em cache em `aprendendo-age/tools/aom-extracted/` (proto, techtree, strings).

---

## 1. Extrair dados do jogo

Arquivo: `extract-unidades-aom.py`

Lê `game/data/Data.bar` e gera JSON com stats brutos do jogo.

```bash
# Uma unidade (proto name do jogo, ex.: Hoplite)
python scripts/extract-unidades-aom.py --unit Hoplite

# Comparar com o catálogo atual
python scripts/extract-unidades-aom.py --compare Hoplite

# Exportar todas as unidades (~537)
python scripts/extract-unidades-aom.py --output tools/aom-unidades-extracted.json --pretty
```

| Flag | Descrição |
|------|-----------|
| `--game-dir` | Pasta raiz do AoM Retold |
| `--cache-dir` | Onde salvar proto/techtree/strings |
| `--crybar` | Caminho do `crybar.exe` |
| `--force-extract` | Reextrai o `Data.bar` mesmo com cache |
| `--unit` | Filtra por proto name |
| `--compare` | Diff contra `locale/pt/unidades_aom.json` |
| `-o`, `--output` | Arquivo JSON de saída |

npm: `npm run data:extract-unidades -- --unit Hoplite`

---

## 2. Atualizar o catálogo (merge)

Arquivo: `merge-unidades-aom.py`

Mescla stats do jogo no JSON do site. **Sempre simule com `--dry-run` antes de `--write`.**

```bash
# Simular uma unidade
python scripts/merge-unidades-aom.py --unit Hoplite --dry-run

# Gravar uma unidade (PT + EN)
python scripts/merge-unidades-aom.py --unit Hoplite --write

# Intervalo de IDs do catálogo
python scripts/merge-unidades-aom.py --ids 1-50 --dry-run
python scripts/merge-unidades-aom.py --ids 1-50 --write

# Várias unidades por proto name
python scripts/merge-unidades-aom.py --unit Hoplite,Hippeus,Toxote --write

# Só português
python scripts/merge-unidades-aom.py --ids 1-50 --locale pt --write
```

| Flag | Descrição |
|------|-----------|
| `--dry-run` | Mostra diff, não grava |
| `--write` | Grava nos JSONs |
| `--unit` | Proto name(s), separados por vírgula |
| `--ids` | ID(s) do catálogo: `1`, `1,5,10` ou `1-50` |
| `--locale` | `pt`, `en` ou `both` (padrão) |
| `--game-dir`, `--cache-dir`, `--crybar`, `--force-extract` | Igual ao script de extração |

npm: `npm run data:merge-unidades -- --ids 1-50 --dry-run`

---

## 2b. Importar MUs astecas ausentes

Arquivo: `import-aztec-myth-units.py`

Adiciona unidades míticas treináveis do panteão Asteca (com era, `god_dono`, construção e ícones).

```bash
python scripts/import-aztec-myth-units.py --dry-run
python scripts/import-aztec-myth-units.py --write
```

Ignora variantes (Idol, Mutant, SPC/CG, cheats). `Quinametzin` já existente é pulada.

---

## O que é atualizado vs. preservado

### Atualizado do jogo

- Nomes (`nome` / `ingles`), tipo, pantão, era, multiplicadores
- Stats: HP, dano, DPS, armaduras, custos, população, tempo de treino, velocidade, ícone
- Construções que treinam a unidade (mantém `id` quando já existir)

### Preservado (não sobrescrito)

- `id`
- `counter_de`
- `categoria`
- `forte_contra`
- `fraco_contra`
- `forca_atributos`

### Locale EN

No arquivo inglês, só entram **stats** e **nome/ingles**. Textos já traduzidos (pantão, era, tipo, etc.) permanecem como estão.

---

## Matching catálogo ↔ jogo

O merge usa o campo `ingles` do JSON para achar a unidade no `proto.xml`. Alguns nomes divergem; aliases conhecidos:

| Catálogo | Proto no jogo |
|----------|----------------|
| Toxote | Toxotes |
| Hypapist | Hypaspist |
| Berserker | Berserk |
| Huscarl | Huskarl |
| Minotauro | Minotaur |
| Centauro | Centaur |
| Ciclope | Cyclops |
| Esfinge | Sphinx |
| Valquíria | Valkyrie |
| Prometeus | Promethean |
| Autômato | Automaton |
| Oracle (Hero) | OracleHero |
| Murmillo (Hero) | MurmilloHero |
| *(Hero)* variants | *Hero* suffix no proto |

Nomes com espaço (`Camel Rider`, `War Elephant`) são normalizados automaticamente (`CamelRider`, `WarElephant`).

### Construções (`construcao`)

- Usa apenas o **templo principal** (`Temple` → `Templo (Grego)`, `Templo (Atlante)`, etc.).
- Templos de campanha/cenário são ignorados (`TempleOvergrown`, `TempleOfKronos`, …).
- Demais prédios militares (Academia, Estábulo, …) permanecem normais.

---

| Arquivo no `Data.bar` | Conteúdo |
|-------------------------|----------|
| `gameplay/proto.xml` | Stats das unidades |
| `gameplay/techtree.xml` | Eras e liberação de unidades |
| `strings/*/string_table.txt` | Nomes localizados |

Documentação oficial: `BANG_Documentation/Data documentation/AoMRT Comprehensive Core Data Guide.pdf` (pasta do jogo).

---

## 3. Modelo 3D da página da unidade

Arquivo: `extract-unit-models-aom.py`

Lê o `animfile` do proto, converte o TMModel (e acessórios como arma, escudo e elmo) com o CryBar e grava um GLB estático em `public/assets/unit-models/`. A malha usa o primeiro quadro da animação Idle, então o cavaleiro fica montado e as armas saem na mão. O manifesto fica em `src/data/unit_models.json`. A página de detalhes mostra esse modelo ao lado de Visão geral, com giro para a esquerda e para a direita.

```bash
python scripts/extract-unit-models-aom.py --unit Hoplite
python scripts/extract-unit-models-aom.py --all
```

npm: `npm run data:extract-unit-models -- --all`

O cache intermediário (índice dos .bar, TMM, texturas) fica em `tools/.unit-model-cache/` e não entra no Git.

---

## Fluxo recomendado

1. `extract-unidades-aom.py --compare <Unidade>` — conferir uma unidade.
2. `merge-unidades-aom.py --ids X-Y --dry-run` — ver o que mudaria.
3. `merge-unidades-aom.py --ids X-Y --write` — aplicar no catálogo.
4. Revisar diff no Git e testar no app.

Após patch do jogo: `--force-extract` para refrescar o cache antes do merge.

---

## Sync geral (unidades + tecnologias + god powers)

```bash
npm run data:sync-aom -- --dry-run
npm run data:sync-aom -- --write
npm run data:sync-aom -- --only unidades,tecnologias --write
```

Script: `scripts/sync-aom-data.py`. Ver também `tecnologias-aom.md`, `godpowers-aom.md` e `construcoes-aom.md`.
