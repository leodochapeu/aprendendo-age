import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { useMusic } from "@/context/MusicContext";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { useTranslation } from "@/hooks/useTranslation";
import { canSendSiteNotification } from "@/lib/auth/constants";
import { cn } from "@/lib/cn";
import { localeAuthPath, localeNotificationComposePath } from "@/lib/localeRoutes";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function menuItemClassName() {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
    "text-zinc-200 transition-colors hover:bg-zinc-800/90 hover:text-white",
  );
}

export function SettingsMenu({ className }: { className?: string }) {
  const { t, locale } = useTranslation();
  const { status, profile, profileLoadState } = useAuth();
  const { ligada, volume, faixa, setLigada, setVolume, avancar } = useMusic();
  const { targetFlag, switchLocale, switchLanguageLabel } = useLocaleSwitch();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";
  const canSendNotification =
    isAuthenticated && profileLoadState === "ready" && canSendSiteNotification(profile?.role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClose = () => setOpen(false);
    window.addEventListener("shell:close-settings", onClose);
    return () => window.removeEventListener("shell:close-settings", onClose);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => {
            const next = !current;
            if (next) window.dispatchEvent(new Event("shell:close-notifications"));
            return next;
          })
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("settings.openMenu")}
        title={t("settings.title")}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border border-aom-border",
          "bg-zinc-950/90 px-3 shadow-lg shadow-black/30 backdrop-blur-sm",
          "text-zinc-200 transition hover:border-amber-500/45 hover:bg-zinc-900",
          "focus:outline-none focus:ring-2 focus:ring-amber-500/35",
        )}
      >
        <GearIcon className="shrink-0 text-amber-200/95" />
        <span className="hidden text-sm font-medium text-amber-200/95 md:inline">{t("settings.title")}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("settings.title")}
          className={cn(
            "absolute right-0 mt-2 w-[17.5rem] rounded-xl border border-aom-border",
            "bg-zinc-950/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-sm",
          )}
        >
          {!isAuthenticated ? (
            <>
              <Link
                role="menuitem"
                to={localeAuthPath(locale, "login")}
                className={menuItemClassName()}
                onClick={() => setOpen(false)}
              >
                {t("settings.login")}
              </Link>
              <Link
                role="menuitem"
                to={localeAuthPath(locale, "register")}
                className={menuItemClassName()}
                onClick={() => setOpen(false)}
              >
                {t("settings.register")}
              </Link>
            </>
          ) : (
            <Link
              role="menuitem"
              to={localeAuthPath(locale, "profile")}
              className={menuItemClassName()}
              onClick={() => setOpen(false)}
            >
              {t("settings.profile")}
            </Link>
          )}

          {canSendNotification ? (
            <Link
              role="menuitem"
              to={localeNotificationComposePath(locale)}
              className={menuItemClassName()}
              onClick={() => setOpen(false)}
            >
              {t("notifications.composeMenu")}
            </Link>
          ) : null}

          <div className="my-1 border-t border-aom-border/80" role="separator" />

          <div className="px-3 py-2" role="group" aria-label={t("settings.music")}>
            <button
              type="button"
              data-musica="interruptor"
              role="menuitemcheckbox"
              aria-checked={ligada}
              aria-pressed={ligada}
              aria-label={ligada ? t("settings.musicDisable") : t("settings.musicEnable")}
              className="flex w-full items-center justify-between gap-3 text-left text-sm text-zinc-200"
              onClick={() => setLigada(!ligada)}
            >
              <span>{t("settings.music")}</span>
              <span
                aria-hidden
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  ligada ? "bg-amber-500/80" : "bg-zinc-700",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-zinc-950 transition-transform",
                    ligada ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>

            <label className="mt-3 block">
              <span className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                <span>{t("settings.musicVolume")}</span>
                <output className="tabular-nums text-amber-200/90">{volume}%</output>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                aria-label={t("settings.musicVolume")}
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-amber-400"
                onChange={(event) => setVolume(Number(event.target.value))}
              />
            </label>

            {faixa ? (
              <div className="mt-2">
                <p className="truncate text-xs text-amber-200/75" title={faixa.title}>
                  <span className="text-zinc-500">{t("settings.nowPlaying")}: </span>
                  {faixa.title}
                </p>
                <button
                  type="button"
                  onClick={avancar}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-amber-200/80"
                >
                  <span aria-hidden className="text-[10px] leading-none">
                    ▶▶
                  </span>
                  {t("settings.musicNext")}
                </button>
              </div>
            ) : null}
          </div>

          <div className="my-1 border-t border-aom-border/80" role="separator" />

          <button
            type="button"
            role="menuitem"
            className={menuItemClassName()}
            onClick={() => {
              switchLocale();
              setOpen(false);
            }}
            aria-label={switchLanguageLabel}
          >
            <span aria-hidden className="text-base leading-none">
              {targetFlag}
            </span>
            {t("settings.changeLanguage")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
