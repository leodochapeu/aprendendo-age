import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type RefObject } from "react";
import { createPortal } from "react-dom";

import { CatalogHoverPortrait } from "@/components/ui/CatalogHoverPortrait";
import { cn } from "@/lib/cn";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { unitModelUrl } from "@/lib/unitModelUrl";

type Props = {
  nome: string;
  icon?: string | null;
  unitId?: number;
  selected?: boolean;
  disabled?: boolean;
  locked?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
};

const SIZE = {
  sm: "size-14",
  md: "size-20",
  lg: "size-28 sm:size-32",
} as const;

export function BattleUnitPortrait({
  nome,
  icon,
  unitId,
  selected,
  disabled,
  locked,
  size = "md",
  onClick,
  className,
}: Props) {
  const src = getUnidadeAssetUrl({ icon });
  const [previewOpen, setPreviewOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  const body = (
    <>
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden
          className={cn(
            "size-full object-contain p-1.5 transition",
            locked && "grayscale opacity-45",
          )}
        />
      ) : (
        <span className="px-1 text-center text-[10px] leading-tight text-zinc-400">{nome}</span>
      )}
    </>
  );

  const frameClass = cn(
    "relative shrink-0 overflow-hidden rounded-xl border bg-black/55 shadow-md shadow-black/40 transition",
    SIZE[size],
    className,
  );

  const face = onClick ? (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        frameClass,
        selected
          ? "border-amber-200 shadow-[0_0_18px_rgba(255,196,70,0.45)] ring-2 ring-amber-200/50"
          : "border-amber-200/25 hover:border-amber-200/70 hover:bg-black/40",
        disabled && !locked && "cursor-not-allowed opacity-40 hover:border-aom-border",
        locked && "cursor-not-allowed border-zinc-700 bg-zinc-950 hover:border-zinc-700",
      )}
    >
      {body}
      {locked ? <LockMark /> : null}
      <span className="sr-only">{nome}</span>
    </button>
  ) : (
    <div className={cn(frameClass, "border-amber-200/30 shadow-[0_0_18px_rgba(255,196,70,0.28)]")}>
      {body}
    </div>
  );

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
      onFocus={() => setPreviewOpen(true)}
      onBlur={(event: FocusEvent<HTMLSpanElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPreviewOpen(false);
      }}
    >
      {face}
      {previewOpen ? (
        <BattleUnitHover nome={nome} unitId={unitId} portraitSrc={src} anchorRef={anchorRef} />
      ) : null}
    </span>
  );
}

function LockMark() {
  return (
    <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/30">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6 text-zinc-200 drop-shadow">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

function BattleUnitHover({
  nome,
  unitId,
  portraitSrc,
  anchorRef,
}: {
  nome: string;
  unitId?: number;
  portraitSrc?: string;
  anchorRef: RefObject<HTMLSpanElement | null>;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewId = useId();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modelUrl = unitId != null ? unitModelUrl(unitId) : undefined;

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const pad = 10;
      const gap = 10;
      const anchorRect = anchor.getBoundingClientRect();
      const previewWidth = previewRef.current?.offsetWidth ?? 300;
      const previewHeight = previewRef.current?.offsetHeight ?? 280;
      const left = Math.max(
        pad,
        Math.min(anchorRect.left + anchorRect.width / 2 - previewWidth / 2, window.innerWidth - previewWidth - pad),
      );
      const below = anchorRect.bottom + gap;
      const above = anchorRect.top - previewHeight - gap;
      const top = below + previewHeight <= window.innerHeight - pad ? below : Math.max(pad, above);
      setPosition({ top, left });
    };

    updatePosition();
    const observer = previewRef.current ? new ResizeObserver(updatePosition) : null;
    if (previewRef.current && observer) observer.observe(previewRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  return createPortal(
    <div
      ref={previewRef}
      id={previewId}
      role="tooltip"
      className="pointer-events-none fixed z-[300] w-[min(19rem,calc(100vw-1.25rem))] overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/95 text-left shadow-xl shadow-black/60 backdrop-blur-sm"
      style={{ top: position.top, left: position.left }}
    >
      <div className="border-b border-zinc-800/90 px-3.5 py-2.5">
        <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100">{nome}</p>
      </div>
      <div className="p-3">
        <CatalogHoverPortrait modelUrl={modelUrl} portraitSrc={portraitSrc} />
      </div>
    </div>,
    document.body,
  );
}
