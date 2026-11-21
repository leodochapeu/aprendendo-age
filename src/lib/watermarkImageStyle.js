/**
 * `url()` em CSS não tolera apóstrofos literais no path (ex.: `Freyr's_Gift`); quebra o estilo
 * enquanto `<img src>` com o mesmo path funciona. Usa JSON.stringify para delimitar.
 */
/** Exportado para `EntityCard` (cover) e estilos de marca d’água. */
export function cssUrl(value) {
    return `url(${JSON.stringify(value)})`;
}
/** Grelha (EntityCard): transição na faixa; encosta à direita com altura do card. */
const MASK_ENTITY_STRIP = "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.90) 75%, rgba(0,0,0,1) 100%)";
/** Section: degradê um pouco mais longo na faixa (painéis largos); imagem com altura = 100% do card. */
const MASK_SECTION_STRIP = "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.33) 32%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.90) 72%, rgba(0,0,0,1) 92%)";
function maskFromGradient(gradient) {
    return {
        WebkitMaskImage: gradient,
        maskImage: gradient,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
    };
}
/**
 * Coluna direita do EntityCard (`w-[min(52%,20rem)]`).
 * Máscara relativa só à faixa, não ao card inteiro.
 */
export function watermarkStripImageStyle(imageUrl) {
    return {
        backgroundImage: cssUrl(imageUrl),
        backgroundSize: "auto 100%",
        backgroundPosition: "right center",
        backgroundRepeat: "no-repeat",
        ...maskFromGradient(MASK_ENTITY_STRIP),
    };
}
/**
 * Coluna direita da Section — igual à grelha: altura do sprite = altura do card (`auto 100%`).
 * `contain` deixava barras vazias acima/abaixo; o excesso horizontal corta-se com `overflow-hidden` na faixa.
 */
export function sectionWatermarkStripStyle(imageUrl) {
    return {
        backgroundImage: cssUrl(imageUrl),
        backgroundSize: "auto 100%",
        backgroundPosition: "right center",
        backgroundRepeat: "no-repeat",
        ...maskFromGradient(MASK_SECTION_STRIP),
    };
}
