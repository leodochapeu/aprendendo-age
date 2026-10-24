function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderShareHtml({ title, description, lang, url, image }) {
  const fullTitle = title.startsWith("Aprendendo Age") ? title : `${title} — Aprendendo Age`;
  const htmlLang = lang === "en" ? "en" : "pt-BR";
  const ogLocale = lang === "en" ? "en_US" : "pt_BR";
  const safeTitle = esc(fullTitle);
  const safeDescription = esc(description);
  const safeUrl = esc(url);
  const safeImage = esc(image);

  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<meta name="robots" content="noindex" />
<link rel="canonical" href="${safeUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Aprendendo Age" />
<meta property="og:locale" content="${ogLocale}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:secure_url" content="${safeImage}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1024" />
<meta property="og:image:height" content="1024" />
<meta property="og:image:alt" content="Aprendendo Age" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
<link rel="icon" type="image/png" href="${esc(image.replace(/\/og\.jpg$/, "/favicon.png"))}" />
</head>
<body>
<p><a href="${safeUrl}">${safeTitle}</a></p>
<p>${safeDescription}</p>
</body>
</html>
`;
}
