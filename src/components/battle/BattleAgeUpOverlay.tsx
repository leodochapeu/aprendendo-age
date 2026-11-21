import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import type { PlayableEraId } from "@/lib/battleGame";

type Props = {
  open: boolean;
  eraId: PlayableEraId;
  eraName: string;
  eraIcon?: string | null;
  onDone: () => void;
};

export function BattleAgeUpOverlay({ open, eraName, eraIcon, onDone }: Props) {
  const { t } = useTranslation();
  const iconSrc = getIconFieldUrl(eraIcon);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(timer);
  }, [open, onDone]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,196,70,0.22),transparent_58%)]" aria-hidden />
      <div className="epic-gold-glow" aria-hidden />
      <div className="relative animate-[battleAgePulse_1.8s_ease-out] text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300/80">
          {t("pages.battle.ageUpLabel")}
        </p>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            className="mx-auto mt-4 size-24 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.45)]"
          />
        ) : null}
        <p className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-wide text-amber-50 sm:text-5xl">
          {eraName}
        </p>
        <p className="mt-2 text-sm text-zinc-400">{t("pages.battle.ageUpHint")}</p>
      </div>
      <style>{`
        @keyframes battleAgePulse {
          0% { opacity: 0; transform: scale(0.86); }
          25% { opacity: 1; transform: scale(1.04); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.9; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
