import { useLocaleContext } from "@/context/LocaleContext";
export function useCatalog() {
    return useLocaleContext().catalog;
}
