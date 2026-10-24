import type { Channel } from "@/data/channels";
import type { ChannelLiveSnapshot } from "@/lib/channelLiveStatus";
import type { SiteNotification } from "@/lib/siteNotifications";

export type TickerNewsSlide = { kind: "news"; item: SiteNotification };
export type TickerLiveSlide = { kind: "live"; channel: Channel; preview: ChannelLiveSnapshot };
export type TickerSlide = TickerNewsSlide | TickerLiveSlide;

/** Intercala notícia e streamer ao vivo, começando por uma notícia quando houver. */
export function interleaveTickerSlides(news: readonly SiteNotification[], live: readonly TickerLiveSlide[]): TickerSlide[] {
  const newsSlides: TickerSlide[] = news.map((item) => ({ kind: "news", item }));
  if (live.length === 0) return newsSlides;
  if (newsSlides.length === 0) return [...live];

  const slides: TickerSlide[] = [];
  const turns = Math.max(newsSlides.length, live.length);
  for (let index = 0; index < turns; index += 1) {
    const newsSlide = newsSlides[index];
    const liveSlide = live[index];
    if (newsSlide) slides.push(newsSlide);
    if (liveSlide) slides.push(liveSlide);
  }
  return slides;
}

export function tickerSlideKey(slide: TickerSlide): string {
  return slide.kind === "news" ? `news:${slide.item.id}` : `live:${slide.channel.id}`;
}
