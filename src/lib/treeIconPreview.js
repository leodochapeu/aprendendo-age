export function treeIconPreview(source) {
    const lines = (source.campo ?? []).map((line) => line.trim()).filter(Boolean);
    const summary = source.descricao_resumida?.trim();
    if (!lines.length && summary)
        lines.push(summary);
    const preview = {
        lines: lines.length ? lines : undefined,
        food: positive(source.comida),
        wood: positive(source.madeira),
        gold: positive(source.ouro),
        favor: positive(source.favor),
        time: positive(source.tempo_s ?? source.tempo_treinamento ?? source.tempo_construir_segundos),
    };
    if (!preview.lines && preview.food == null && preview.wood == null && preview.gold == null && preview.favor == null && preview.time == null) {
        return undefined;
    }
    return preview;
}
function positive(value) {
    return typeof value === "number" && value > 0 ? value : undefined;
}
