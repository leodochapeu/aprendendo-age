function englishKey(ingles) {
    return ingles?.trim().toLowerCase() ?? "";
}
/**
 * Aldeão da página de Aldeões que corresponde a esta unidade.
 * O casamento é pelo nome em inglês (`ingles`), estável entre os idiomas da interface.
 * Cidadão (Herói) e Kuafu (Herói) só existem em Aldeões, então não há unidade para eles.
 */
export function aldeaoIdMatchingUnit(unit, aldeoes) {
    const key = englishKey(unit.ingles);
    if (!key)
        return undefined;
    return aldeoes.find((aldeao) => englishKey(aldeao.ingles) === key)?.id;
}
/**
 * Unidade que corresponde a este aldeão.
 * O casamento é o inverso de `aldeaoIdMatchingUnit`: mesmo nome em inglês.
 * Cidadão (Herói) e Kuafu (Herói) não têm unidade.
 */
export function unitIdMatchingAldeao(aldeao, unidades) {
    const key = englishKey(aldeao.ingles);
    if (!key)
        return undefined;
    return unidades.find((unit) => englishKey(unit.ingles) === key)?.id;
}
