import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RacePlayerCard } from "@/components/jogadores/RacePlayerCard";
import { type AomRacePlayer, playerDisplayLabel } from "@/lib/playersApi";
import { getRankClassification } from "@/lib/rankClassification";

function computePosition(anchor: HTMLElement, popover: HTMLElement | null): { top: number; left: number } {
  const pad = 10;
  const gap = 10;
  const rect = anchor.getBoundingClientRect();
  const width = popover?.offsetWidth ?? 268;
  const height = popover?.offsetHeight ?? 148;

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));

  const below = rect.bottom + gap;
  const above = rect.top - gap - height;
  const fitsBelow = below + height <= window.innerHeight - pad;
  const top = fitsBelow ? below : Math.max(pad, above);

  return { top, left };
}

type RacePlayerPopoverProps = {
  player: AomRacePlayer;
  anchorEl: HTMLElement;
  onClose: () => void;
};

export function RacePlayerPopover({ player, anchorEl, onClose }: RacePlayerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const cls = getRankClassification(player.rr);
  const label = playerDisplayLabel(player);

  useLayoutEffect(() => {
    const update = () => {
      setPosition(computePosition(anchorEl, popoverRef.current));
    };
    update();

    const el = popoverRef.current;
    const ro = el ? new ResizeObserver(update) : null;
    if (el && ro) ro.observe(el);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorEl, player.id, label, cls.categoryLabel, cls.subcategoryLabel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [anchorEl, onClose]);

  return createPortal(
    <div ref={popoverRef} role="dialog" aria-label={label} className="fixed z-[300] w-fit" style={{ top: position.top, left: position.left }}>
      <RacePlayerCard player={player} onNavigate={onClose} />
    </div>,
    document.body,
  );
}
