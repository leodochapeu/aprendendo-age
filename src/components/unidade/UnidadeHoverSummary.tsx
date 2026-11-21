import { CatalogHoverStats } from "@/components/ui/CatalogHoverPortrait";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useTranslation } from "@/hooks/useTranslation";
import { formatArmorPercent } from "@/lib/armorDisplay";

type Unidade = LocaleCatalog["unidades"][number];

function unitBenchmarkValueClass(
  value: number | undefined,
  benchmark: number,
  lowerIsBetter: boolean,
): string | undefined {
  if (value === 0) return "text-zinc-500";
  if (value == null) return undefined;
  const isBetter = lowerIsBetter ? value <= benchmark : value >= benchmark;
  return isBetter ? "text-emerald-400" : "text-red-400";
}

const HUMAN_UNIT_BENCHMARKS = {
  totalCost: 147,
  population: 2,
  trainTime: 15,
  moveSpeed: 4.5,
  hitPoints: 80,
  hackDamage: 10,
  pierceDamage: 10,
  attackSpeed: 1,
  hackArmor: 40,
  pierceArmor: 40,
};

const MYTH_UNIT_BENCHMARKS = {
  ...HUMAN_UNIT_BENCHMARKS,
  totalCost: 227,
  hitPoints: 300,
  pierceDamage: 6,
};

const HERO_UNIT_BENCHMARKS = {
  ...MYTH_UNIT_BENCHMARKS,
  totalCost: 288,
};

function hasUnitType(u: Unidade, icons: string[], labels: string[]): boolean {
  return Boolean(
    u.tipo?.some((item) => {
      const icon = item.icon?.toLowerCase();
      const type = item.type.toLowerCase();
      return (icon != null && icons.includes(icon)) || labels.includes(type);
    }),
  );
}

function unitBenchmarksFor(u: Unidade) {
  if (hasUnitType(u, ["aomr_type_hero_icon"], ["herói", "hero"])) return HERO_UNIT_BENCHMARKS;
  if (hasUnitType(u, ["aomr_type_myth_unit_icon"], ["unidade mítica", "myth unit"])) return MYTH_UNIT_BENCHMARKS;
  return HUMAN_UNIT_BENCHMARKS;
}

/** Resumo do card de unidade (custo, atributos e multiplicador) — o mesmo do hover na grade. */
export function UnidadeHoverSummary({ unidade }: { unidade: Unidade }) {
  const { t } = useTranslation();
  const benchmarks = unitBenchmarksFor(unidade);

  return (
    <CatalogHoverStats
      items={[
        {
          icon: "aomr_hit_points_icon",
          label: t("spreadsheet.unidades.hitPoints"),
          value: unidade.pontos_de_vida,
          valueClassName: unitBenchmarkValueClass(unidade.pontos_de_vida, benchmarks.hitPoints, false),
        },
        {
          label: t("common.totalCost"),
          value: unidade.custo_total,
          valueClassName: unitBenchmarkValueClass(unidade.custo_total, benchmarks.totalCost, true),
        },
        {
          icon: "hackdamage",
          label: t("spreadsheet.unidades.hackDamage"),
          value: unidade.dano_cortante,
          valueClassName: unitBenchmarkValueClass(unidade.dano_cortante, benchmarks.hackDamage, false),
        },
        {
          icon: "aomr_population_provision_icon",
          label: t("spreadsheet.unidades.population"),
          value: unidade.populacao,
          valueClassName: unitBenchmarkValueClass(unidade.populacao, benchmarks.population, true),
        },
        {
          icon: "piercedamage",
          label: t("spreadsheet.unidades.pierceDamage"),
          value: unidade.dano_perfurante,
          valueClassName: unitBenchmarkValueClass(unidade.dano_perfurante, benchmarks.pierceDamage, false),
        },
        {
          icon: "aomr_time_icon",
          label: t("spreadsheet.unidades.trainTime"),
          value: unidade.tempo_treinamento,
          valueClassName: unitBenchmarkValueClass(unidade.tempo_treinamento, benchmarks.trainTime, true),
        },
        {
          icon: "aomr_rate_of_fire_icon",
          label: t("spreadsheet.unidades.attackSpeed"),
          value: unidade.velocidade_de_ataque_atk_s,
          valueClassName: unitBenchmarkValueClass(unidade.velocidade_de_ataque_atk_s, benchmarks.attackSpeed, true),
        },
        {
          icon: "hackarmor",
          label: t("spreadsheet.unidades.hackArmor"),
          value: unidade.armadura_anticorte != null ? formatArmorPercent(unidade.armadura_anticorte) : null,
          valueClassName: unitBenchmarkValueClass(unidade.armadura_anticorte, benchmarks.hackArmor, false),
        },
        { icon: "rangeicon", label: t("spreadsheet.unidades.range"), value: unidade.alcance },
        {
          icon: "piercearmor",
          label: t("spreadsheet.unidades.pierceArmor"),
          value: unidade.armadura_antiperfurante != null ? formatArmorPercent(unidade.armadura_antiperfurante) : null,
          valueClassName: unitBenchmarkValueClass(unidade.armadura_antiperfurante, benchmarks.pierceArmor, false),
        },
        {
          icon: "aomr_speed_icon",
          label: t("spreadsheet.unidades.moveSpeed"),
          value: unidade.velocidade_movimento,
          valueClassName: unitBenchmarkValueClass(unidade.velocidade_movimento, benchmarks.moveSpeed, false),
        },
      ]}
    />
  );
}
