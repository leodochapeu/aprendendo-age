import { shareDocument } from "../share/document.mjs";

function header(req, name) {
  const value = req.headers[name];
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? "").split(",")[0].trim();
}

export default function handler(req, res) {
  const proto = header(req, "x-forwarded-proto") || "https";
  const host = header(req, "x-forwarded-host") || header(req, "host") || "aprendendoage.com";
  const url = new URL(req.url ?? "/", `${proto}://${host}`);
  const html = shareDocument({
    path: url.searchParams.get("path") || "/",
    search: url.searchParams.get("search") || "",
    origin: `${proto}://${host}`,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("X-Robots-Tag", "noindex");
  res.status(200).send(html);
}
