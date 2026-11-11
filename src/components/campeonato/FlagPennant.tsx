import { cn } from "@/lib/cn";
import { countryLabelFromStored, flagIsoFromStoredCountry } from "@/lib/playerCountry";
import type { RankTierId } from "@/lib/rankClassification";

/** Bandeiras em que o desenho ocupa a largura inteira — o corte central apaga faixas ou o brasão. */
const FULL_FLAG = new Set(["mx", "rs", "ro", "fr"]);

/** Estandarte pendurado, no formato de bandeira de tecido com barra e ponta. */
export function FlagPennant({
  country,
  tier,
  className,
}: {
  country: string | null | undefined;
  tier?: RankTierId;
  className?: string;
}) {
  const iso = flagIsoFromStoredCountry(country);
  const label = countryLabelFromStored(country);
  if (!iso || !label) return null;

  return (
    <div className={cn("flag-pennant", tier && `flag-pennant--${tier}`, className)} role="img" aria-label={label} title={label}>
      <div className="flag-pennant__rod" aria-hidden />
      <div className="flag-pennant__cloth" aria-hidden>
        <img
          src={`/assets/flags/${iso}.svg`}
          alt=""
          draggable={false}
          className={cn(iso === "us" && "flag-pennant__cloth-img--hoist", FULL_FLAG.has(iso) && "flag-pennant__cloth-img--full")}
        />
        <div className="flag-pennant__folds" />
      </div>
    </div>
  );
}
