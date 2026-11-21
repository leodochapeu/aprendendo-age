import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

/** Confirmação do ataque, presa embaixo, sem escurecer o restante da tela. */
export function BattleConfirmSheet({ open, title, description, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4">
      <section
        role="dialog"
        aria-modal="false"
        aria-label={title}
        className="pointer-events-auto w-full max-w-3xl animate-[battleSheetIn_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-2xl border border-amber-200/30 bg-[#16130f]/95 shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md motion-reduce:animate-none"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide text-amber-100">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-zinc-300">{description}</p> : null}
        </div>
        <div className="px-4 py-3">{children}</div>
      </section>
      <style>{`
        @keyframes battleSheetIn {
          from { opacity: 0; transform: translateY(110%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
