import { renderShareHtml } from "./html.mjs";
import { resolveSharePage } from "./pages.mjs";

function sanitizeSearch(search) {
  if (!search) return "";
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const tab = params.get("tab");
  if (tab !== "corrida" && tab !== "jogadores" && tab !== "rank") return "";
  return `?tab=${tab}`;
}

export function shareDocument({ path, search, origin }) {
  const page = resolveSharePage(path, search);
  const cleanOrigin = String(origin ?? "").replace(/\/$/, "");
  const url = `${cleanOrigin}${page.pathname}${sanitizeSearch(search)}`;
  return renderShareHtml({
    title: page.title,
    description: page.description,
    lang: page.lang,
    url,
    image: `${cleanOrigin}/og.jpg`,
  });
}
