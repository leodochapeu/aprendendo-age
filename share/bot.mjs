/** Crawlers de preview. O navegador interno do WhatsApp também traz "WhatsApp" no UA, mas com Mozilla. */
export function isPreviewBot(userAgent) {
  const ua = String(userAgent ?? "");
  if (/WhatsApp/i.test(ua)) return !/Mozilla/i.test(ua);
  return /facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|Discordbot|LinkedInBot|Pinterestbot|redditbot|Iframely|Embedly|vkShare|SkypeUriPreview|Slack-ImgProxy/i.test(
    ua,
  );
}
