import type { Locale } from "@/i18n/types";

export type ClanAboutBlock = {
  title: string;
  paragraphs: string[];
};

export type ClanAboutCopy = {
  blocks: ClanAboutBlock[];
  motto: string;
};

const MDRE: Record<Locale, ClanAboutCopy> = {
  pt: {
    blocks: [
      {
        title: "Quem Somos?",
        paragraphs: [
          "Somos um clã apaixonado por Age of Mythology: Retold, com foco em Team Games (TG). Acreditamos que as melhores partidas são construídas com estratégia, comunicação e trabalho em equipe.",
          "O que começou entre amigos se transformou em um clã dedicado a aprender, competir, criar amizades e fortalecer a cena brasileira do jogo. Promovemos projetos como o God of Olympus, campeonatos internos, encontros presenciais, participação em torneios e produção de conteúdo.",
          "Se você gosta de jogar em equipe e fazer parte de um clã unido, o MDRE é o seu lugar.",
        ],
      },
      {
        title: "Origem",
        paragraphs: [
          "O MDRE nasceu quando quatro colegas de trabalho decidiram se reunir para jogar. Depois de uma única noite de Counter-Strike, redescobrimos o Age of Mythology e nunca mais paramos.",
          "Começamos jogando apenas entre amigos, aprendendo juntos e evoluindo como equipe. Com o tempo, novos jogadores chegaram, o clã cresceu e o que era um hobby virou um projeto, com campeonatos, eventos e uma comunidade de jogadores cada vez mais ativa.",
        ],
      },
      {
        title: "Por que “Manda Recurso”?",
        paragraphs: [
          "Em toda partida em equipe existe aquele momento em que alguém precisa de ajuda e grita: **“Manda recurso!”**",
          "A frase virou um bordão entre nós e acabou representando perfeitamente o espírito do clã: cooperação, amizade e a certeza de que ninguém vence sozinho.",
        ],
      },
      {
        title: "Nossa Missão",
        paragraphs: [
          "Queremos construir um clã onde competir seja tão importante quanto fazer amizades. Nosso objetivo é incentivar novos jogadores, fortalecer a cena brasileira de Age of Mythology e mostrar que jogar em equipe é sempre mais divertido.",
        ],
      },
    ],
    motto: "Aqui ninguém joga sozinho. Se faltar recurso… a gente manda.",
  },
  en: {
    blocks: [
      {
        title: "Who We Are",
        paragraphs: [
          "We are a clan passionate about Age of Mythology: Retold, focused on Team Games (TG). We believe the best matches are built on strategy, communication, and teamwork.",
          "What began among friends became a clan dedicated to learning, competing, building friendships, and strengthening the Brazilian scene. We run projects such as God of Olympus, internal championships, in-person meetups, tournament appearances, and content.",
          "If you enjoy playing as a team and being part of a close-knit clan, MDRE is your place.",
        ],
      },
      {
        title: "Origin",
        paragraphs: [
          "MDRE was born when four coworkers decided to get together and play. After a single night of Counter-Strike, we rediscovered Age of Mythology and never stopped.",
          "We started playing only among friends, learning together and growing as a team. Over time, new players arrived, the clan grew, and what had been a hobby became a project — with championships, events, and an ever more active community.",
        ],
      },
      {
        title: "Why “Manda Recurso”?",
        paragraphs: [
          "In every team game there is that moment when someone needs help and shouts: **“Manda recurso!”**",
          "The phrase became a catchphrase among us and came to represent the spirit of the clan perfectly: cooperation, friendship, and the certainty that no one wins alone.",
        ],
      },
      {
        title: "Our Mission",
        paragraphs: [
          "We want to build a clan where competing matters as much as making friends. Our goal is to encourage new players, strengthen the Brazilian Age of Mythology scene, and show that playing as a team is always more fun.",
        ],
      },
    ],
    motto: "No one plays alone here. If resources run short… we send them.",
  },
};

const BY_SLUG: Record<string, Record<Locale, ClanAboutCopy>> = {
  mdre: MDRE,
};

export function getClanAbout(slug: string, locale: Locale): ClanAboutCopy | null {
  return BY_SLUG[slug.trim().toLowerCase()]?.[locale] ?? null;
}
