export function firstNumId(refs) {
    const id = refs?.[0]?.id;
    return typeof id === "number" ? id : undefined;
}
export function firstNome(refs) {
    return refs?.[0]?.nome;
}
export function joinRefNomes(refs, sep = ", ") {
    return (refs ?? []).map((r) => r.nome).join(sep);
}
/** Campo legado ainda string (ex.: `panteoes: "Geral"`) ou já migrado para `[{ id, nome }]`. */
export function joinRefNomesOrString(v, sep = ", ") {
    if (v == null)
        return "";
    if (typeof v === "string")
        return v;
    return joinRefNomes(v, sep);
}
