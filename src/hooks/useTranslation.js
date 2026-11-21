import { useLocaleContext } from "@/context/LocaleContext";
export function useTranslation() {
    const { t, locale, setLocale, toggleLocale } = useLocaleContext();
    return { t, locale, setLocale, toggleLocale };
}
