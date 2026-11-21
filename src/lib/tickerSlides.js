/** Intercala notícia e streamer ao vivo, começando por uma notícia quando houver. */
export function interleaveTickerSlides(news, live) {
    const newsSlides = news.map((item) => ({ kind: "news", item }));
    if (live.length === 0)
        return newsSlides;
    if (newsSlides.length === 0)
        return [...live];
    const slides = [];
    const turns = Math.max(newsSlides.length, live.length);
    for (let index = 0; index < turns; index += 1) {
        const newsSlide = newsSlides[index];
        const liveSlide = live[index];
        if (newsSlide)
            slides.push(newsSlide);
        if (liveSlide)
            slides.push(liveSlide);
    }
    return slides;
}
export function tickerSlideKey(slide) {
    return slide.kind === "news" ? `news:${slide.item.id}` : `live:${slide.channel.id}`;
}
