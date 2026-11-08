import { describe, expect, it } from "vitest";

import { countryLabelFromStored, flagIsoFromStoredCountry } from "@/lib/playerCountry";

describe("flagIsoFromStoredCountry", () => {
  it("aceita o slug gravado na importação do AoM Stats", () => {
    expect(flagIsoFromStoredCountry("brasil")).toBe("br");
    expect(flagIsoFromStoredCountry("estadosunidos")).toBe("us");
    expect(flagIsoFromStoredCountry("Chile")).toBe("cl");
    expect(flagIsoFromStoredCountry("reinounido")).toBe("gb");
  });

  it("aceita o ISO que a API do AoM Stats devolve", () => {
    expect(flagIsoFromStoredCountry("BR")).toBe("br");
    expect(flagIsoFromStoredCountry("co")).toBe("co");
    expect(flagIsoFromStoredCountry("uk")).toBe("gb");
  });

  it("ignora país vazio", () => {
    expect(flagIsoFromStoredCountry(null)).toBeNull();
    expect(flagIsoFromStoredCountry("")).toBeNull();
    expect(flagIsoFromStoredCountry("null")).toBeNull();
    expect(flagIsoFromStoredCountry("atlantis")).toBeNull();
  });

  it("nomeia o país para o leitor de tela", () => {
    expect(countryLabelFromStored("brasil")).toBe("Brasil");
    expect(countryLabelFromStored("fr")).toBe("França");
  });
});
