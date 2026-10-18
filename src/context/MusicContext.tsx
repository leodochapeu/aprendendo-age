import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import {
  inscreverFaixa,
  lerFaixaAtual,
  lerMusicaLigada,
  lerVolumeMusica,
  salvarMusicaLigada,
  avancarFaixa,
  salvarVolumeMusica,
  useMusicaDeFundo,
  type Faixa,
} from "@/lib/musica";

type MusicContextValue = {
  ligada: boolean;
  volume: number;
  faixa: Faixa | null;
  setLigada: (ligada: boolean) => void;
  setVolume: (volume: number) => void;
  avancar: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [ligada, setLigadaState] = useState(lerMusicaLigada);
  const [volume, setVolumeState] = useState(lerVolumeMusica);
  const faixa = useSyncExternalStore(inscreverFaixa, lerFaixaAtual, () => null);
  useMusicaDeFundo(ligada, volume);

  const value = useMemo<MusicContextValue>(
    () => ({
      ligada,
      volume,
      faixa,
      setLigada(proxima) {
        salvarMusicaLigada(proxima);
        setLigadaState(proxima);
      },
      setVolume(proximo) {
        salvarVolumeMusica(proximo);
        setVolumeState(proximo);
      },
      avancar() {
        avancarFaixa();
      },
    }),
    [faixa, ligada, volume],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic(): MusicContextValue {
  const value = useContext(MusicContext);
  if (!value) throw new Error("useMusic precisa ficar dentro de MusicProvider");
  return value;
}
