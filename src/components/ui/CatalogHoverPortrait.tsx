import type { ReactNode } from "react";

import { UnidadeModelViewer } from "@/components/unidade/UnidadeModelViewer";
import { EntityCardPreviewStats, type EntityCardPreviewStat } from "@/components/ui/EntityCardPreview";
import { cn } from "@/lib/cn";

type Props = {
  modelUrl?: string;
  portraitSrc?: string;
  /** Inclinação da câmera. Construções usam uma vista mais alta. */
  pitch?: number;
};

/** Retrato grande do hover: projeção 3D quando existe modelo, senão a arte da unidade. */
export function CatalogHoverPortrait({ modelUrl, portraitSrc, pitch }: Props) {
  if (modelUrl) {
    return <UnidadeModelViewer urls={[modelUrl]} compact spin pitch={pitch} />;
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
export function CatalogHoverFrame({ modelUrl, portraitSrc, pitch, children, footer }: FrameProps) {
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
        <CatalogHoverPortrait modelUrl={modelUrl} portraitSrc={portraitSrc} pitch={pitch} />
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
