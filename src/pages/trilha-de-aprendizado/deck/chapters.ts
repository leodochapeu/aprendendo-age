export const TRILHA_CHAPTERS = [
  {
    id: "inicio",
    shortKey: "pages.trilha.deck.chapterStart",
    titleKey: "pages.trilha.index.title",
    blurbKey: "pages.trilha.index.description",
  },
  {
    id: "forcas",
    shortKey: "pages.trilha.deck.chapterForces",
    titleKey: "pages.trilha.index.step1",
    blurbKey: "pages.trilha.index.step1Desc",
  },
  {
    id: "eras",
    shortKey: "pages.trilha.deck.chapterAges",
    titleKey: "pages.trilha.index.step2",
    blurbKey: "pages.trilha.index.step2Body",
  },
  {
    id: "unidades",
    shortKey: "pages.trilha.deck.chapterUnits",
    titleKey: "pages.trilha.index.step3",
    blurbKey: "pages.trilha.index.step3Desc",
  },
  {
    id: "atalhos",
    shortKey: "pages.trilha.deck.chapterShortcuts",
    titleKey: "pages.trilha.index.step4",
    blurbKey: "pages.trilha.index.step4Desc",
  },
  {
    id: "starts",
    shortKey: "pages.trilha.deck.chapterStarts",
    titleKey: "pages.trilha.index.step5",
    blurbKey: "pages.trilha.index.step5Body",
  },
  {
    id: "estrategia",
    shortKey: "pages.trilha.deck.chapterStrategy",
    titleKey: "pages.trilha.index.step6",
    blurbKey: "pages.trilha.index.step6Desc",
  },
  {
    id: "video",
    shortKey: "pages.trilha.deck.chapterVideo",
    titleKey: "pages.trilha.index.step7",
    blurbKey: "pages.trilha.index.step7Body",
  },
  {
    id: "simulador",
    shortKey: "pages.trilha.deck.chapterSim",
    titleKey: "pages.trilha.index.step8",
    blurbKey: "pages.trilha.index.step8Desc",
  },
] as const;

export type TrilhaChapterId = (typeof TRILHA_CHAPTERS)[number]["id"];

export function chapterKicker(t: (key: string) => string, chapterId: TrilhaChapterId): string {
  const index = TRILHA_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  const chapter = TRILHA_CHAPTERS[index];
  if (!chapter || index <= 0) return t("pages.trilha.deck.chapterStart");
  return `${String(index).padStart(2, "0")}  ·  ${t(chapter.titleKey)}`;
}
