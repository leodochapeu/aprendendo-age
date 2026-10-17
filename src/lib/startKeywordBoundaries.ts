/** Evita expandir de novo se já houver :aomr_*: logo após a palavra. */
export const NOT_IF_ICON = String.raw`(?!\s*:aomr_)`;
/** Não expandir logo após letra/número nem após «>» de tag. */
export const B = String.raw`(?<![\p{L}\p{M}\p{N}_<>])`;
export const A = String.raw`(?![\p{L}\p{M}\p{N}_])`;
export const U = "giu" as const;

/**
 * Palavra já dentro de `<highlight-*>`. Reaplicar o mesmo destaque quebra o parser
 * (o primeiro `</highlight-*>` fecha a tag de fora e o resto aparece como texto).
 */
export function isInsideHighlightTag(full: string, offset: number): boolean {
  const before = full.slice(0, offset);
  const stack: string[] = [];
  const re = /<(\/?)(highlight-[a-z0-9_-]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(before))) {
    if (m[1] === "/") {
      const i = stack.lastIndexOf(m[2]!);
      if (i >= 0) stack.splice(i, 1);
    } else {
      stack.push(m[2]!);
    }
  }
  return stack.length > 0;
}
