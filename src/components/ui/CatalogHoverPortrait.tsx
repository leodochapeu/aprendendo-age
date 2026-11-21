import type { ReactNode } from "react";

import { UnidadeModelViewer } from "@/components/unidade/UnidadeModelViewer";
import { EntityCardPreviewStats, type EntityCardPreviewStat } from "@/components/ui/EntityCardPreview";
import { cn } from "@/lib/cn";
import type { IdleVfxAnchor } from "@/lib/unitIdleVfx";

type Props = {
  modelUrl?: string;
  /** Peças do modelo parado. Substitui `modelUrl` quando a unidade troca de arma. */
  modelUrls?: string[];
  portraitSrc?: string;
  /** Inclinação da câmera. Construções usam uma vista mais alta. */
  pitch?: number;
  /** Aura e brilho usados nos heróis. */
  hero?: boolean;
  vfx?: IdleVfxAnchor[];
};

function portraitUrls(modelUrl: string | undefined, modelUrls: string[] | undefined): string[] {
  const urls = modelUrls?.filter(Boolean) ?? [];
  if (urls.length) return urls;
  return modelUrl ? [modelUrl] : [];
}

/** Retrato grande do hover: projeção 3D quando existe modelo, senão a arte da unidade. */
export function CatalogHoverPortrait({ modelUrl, modelUrls, portraitSrc, pitch, hero = false, vfx }: Props) {
  const urls = portraitUrls(modelUrl, modelUrls);
  if (urls.length) {
    return <UnidadeModelViewer urls={urls} compact spin pitch={pitch} hero={hero} vfx={vfx} />;
  }
  if (portraitSrc) {
    return <img src={portraitSrc} alt="" className="mx-auto h-52 w-full object-contain" />;
  }
  return null;
}

type FrameProps = Props & {
  /** Atributos ao lado do retrato. */
  children: ReactNode;
  /** Bloco extra em largura cheia, abaixo do retrato e dos atributos. */
  footer?: ReactNode;
};

/** Retrato à esquerda e atributos à direita. No celular, um embaixo do outro. */
export function CatalogHoverFrame({ modelUrl, modelUrls, portraitSrc, pitch, children, footer }: FrameProps) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "grid items-center gap-x-4 gap-y-3",
          pitch != null
            ? "sm:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.85fr)]"
            : "sm:grid-cols-[13.5rem_minmax(0,1fr)]",
        )}
      >
        <CatalogHoverPortrait modelUrl={modelUrl} modelUrls={modelUrls} portraitSrc={portraitSrc} pitch={pitch} />
        <div className="min-w-0">{children}</div>
      </div>
      {footer}
    </div>
  );
}

/** Atributos em colunas pares: ícone, nome e valor alinhados. */
export function CatalogHoverStats({
  items,
  columns = 2,
}: {
  items: EntityCardPreviewStat[];
  columns?: 1 | 2;
}) {
  return <EntityCardPreviewStats items={items} columns={columns} />;
}
