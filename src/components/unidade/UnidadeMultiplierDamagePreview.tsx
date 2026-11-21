import type { LocaleCatalog } from "@/data/catalogLocale";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveMultiplicadorIcon } from "@/lib/unidadeMultiplicador";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";

type Unidade = LocaleCatalog["unidades"][number];

function parseSimpleMultiplier(value: string): number | null {
  const normalized = value.trim().replace(",", ".").replace(/x$/i, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function UnidadeMultiplierDamagePreview({ unidade }: { unidade: Unidade }) {
  const { t, locale } = useTranslation();
  const multipliers = unidade.multiplicador ?? [];
  const damageTypes = [
    {
      value: unidade.dano_cortante,
      icon: "hackdamage",
      label: t("spreadsheet.unidades.hackDamage"),
    },
    {
      value: unidade.dano_perfurante,
      icon: "piercedamage",
      label: t("spreadsheet.unidades.pierceDamage"),
    },
  ].filter((damage): damage is { value: number; icon: string; label: string } => damage.value != null);

  const rows = damageTypes.flatMap((damage) =>
    multipliers.flatMap((multiplier, index) => {
      const factor = parseSimpleMultiplier(multiplier.value);
      if (factor == null) return [];
      return [{
        key: `${damage.icon}-${multiplier.type}-${index}`,
        damage,
        multiplier,
        factor,
        calculatedDamage: damage.value * factor,
      }];
    }),
  );

  if (!rows.length) return null;

  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const betterIcon = resolveTokenIconSrc("aomr_better_icon");
  const worseIcon = resolveTokenIconSrc("aomr_worse_icon");

  return (
    <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3 sm:grid-cols-3">
      {rows.map(({ key, damage, multiplier, factor, calculatedDamage }) => {
        const damageIcon = resolveTokenIconSrc(damage.icon);
        const targetToken = resolveMultiplicadorIcon(multiplier);
        const targetIcon = targetToken ? resolveTokenIconSrc(targetToken) : undefined;
        const favorable = factor >= 1;
        const resultIcon = favorable ? betterIcon : worseIcon;

        return (
          <div
            key={key}
            title={`${damage.label} × ${multiplier.type} (${numberFormatter.format(factor)}x)`}
            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-zinc-800/90 bg-zinc-900/65 px-2.5 py-2"
          >
            {damageIcon ? <img src={damageIcon} alt="" aria-hidden className="size-5 shrink-0 object-contain" /> : null}
            <span className={favorable ? "text-xs font-semibold tabular-nums text-emerald-400" : "text-xs font-semibold tabular-nums text-red-400"}>
              {numberFormatter.format(calculatedDamage)}
            </span>
            {targetIcon ? (
              <img src={targetIcon} alt="" aria-hidden className="size-3.5 shrink-0 object-contain" />
            ) : (
              <span className="max-w-16 truncate text-[9px] text-zinc-400">{multiplier.type}</span>
            )}
            {resultIcon ? (
              <img src={resultIcon} alt="" aria-hidden className="size-3.5 shrink-0 object-contain" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
