import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

export type MultiSelectOption = {
  value: string;
  label: string;
  iconSrc?: string;
};

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-zinc-400 transition-transform", open && "rotate-180")}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MultiSelect({ label, placeholder, options, value, onChange }: MultiSelectProps) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const selected = options.filter((option) => value.includes(option.value));

  const selectionKey = value.join("\0");

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const flip = spaceBelow < 220 && spaceAbove > spaceBelow;
      setBox(
        flip
          ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
          : { top: rect.bottom + 4, left: rect.left, width: rect.width },
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, selectionKey]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);
  }

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-xl border bg-aom-card px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25",
          value.length > 0 ? "border-amber-500/40" : "border-aom-border",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selected.length === 0 ? (
            <span className="text-zinc-500">{placeholder}</span>
          ) : (
            selected.map((option) => (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100"
              >
                {option.iconSrc ? (
                  <img src={option.iconSrc} alt="" aria-hidden className="size-4 shrink-0 object-contain" />
                ) : null}
                <span className="truncate">{option.label}</span>
              </span>
            ))
          )}
        </span>
        <Chevron open={open} />
      </button>
      {open && box
        ? createPortal(
            <div
              ref={panelRef}
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              style={{
                position: "fixed",
                top: box.top,
                bottom: box.bottom,
                left: box.left,
                width: box.width,
                zIndex: 70,
              }}
              className="max-h-60 overflow-y-auto rounded-xl border border-aom-border bg-zinc-950 py-1 shadow-xl shadow-black/50"
            >
              {options.map((option) => {
                const active = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
                      active ? "bg-amber-500/15 text-amber-100" : "text-zinc-200 hover:bg-zinc-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        active
                          ? "border-amber-400 bg-amber-500/30 text-amber-100"
                          : "border-zinc-600 text-transparent",
                      )}
                      aria-hidden
                    >
                      ✓
                    </span>
                    {option.iconSrc ? (
                      <img src={option.iconSrc} alt="" aria-hidden className="size-5 shrink-0 object-contain" />
                    ) : (
                      <span className="size-5 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
