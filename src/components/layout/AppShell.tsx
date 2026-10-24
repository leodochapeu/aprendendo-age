import { useLayoutEffect, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationTicker, NotificationTickerToggle } from "@/components/notifications/NotificationTicker";
import { SettingsMenu } from "@/components/ui/SettingsMenu";
import { MusicProvider } from "@/context/MusicContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/hooks/useTranslation";
import { localeCommunityTopicsPath, localeSectionPath, sectionFromPathSegment, type LocaleSection } from "@/lib/localeRoutes";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { startNovoTagClassNav } from "@/components/start/startNovoTag";

const LIST_INDEX_SECTIONS = new Set<LocaleSection>([
  "construcoes",
  "deuses",
  "poderes",
  "mapas",
  "reliquias",
  "starts",
  "tecnologias",
  "unidades",
]);

/** Só o índice (`/unidades`), não o detalhe (`/unidades/hoplita`) nem a comparação. */
function isCatalogListIndex(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return false;
  const section = sectionFromPathSegment(parts[0]!);
  return section != null && LIST_INDEX_SECTIONS.has(section);
}

type NavLinkItem =
  | { to: string; labelKey: string; end?: boolean; navNovo?: boolean; icon?: string }
  | { to: string; labelKey: string; match: (pathname: string) => boolean; navNovo?: boolean; icon?: string };

type NavModule = {
  id: string;
  labelKey: string;
  items: NavLinkItem[];
};

type NavEntry = NavLinkItem | NavModule;

function isNavModule(entry: NavEntry): entry is NavModule {
  return "items" in entry;
}

function isNavItemActive(item: NavLinkItem, pathname: string): boolean {
  return "match" in item ? item.match(pathname) : pathname === item.to;
}

function buildNavStructure(locale: import("@/i18n/types").Locale): NavEntry[] {
  return [
    { to: "/", labelKey: "nav.home", end: true },
    { to: localeSectionPath(locale, "starts"), labelKey: "nav.starts" },
    {
      to: "/trilha-de-aprendizado",
      labelKey: "nav.trilha",
      match: (p: string) => p === "/trilha-de-aprendizado" || p.startsWith("/trilha-de-aprendizado/"),
    },
    {
      id: "conhecimento-age",
      labelKey: "nav.modules.conhecimentoAge",
      items: [
        { to: localeSectionPath(locale, "panteoes"), labelKey: "nav.pantheons", icon: "aomr_pantheon_greeks_icon" },
        { to: localeSectionPath(locale, "deuses"), labelKey: "nav.gods", icon: "aomr_amaterasu_icon" },
        { to: localeSectionPath(locale, "eras"), labelKey: "nav.eras", icon: "aomr_wonder_age_icon" },
        { to: localeSectionPath(locale, "poderes"), labelKey: "nav.godpowers", icon: "aomr_lightning_storm_icon" },
        { to: localeSectionPath(locale, "construcoes"), labelKey: "nav.buildings", icon: "aomr_town_center_greek_icon" },
        { to: localeSectionPath(locale, "unidades"), labelKey: "nav.units", icon: "aomr_type_myth_unit_icon" },
        { to: localeSectionPath(locale, "aldeoes"), labelKey: "nav.villagers", icon: "aomr_type_villager_icon" },
        { to: localeSectionPath(locale, "mapas"), labelKey: "nav.maps", icon: "aomr_acropolis_icon" },
        { to: localeSectionPath(locale, "reliquias"), labelKey: "nav.reliquias", icon: "aomr_relic_crown_icon" },
        { to: localeSectionPath(locale, "tecnologias"), labelKey: "nav.technologies", icon: "aomr_pickaxe_icon" },
      ],
    },
    {
      id: "comunidade",
      labelKey: "nav.modules.comunidade",
      items: [
        {
          to: localeCommunityTopicsPath(locale),
          labelKey: "nav.communityTopics",
          icon: "aomr_wonder_age_icon",
          match: (p: string) =>
            p === "/comunidade" || p.startsWith("/comunidade/") || p === "/community" || p.startsWith("/community/"),
        },
        {
          to: "/videos-comunidade",
          labelKey: "nav.communityVideos",
          icon: "aomr_relic_scroll_icon",
          match: (p: string) => p === "/videos-comunidade" || p.startsWith("/videos-comunidade/"),
        },
        {
          to: "/jogadores-aom",
          labelKey: "nav.players",
          icon: "aomr_type_hero_icon",
          match: (p: string) => p === "/jogadores-aom" || p === "/aom-players",
        },
        {
          to: "/clans",
          labelKey: "nav.clans",
          icon: "aomr_pantheon_norse_icon",
          match: (p: string) => p === "/clans" || p.startsWith("/clans/"),
        },
        {
          to: "/links-streamers",
          labelKey: "nav.streamerLinks",
          icon: "aomr_ambassadors_icon",
          match: (p: string) => p === "/links-streamers" || p === "/streamer-links",
        },
      ],
    },
  ];
}

function navClass(active: boolean) {
  return cn(
    "flex min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35"
      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white",
  );
}

function NavLinkRow({
  item,
  pathname,
  onItemClick,
  t,
  nested = false,
}: {
  item: NavLinkItem;
  pathname: string;
  onItemClick?: () => void;
  t: (key: string) => string;
  nested?: boolean;
}) {
  const active = isNavItemActive(item, pathname);
  const iconSrc = item.icon ? getTokenAssetUrl(item.icon) : undefined;
  return (
    <NavLink
      to={item.to}
      end={"end" in item ? item.end : false}
      onClick={onItemClick}
      className={cn(navClass(active), nested && "ml-2 border-l border-zinc-800 pl-2.5")}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            className={cn("size-3.5 shrink-0 object-contain", active ? "opacity-90" : "opacity-55")}
          />
        ) : null}
        <span className="min-w-0 truncate">{t(item.labelKey)}</span>
      </span>
      {item.navNovo ? (
        <span className={startNovoTagClassNav} title={t("common.newTooltip")}>
          {t("common.new")}
        </span>
      ) : null}
    </NavLink>
  );
}

function ChevronGlyph({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-zinc-500 transition-transform", expanded && "rotate-90")}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShellNavLinks({
  pathname,
  onItemClick,
  t,
  locale,
}: {
  pathname: string;
  onItemClick?: () => void;
  t: (key: string) => string;
  locale: import("@/i18n/types").Locale;
}) {
  const navStructure = useMemo(() => buildNavStructure(locale), [locale]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of buildNavStructure(locale)) {
      if (isNavModule(entry) && entry.items.some((item) => isNavItemActive(item, pathname))) {
        initial[entry.id] = true;
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const entry of navStructure) {
      if (!isNavModule(entry)) continue;
      if (entry.items.some((item) => isNavItemActive(item, pathname))) {
        setExpandedModules((prev) => (prev[entry.id] ? prev : { ...prev, [entry.id]: true }));
      }
    }
  }, [pathname, navStructure]);

  return (
    <>
      {navStructure.map((entry) => {
        if (!isNavModule(entry)) {
          return (
            <NavLinkRow
              key={entry.to}
              item={entry}
              pathname={pathname}
              onItemClick={onItemClick}
              t={t}
            />
          );
        }

        const expanded = expandedModules[entry.id] ?? false;
        const moduleActive = entry.items.some((item) => isNavItemActive(item, pathname));

        return (
          <div key={entry.id} className="flex flex-col gap-0.5">
            <button
              type="button"
              className={cn(
                navClass(moduleActive),
                "w-full text-left font-medium",
              )}
              aria-expanded={expanded}
              onClick={() =>
                setExpandedModules((prev) => ({ ...prev, [entry.id]: !expanded }))
              }
            >
              <ChevronGlyph expanded={expanded} />
              <span className="min-w-0 flex-1 truncate">{t(entry.labelKey)}</span>
            </button>
            {expanded ? (
              <div className="flex flex-col gap-0.5 pb-0.5">
                {entry.items.map((item) => (
                  <NavLinkRow
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    onItemClick={onItemClick}
                    t={t}
                    nested
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

const DESKTOP_NAV_COLLAPSED_KEY = "aprendendo-age.desktop-nav-collapsed";
const DESKTOP_NAV_AUTO_COLLAPSE_MS = 20_000;

function readDesktopNavCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(DESKTOP_NAV_COLLAPSED_KEY);
    if (stored == null) return true;
    return stored !== "0";
  } catch {
    return true;
  }
}

function writeDesktopNavCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(DESKTOP_NAV_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* preferência local indisponível */
  }
}

function SidebarToggleGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.7" />
      <path
        d={collapsed ? "M13 9.5 16 12l-3 2.5" : "M16 9.5 13 12l3 2.5"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-amber-200/95"
      aria-hidden
    >
      {open ? (
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function AppShell() {
  const { pathname, key } = useLocation();
  const { t, locale } = useTranslation();
  const { bannerOffset, tickerOffset } = useSiteNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(readDesktopNavCollapsed);

  function toggleDesktopNav() {
    setDesktopNavCollapsed((current) => {
      const next = !current;
      writeDesktopNavCollapsed(next);
      return next;
    });
  }

  useEffect(() => {
    if (desktopNavCollapsed) return;
    const timer = window.setTimeout(() => {
      setDesktopNavCollapsed(true);
      writeDesktopNavCollapsed(true);
    }, DESKTOP_NAV_AUTO_COLLAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [desktopNavCollapsed]);

  useLayoutEffect(() => {
    if (isCatalogListIndex(pathname)) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, key]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const appTitle = useMemo(() => t("common.appTitle"), [t]);
  const appByline = useMemo(() => t("common.appByline"), [t]);

  return (
    <MusicProvider>
    <div className="flex min-h-screen flex-col md:flex-row" style={{ paddingTop: bannerOffset }}>
      <NotificationBanner />
      <NotificationTicker />
      <div
        className="fixed right-4 z-[60] flex items-start gap-2"
        style={{
          top: `calc(${bannerOffset}px + max(${tickerOffset > 0 ? "0.625rem" : "1rem"}, env(safe-area-inset-top, 0px)))`,
        }}
      >
        <NotificationTickerToggle />
        <NotificationBell />
        <SettingsMenu />
      </div>

      <header
        className="sticky z-30 flex min-h-16 shrink-0 items-center gap-3 border-b border-aom-border bg-zinc-950/95 px-3 py-3 backdrop-blur-sm md:hidden"
        style={{ top: bannerOffset }}
      >
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-aom-border bg-zinc-900/80 text-amber-200 transition-colors hover:bg-zinc-800/90 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
          aria-expanded={mobileMenuOpen}
          aria-controls="app-mobile-nav"
          aria-label={mobileMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          <MenuGlyph open={mobileMenuOpen} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-200">
            {appTitle}
          </div>
        </div>
        <div className="w-[6.5rem] shrink-0" aria-hidden />
      </header>

      <aside
        id="app-desktop-nav"
        className={cn(
          "relative hidden shrink-0 overflow-hidden border-aom-border bg-zinc-950/95 backdrop-blur-sm md:sticky md:top-0 md:z-20 md:flex md:h-[100dvh] md:min-h-[100dvh] md:min-w-14 md:flex-col md:self-start md:border-r md:transition-[width] md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:md:transition-none",
          desktopNavCollapsed ? "md:w-14" : "md:w-56",
        )}
        style={
          bannerOffset > 0
            ? {
                top: bannerOffset,
                height: `calc(100dvh - ${bannerOffset}px)`,
                minHeight: `calc(100dvh - ${bannerOffset}px)`,
              }
            : undefined
        }
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-14 flex-col items-center gap-3 py-4 transition-opacity duration-300 ease-out motion-reduce:transition-none",
            desktopNavCollapsed ? "opacity-100 delay-300" : "pointer-events-none opacity-0 delay-0",
          )}
          inert={!desktopNavCollapsed}
        >
          <img
            src="/favicon.png?v=2"
            alt={appTitle}
            width={40}
            height={40}
            className="size-10 rounded-md object-cover"
          />
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-aom-border bg-zinc-900/80 text-amber-200 transition-colors hover:bg-zinc-800/90 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
            aria-expanded={false}
            aria-controls="app-desktop-nav"
            aria-label={t("common.expandMenu")}
            title={t("common.expandMenu")}
            onClick={toggleDesktopNav}
          >
            <SidebarToggleGlyph collapsed />
          </button>
        </div>
        <div
          className={cn(
            "flex h-full w-56 shrink-0 flex-col py-6 transition-opacity duration-300 ease-out motion-reduce:transition-none",
            desktopNavCollapsed ? "pointer-events-none opacity-0 delay-0" : "opacity-100 delay-150",
          )}
          inert={desktopNavCollapsed}
        >
          <div className="shrink-0 px-4 pb-3 pt-4 md:px-5 md:pb-6 md:pt-0">
            <div className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide text-amber-200">
              {appTitle}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs text-zinc-500">{appByline}</p>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-aom-border bg-zinc-900/80 text-amber-200/90 transition-colors hover:bg-zinc-800 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
                aria-expanded
                aria-controls="app-desktop-nav"
                aria-label={t("common.collapseMenu")}
                title={t("common.collapseMenu")}
                onClick={toggleDesktopNav}
              >
                <SidebarToggleGlyph collapsed={false} />
              </button>
            </div>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3 md:px-3 md:pb-6">
            <ShellNavLinks pathname={pathname} t={t} locale={locale} />
          </nav>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 md:hidden"
            aria-label={t("common.closeMenu")}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="app-mobile-nav"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,20rem)] flex-col border-r border-aom-border bg-zinc-950 shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("common.navigation")}
          >
            <div className="flex items-start justify-between gap-3 border-b border-aom-border px-4 py-4">
              <div className="min-w-0">
                <div className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide text-amber-200">
                  {appTitle}
                </div>
                <p className="mt-1 text-xs text-zinc-500">{appByline}</p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-aom-border bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
                aria-label={t("common.closeMenu")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              <ShellNavLinks pathname={pathname} onItemClick={() => setMobileMenuOpen(false)} t={t} locale={locale} />
            </nav>
          </div>
        </>
      ) : null}

      <main
        className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10"
        style={tickerOffset > 0 ? { paddingTop: `calc(${tickerOffset}px + 2.5rem)` } : undefined}
      >
        <Outlet />
      </main>
    </div>
    </MusicProvider>
  );
}
