import type { DeusExplicacaoBloco } from "@/data/catalog";
import { NotionText } from "@/components/ui/NotionText";
import { Section } from "@/components/ui/Section";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  blocos: DeusExplicacaoBloco[];
  className?: string;
};

/**
 * Corpo explicativo dos deuses maiores (export Notion), com ícones via {@link NotionText} / token_asset_map.
 */
export function DeusExplicacaoMaiorSection({ blocos, className }: Props) {
  const { t } = useTranslation();
  if (!blocos.length) return null;

  return (
    <Section title={t("common.bonusesAndTraits")} className={className}>
      <div className="space-y-5">
        {blocos.map((b, i) => (
          <DeusExplicacaoBlocoView key={i} bloco={b} />
        ))}
      </div>
    </Section>
  );
}

function DeusExplicacaoBlocoView({ bloco }: { bloco: DeusExplicacaoBloco }) {
  switch (bloco.tipo) {
    case "citacao":
      return (
        <blockquote className="border-l-[3px] border-amber-500/45 bg-zinc-900/35 py-2.5 pl-4 pr-3 text-sm leading-relaxed text-zinc-200">
          <NotionText text={bloco.texto} />
        </blockquote>
      );
    case "lista":
      return (
        <ul className="list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-zinc-500">
          {bloco.itens.map((item, j) => (
            <li key={j}>
              <NotionText text={item} />
            </li>
          ))}
        </ul>
      );
    case "titulo":
      return (
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100/95">
          <NotionText text={bloco.texto} />
        </h3>
      );
    case "paragrafo":
      return (
        <p className="text-sm leading-relaxed text-zinc-300">
          <NotionText text={bloco.texto} />
        </p>
      );
    default:
      return null;
  }
}
