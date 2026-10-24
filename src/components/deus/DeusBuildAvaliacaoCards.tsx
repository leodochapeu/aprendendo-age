import { Link } from "react-router-dom";

import { NotionText } from "@/components/ui/NotionText";
import {
  buildAvaliacaoLabel,
  buildAvaliacaoScoreClassName,
  PLAYSTYLE_BUILD_MODES,
  type PlaystyleStatKey,
} from "@/lib/playstyleBuild";
import { cn } from "@/lib/cn";

function PlaystyleScoreBar({ score, barClass }: { score: number; barClass: string }) {
  return (
    <div className="flex justify-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn("h-1.5 w-3 rounded-full sm:h-2 sm:w-3.5", i <= score ? barClass : "bg-zinc-800/90")}
        />
      ))}
    </div>
  );
}
import { rushTurtleBoomarImg } from "@/pages/trilha-de-aprendizado/trilhaAssets";

type DeusBuildAvaliacaoCardsProps = {
  rush?: number | null;
  turtle?: number | null;
  eco?: number | null;
  foco?: string | null;
};

function PlaystyleBuildCard({
  mode,
  score,
}: {
  mode: (typeof PLAYSTYLE_BUILD_MODES)[number];
  score: number | null | undefined;
}) {
  const hasScore = score != null && !Number.isNaN(score);

  return (
    <article
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center sm:px-4 sm:py-4",
        mode.cardClass,
        hasScore && score >= 4 && `ring-1 ${mode.ring}`,
      )}
    >
      <img
        src={rushTurtleBoomarImg(mode.img)}
        alt=""
        className="h-11 w-11 rounded-lg border border-zinc-800/80 object-contain sm:h-14 sm:w-14"
      />
      <h3
        className={cn(
          "font-[family-name:var(--font-display)] text-xs font-semibold leading-tight sm:text-sm",
          mode.titleClass,
        )}
      >
        {mode.short}
      </h3>
      {hasScore ? (
        <>
          <PlaystyleScoreBar score={score} barClass={mode.bar} />
          <p className={cn("text-xs font-medium tabular-nums", mode.accent)}>
            {score}/5
          </p>
          <p className={buildAvaliacaoScoreClassName(score)}>{buildAvaliacaoLabel(score)}</p>
        </>
      ) : (
        <p className="text-xs font-medium text-zinc-500">—</p>
      )}
    </article>
  );
}

export function DeusBuildAvaliacaoCards({ rush, turtle, eco, foco }: DeusBuildAvaliacaoCardsProps) {
  const scores: Record<PlaystyleStatKey, number | null | undefined> = { rush, turtle, eco };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {PLAYSTYLE_BUILD_MODES.map((mode) => (
          <PlaystyleBuildCard key={mode.id} mode={mode} score={scores[mode.statKey]} />
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Escala 1–5 (5 = melhor para o arquétipo).{" "}
        <Link
          to="/trilha-de-aprendizado#estrategia-ranking"
          className="text-amber-200/90 underline-offset-2 hover:text-amber-50 hover:underline"
        >
          Ver ranking na trilha
        </Link>
        .
      </p>
      {foco ? (
        <p className="mt-4 text-sm">
          <span className="text-zinc-500">Foco: </span>
          <NotionText text={foco} />
        </p>
      ) : null}
    </>
  );
}
