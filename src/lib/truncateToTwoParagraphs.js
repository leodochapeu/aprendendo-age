/** Mantém no máximo dois blocos separados por linha em branco (parágrafos). */
export function truncateToTwoParagraphs(text) {
    const raw = text?.trim() ?? "";
    if (!raw)
        return "";
    const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 2)
        return parts.join("\n\n");
    return `${parts[0]}\n\n${parts[1]}`;
}
