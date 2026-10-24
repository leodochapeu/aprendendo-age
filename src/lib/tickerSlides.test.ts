import { describe, expect, it } from "vitest";

import type { Channel } from "@/data/channels";
import type { ChannelLiveSnapshot } from "@/lib/channelLiveStatus";
import type { SiteNotification } from "@/lib/siteNotifications";
import { interleaveTickerSlides, tickerSlideKey, type TickerLiveSlide } from "@/lib/tickerSlides";

function news(id: string): SiteNotification {
  return {
    id,
    title: id,
    description: "",
    linkUrl: null,
    imageUrl: null,
    startsAt: "",
    expiresAt: "",
    createdAt: "",
    highlighted: false,
  };
}

function live(id: string): TickerLiveSlide {
  const channel: Channel = {
    id,
    name: id,
    urlLink: "https://twitch.tv/x",
    category: "twitch",
    imagePath: null,
    clanId: null,
    sortOrder: 0,
  };
  const preview: ChannelLiveSnapshot = {
    title: "partida",
    viewerCount: 1,
    thumbnailUrl: null,
    portraitUrl: null,
  };
  return { kind: "live", channel, preview };
}

describe("interleaveTickerSlides", () => {
  it("coloca cada streamer entre as notícias", () => {
    const slides = interleaveTickerSlides([news("a"), news("b"), news("c")], [live("x")]);
    expect(slides.map(tickerSlideKey)).toEqual(["news:a", "live:x", "news:b", "news:c"]);
  });

  it("alterna quando há mais de um ao vivo", () => {
    const slides = interleaveTickerSlides([news("a"), news("b")], [live("x"), live("y")]);
    expect(slides.map(tickerSlideKey)).toEqual(["news:a", "live:x", "news:b", "live:y"]);
  });

  it("mostra só a live quando não há aviso", () => {
    const slides = interleaveTickerSlides([], [live("x")]);
    expect(slides.map(tickerSlideKey)).toEqual(["live:x"]);
  });
});
