import { describe, expect, it } from "vitest";

import { captionToNotification, instagramNotificationWindow, isRunDue, parseInstagramUsername, zonedDayRange } from "@/lib/instagramSync";

describe("parseInstagramUsername", () => {
  it("aceita usuário, arroba e link do perfil", () => {
    expect(parseInstagramUsername("@MDRE.mandarecurso")).toBe("mdre.mandarecurso");
    expect(parseInstagramUsername("https://www.instagram.com/mdre.mandarecurso/")).toBe("mdre.mandarecurso");
    expect(parseInstagramUsername("não é usuário")).toBeNull();
  });
});

describe("captionToNotification", () => {
  it("usa a primeira linha como título e o texto como descrição", () => {
    const copy = captionToNotification("Análise do Mosca\nVenha conferir a série.", "mdre.mandarecurso");
    expect(copy.title).toBe("Análise do Mosca");
    expect(copy.description).toContain("Venha conferir");
  });
});

describe("instagramNotificationWindow", () => {
  it("usa a data do post e mantém sete dias a partir da importação", () => {
    const now = new Date("2026-10-24T18:00:00.000Z");
    const window = instagramNotificationWindow("2026-10-20T22:00:00.000Z", now);
    expect(window.startsAt.toISOString()).toBe("2026-10-20T22:00:00.000Z");
    expect(window.expiresAt.toISOString()).toBe("2026-10-31T18:00:00.000Z");
  });

  it("cai para o momento da importação quando a data do post não serve", () => {
    const now = new Date("2026-10-24T18:00:00.000Z");
    expect(instagramNotificationWindow("não é data", now).startsAt.toISOString()).toBe(now.toISOString());
    expect(instagramNotificationWindow("2026-10-25T18:00:00.000Z", now).startsAt.toISOString()).toBe(now.toISOString());
  });
});

describe("zonedDayRange", () => {
  it("trata o dia civil de Brasília", () => {
    const range = zonedDayRange("2026-10-23", "2026-10-23");
    expect(range && new Date(range.start).toISOString()).toBe("2026-10-23T03:00:00.000Z");
    expect(range && new Date(range.end).toISOString()).toBe("2026-10-24T03:00:00.000Z");
    expect(zonedDayRange("2026-10-24", "2026-10-23")).toBeNull();
  });
});

describe("isRunDue", () => {
  it("roda depois do horário e só uma vez no dia", () => {
    const before = new Date("2026-10-23T11:30:00.000Z");
    const after = new Date("2026-10-23T12:15:00.000Z");
    expect(isRunDue(before, "09:00", null)).toBe(false);
    expect(isRunDue(after, "09:00", null)).toBe(true);
    expect(isRunDue(after, "09:00", "2026-10-23T12:05:00.000Z")).toBe(false);
    expect(isRunDue(after, "09:00", "2026-10-22T12:05:00.000Z")).toBe(true);
  });
});
