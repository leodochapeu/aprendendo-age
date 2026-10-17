/**
 * Tinte leve por panteão para misturar com o fundo cinza do EntityCard (camada sob bg-zinc-900/40).
 */
const PANTHEON_TINT_RGBA: Record<string, string> = {
  Grego: "rgba(25, 85, 125, 0.22)", // azul mar
  Egípcio: "rgba(175, 135, 45, 0.2)", // amarelo deserto
  Nórdico: "rgba(125, 32, 32, 0.2)", // vermelho sangue
  Atlante: "rgba(22, 145, 145, 0.2)", // turquesa
  Chinês: "rgba(95, 55, 130, 0.18)", // roxo
  Japonês: "rgba(155, 75, 105, 0.18)", // rosa cerejeira
  Astecas: "rgba(165, 78, 28, 0.2)", // laranja barro
};

/** Nomes que aparecem nos dados, mas apontam para a mesma cor do catálogo. */
const PANTHEON_TINT_ALIASES: Record<string, string> = {
  Asteca: "Astecas",
  Aztec: "Astecas",
  Aztecs: "Astecas",
};

export function pantheonCardTint(panteao: string): string | undefined {
  const key = PANTHEON_TINT_ALIASES[panteao] ?? panteao;
  return PANTHEON_TINT_RGBA[key];
}

/**
 * O campo `panteao` em Notion/JSON às vezes lista várias civilizações (vários tokens `:aomr_pantheon_*` separados por vírgula).
 * Nesse caso não se deve aplicar um único tinte.
 */
export function panteaoFieldHasMultiplePantheons(panteao: string | undefined): boolean {
  if (!panteao) return false;
  return (panteao.match(/:aomr_pantheon_/g) ?? []).length > 1;
}
