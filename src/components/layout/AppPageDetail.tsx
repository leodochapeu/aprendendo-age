import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { BackLink } from "@/components/ui/BackLink";
import { listIndexReturnTo } from "@/lib/listIndexReturnState";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

/** Mesmo fade do detalhe de mapa: opaco no topo, some para baixo. */
const HERO_BACKGROUND_MASK =
  "linear-gradient(to bottom, #000 0%, #000 18%, rgba(0,0,0,0.45) 42%, transparent 100%)";

export type AppPageDetailProps = {
  backTo: string;
  backLabel: string;
  title: ReactNode;
  description?: ReactNode;
  headerIconSrc?: string;
  descriptionTag?: boolean;
  actions?: ReactNode;
  /** Setas de anterior/próximo, na extrema direita da linha do título. */
  siblingNav?: ReactNode;
  /**
   * Imagem de fundo no topo do detalhe (URL em `/public`), com fade para baixo.
   * Compensa o padding do `<main>` para o fundo ir até ao topo da coluna.
   */
  heroBackgroundSrc?: string;
  /** Se o URL principal (p.ex. preview) não carregar, tenta-se este. */
  heroBackgroundFallbackSrc?: string;
  /** Junta-se ao `PageHeader` (por omissão `mb-0` porque o bloco hero já tem `mb-8`). */
  pageHeaderClassName?: string;
  className?: string;
  /** Corpo da página: `Section`, listas, etc. */
  children: ReactNode;
};

/**
 * Esqueleto comum de página de detalhe: volta + cabeçalho + corpo opcionalmente com hero de fundo.
 */
export function AppPageDetail({
  backTo,
  backLabel,
  title,
  description,
  headerIconSrc,
  descriptionTag,
  actions,
  siblingNav,
  heroBackgroundSrc,
  heroBackgroundFallbackSrc,
  pageHeaderClassName,
  className,
  children,
}: AppPageDetailProps) {
  const { state: navState } = useLocation();
  const backHref = listIndexReturnTo(backTo, navState);
  const [heroSrc, setHeroSrc] = useState(heroBackgroundSrc);
  useEffect(() => {
    setHeroSrc(heroBackgroundSrc);
  }, [heroBackgroundSrc]);

  return (
    <div className={cn(className)}>
      <div className="relative -mx-4 -mt-6 mb-8 md:-mx-10 md:-mt-10">
        {heroSrc ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(46vh,400px)] overflow-hidden"
          >
            <img
              src={heroSrc}
              alt=""
              className="h-full w-full object-cover object-center opacity-[0.22] saturate-125"
              style={{
                maskImage: HERO_BACKGROUND_MASK,
                WebkitMaskImage: HERO_BACKGROUND_MASK,
              }}
              draggable={false}
              onError={() => {
                if (heroBackgroundFallbackSrc && heroSrc === heroBackgroundSrc) {
                  setHeroSrc(heroBackgroundFallbackSrc);
                }
              }}
            />
          </div>
        ) : null}
        <div className="relative z-10 px-4 pt-6 md:px-10 md:pt-10">
          <BackLink to={backHref}>{backLabel}</BackLink>
          <PageHeader
            title={title}
            description={description}
            headerIconSrc={headerIconSrc}
            descriptionTag={descriptionTag}
            actions={actions}
            siblingNav={siblingNav}
            className={cn("mb-0", pageHeaderClassName)}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
