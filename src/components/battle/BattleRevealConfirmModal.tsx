import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";

type ConfirmProps = {
  open: boolean;
  title: string;
  description: string;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function BattleRevealConfirmModal({ open, title, description, cost, onClose, onConfirm }: ConfirmProps) {
  const { t } = useTranslation();
  const favorIcon = getIconFieldUrl("favoraom");

  return (
    <ModalApp open={open} onClose={onClose} title={title} description={description} className="max-w-md">
      <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-950/30 px-4 py-3">
        {favorIcon ? <img src={favorIcon} alt="" aria-hidden className="size-6 object-contain" /> : null}
        <span className="text-lg font-bold tabular-nums text-blue-100">{cost}</span>
        <span className="text-sm text-blue-200/70">{t("pages.battle.favor")}</span>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
        >
          {t("pages.battle.cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {t("pages.battle.revealConfirm")}
        </button>
      </div>
    </ModalApp>
  );
}

export function RevealEyeButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || active}
      onClick={onClick}
      className={cn(
        "ml-auto flex size-10 shrink-0 items-center justify-center rounded-full border transition",
        active
          ? "border-amber-200/80 bg-amber-500/20 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.4)]"
          : "border-white/20 bg-black/45 text-zinc-100 hover:border-amber-200/60 hover:text-amber-50",
        disabled && !active && "cursor-not-allowed opacity-40 hover:border-white/20 hover:text-zinc-100",
      )}
    >
      <EyeIcon open={active} />
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r={open ? "2.6" : "2.2"} fill={open ? "currentColor" : "none"} />
    </svg>
  );
}
