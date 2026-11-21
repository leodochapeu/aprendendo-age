import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, type To } from "react-router-dom";

import { AppTag, type AppTagVariant } from "@/components/ui/AppTag";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { cssUrl, watermarkStripImageStyle } from "@/lib/watermarkImageStyle";

export type EntityCardTitleIcon = {
  /** Token em `token_asset_map.json`; ignorado se `src` estiver definido. */
  icon?: string;
  /** URL direta do ícone (ex.: DLC em `/assets/dlc_icons`). */
  src?: string;
  label: string;
};

type EntityCardProps = {
  to: To;
  /**
   * Passado a `<Link state>`, p.ex. a URL do índice (path + `?search=`) para
   * restaurar o filtro ao voltar com "←" na página de detalhe.
   */
  linkState?: unknown;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  /** Ícone ou arte como marca d’água à direita (baixa opacidade); fica acima do fundo em `backgroundCoverSrc`. */
  watermarkSrc?: string;
  /** Imagem de fundo em todo o card (cover, mesma opacidade suave que a faixa da marca d’água); por baixo do ícone e do texto. */
  backgroundCoverSrc?: string;
  /** Se `backgroundCoverSrc` falhar ao carregar (ex. preview 404), usa-se esta URL. */
  backgroundCoverFallbackSrc?: string;
  /** Se true, o subtítulo é mostrado dentro de {@link AppTag}. */
  subtitleTag?: boolean;
  /** Estilo do {@link AppTag} do subtítulo (`rich` = não forçar âmbar; útil com cores por tipo). */
  subtitleTagVariant?: AppTagVariant;
  /** Reserva altura fixa para N linhas de subtítulo (ex.: 3 para grelha uniforme). */
  subtitleMinLines?: 2 | 3;
  className?: string;
  /** Modo comparação: card não navega; exibe checkbox e alterna seleção ao clicar. */
  compareMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Quando true e já há 2 outras unidades selecionadas, bloqueia nova seleção. */
  selectDisabled?: boolean;
  /** Tinte de fundo (ex.: rgba) por baixo do cinza — mistura com o card sem substituir o visual base. */
  cardTint?: string;
  /** Ícones à direita do título; `label` aparece no hover (atributo `title`). Sem entrada em `token_asset_map.json`, mostra o texto de `icon`. */
  titleIcons?: EntityCardTitleIcon[];
  /** Borda dourada + brilho ocasional — ex.: mapas da ranqueada. */
  rankedHighlight?: boolean;
  /** Resumo exibido ao passar o mouse ou focar o card. O nome do card é incluído automaticamente no topo. */
  hoverPreview?: ReactNode;
  /** Tooltip mais largo, para o retrato 3D ao lado dos atributos. */
  hoverPreviewWide?: boolean;
};

export function EntityCard({
  to,
  linkState,
  title,
  subtitle,
  meta,
  watermarkSrc,
  backgroundCoverSrc,
  backgroundCoverFallbackSrc,
  subtitleTag = true,
  subtitleTagVariant = "amber",
  subtitleMinLines = 2,
  className,
  compareMode,
  selected,
  onToggleSelect,
  selectDisabled,
  cardTint,
  titleIcons,
  rankedHighlight = false,
  hoverPreview,
  hoverPreviewWide = false,
}: EntityCardProps) {
  const [coverSrc, setCoverSrc] = useState(backgroundCoverSrc);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewId = useId();
  useEffect(() => {
    setCoverSrc(backgroundCoverSrc);
  }, [backgroundCoverSrc]);

  useLayoutEffect(() => {
    if (!previewOpen || !hoverPreview) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const pad = 10;
      const gap = 10;
      const anchorRect = anchor.getBoundingClientRect();
      const previewWidth = previewRef.current?.offsetWidth ?? (hoverPreviewWide ? 704 : 416);
      const previewHeight = previewRef.current?.offsetHeight ?? 180;
      const left = Math.max(
        pad,
        Math.min(
          anchorRect.left + anchorRect.width / 2 - previewWidth / 2,
          window.innerWidth - previewWidth - pad,
        ),
      );
      const below = anchorRect.bottom + gap;
      const above = anchorRect.top - previewHeight - gap;
      const top =
        below + previewHeight <= window.innerHeight - pad
          ? below
          : Math.max(pad, above);

      setPreviewPosition({ top, left });
    };

    updatePosition();
    const resizeObserver = previewRef.current ? new ResizeObserver(updatePosition) : null;
    if (previewRef.current && resizeObserver) resizeObserver.observe(previewRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [hoverPreview, hoverPreviewWide, previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);

  const hasTint = Boolean(cardTint);
  const hasBgCover = Boolean(coverSrc);
  const useCoverFallbackProbe =
    Boolean(
      backgroundCoverSrc &&
        backgroundCoverFallbackSrc &&
        backgroundCoverSrc !== backgroundCoverFallbackSrc,
    );
  const useSubtitleTag = subtitleTag && subtitle != null && subtitle !== "";
  const subtitleBody = useSubtitleTag ? (
    <AppTag
      variant={subtitleTagVariant}
      className="align-top leading-snug [word-break:break-word] normal-case"
    >
      {subtitle}
    </AppTag>
  ) : (
    subtitle
  );

  const shellClass = cn(
    "group relative block overflow-hidden rounded-xl border p-4 transition-colors",
    !hasTint && !hasBgCover && "bg-zinc-900/40",
    !hasTint && hasBgCover && "bg-transparent",
    compareMode ? "cursor-pointer" : false,
    rankedHighlight
      ? "entity-card-ranked border-amber-400/75 shadow-[0_0_0_1px_rgba(251,191,36,0.28),0_0_14px_rgba(245,158,11,0.18)] hover:border-amber-300/90"
      : "border-aom-border hover:border-amber-500/35",
    !hasTint && !hasBgCover && "hover:bg-zinc-900/70",
    selected && compareMode && !hasTint && !hasBgCover ? "border-amber-500/50 bg-zinc-900/70 ring-1 ring-amber-500/30" : false,
    selected && compareMode && hasTint ? "border-amber-500/50 ring-1 ring-amber-500/30" : false,
    selected && compareMode && hasBgCover && !hasTint ? "border-amber-500/50 ring-1 ring-amber-500/30" : false,
    selectDisabled && compareMode && !selected ? "opacity-60" : false,
    className,
  );

  const tintLayers =
    hasTint && cardTint ? (
      <>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit]",
            hasBgCover && "z-[2]",
          )}
          style={{ backgroundColor: cardTint }}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-900/40 transition-colors",
            "group-hover:bg-zinc-900/70",
            selected && compareMode && "bg-zinc-900/70",
            hasBgCover && "z-[3]",
          )}
        />
      </>
    ) : null;

  const bgCoverLayers = hasBgCover ? (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center saturate-125 opacity-[0.5] transition-opacity group-hover:opacity-[0.5]"
          style={{ backgroundImage: cssUrl(coverSrc!) }}
        />
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[1] rounded-[inherit] bg-zinc-900/40 transition-colors",
          "group-hover:bg-zinc-900/70",
          selected && compareMode && !hasTint && "bg-zinc-900/70",
        )}
      />
    </>
  ) : null;

  const wmZ = hasBgCover ? "z-[4]" : "z-0";
  const contentZ = hasBgCover ? "z-[5]" : "z-[1]";

  const inner = (
    <>
      {watermarkSrc ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-[min(52%,20rem)] overflow-hidden",
            wmZ,
          )}
        >
          <div
            className="absolute inset-0 saturate-125 opacity-[0.3] transition-opacity group-hover:opacity-[0.3]"
            style={watermarkStripImageStyle(watermarkSrc)}
          />
        </div>
      ) : null}
      <div className={cn("relative", contentZ)}>
        <div className="flex min-w-0 items-start gap-3">
          {compareMode ? (
            <input
              type="checkbox"
              checked={!!selected}
              disabled={selectDisabled && !selected}
              onChange={(e) => {
                e.stopPropagation();
                if (selectDisabled && !selected) return;
                onToggleSelect?.();
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 size-4 shrink-0 rounded border-aom-border bg-zinc-900 text-amber-600 focus:ring-amber-500/40 disabled:cursor-not-allowed"
              aria-label="Selecionar para comparar"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 flex-1 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100 group-hover:text-amber-50">
              {title}
            </span>
            {titleIcons?.length ? (
              <span className="flex shrink-0 items-center gap-1">
                {titleIcons.map((ti, idx) => {
                  const src = ti.src ?? (ti.icon ? resolveTokenIconSrc(ti.icon) : undefined);
                  const key = ti.src ?? ti.icon ?? ti.label;
                  return (
                    <span key={`${key}-${idx}`} title={ti.label} className="inline-flex">
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          draggable={false}
                          className="size-5 object-contain"
                        />
                      ) : (
                        <span className="max-w-[7rem] truncate text-xs font-normal normal-case text-amber-200/85">
                          {ti.icon ?? ti.label}
                        </span>
                      )}
                    </span>
                  );
                })}
              </span>
            ) : null}
          </div>
        </div>
        {subtitleMinLines === 3 ? (
          <p className="mt-2 line-clamp-3 min-h-[3lh] text-sm leading-relaxed text-zinc-400">
            {subtitle != null ? subtitleBody : "\u00A0"}
          </p>
        ) : subtitle ? (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{subtitleBody}</p>
        ) : null}
        {meta ? <div className="mt-2 text-xs text-zinc-500">{meta}</div> : null}
      </div>
    </>
  );

  const coverProbe =
    useCoverFallbackProbe && hasBgCover && backgroundCoverFallbackSrc ? (
      <img
        key={backgroundCoverSrc}
        src={backgroundCoverSrc}
        alt=""
        className="pointer-events-none h-px w-px max-h-0 max-w-0 overflow-hidden border-0 opacity-0"
        onError={() => {
          if (backgroundCoverFallbackSrc) setCoverSrc(backgroundCoverFallbackSrc);
        }}
      />
    ) : null;

  const preview =
    previewOpen && hoverPreview && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={previewRef}
            id={previewId}
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[300] overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/95 text-left shadow-xl shadow-black/60 backdrop-blur-sm",
              hoverPreviewWide
                ? "w-[min(44rem,calc(100vw-1.25rem))]"
                : "w-[min(26rem,calc(100vw-1.25rem))]",
            )}
            style={{ top: previewPosition.top, left: previewPosition.left }}
          >
            <div className="border-b border-zinc-800/90 px-3.5 py-2.5">
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-amber-100">
                {title}
              </p>
            </div>
            <div className="px-3.5 py-3">{hoverPreview}</div>
          </div>,
          document.body,
        )
      : null;

  const previewHandlers = hoverPreview
    ? {
        onMouseEnter: () => setPreviewOpen(true),
        onMouseLeave: () => setPreviewOpen(false),
        onFocus: () => setPreviewOpen(true),
        onBlur: (event: FocusEvent<HTMLElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreviewOpen(false);
        },
        "aria-describedby": previewOpen ? previewId : undefined,
      }
    : {};

  if (compareMode) {
    return (
      <>
        <div
          ref={(node) => {
            anchorRef.current = node;
          }}
          role="button"
          tabIndex={0}
          className={shellClass}
          onClick={() => {
            if (selectDisabled && !selected) return;
            onToggleSelect?.();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            if (selectDisabled && !selected) return;
            onToggleSelect?.();
          }}
          {...previewHandlers}
        >
          {coverProbe}
          {bgCoverLayers}
          {tintLayers}
          {inner}
        </div>
        {preview}
      </>
    );
  }

  return (
    <>
      <Link
        ref={(node) => {
          anchorRef.current = node;
        }}
        to={to}
        className={shellClass}
        state={linkState}
        {...previewHandlers}
      >
        {coverProbe}
        {bgCoverLayers}
        {tintLayers}
        {inner}
      </Link>
      {preview}
    </>
  );
}
