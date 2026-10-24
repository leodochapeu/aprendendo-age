import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { nextLocale } from "@/lib/locale";
import { swapLocaleInPath } from "@/lib/localeRoutes";

export function useLocaleSwitch() {
  const { locale, setLocale, t } = useTranslation();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const targetLocale = nextLocale(locale);

  const switchLocale = useCallback(() => {
    const next = nextLocale(locale);
    setLocale(next);
    const current = `${pathname}${search}`;
    const swapped = swapLocaleInPath(current, next);
    if (swapped !== current) navigate(swapped);
  }, [locale, navigate, pathname, search, setLocale]);

  return {
    locale,
    targetLocale,
    switchLocale,
    switchLanguageLabel: t("common.switchLanguage"),
  };
}
