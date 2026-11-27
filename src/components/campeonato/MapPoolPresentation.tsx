import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { AppTag } from "@/components/ui/AppTag";
import type { Mapa } from "@/data/catalog";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getMapaAssetUrl, getMapaPreviewUrl } from "@/lib/entityWatermarkUrls";
import { localeSectionPath } from "@/lib/localeRoutes";
import { formatMapaOrigem, mapaOrigemTitleIcons } from "@/lib/mapaOrigemIcons";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";

const HOLD_MS = 6200;
const EXIT_MS = 500;

/** O id guardado é o stem da arte (`nileshallows`). O catálogo às vezes normaliza o inglês para outro texto. */
const CATALOG_KEY_TO_ART: Record<string, string> = {
  templeofthejaguarmoon: "templeofthejaguar",
};

function poolKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

type Slide = { id: string; mapa: Mapa; index: number };

function slidesFor(mapIds: string[], mapas: Mapa[]): Slide[] {
  const byArt = new Map<string, { mapa: Mapa; index: number }>();
  mapas.forEach((mapa, index) => {
    for (const raw of [mapa.ingles, mapa.nome]) {
      const key = poolKey(raw ?? "");
      if (!key) continue;
      const artId = CATALOG_KEY_TO_ART[key] ?? key;
      if (!byArt.has(artId)) byArt.set(artId, { mapa, index });
      if (!byArt.has(key)) byArt.set(key, { mapa, index });
    }
  });
  const slides: Slide[] = [];
  const seen = new Set<string>();
  for (const raw of mapIds) {
    const id = poolKey(raw);
    if (!id || seen.has(id)) continue;
    const found = byArt.get(id);
    if (!found) continue;
    seen.add(id);
    slides.push({ id, mapa: found.mapa, index: found.index });
  }
  return slides;
}

export function MapPoolPresentation({ mapIds }: { mapIds: string[] }) {
  const { t, locale } = useTranslation();
  const { mapas, mapaSlugByIndex } = useCatalog();
  const reduced = useReducedMotion();
  const slides = useMemo(() => slidesFor(mapIds, mapas), [mapIds, mapas]);
  const orderKey = slides.map((slide) => slide.id).join("|");
  const [orderSeen, setOrderSeen] = useState(orderKey);
  const [cursor, setCursor] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const traveling = useRef(false);
  const exitTimer = useRef<number | null>(null);

  if (orderSeen !== orderKey) {
    setOrderSeen(orderKey);
    setCursor(0);
    setVisible(true);
    setCoverFailed(false);
    traveling.current = false;
  }

  const travel = useCallback(
    (dir: 1 | -1) => {
      if (slides.length < 2 || traveling.current) return;
      if (reduced) {
        setCursor((current) => (current + dir + slides.length) % slides.length);
        setCoverFailed(false);
        return;
      }
      traveling.current = true;
      setVisible(false);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
      exitTimer.current = window.setTimeout(() => {
        setCursor((current) => (current + dir + slides.length) % slides.length);
        setCoverFailed(false);
        setVisible(true);
        traveling.current = false;
      }, EXIT_MS);
    },
    [reduced, slides.length],
  );

  useEffect(() => {
    if (paused || reduced || !visible || slides.length < 2) return;
    const id = window.setTimeout(() => travel(1), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [paused, reduced, visible, slides.length, cursor, travel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowRight") travel(1);
      if (event.key === "ArrowLeft") travel(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [travel]);

  useEffect(
    () => () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    },
    [],
  );

  if (slides.length === 0) return null;

  const slide = slides[Math.min(cursor, slides.length - 1)];
  const mapa = slide.mapa;
  const preview = getMapaPreviewUrl(mapa);
  const icon = getMapaAssetUrl(mapa);
  const cover = coverFailed ? icon : (preview ?? icon);
  const slug = mapaSlugByIndex.get(slide.index);
  const origem = formatMapaOrigem(mapa.origem);
  const origemIcons = mapaOrigemTitleIcons(mapa.origem);
  const rankedIcon = mapa.mapas_da_ranqueada ? resolveTokenIconSrc("aomr_type_hero_icon") : undefined;
  const to = slug ? localeSectionPath(locale, "mapas", slug) : localeSectionPath(locale, "mapas");

  return (
    <div
      className="mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <div className="epic-gold-glow" aria-hidden />
        <div className={cn("relative", visible ? "roster-slide-in" : "roster-slide-out")}>
          <Link
            key={slide.id}
            to={to}
            className={cn(
              "group relative block aspect-[16/10] min-h-[18rem] overflow-hidden rounded-3xl border bg-black/50 shadow-lg shadow-black/40",
              mapa.mapas_da_ranqueada
                ? "entity-card-ranked border-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_28px_rgba(245,158,11,0.28)]"
                : "border-amber-200/30",
            )}
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => {
                  if (!coverFailed && icon && cover !== icon) setCoverFailed(true);
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/15" />
            <div className="epic-wind" aria-hidden>
              <span /><span /><span /><span /><span /><span /><span />
            </div>
            {icon ? (
              <img
                src={icon}
                alt=""
                className="pointer-events-none absolute right-4 top-4 z-[3] h-16 w-16 object-contain opacity-90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] sm:h-20 sm:w-20"
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 z-[7] p-5 sm:p-8">
              <div className="flex items-center gap-2">
                {rankedIcon ? <img src={rankedIcon} alt="" className="size-6 shrink-0 object-contain" /> : null}
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-amber-50 sm:text-4xl">{mapa.nome}</h3>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-200">
                {mapa.tipo ? <AppTag>{mapa.tipo}</AppTag> : null}
                {origemIcons.map((item) => (
                  <img key={item.src} src={item.src} alt="" title={item.label} className="size-4 object-contain" />
                ))}
                {origem ? <span>{origem}</span> : null}
              </div>
              {mapa.descricao_resumida ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-200 line-clamp-2">{mapa.descricao_resumida}</p>
              ) : null}
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => travel(-1)}
          disabled={slides.length < 2}
          aria-label={t("pages.championship.mapsPrev")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
        >
          ‹
        </button>
        <p className="min-w-16 text-center text-sm tabular-nums text-amber-100/80" aria-live="polite">
          {Math.min(cursor, slides.length - 1) + 1} / {slides.length}
        </p>
        <button
          type="button"
          onClick={() => travel(1)}
          disabled={slides.length < 2}
          aria-label={t("pages.championship.mapsNext")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
        >
          ›
        </button>
      </div>
      {slides.length > 1 && !reduced ? (
        <div className="mx-auto mt-3 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10">
          {visible && !paused ? (
            <div key={cursor} className="roster-progress h-full bg-amber-200/80" style={{ animationDuration: `${HOLD_MS}ms` }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
