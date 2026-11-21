import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { CatalogHoverFrame, CatalogHoverStats } from "@/components/ui/CatalogHoverPortrait";
import { EntityCard } from "@/components/ui/EntityCard";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { getAldeaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
import { unitIdMatchingAldeao } from "@/lib/unidadeAldeao";
import { unitModelUrl } from "@/lib/unitModelUrl";

function matches(a: LocaleCatalog["aldeoes"][number], q: string) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [a.nome, a.ingles ?? "", joinRefNomes(a.panteao)].join(" ").toLowerCase().includes(s);
}

function zeroValueClass(value: number | undefined): string | undefined {
  return value === 0 ? "text-zinc-500" : undefined;
}

function gatherBonusValueClass(
  baseValue: number | undefined,
  percentBonus: number | undefined,
): string | undefined {
  if (baseValue === 0) return "text-zinc-500";
  if (percentBonus == null || percentBonus === 0) return undefined;
  return percentBonus > 0 ? "text-emerald-400" : "text-red-400";
}

const toolbarBtn =
  "rounded-xl border border-aom-border bg-zinc-900/50 px-3.5 py-2 text-sm font-medium text-amber-100/95 transition-colors hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45";

export function AldeoesPage() {
  const { t } = useTranslation();
  const { aldeoes, aldeaoSlugById, panteaoById, unidades } = useCatalog();
  const navigate = useNavigate();
  const { pathname, search: locSearch } = useLocation();
  const listIndexState = useMemo(
    () => listIndexLinkStateFromLocation(pathname, locSearch),
    [pathname, locSearch],
  );
  const [q, setQ] = useListPageSearchQuery();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const filtered = useMemo(() => aldeoes.filter((a) => matches(a, q)), [aldeoes, q]);

  function toggleSelect(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((x) => x !== slug);
      if (prev.length >= 2) return prev;
      return [...prev, slug];
    });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setSelectedSlugs([]);
  }

  function enterCompareMode() {
    setCompareMode(true);
    setSelectedSlugs([]);
  }

  const canCompare = selectedSlugs.length === 2;

  return (
    <div>
      <ListPageStickyHeader>
        <PageHeader
          title={t("pages.aldeoes.title")}
          description={t("pages.aldeoes.description")}
          className="!mb-0"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchField value={q} onChange={setQ} placeholder={t("common.filter")} id="aldeoes-search" />
          <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
            {!compareMode ? (
              <button type="button" className={toolbarBtn} onClick={enterCompareMode}>
                {t("common.compareMode")}
              </button>
            ) : (
              <>
                <button type="button" className={toolbarBtn} onClick={exitCompareMode}>
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className={toolbarBtn}
                  disabled={!canCompare}
                  onClick={() => {
                    if (!canCompare) return;
                    navigate(`/aldeoes/compare/${selectedSlugs[0]}/${selectedSlugs[1]}`);
                  }}
                >
                  {t("common.compare")}
                </button>
              </>
            )}
          </div>
        </div>
      </ListPageStickyHeader>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => {
          const slug = aldeaoSlugById.get(a.id) ?? String(a.id);
          const selected = selectedSlugs.includes(slug);
          const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
          const panteaoId = firstNumId(a.panteao);
          const tintNome = panteaoId != null ? (panteaoById.get(panteaoId)?.nome ?? "") : "";
          const matchedUnitId = unitIdMatchingAldeao(a, unidades);

          return (
            <li key={a.id}>
              <EntityCard
                to={`/aldeoes/${slug}`}
                linkState={listIndexState}
                title={a.nome}
                cardTint={pantheonCardTint(tintNome)}
                subtitle={firstNome(a.panteao) ? <NotionText text={firstNome(a.panteao)!} /> : undefined}
                meta={<MetaNotionLine parts={[a.ingles]} />}
                hoverPreviewWide
                hoverPreview={
                  <CatalogHoverFrame
                    modelUrl={matchedUnitId != null ? unitModelUrl(matchedUnitId) : undefined}
                    portraitSrc={getAldeaoAssetUrl(a)}
                  >
                    <CatalogHoverStats
                      items={[
                        {
                          icon: "aomr_hit_points_icon",
                          label: t("spreadsheet.unidades.hitPoints"),
                          value: a.vida,
                          valueClassName: zeroValueClass(a.vida),
                        },
                        {
                          icon: "aomr_caribou_icon",
                          label: t("spreadsheet.aldeoes.hunt"),
                          value: a.cacar,
                          valueClassName: gatherBonusValueClass(a.cacar, a.cacar_porcento),
                        },
                        {
                          icon: "aomr_population_provision_icon",
                          label: t("spreadsheet.unidades.population"),
                          value: a.populacao,
                          valueClassName: zeroValueClass(a.populacao),
                        },
                        {
                          icon: "aomr_cow_icon",
                          label: t("spreadsheet.aldeoes.livestock"),
                          value: a.gado_galinhas,
                          valueClassName: gatherBonusValueClass(a.gado_galinhas, a.gado_porcento),
                        },
                        {
                          icon: "aomr_time_icon",
                          label: t("spreadsheet.aldeoes.trainTime"),
                          value: a.tempo_de_treinamento,
                          valueClassName: zeroValueClass(a.tempo_de_treinamento),
                        },
                        {
                          icon: "aomr_berry_bush_icon",
                          label: t("spreadsheet.aldeoes.berries"),
                          value: a.frutinhas,
                          valueClassName: gatherBonusValueClass(a.frutinhas, a.frutinhas_porcento),
                        },
                        {
                          icon: "aomr_farm_icon",
                          label: t("spreadsheet.aldeoes.farm"),
                          value: a.fazenda,
                          valueClassName: gatherBonusValueClass(a.fazenda, a.fazenda_porcento),
                        },
                        {
                          icon: "aomr_tree_oak_icon",
                          label: t("spreadsheet.aldeoes.tree"),
                          value: a.arvore,
                          valueClassName: gatherBonusValueClass(a.arvore, a.arvore_porcento),
                        },
                        {
                          icon: "aomr_gold_mine_icon",
                          label: t("spreadsheet.aldeoes.mine"),
                          value: a.mina,
                          valueClassName: gatherBonusValueClass(a.mina, a.mina_porcento),
                        },
                        {
                          icon: "aomr_type_building_icon",
                          label: t("spreadsheet.aldeoes.buildSpeed"),
                          value: a.velocidade_construcao,
                          valueClassName: gatherBonusValueClass(
                            a.velocidade_construcao,
                            a.velocidade_construcao_porcento,
                          ),
                        },
                      ]}
                    />
                  </CatalogHoverFrame>
                }
                watermarkSrc={getAldeaoAssetUrl(a)}
                compareMode={compareMode}
                selected={selected}
                selectDisabled={selectDisabled}
                onToggleSelect={() => toggleSelect(slug)}
              />
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">{t("common.noResults")}</p>
      ) : null}
    </div>
  );
}
