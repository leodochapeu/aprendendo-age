import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLocaleCatalog } from "@/data/catalogLocale";
import { getMessagesForLocale, ptMessages } from "@/i18n/locales";
import { createTranslator } from "@/i18n/translate";
import { localeToHtmlLang, readStoredLocale, writeStoredLocale, } from "@/lib/locale";
const LocaleContext = createContext(null);
export function LocaleProvider({ children }) {
    const [locale, setLocaleState] = useState(() => readStoredLocale());
    const setLocale = useCallback((next) => {
        setLocaleState(next);
        writeStoredLocale(next);
    }, []);
    const toggleLocale = useCallback(() => {
        setLocale(locale === "pt" ? "en" : "pt");
    }, [locale, setLocale]);
    useEffect(() => {
        document.documentElement.lang = localeToHtmlLang(locale);
    }, [locale]);
    const catalog = useMemo(() => getLocaleCatalog(locale), [locale]);
    const t = useMemo(() => {
        const primary = getMessagesForLocale(locale);
        return createTranslator(primary, ptMessages);
    }, [locale]);
    const value = useMemo(() => ({ locale, setLocale, toggleLocale, t, catalog }), [locale, setLocale, toggleLocale, t, catalog]);
    return _jsx(LocaleContext.Provider, { value: value, children: children });
}
export function useLocaleContext() {
    const ctx = useContext(LocaleContext);
    if (!ctx) {
        throw new Error("useLocaleContext must be used within LocaleProvider");
    }
    return ctx;
}
