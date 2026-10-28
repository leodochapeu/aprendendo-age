/** Extrai o ID de 11 caracteres de URLs youtu.be ou youtube.com/watch|embed|shorts|live. */
export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  const m =
    trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/** Converte URL youtu.be ou youtube.com/watch em URL de embed. */
export function toYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}
