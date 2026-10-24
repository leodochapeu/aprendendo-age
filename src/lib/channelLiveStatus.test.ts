import { describe, expect, it } from "vitest";

import {
  parseTwitchAvatarResponse,
  parseTwitchTitleResponse,
  parseTwitchUptimeResponse,
  parseTwitchViewerCount,
  twitchLivePreviewUrl,
} from "@/lib/channelLiveStatus";

describe("twitch live snapshot parsers", () => {
  it("reconhece uptime ao vivo e offline", () => {
    expect(parseTwitchUptimeResponse("2 hours, 4 minutes")).toBe(true);
    expect(parseTwitchUptimeResponse("thunder_aom is offline")).toBe(false);
  });

  it("lê título, espectadores e avatar só quando a resposta é útil", () => {
    expect(parseTwitchTitleResponse("go go go!!!")).toBe("go go go!!!");
    expect(parseTwitchTitleResponse("thunder_aom is offline")).toBeNull();
    expect(parseTwitchViewerCount("13")).toBe(13);
    expect(parseTwitchViewerCount("1,204 viewers")).toBe(1204);
    expect(parseTwitchViewerCount("user is offline")).toBeNull();
    expect(parseTwitchAvatarResponse("https://static-cdn.jtvnw.net/jtv_user_pictures/a.png")).toMatch(/^https:\/\//);
    expect(parseTwitchAvatarResponse("not found")).toBeNull();
  });

  it("monta o print 16:9 da live com o login saneado", () => {
    const url = twitchLivePreviewUrl("Thunder_AoM", 180_000);
    expect(url).toBe("https://static-cdn.jtvnw.net/previews-ttv/live_user_thunder_aom-1280x720.jpg?t=3");
  });
});
