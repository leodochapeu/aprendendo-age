export type TreeIconPreview = {
  lines?: string[];
  food?: number;
  wood?: number;
  gold?: number;
  favor?: number;
  time?: number;
};

type PreviewSource = {
  descricao_resumida?: string;
  campo?: string[];
  comida?: number;
  madeira?: number;
  ouro?: number;
  favor?: number;
  tempo_s?: number;
  tempo_treinamento?: number;
  tempo_construir_segundos?: number;
};

export function treeIconPreview(source: PreviewSource): TreeIconPreview | undefined {
  const lines = (source.campo ?? []).map((line) => line.trim()).filter(Boolean);
  const summary = source.descricao_resumida?.trim();
  if (!lines.length && summary) lines.push(summary);

  const preview: TreeIconPreview = {
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

function positive(value: number | undefined): number | undefined {
  return typeof value === "number" && value > 0 ? value : undefined;
}
