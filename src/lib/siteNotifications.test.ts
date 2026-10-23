import { describe, expect, it } from "vitest";

import {
  mergeReadIds,
  notificationImageStoragePath,
  notificationPhase,
  notificationTextError,
  parseStoredReadIds,
  resolveNotificationLink,
  resolveNotificationWindow,
} from "@/lib/siteNotifications";

describe("resolveNotificationLink", () => {
  it("aceita caminho interno e http(s)", () => {
    expect(resolveNotificationLink("/unidades")).toEqual({ href: "/unidades", kind: "internal" });
    expect(resolveNotificationLink(" https://www.youtube.com/watch?v=abc ")).toEqual({
      href: "https://www.youtube.com/watch?v=abc",
      kind: "external",
    });
  });

  it("recusa protocolo solto, javascript e link vazio", () => {
    expect(resolveNotificationLink("//evil.test")).toBeNull();
    expect(resolveNotificationLink("javascript:alert(1)")).toBeNull();
    expect(resolveNotificationLink("  ")).toBeNull();
    expect(resolveNotificationLink(null)).toBeNull();
  });
});

describe("resolveNotificationWindow", () => {
  const now = new Date(2026, 9, 19, 12, 0, 0);

  it("usa o instante atual quando o disparo é imediato", () => {
    const result = resolveNotificationWindow(
      { mode: "now", startsAtLocal: "", expiresAtLocal: "2026-10-26T12:00" },
      now,
    );
    expect(result).toEqual({ ok: true, startsAt: now, expiresAt: new Date(2026, 9, 26, 12, 0, 0) });
  });

  it("recusa horário passado e expiração antes do início", () => {
    expect(
      resolveNotificationWindow(
        { mode: "schedule", startsAtLocal: "2026-10-19T10:00", expiresAtLocal: "2026-10-19T18:00" },
        now,
      ),
    ).toEqual({ ok: false, error: "schedulePast" });

    expect(
      resolveNotificationWindow(
        { mode: "schedule", startsAtLocal: "2026-10-19T13:00", expiresAtLocal: "2026-10-19T12:30" },
        now,
      ),
    ).toEqual({ ok: false, error: "expiresOrder" });
  });

  it("preserva o início de um aviso que já começou", () => {
    const kept = new Date(2026, 9, 18, 9, 0, 0);
    const result = resolveNotificationWindow(
      { mode: "now", startsAtLocal: "", expiresAtLocal: "2026-10-26T12:00", keepStartsAt: kept },
      now,
    );
    expect(result).toEqual({ ok: true, startsAt: kept, expiresAt: new Date(2026, 9, 26, 12, 0, 0) });
  });
});

describe("notificationPhase", () => {
  const now = Date.parse("2026-10-19T15:00:00.000Z");

  it("separa agendada, no ar e expirada", () => {
    expect(notificationPhase(new Date(now + 3_600_000).toISOString(), new Date(now + 7_200_000).toISOString(), now)).toBe(
      "scheduled",
    );
    expect(notificationPhase(new Date(now - 3_600_000).toISOString(), new Date(now + 3_600_000).toISOString(), now)).toBe(
      "active",
    );
    expect(notificationPhase(new Date(now - 7_200_000).toISOString(), new Date(now - 3_600_000).toISOString(), now)).toBe(
      "expired",
    );
  });
});

describe("notificationImageStoragePath", () => {
  it("extrai o caminho público do bucket", () => {
    expect(
      notificationImageStoragePath(
        "http://127.0.0.1:54321/storage/v1/object/public/site-notifications/user/file.png",
      ),
    ).toBe("user/file.png");
    expect(notificationImageStoragePath("https://cdn.example/other.png")).toBeNull();
  });
});

describe("notificationTextError", () => {
  it("exige título, descrição e um link válido quando preenchido", () => {
    expect(notificationTextError("  ", "texto", "")).toBe("title");
    expect(notificationTextError("Aviso", "  ", "")).toBe("description");
    expect(notificationTextError("Aviso", "texto", "nota")).toBe("link");
    expect(notificationTextError("Aviso", "texto", "/starts")).toBeNull();
  });
});

describe("read ids", () => {
  it("ignora armazenamento inválido e só acrescenta ids novos", () => {
    expect(parseStoredReadIds("nope")).toEqual([]);
    expect(parseStoredReadIds('["a", 1, "b"]')).toEqual(["a", "b"]);
    const current = ["a"];
    expect(mergeReadIds(current, ["a"])).toBe(current);
    expect(mergeReadIds(current, ["b"])).toEqual(["a", "b"]);
  });
});
