import { useMemo } from "react";
import { useLocaleContext } from "@/context/LocaleContext";
import { createEntityResolver } from "@/lib/entityResolve";
export function useEntityResolver() {
    const { catalog } = useLocaleContext();
    return useMemo(() => createEntityResolver(catalog), [catalog]);
}
