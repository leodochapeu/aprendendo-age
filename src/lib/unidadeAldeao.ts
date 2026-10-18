type Named = { id: number; ingles?: string };

function englishKey(ingles: string | undefined): string {
  return ingles?.trim().toLowerCase() ?? "";
}

/**
 * Aldeão da página de Aldeões que corresponde a esta unidade.
 * O casamento é pelo nome em inglês (`ingles`), estável entre os idiomas da interface.
 * Cidadão (Herói) e Kuafu (Herói) só existem em Aldeões, então não há unidade para eles.
 */
export function aldeaoIdMatchingUnit(unit: { ingles?: string }, aldeoes: readonly Named[]): number | undefined {
  const key = englishKey(unit.ingles);
  if (!key) return undefined;
  return aldeoes.find((aldeao) => englishKey(aldeao.ingles) === key)?.id;
}
