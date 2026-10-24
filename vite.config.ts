import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

/** Espelha `share/bot.mjs`. O navegador do WhatsApp inclui Mozilla; o crawler de preview, não. */
function isPreviewBot(userAgent: string | undefined): boolean {
  const ua = userAgent ?? "";
  if (/WhatsApp/i.test(ua)) return !/Mozilla/i.test(ua);
  return /facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|Discordbot|LinkedInBot|Pinterestbot|redditbot|Iframely|Embedly|vkShare|SkypeUriPreview|Slack-ImgProxy/i.test(
    ua,
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveBuildId(): string {
  const fromEnv =
    process.env.VITE_BUILD_ID?.trim() ||
    process.env.CI_COMMIT_SHORT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim().slice(0, 7) ||
    "";
  if (fromEnv) return fromEnv;
  return Date.now().toString(36);
}

function sharePreviewPlugin(): Plugin {
  return {
    name: "share-preview",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isPreviewBot(req.headers["user-agent"])) return next();
        const url = new URL(req.url ?? "/", "http://localhost");
        if (
          url.pathname.startsWith("/api/") ||
          url.pathname.startsWith("/@") ||
          url.pathname.startsWith("/src/") ||
          url.pathname.startsWith("/node_modules/") ||
          url.pathname.startsWith("/assets/")
        ) {
          return next();
        }
        if (/\.[a-z0-9]+$/i.test(url.pathname)) return next();

        void (async () => {
          try {
            const mod = await import(pathToFileURL(path.resolve(__dirname, "share/document.mjs")).href);
            const host = req.headers.host ?? "localhost:5173";
            const html = mod.shareDocument({
              path: url.pathname,
              search: url.search,
              origin: `http://${host}`,
            });
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.end(html);
          } catch (error) {
            next(error);
          }
        })();
      });
    },
  };
}

function emitVersionJsonPlugin(buildId: string): Plugin {
  return {
    name: "emit-version-json",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, "version.json"),
        JSON.stringify({ build: buildId }),
        "utf8",
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const buildId = command === "serve" ? "dev" : resolveBuildId();

  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      sharePreviewPlugin(),
      ...(command === "build" ? [emitVersionJsonPlugin(buildId)] : []),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
