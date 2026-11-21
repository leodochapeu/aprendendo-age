/** URLs de avatar por nome de autor (após normalização). */
export const START_AUTHOR_IMAGE_URLS = {
    Moose: "https://yt3.googleusercontent.com/doYIQ7DUckOTiQwwCIyBrsMoMYmzaXYbhJnIJqCPS176Sztk_NNsLq1MV-0bHRDeuxqu0rPmTA=s160-c-k-c0x00ffffff-no-rj",
    TheRapl: "https://yt3.googleusercontent.com/0jz4T0uQ3pmAl953SR6BFeqs8dgNPvJcEjkcwR7UhbbyQZwcslyEIdgCY5owdCF1HV0SvfFz3A=s160-c-k-c0x00ffffff-no-rj",
    KevenAoM: "https://yt3.googleusercontent.com/8GDya_nISo4VD6PygrZ8ziWPVma_DCQ6PbBJLYL4ovRF4hr-rAapq6s5sez3YDZVZAFdQAKU7w=s160-c-k-c0x00ffffff-no-rj",
    Miniyeti: "https://avatars.steamstatic.com/49d94564bef50f7ae277379ab49d745e18590301_full.jpg",
    Cafeína: "https://avatars.steamstatic.com/c169a4e0670e4fb33ce0fb1d9321b80a73adc7a0_full.jpg",
    "Morley Games": "https://yt3.googleusercontent.com/whaU7TrzxilqsCWJfKdcBCaEjRqpGL8Dt6JaWUqhrOJkjKnFmRDNYcqWswb5fb3OHzaTBAYg=s160-c-k-c0x00ffffff-no-rj",
    Morley: "https://yt3.googleusercontent.com/whaU7TrzxilqsCWJfKdcBCaEjRqpGL8Dt6JaWUqhrOJkjKnFmRDNYcqWswb5fb3OHzaTBAYg=s160-c-k-c0x00ffffff-no-rj",
    Balerion: "https://yt3.googleusercontent.com/2poWZZtWyNVFCtLMmiiYeLwZw1WYr-VwUdDAtQc-BflKZeVE7G_RxMgRFuMkzQYh4A6Q2qLC9w=s160-c-k-c0x00ffffff-no-rj",
    HuskSuppe: "https://yt3.googleusercontent.com/LSsFrC1RmJi-mqiNTmC5W2eDMShIq3kDKb0kEEx3QMlYPZmsqAc0i1cDdGoval6zAmlveh2HwQ=s160-c-k-c0x00ffffff-no-rj",
    Aussie_Drongo: "/assets/authors/aussie-drongo.webp",
};
const AUTHOR_NAME_ALIASES = {
    "Light Yagami": "KevenAoM",
};
export function normalizeStartAuthorName(raw) {
    const trimmed = raw.trim();
    return AUTHOR_NAME_ALIASES[trimmed] ?? trimmed;
}
export function startAuthorImageUrl(name) {
    const normalized = normalizeStartAuthorName(name);
    if (START_AUTHOR_IMAGE_URLS[normalized])
        return START_AUTHOR_IMAGE_URLS[normalized];
    const cafeina = /^Cafeína\b/i.test(normalized) ? START_AUTHOR_IMAGE_URLS["Cafeína"] : undefined;
    return cafeina;
}
/** Preferência: mapa local (`/assets/...`) → `imageUrl` guardado no JSON. */
export function resolveStartAuthorImageSrc(name, imageUrl) {
    return startAuthorImageUrl(name) ?? imageUrl;
}
export function startAuthorFromString(raw) {
    const name = normalizeStartAuthorName(raw);
    const imageUrl = startAuthorImageUrl(name);
    return imageUrl ? { name, imageUrl } : { name };
}
/** Atualiza `imageUrl` no autor conforme o mapa (ex.: URL local estável). */
export function withResolvedStartAuthorImage(author) {
    const imageUrl = resolveStartAuthorImageSrc(author.name, author.imageUrl);
    return imageUrl ? { ...author, imageUrl } : { name: author.name };
}
export function startAuthorName(author) {
    return author.name.trim();
}
export function formatStartAuthors(authors, separator = " · ") {
    return authors.map((a) => startAuthorName(a)).filter(Boolean).join(separator);
}
