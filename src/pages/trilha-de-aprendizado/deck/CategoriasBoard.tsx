import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { UnidadeHoverSummary } from "@/components/unidade/UnidadeHoverSummary";
import { ModalApp } from "@/components/ui/ModalApp";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNumId } from "@/lib/entityRefs";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { cn } from "@/lib/cn";

type Unidade = LocaleCatalog["unidades"][number];

const INFANTRY = "aomr_type_infantry_icon";
const CAVALRY = "aomr_type_cavalry_icon";
const ARCHER = "aomr_type_archer_icon";
const HUMAN = "aomr_type_human_soldier_icon";
const HERO = "aomr_type_hero_icon";
const MYTH = "aomr_type_myth_unit_icon";
const RANGED = "rangeicon";

/**
 * Arqueiros a pé ficam abaixo de 5. Os montados (biga, turma, cavalaria de arco)
 * começam em 5 — é o que separa o híbrido cavalaria-arco da artilharia.
 */
const MOUNTED_ARCHER_SPEED = 5;

/** Alcance de arma de arremesso. O corpo a corpo fica em torno de 0,75–1,5. */
const THROWN_RANGE = 8;

type CategoryId =
  | "infantry"
  | "infantryVsCavalry"
  | "cavalry"
  | "archers"
  | "hybridCavArcher"
  | "hybridInfArcher";

const CATEGORIES: {
  id: CategoryId;
  labelKey: string;
  icons: string[];
  tone: string;
}[] = [
  {
    id: "infantry",
    labelKey: "pages.trilha.multipliers.categoriesInfantry",
    icons: [INFANTRY],
    tone: "bg-red-400 text-red-950",
  },
  {
    id: "infantryVsCavalry",
    labelKey: "pages.trilha.multipliers.categoriesInfantryVsCavalry",
    icons: [INFANTRY, CAVALRY],
    tone: "bg-orange-300 text-orange-950",
  },
  {
    id: "cavalry",
    labelKey: "pages.trilha.multipliers.categoriesCavalry",
    icons: [CAVALRY],
    tone: "bg-emerald-300 text-emerald-950",
  },
  {
    id: "archers",
    labelKey: "pages.trilha.multipliers.categoriesArchers",
    icons: [ARCHER],
    tone: "bg-sky-300 text-sky-950",
  },
  {
    id: "hybridCavArcher",
    labelKey: "pages.trilha.multipliers.categoriesHybridCavArcher",
    icons: [CAVALRY, ARCHER],
    tone: "bg-fuchsia-300 text-fuchsia-950",
  },
  {
    id: "hybridInfArcher",
    labelKey: "pages.trilha.multipliers.categoriesHybridInfArcher",
    icons: [INFANTRY, ARCHER],
    tone: "bg-pink-300 text-pink-950",
  },
];

function hasIcon(unit: Unidade, icon: string, visibleOnly: boolean): boolean {
  return (unit.tipo ?? []).some((item) => item.icon === icon && (!visibleOnly || !item.hidden));
}

function isHardCavalryCounter(unit: Unidade): boolean {
  return (unit.categoria ?? []).some(
    (item) => item.icon === CAVALRY && /^hard\b/i.test(item.type ?? ""),
  );
}

/**
 * Linha didática do soldado humano.
 * Híbridos e “contra cavalaria” juntam duas categorias e saem da linha simples.
 */
function humanSoldierCategory(unit: Unidade): CategoryId | null {
  if (hasIcon(unit, HERO, false) || hasIcon(unit, MYTH, false)) return null;
  if (!hasIcon(unit, HUMAN, false)) return null;

  const infantry = hasIcon(unit, INFANTRY, true);
  const cavalry = hasIcon(unit, CAVALRY, true);
  const archer = hasIcon(unit, ARCHER, true);
  if (!infantry && !cavalry && !archer) return null;

  if (infantry && archer) return "hybridInfArcher";
  if (cavalry && archer) return "hybridCavArcher";
  if (infantry && hasIcon(unit, RANGED, false) && (unit.alcance ?? 0) >= THROWN_RANGE) {
    return "hybridInfArcher";
  }
  if (archer && (unit.velocidade_movimento ?? 0) >= MOUNTED_ARCHER_SPEED) return "hybridCavArcher";
  if (infantry && isHardCavalryCounter(unit)) return "infantryVsCavalry";
  if (infantry) return "infantry";
  if (cavalry) return "cavalry";
  return "archers";
}

function compareByEra(a: Unidade, b: Unidade): number {
  const era = (firstNumId(a.era) ?? 0) - (firstNumId(b.era) ?? 0);
  if (era !== 0) return era;
  const pantheon = (firstNumId(a.panteao) ?? 0) - (firstNumId(b.panteao) ?? 0);
  if (pantheon !== 0) return pantheon;
  return a.id - b.id;
}

export function CategoriasBoard() {
  const { t, locale } = useTranslation();
  const { unidades, eras, unidadeSlugById } = useCatalog();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const eraIconById = useMemo(() => {
    const map = new Map<number, string>();
    for (const era of eras) {
      if (era.icon) map.set(era.id, era.icon);
    }
    return map;
  }, [eras]);

  const rows = useMemo(() => {
    const grouped = new Map<CategoryId, Unidade[]>();
    for (const category of CATEGORIES) grouped.set(category.id, []);
    for (const unit of unidades) {
      const category = humanSoldierCategory(unit);
      if (!category) continue;
      grouped.get(category)?.push(unit);
    }
    for (const list of grouped.values()) list.sort(compareByEra);
    return CATEGORIES.map((category) => ({
      ...category,
      units: grouped.get(category.id) ?? [],
    })).filter((row) => row.units.length > 0);
  }, [unidades]);

  const selected = selectedId == null ? null : (unidades.find((unit) => unit.id === selectedId) ?? null);
  const selectedSlug = selected ? (unidadeSlugById.get(selected.id) ?? String(selected.id)) : null;

  return (
    <>
      <div
        className="mt-6 overflow-hidden rounded-2xl border border-white/10"
        aria-label={t("pages.trilha.multipliers.categoriesAlt")}
      >
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)] border-b border-black/40 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
          >
            <div className={cn("flex flex-col justify-center gap-2 px-3 py-3", row.tone)}>
              <p className="text-sm font-semibold leading-tight">{t(row.labelKey)}</p>
              <span className="flex items-center gap-1">
                {row.icons.map((icon) => {
                  const src = getTokenAssetUrl(icon);
                  return src ? (
                    <img key={icon} src={src} alt="" className="size-5 object-contain" />
                  ) : null;
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto bg-black/50 px-2 py-2">
              {row.units.map((unit, index) => {
                const eraId = firstNumId(unit.era);
                const previousEra = index > 0 ? firstNumId(row.units[index - 1]?.era) : undefined;
                const eraIcon = eraId != null && eraId !== previousEra ? eraIconById.get(eraId) : undefined;
                const eraSrc = eraIcon ? getTokenAssetUrl(eraIcon) : undefined;
                const portrait = getUnidadeAssetUrl(unit);
                return (
                  <span key={unit.id} className="flex shrink-0 items-center gap-1">
                    {eraSrc ? (
                      <img src={eraSrc} alt="" title={unit.era?.[0]?.nome} className="mx-1 size-6 object-contain" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedId(unit.id)}
                      title={unit.nome}
                      aria-label={t("pages.trilha.multipliers.categoryUnitHint", { name: unit.nome })}
                      className="rounded-md p-0.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      {portrait ? (
                        <img src={portrait} alt="" className="h-16 w-12 object-contain" />
                      ) : (
                        <span className="flex h-16 w-12 items-center justify-center text-[10px] text-zinc-300">
                          {unit.nome.slice(0, 2)}
                        </span>
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ModalApp
        open={selected != null}
        onClose={() => setSelectedId(null)}
        title={selected?.nome ?? ""}
        className="max-w-lg"
      >
        {selected && selectedSlug ? (
          <div className="space-y-5">
            <UnidadeHoverSummary unidade={selected} />
            <Link
              to={localeSectionPath(locale, "unidades", selectedSlug)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {t("pages.trilha.multipliers.categoryOpenUnit")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : null}
      </ModalApp>
    </>
  );
}
