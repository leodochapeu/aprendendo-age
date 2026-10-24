import { describe, expect, it } from "vitest";

import { displayToStored, mentionQueryAt, mentionsToDisplay, parseComment, sanitizeMentionLabel } from "@/lib/commentMarkup";

const DIDI = "11111111-1111-4111-8111-111111111111";

describe("parseComment", () => {
  it("separa título, negrito, itálico e menção", () => {
    const blocks = parseComment(`# Acrópole\nO mapa **fecha** bem e *abre* o ouro. @[Didi](${DIDI})`);
    expect(blocks[0]).toEqual({ type: "heading", spans: [{ type: "text", text: "Acrópole" }] });
    expect(blocks[1]).toEqual({
      type: "paragraph",
      spans: [
        { type: "text", text: "O mapa " },
        { type: "bold", text: "fecha" },
        { type: "text", text: " bem e " },
        { type: "italic", text: "abre" },
        { type: "text", text: " o ouro. " },
        { type: "mention", label: "Didi", id: DIDI },
      ],
    });
  });
});

describe("mentions", () => {
  it("mostra @Nome no editor e grava o id ao publicar", () => {
    const stored = `@[Didi Braguinha](${DIDI}) curtiu`;
    const shown = mentionsToDisplay(stored);
    expect(shown.text).toBe("@Didi Braguinha curtiu");
    expect(displayToStored(shown.text, shown.mentions)).toBe(stored);
  });

  it("não corta um nome maior ao trocar a menção curta", () => {
    const text = displayToStored("@Didi e @Di", [
      { label: "Di", id: DIDI },
      { label: "Didi", id: "22222222-2222-4222-8222-222222222222" },
    ]);
    expect(text.startsWith("@[Didi](22222222-2222-4222-8222-222222222222)")).toBe(true);
    expect(text).toContain(`@[Di](${DIDI})`);
  });

  it("lê a busca depois do @", () => {
    expect(mentionQueryAt("fala com @did", 13)).toEqual({ start: 9, query: "did" });
    expect(mentionQueryAt("sem arroba", 10)).toBeNull();
    expect(sanitizeMentionLabel("Didi](x)")).toBe("Didix");
  });
});
