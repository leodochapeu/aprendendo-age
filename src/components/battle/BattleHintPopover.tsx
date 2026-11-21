import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

export function BattleHintPopover({
  anchorEl,
  title,
  hint,
  onClose,
}: {
  anchorEl: HTMLElement;
  title: string;
  hint: string;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, arrow: 120, place: "above" as "above" | "below" });

  useLayoutEffect(() => {
    const update = () => {
      const pad = 12;
      const gap = 10;
      const rect = anchorEl.getBoundingClientRect();
      const width = popoverRef.current?.offsetWidth ?? 240;
      const height = popoverRef.current?.offsetHeight ?? 88;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
      const above = rect.top - gap - height;
      const place = above >= pad ? "above" : "below";
      const top = place === "above" ? above : rect.bottom + gap;
      const arrow = Math.max(16, Math.min(width - 16, rect.left + rect.width / 2 - left));
      setPosition({ top, left, arrow, place });
    };
    update();
    const el = popoverRef.current;
    const observer = el ? new ResizeObserver(update) : null;
    if (el && observer) observer.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorEl, title, hint]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [anchorEl, onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      role="status"
      className="fixed z-[80] w-64 rounded-xl border border-amber-200/40 bg-[#1a1612] px-3 py-2.5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-sm font-semibold text-amber-50">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{hint}</p>
      <span
        aria-hidden
        className={cn(
          "absolute size-2.5 -translate-x-1/2 rotate-45 border-amber-200/40 bg-[#1a1612]",
          position.place === "above" ? "-bottom-1.5 border-b border-r" : "-top-1.5 border-l border-t",
        )}
        style={{ left: position.arrow }}
      />
    </div>,
    document.body,
  );
}
