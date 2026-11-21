import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { inscreverFaixa, lerFaixaAtual, lerMusicaLigada, lerVolumeMusica, salvarMusicaLigada, avancarFaixa, salvarVolumeMusica, useMusicaDeFundo, } from "@/lib/musica";
const MusicContext = createContext(null);
export function MusicProvider({ children }) {
    const [ligada, setLigadaState] = useState(lerMusicaLigada);
    const [volume, setVolumeState] = useState(lerVolumeMusica);
    const faixa = useSyncExternalStore(inscreverFaixa, lerFaixaAtual, () => null);
    useMusicaDeFundo(ligada, volume);
    const value = useMemo(() => ({
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
    }), [faixa, ligada, volume]);
    return _jsx(MusicContext.Provider, { value: value, children: children });
}
export function useMusic() {
    const value = useContext(MusicContext);
    if (!value)
        throw new Error("useMusic precisa ficar dentro de MusicProvider");
    return value;
}
