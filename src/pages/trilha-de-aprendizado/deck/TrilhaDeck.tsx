import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";

import { AtalhosCombatPanel, AtalhosCommandsPanel, AtalhosGroupsPanel, AtalhosIntroPanel, AtalhosSearchPanel } from "./AtalhosPanels";
import { TRILHA_CHAPTERS } from "./chapters";
import { EstrategiaPanel, EstrategiaRankingPanel } from "./EstrategiaPanels";
import { ForcasCyclePanel, ForcasDamagePanel, ForcasMultipliersPanel, ForcasRolesPanel } from "./ForcasPanels";
import { TrilhaJumpContext } from "./jump";
import { ErasPanel, IntroPanel, SimPanel, StartsPanel, UnidadesPanel, VideoPanel } from "./TrailPanels";

const PANELS = [
  { id: "inicio", chapterId: "inicio", Component: IntroPanel },
  { id: "forcas", chapterId: "forcas", Component: ForcasMultipliersPanel },
  { id: "forcas-ciclo", chapterId: "forcas", Component: ForcasCyclePanel },
  { id: "forcas-papeis", chapterId: "forcas", Component: ForcasRolesPanel },
  { id: "forcas-dano", chapterId: "forcas", Component: ForcasDamagePanel },
  { id: "eras", chapterId: "eras", Component: ErasPanel },
  { id: "unidades", chapterId: "unidades", Component: UnidadesPanel },
  { id: "atalhos", chapterId: "atalhos", Component: AtalhosIntroPanel },
  { id: "atalhos-busca", chapterId: "atalhos", Component: AtalhosSearchPanel },
  { id: "atalhos-comandos", chapterId: "atalhos", Component: AtalhosCommandsPanel },
  { id: "atalhos-grupos", chapterId: "atalhos", Component: AtalhosGroupsPanel },
  { id: "atalhos-combate", chapterId: "atalhos", Component: AtalhosCombatPanel },
  { id: "starts", chapterId: "starts", Component: StartsPanel },
  { id: "estrategia", chapterId: "estrategia", Component: EstrategiaPanel },
  { id: "estrategia-ranking", chapterId: "estrategia", Component: EstrategiaRankingPanel },
  { id: "video", chapterId: "video", Component: VideoPanel },
  { id: "simulador", chapterId: "simulador", Component: SimPanel },
] as const;

function readHash(): string | null {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function useStickTop() {
  const { tickerOffset, bannerOffset } = useSiteNotifications();
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return desktop ? bannerOffset + tickerOffset : bannerOffset + 64;
}

export function TrilhaDeck() {
  const { t } = useTranslation();
  const stickTop = useStickTop();
  const navRef = useRef<HTMLElement>(null);
  const scrollLock = useRef(0);
  const [activeId, setActiveId] = useState(() => readHash() ?? "inicio");

  const goTo = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActiveId(id);
    scrollLock.current = performance.now() + (scrollBehavior() === "smooth" ? 900 : 80);
    target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    const nextUrl = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    const id = readHash();
    if (!id || !PANELS.some((panel) => panel.id === id)) return;
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block: "start" });
    setActiveId(id);
    scrollLock.current = performance.now() + 500;
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (performance.now() < scrollLock.current) return;
        const marker = stickTop + (navRef.current?.offsetHeight ?? 56) + 12;
        let current: string = PANELS[0].id;
        for (const panel of PANELS) {
          const element = document.getElementById(panel.id);
          if (!element) continue;
          if (element.getBoundingClientRect().top <= marker) current = panel.id;
        }
        setActiveId((previous) => (previous === current ? previous : current));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [stickTop]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      const index = PANELS.findIndex((panel) => panel.id === activeId);
      const nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
      const next = PANELS[nextIndex];
      if (!next) return;
      event.preventDefault();
      goTo(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, goTo]);

  const activeIndex = Math.max(0, PANELS.findIndex((panel) => panel.id === activeId));
  const activeChapterId = PANELS[activeIndex]?.chapterId ?? "inicio";

  return (
    <TrilhaJumpContext.Provider value={goTo}>
      <div
        className="relative -mx-4 -mb-6 bg-[#07080c] pb-16 text-zinc-100 md:-mx-10 md:-mb-10"
        style={{ "--trilha-stick": `${stickTop}px` } as CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_62%)]"
        />

        <nav
          ref={navRef}
          aria-label={t("pages.trilha.deck.indexAria")}
          className="sticky z-30 border-b border-white/10 bg-[#07080c]/90 backdrop-blur-xl"
          style={{ top: stickTop }}
        >
          <div className="mx-auto max-w-6xl px-3 py-2.5 md:px-6 md:pr-40">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
                <button
                  type="button"
                  aria-label={t("pages.trilha.deck.prev")}
                  onClick={() => PANELS[activeIndex - 1] && goTo(PANELS[activeIndex - 1].id)}
                  disabled={activeIndex === 0}
                  className="rounded-full px-3 py-2 text-base font-medium text-zinc-100 transition hover:bg-white/10 disabled:opacity-30"
                >
                  {t("pages.trilha.deck.prev")}
                </button>
                <p className="min-w-12 px-1 text-center text-sm tabular-nums text-zinc-200">
                  {activeIndex + 1}/{PANELS.length}
                </p>
                <button
                  type="button"
                  aria-label={t("pages.trilha.deck.next")}
                  onClick={() => PANELS[activeIndex + 1] && goTo(PANELS[activeIndex + 1].id)}
                  disabled={activeIndex >= PANELS.length - 1}
                  className="rounded-full bg-zinc-50 px-3 py-2 text-base font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-30"
                >
                  {t("pages.trilha.deck.next")}
                </button>
              </div>
            </div>
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {TRILHA_CHAPTERS.map((item, index) => {
                const active = item.id === activeChapterId;
                const firstPanel = PANELS.find((panel) => panel.chapterId === item.id);
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      data-chapter-tab={item.id}
                      aria-current={active ? "true" : undefined}
                      onClick={() => firstPanel && goTo(firstPanel.id)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
                        active ? "bg-zinc-50 text-zinc-950" : "text-zinc-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {index > 0 ? <span className="mr-1.5 tabular-nums opacity-60">{index}</span> : null}
                      {t(item.shortKey)}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-amber-300 transition-[width] duration-300"
              style={{ width: `${((activeIndex + 1) / PANELS.length) * 100}%` }}
            />
          </div>
        </nav>

        <div className="relative">
          {PANELS.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        </div>
      </div>
    </TrilhaJumpContext.Provider>
  );
}
