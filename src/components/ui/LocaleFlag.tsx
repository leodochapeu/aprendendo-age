import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/cn";

const flagClassName = "h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/25";

function BrazilFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={cn(flagClassName, className)} aria-hidden>
      <rect width="20" height="14" fill="#009C3B" />
      <polygon points="10,1.4 18.4,7 10,12.6 1.6,7" fill="#FFDF00" />
      <circle cx="10" cy="7" r="2.35" fill="#002776" />
      <path
        d="M8.1 7.35c1.15-.85 2.5-1.05 3.85-.5"
        fill="none"
        stroke="#fff"
        strokeWidth="0.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnitedStatesFlag({ className }: { className?: string }) {
  const stripeH = 14 / 13;
  return (
    <svg viewBox="0 0 20 14" className={cn(flagClassName, className)} aria-hidden>
      <rect width="20" height="14" fill="#BF0A30" />
      {Array.from({ length: 6 }, (_, index) => (
        <rect key={index} y={(index * 2 + 1) * stripeH} width="20" height={stripeH} fill="#fff" />
      ))}
      <rect width="8" height={stripeH * 7} fill="#3C3B6E" />
      {[0, 1, 2, 3, 4].flatMap((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={1.15 + col * 1.85 + (row % 2) * 0.9}
            cy={0.85 + row * 1.35}
            r="0.28"
            fill="#fff"
          />
        )),
      )}
    </svg>
  );
}

export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  if (locale === "en") return <UnitedStatesFlag className={className} />;
  return <BrazilFlag className={className} />;
}
