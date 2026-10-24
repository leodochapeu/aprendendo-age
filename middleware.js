import { isPreviewBot } from "./share/bot.mjs";

export const config = {
  matcher: ["/", "/:path*"],
};

export default async function middleware(request) {
  if (!isPreviewBot(request.headers.get("user-agent"))) return;

  const incoming = new URL(request.url);
  if (incoming.pathname.startsWith("/api/") || incoming.pathname.startsWith("/assets/")) return;
  if (/\.[a-z0-9]+$/i.test(incoming.pathname)) return;

  const share = new URL("/api/share", incoming.origin);
  share.searchParams.set("path", incoming.pathname);
  share.searchParams.set("search", incoming.search);

  try {
    const preview = await fetch(share);
    if (!preview.ok) return;
    return new Response(await preview.text(), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex",
      },
    });
  } catch {
    return;
  }
}
