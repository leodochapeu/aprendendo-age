import { useEffect, useRef } from "react";

import faixasJson from "@/data/music_tracks.json";

const CHAVE = "aom-musica";
const CHAVE_VOLUME = "aom-volume-musica";
const VOLUME_PADRAO = 30;
// A faixa seguinte começa neste intervalo antes do fim e as duas se cruzam até a anterior acabar.
const ANTECEDENCIA = 2;
const FADE_CONTROLE = 0.4;

export type Faixa = {
  id: string;
  title: string;
  src: string;
  durationSec: number;
};

const faixasCatalogo = faixasJson as Faixa[];
const faixasDeFundo = faixasCatalogo.map((faixa) => faixa.src);
const faixaPorSrc = new Map(faixasCatalogo.map((faixa) => [faixa.src, faixa]));

let faixaAtualSrc: string | null = null;
const ouvintesFaixa = new Set<() => void>();

export function lerFaixaAtual(): Faixa | null {
  if (!faixaAtualSrc) return null;
  return faixaPorSrc.get(faixaAtualSrc) ?? null;
}

export function inscreverFaixa(ouvinte: () => void): () => void {
  ouvintesFaixa.add(ouvinte);
  return () => {
    ouvintesFaixa.delete(ouvinte);
  };
}

function publicarFaixa(src: string | null): void {
  if (faixaAtualSrc === src) return;
  faixaAtualSrc = src;
  for (const ouvinte of ouvintesFaixa) ouvinte();
}

function embaralhar(faixas: readonly string[]): string[] {
  const ordem = faixas.slice();
  for (let i = ordem.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const troca = ordem[i];
    ordem[i] = ordem[j];
    ordem[j] = troca;
  }
  return ordem;
}

export function lerMusicaLigada(): boolean {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "0") return false;
    if (salvo === "1") return true;
  } catch {
    /* armazenamento indisponível */
  }
  return true;
}

export function salvarMusicaLigada(ligada: boolean): void {
  try {
    localStorage.setItem(CHAVE, ligada ? "1" : "0");
  } catch {
    /* armazenamento indisponível */
  }
}

function limitarPercentual(valor: number): number {
  if (!Number.isFinite(valor)) return VOLUME_PADRAO;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

// O slider continua em 0–100. O ganho real é mais baixo: 50% soa como o antigo 20%
// e 100% soa como o antigo 50%.
const EXPOENTE_VOLUME = Math.log(0.4) / Math.log(0.5);
const TETO_VOLUME = 0.5;

export function ganhoDoPercentual(percentual: number): number {
  const t = limitarPercentual(percentual) / 100;
  return TETO_VOLUME * Math.pow(t, EXPOENTE_VOLUME);
}

export function lerVolumeMusica(): number {
  try {
    const salvo = localStorage.getItem(CHAVE_VOLUME);
    if (salvo == null) return VOLUME_PADRAO;
    return limitarPercentual(Number(salvo));
  } catch {
    return VOLUME_PADRAO;
  }
}

export function salvarVolumeMusica(percentual: number): void {
  const limitado = limitarPercentual(percentual);
  nivelMusica = ganhoDoPercentual(limitado);
  try {
    localStorage.setItem(CHAVE_VOLUME, String(limitado));
  } catch {
    /* armazenamento indisponível */
  }
}

let nivelMusica = ganhoDoPercentual(lerVolumeMusica());

function curva(t: number): number {
  return Math.sin(Math.min(1, Math.max(0, t)) * Math.PI * 0.5);
}

function criarAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.dataset.faixa = src;
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = 0;
  return audio;
}

function origem(audio: HTMLAudioElement | null): string | null {
  return audio?.dataset.faixa || null;
}

function liberar(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.src = "";
  audio.load();
}

function cliqueDesligaMusica(evento: Event): boolean {
  const alvo = evento.target;
  if (!(alvo instanceof Element)) return false;
  const rotulo = alvo.closest("[data-musica='interruptor']");
  if (!(rotulo instanceof HTMLButtonElement)) return false;
  return rotulo.getAttribute("aria-pressed") === "true";
}

interface Playlist {
  definirLigada(ligada: boolean): void;
  definirVolume(percentual: number): void;
  avancar(): void;
  destruir(): void;
}

type Modo = "ocioso" | "subindo" | "estavel" | "cruzando" | "descendo" | "mudo";

function criarPlaylist(lista: readonly string[]): Playlist {
  let faixas = embaralhar(lista);
  let indice = 0;
  let atual: HTMLAudioElement | null = null;
  let seguinte: HTMLAudioElement | null = null;
  let reserva: HTMLAudioElement | null = null;
  let ligada = false;
  let vivo = true;
  let quadro = 0;
  let temporizador = 0;
  let modo: Modo = "ocioso";
  let marco = 0;
  let duracaoCruzamento = ANTECEDENCIA;
  let volumesDescida = [0, 0];
  let gesto: ((evento: Event) => void) | null = null;
  let geracao = 0;
  let tentativaEm = 0;
  let abrindo = false;
  let cruzamentoPorRelogio = false;
  let marcoCruzamento = 0;
  let aoSoltar: (() => void) | null = null;

  function tirarGesto(): void {
    if (!gesto) return;
    window.removeEventListener("pointerdown", gesto);
    window.removeEventListener("keydown", gesto);
    gesto = null;
  }

  function pedirGesto(): void {
    if (gesto || !vivo || !ligada) return;
    const tentar = (evento: Event) => {
      if (cliqueDesligaMusica(evento)) return;
      tirarGesto();
      if (vivo && ligada) void retomar();
    };
    gesto = tentar;
    window.addEventListener("pointerdown", tentar);
    window.addEventListener("keydown", tentar);
  }

  function garantirQuadro(): void {
    if (quadro || !vivo) return;
    const passo = (agora: number) => {
      quadro = window.requestAnimationFrame(passo);
      atualizar(agora);
    };
    quadro = window.requestAnimationFrame(passo);
  }

  function pararQuadro(): void {
    if (!quadro) return;
    window.cancelAnimationFrame(quadro);
    quadro = 0;
  }

  function cancelarTroca(): void {
    if (!temporizador) return;
    window.clearTimeout(temporizador);
    temporizador = 0;
  }

  function prepararReserva(): void {
    if (faixas.length === 0 || reserva) return;
    if (faixas.length > 1 && indice >= faixas.length - 1) {
      const tocando = faixas[indice];
      faixas = [tocando, ...embaralhar(faixas.filter((url) => url !== tocando))];
      indice = 0;
    }
    reserva = criarAudio(faixas[(indice + 1) % faixas.length]);
  }

  function observar(audio: HTMLAudioElement): void {
    audio.addEventListener("timeupdate", noTempo);
    audio.addEventListener("ended", noFim);
    audio.addEventListener("loadedmetadata", noTempo);
  }

  function esquecer(audio: HTMLAudioElement): void {
    audio.removeEventListener("timeupdate", noTempo);
    audio.removeEventListener("ended", noFim);
    audio.removeEventListener("loadedmetadata", noTempo);
  }

  function noTempo(evento: Event): void {
    if (evento.currentTarget !== atual) return;
    if (modo === "cruzando") {
      aplicarCruzamento();
      return;
    }
    agendarTroca();
  }

  function noFim(evento: Event): void {
    if (!vivo || evento.currentTarget !== atual) return;
    if (modo === "cruzando") {
      if (cruzamentoPorRelogio) return;
      concluirCruzamento();
      pararQuadro();
      return;
    }
    if (!ligada || (modo !== "estavel" && modo !== "subindo")) return;
    void iniciarCruzamento(true);
  }

  function agendarTroca(): void {
    cancelarTroca();
    if (!vivo || modo !== "estavel" || !ligada || !atual) return;
    if (!Number.isFinite(atual.duration) || atual.duration <= 0) return;
    const janela = Math.min(ANTECEDENCIA, atual.duration);
    const faltaMs = (atual.duration - atual.currentTime - janela) * 1000;
    if (faltaMs <= 40) {
      void iniciarCruzamento(false);
      return;
    }
    temporizador = window.setTimeout(() => {
      temporizador = 0;
      agendarTroca();
    }, Math.min(faltaMs, 1000));
  }

  function progressoCruzamento(): number {
    if (!atual) return 1;
    if (cruzamentoPorRelogio) {
      if (duracaoCruzamento <= 0) return 1;
      return Math.min(1, Math.max(0, (performance.now() - marcoCruzamento) / (duracaoCruzamento * 1000)));
    }
    const restante = Number.isFinite(atual.duration) ? Math.max(0, atual.duration - atual.currentTime) : 0;
    if (duracaoCruzamento <= 0) return 1;
    return Math.min(1, Math.max(0, 1 - restante / duracaoCruzamento));
  }

  function aplicarCruzamento(): void {
    if (modo !== "cruzando" || !atual || !seguinte) return;
    const t = progressoCruzamento();
    atual.volume = nivelMusica * Math.cos(t * Math.PI * 0.5);
    seguinte.volume = nivelMusica * curva(t);
    if (t >= 1 || (!cruzamentoPorRelogio && atual.ended)) {
      concluirCruzamento();
      pararQuadro();
    }
  }

  async function tocar(audio: HTMLAudioElement, comGesto: boolean): Promise<boolean> {
    try {
      await audio.play();
      return vivo && ligada;
    } catch {
      if (comGesto && vivo && ligada) pedirGesto();
      return false;
    }
  }

  async function retomar(): Promise<void> {
    if (!vivo || !ligada || faixas.length === 0) return;
    if (abrindo || modo === "estavel" || modo === "subindo" || modo === "cruzando") return;
    abrindo = true;
    try {
      if (atual?.ended && seguinte) concluirCruzamento();

      if (seguinte && atual && !atual.ended) {
        if (!cruzamentoPorRelogio) {
          const restante = Number.isFinite(atual.duration) ? Math.max(0.2, atual.duration - atual.currentTime) : ANTECEDENCIA;
          duracaoCruzamento = Math.min(ANTECEDENCIA, restante);
        }
        modo = "cruzando";
        publicarFaixa(origem(seguinte));
        garantirQuadro();
        const okAtual = await tocar(atual, true);
        const okSeguinte = await tocar(seguinte, false);
        if (!vivo || !ligada) return;
        if (!okAtual && !okSeguinte) {
          modo = "mudo";
          publicarFaixa(null);
          pararQuadro();
          pedirGesto();
          return;
        }
        aplicarCruzamento();
        return;
      }

      if (!atual || atual.ended) {
        if (atual) esquecer(atual);
        liberar(atual);
        atual = criarAudio(faixas[indice]);
        observar(atual);
      }

      const audio = atual;
      modo = "subindo";
      marco = performance.now();
      publicarFaixa(origem(audio));
      garantirQuadro();
      const ok = await tocar(audio, true);
      if (!vivo || atual !== audio || !ligada) return;
      if (!ok) {
        audio.pause();
        cancelarTroca();
        modo = "mudo";
        publicarFaixa(null);
        pararQuadro();
        return;
      }
      prepararReserva();
    } finally {
      abrindo = false;
      const seguir = aoSoltar;
      aoSoltar = null;
      seguir?.();
    }
  }

  async function iniciarCruzamento(forcado: boolean): Promise<void> {
    if (!vivo || !ligada || !atual || faixas.length === 0) return;
    if (modo === "cruzando" || modo === "descendo" || modo === "mudo") return;
    if (!forcado && performance.now() - tentativaEm < 800) return;

    const saida = atual;
    const proximo = (indice + 1) % faixas.length;
    const entrada = reserva ?? criarAudio(faixas[proximo]);
    reserva = null;
    indice = proximo;
    prepararReserva();
    seguinte = entrada;
    entrada.volume = 0;
    cancelarTroca();
    cruzamentoPorRelogio = false;
    const restante = Number.isFinite(saida.duration) ? saida.duration - saida.currentTime : ANTECEDENCIA;
    duracaoCruzamento = Math.max(0.2, Math.min(ANTECEDENCIA, restante));
    modo = "cruzando";
    publicarFaixa(origem(entrada));
    garantirQuadro();
    aplicarCruzamento();

    const token = ++geracao;
    const ok = await tocar(entrada, false);
    if (!vivo || token !== geracao) return;
    if (ok || modo !== "cruzando" || seguinte !== entrada) return;

    tentativaEm = performance.now();
    seguinte = null;
    indice = (proximo - 1 + faixas.length) % faixas.length;
    liberar(reserva);
    reserva = entrada;
    entrada.pause();
    modo = "estavel";
    publicarFaixa(origem(saida));
    agendarTroca();
  }

  function ficarComSeguinte(): void {
    if (!seguinte) return;
    const entrada = seguinte;
    if (atual && atual !== entrada) {
      esquecer(atual);
      liberar(atual);
    }
    seguinte = null;
    atual = entrada;
    esquecer(atual);
    observar(atual);
    geracao += 1;
    prepararReserva();
  }

  function concluirCruzamento(): void {
    if (!seguinte || (modo !== "cruzando" && modo !== "mudo" && modo !== "descendo" && modo !== "ocioso")) return;
    const cruzando = modo === "cruzando";
    cruzamentoPorRelogio = false;
    ficarComSeguinte();
    if (!atual || !vivo) return;
    if (!cruzando || !ligada) return;
    atual.volume = nivelMusica;
    modo = "estavel";
    publicarFaixa(origem(atual));
    agendarTroca();
  }

  function atualizar(agora: number): void {
    if (!vivo) return;

    if (modo === "subindo" && atual) {
      const t = (agora - marco) / (FADE_CONTROLE * 1000);
      atual.volume = nivelMusica * curva(t);
      if (t >= 1) {
        atual.volume = nivelMusica;
        modo = "estavel";
        pararQuadro();
        agendarTroca();
      }
      return;
    }

    if (modo === "descendo") {
      const t = Math.min(1, (agora - marco) / (FADE_CONTROLE * 1000));
      const fator = 1 - curva(t);
      if (atual) atual.volume = volumesDescida[0] * fator;
      if (seguinte) seguinte.volume = volumesDescida[1] * fator;
      if (t >= 1) {
        atual?.pause();
        seguinte?.pause();
        modo = "mudo";
        publicarFaixa(null);
        pararQuadro();
      }
      return;
    }

    if (modo === "cruzando") {
      aplicarCruzamento();
      return;
    }

    pararQuadro();
  }

  function definirLigada(valor: boolean): void {
    if (!vivo || valor === ligada) return;
    ligada = valor;
    if (valor) {
      void retomar();
      return;
    }
    tirarGesto();
    cancelarTroca();
    volumesDescida = [atual?.volume ?? 0, seguinte?.volume ?? 0];
    marco = performance.now();
    if (atual || seguinte) {
      modo = "descendo";
      garantirQuadro();
      return;
    }
    modo = "mudo";
    publicarFaixa(null);
  }

  function definirVolume(percentual: number): void {
    nivelMusica = ganhoDoPercentual(percentual);
    if (!vivo || !ligada || modo !== "estavel" || !atual) return;
    atual.volume = nivelMusica;
  }

  function avancar(): void {
    if (!vivo || !ligada || faixas.length === 0) return;
    void iniciarCruzamento(true);
  }

  function destruir(): void {
    vivo = false;
    ligada = false;
    geracao += 1;
    tirarGesto();
    pararQuadro();
    cancelarTroca();
    if (atual) esquecer(atual);
    liberar(atual);
    liberar(seguinte);
    liberar(reserva);
    atual = null;
    seguinte = null;
    reserva = null;
    publicarFaixa(null);
  }

  return { definirLigada, definirVolume, avancar, destruir };
}

let playlistAtiva: Playlist | null = null;
let donos = 0;
let desmonte: number | null = null;

export function useMusicaDeFundo(ligada: boolean, volume: number): void {
  const ligadaRef = useRef(ligada);
  const volumeRef = useRef(volume);
  ligadaRef.current = ligada;
  volumeRef.current = volume;

  useEffect(() => {
    if (faixasDeFundo.length === 0) return;
    if (desmonte != null) {
      window.clearTimeout(desmonte);
      desmonte = null;
    }
    donos += 1;
    if (!playlistAtiva) playlistAtiva = criarPlaylist(faixasDeFundo);
    const controle = playlistAtiva;
    controle.definirVolume(volumeRef.current);
    controle.definirLigada(ligadaRef.current);
    return () => {
      donos -= 1;
      if (donos > 0) return;
      desmonte = window.setTimeout(() => {
        desmonte = null;
        if (donos === 0 && playlistAtiva === controle) {
          controle.destruir();
          playlistAtiva = null;
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    playlistAtiva?.definirLigada(ligada);
  }, [ligada]);

  useEffect(() => {
    playlistAtiva?.definirVolume(volume);
  }, [volume]);
}

export function avancarFaixa(): void {
  playlistAtiva?.avancar();
}
