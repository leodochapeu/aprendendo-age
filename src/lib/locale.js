import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/types";
export const LOCALE_STORAGE_KEY = "aprendendo-age:locale";
export function parseLocale(raw) {
    if (raw === "en" || raw === "pt")
        return raw;
    return DEFAULT_LOCALE;
}
export function readStoredLocale() {
    try {
        return parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    }
    catch {
        return DEFAULT_LOCALE;
    }
}
export function writeStoredLocale(locale) {
    try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    catch {
        /* storage indisponível */
    }
}
export function localeToHtmlLang(locale) {
    return locale === "en" ? "en" : "pt-BR";
}
export function localeCompareTag(locale) {
    return locale === "en" ? "en" : "pt";
}
export function nextLocale(locale) {
    const idx = SUPPORTED_LOCALES.indexOf(locale);
    return SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length] ?? DEFAULT_LOCALE;
}
