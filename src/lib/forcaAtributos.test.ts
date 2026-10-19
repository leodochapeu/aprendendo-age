import { describe, expect, it } from "vitest";

import { attributeStrengthBreakdown } from "@/lib/forcaAtributos";
import type { UnidadeTipoItem } from "@/lib/unidadeTipo";

const infantaria: UnidadeTipoItem[] = [{ type: "Infantaria", icon: "aomr_type_infantry_icon" }];
const artilharia: UnidadeTipoItem[] = [{ type: "Artilharia", icon: "aomr_type_archer_icon" }];
const mitica: UnidadeTipoItem[] = [{ type: "Mítica", icon: "aomr_type_myth_unit_icon" }];

describe("attributeStrengthBreakdown", () => {
  it("soma atributos e desconta treino, metade dos recursos e população", () => {
    const result = attributeStrengthBreakdown({
      pontos_de_vida: 115,
      armadura_anticorte: 40,
      armadura_antiperfurante: 10,
      velocidade_movimento: 4.3,
      tempo_treinamento: 12,
      dps: 8,
      comida: 50,
      madeira: 0,
      ouro: 40,
      populacao: 2,
      tipo: infantaria,
    });
    expect(result.total).toBeCloseTo(118.3, 5);
    expect(result.artillery).toBe(false);
  });

  it("soma 50 para artilharia e ignora o alcance", () => {
    const result = attributeStrengthBreakdown({
      pontos_de_vida: 65,
      armadura_anticorte: 15,
      armadura_antiperfurante: 15,
      velocidade_movimento: 4,
      tempo_treinamento: 15,
      dps: 6,
      comida: 0,
      madeira: 55,
      ouro: 35,
      populacao: 2,
      tipo: artilharia,
    });
    expect(result.total).toBeCloseTo(93, 5);
    expect(result.terms.find((term) => term.id === "artilleryBonus")?.amount).toBe(50);
  });

  it("não dá o bônus de artilharia para unidade mítica de longo alcance e ignora favor", () => {
    const result = attributeStrengthBreakdown({
      pontos_de_vida: 250,
      armadura_anticorte: 15,
      armadura_antiperfurante: 20,
      velocidade_movimento: 5.5,
      tempo_treinamento: 22,
      dps: 12,
      madeira: 180,
      populacao: 3,
      tipo: mitica,
    });
    expect(result.total).toBeCloseTo(187.5, 5);
    expect(result.artillery).toBe(false);
  });

  it("pode ficar negativa quando o treino pesa mais que os atributos", () => {
    const result = attributeStrengthBreakdown({
      pontos_de_vida: 30,
      armadura_anticorte: 20,
      armadura_antiperfurante: 60,
      velocidade_movimento: 4,
      tempo_treinamento: 180,
    });
    expect(result.total).toBeCloseTo(-66, 5);
  });
});
