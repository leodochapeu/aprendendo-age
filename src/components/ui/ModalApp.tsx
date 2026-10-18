import { useEffect, useId, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ModalApp({ open, onClose, title, description, children, className }: Props) {
  const titleId = useId();
  const descriptionId = useId();

  const hasDescription = description != null && (typeof description !== "string" || description !== "");
  const describedBy = useMemo(() => (hasDescription ? descriptionId : undefined), [hasDescription, descriptionId]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          className={cn(
            "relative flex max-h-[min(90vh,48rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-aom-border bg-zinc-950 shadow-xl shadow-black/40",
            className,
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-6 border-b border-aom-border bg-zinc-950/80 px-5 py-4">
            <div className="min-w-0 pr-2">
              <h2
                id={titleId}
                className="truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide text-amber-100"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-aom-border bg-zinc-900/50 px-3 py-2 text-sm font-medium text-amber-100/90 transition hover:border-amber-400/50 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
            >
              Fechar
            </button>
          </div>

          {hasDescription || children ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {hasDescription ? (
                <div id={descriptionId} className="text-sm text-zinc-300">
                  {description}
                </div>
              ) : null}
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

