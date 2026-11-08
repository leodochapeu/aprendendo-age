import { cn } from "@/lib/cn";
import { countryLabelFromStored, flagIsoFromStoredCountry } from "@/lib/playerCountry";

/** Estandarte pendurado, no formato de bandeira de tecido com barra e ponta. */
export function FlagPennant({
  country,
  className,
}: {
  country: string | null | undefined;
  className?: string;
}) {
  const iso = flagIsoFromStoredCountry(country);
  const label = countryLabelFromStored(country);
  if (!iso || !label) return null;

  return (
    <div className={cn("flag-pennant", className)} role="img" aria-label={label} title={label}>
      <div className="flag-pennant__rod" aria-hidden />
      <div className="flag-pennant__cloth" aria-hidden>
        <img src={`/assets/flags/${iso}.svg`} alt="" draggable={false} />
        <div className="flag-pennant__folds" />
      </div>
    </div>
  );
}
