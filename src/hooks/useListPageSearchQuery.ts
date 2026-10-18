import { useCallback, useLayoutEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

const SEARCH_PARAM = "search";
const SCROLL_PREFIX = "aprendendo-age:list-scroll:";

function scrollStorageKey(pathname: string, search: string) {
  return `${SCROLL_PREFIX}${pathname}${search}`;
}

/**
 * Lê e atualiza o filtro de listagem na query `?search=`, com `replace` para não
 * encher o histórico a cada tecla. Ao voltar do detalhe, o filtro volta com a URL.
 *
 * Persiste `window.scrollY` em `sessionStorage` por `pathname + search` (sem
 * `ScrollRestoration` do RR, que exige data router com `RouterProvider`).
 */
export function useListPageSearchQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname, search } = useLocation();

  const q = useMemo(() => searchParams.get(SEARCH_PARAM) ?? "", [searchParams]);

  const scrollKey = useMemo(() => scrollStorageKey(pathname, search), [pathname, search]);

  useLayoutEffect(() => {
    const persist = () => {
      try {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
      } catch {
        /* sessionStorage indisponível */
      }
    };
    try {
      const raw = sessionStorage.getItem(scrollKey);
      if (raw != null) {
        const y = Number(raw);
        if (Number.isFinite(y) && y >= 0) window.scrollTo(0, y);
      }
    } catch {
      /* sessionStorage indisponível */
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        persist();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      // Roda antes do AppShell levar o detalhe ao topo, senão gravaria scroll 0.
      persist();
    };
  }, [scrollKey]);

  const setQ = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next.trim()) p.set(SEARCH_PARAM, next);
          else p.delete(SEARCH_PARAM);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [q, setQ] as const;
}
