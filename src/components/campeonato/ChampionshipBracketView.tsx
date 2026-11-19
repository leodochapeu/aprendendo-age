import type {
  ChampionshipDetail,
  ChampionshipFixture,
  ChampionshipStage,
} from "@/lib/championshipsApi";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { cn } from "@/lib/cn";

function seriesLabel(length: number | null | undefined) {
  if (length === 1) return "MD1";
  if (length === 5) return "MD5";
  if (length === 7) return "MD7";
  if (length === 3) return "MD3";
  return null;
}

function groupLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function playerName(
  camp: ChampionshipDetail,
  entryId: string | null,
  feeder: string | null,
) {
  if (!entryId) return feeder || "A definir";
  return camp.players.find((player) => player.id === entryId)?.name || "Jogador";
}

function playerLogo(camp: ChampionshipDetail, entryId: string | null) {
  if (!entryId) return "";
  return camp.players.find((player) => player.id === entryId)?.logoUrl || "";
}

function BracketMatchCard({
  camp,
  fixture,
  revealed,
  onReveal,
}: {
  camp: ChampionshipDetail;
  fixture: ChampionshipFixture;
  revealed: boolean;
  onReveal: () => void;
}) {
  const showScore = revealed || fixture.status === "finished";
  const winner =
    showScore && fixture.scoreA !== fixture.scoreB
      ? fixture.scoreA > fixture.scoreB
        ? "A"
        : "B"
      : null;
  const md = seriesLabel(fixture.seriesLength);
  const nameA = playerName(camp, fixture.playerAId, fixture.feederA);
  const nameB = playerName(camp, fixture.playerBId, fixture.feederB);

  return (
    <div
      className={cn(
        "relative w-full min-w-[200px] overflow-hidden rounded-lg border border-amber-500/25 bg-zinc-950/90 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
        fixture.isBye && "opacity-40 border-dashed",
        winner ? "border-amber-400/50" : false,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-2 border-b border-white/5 px-2.5 py-1">
        <span className="truncate text-[10px] tracking-wider text-zinc-500 uppercase">{fixture.roundLabel}</span>
        {md ? (
          <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-200">
            {md}
          </span>
        ) : null}
      </div>
      <SlotRow
        name={nameA}
        logoUrl={playerLogo(camp, fixture.playerAId)}
        score={showScore ? fixture.scoreA : null}
        state={winner === "A" ? "winner" : winner === "B" ? "loser" : "open"}
      />
      <SlotRow
        name={nameB}
        logoUrl={playerLogo(camp, fixture.playerBId)}
        score={showScore ? fixture.scoreB : null}
        state={winner === "B" ? "winner" : winner === "A" ? "loser" : "open"}
      />
      {!showScore && fixture.status === "scheduled" && (fixture.scoreA > 0 || fixture.scoreB > 0 || fixture.games.length > 0) ? (
        <button
          type="button"
          onClick={onReveal}
          className="relative w-full border-t border-white/5 py-1 text-[10px] tracking-wide text-amber-200/80 hover:bg-amber-400/10"
        >
          Revelar placar
        </button>
      ) : null}
      {showScore && fixture.games.length > 0 ? (
        <div className="relative flex flex-wrap justify-center gap-1 border-t border-white/5 px-2 py-1.5">
          {fixture.games.map((game) => (
            <span
              key={game.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                game.winnerSide === "A" ? "bg-amber-300" : "bg-sky-300",
              )}
              title={`${game.mapName || "Mapa"} · ${game.winnerSide === "A" ? nameA : nameB}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SlotRow({
  name,
  logoUrl,
  score,
  state,
}: {
  name: string;
  logoUrl: string;
  score: number | null;
  state: "winner" | "loser" | "open";
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 border-b border-white/5 px-2.5 py-1.5 last:border-b-0",
        state === "winner" && "border-l-2 border-l-amber-400 bg-amber-400/10",
        state === "loser" && "opacity-40",
      )}
    >
      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-amber-200/40 bg-zinc-900">
        <PlayerAvatarMark src={logoUrl} className="h-full w-full" width={24} height={24} />
      </div>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-semibold",
          state === "winner" ? "text-amber-100" : "text-zinc-200",
          state === "loser" && "line-through text-zinc-500",
        )}
      >
        {name}
      </span>
      {score != null ? (
        <span className={cn("font-[family-name:var(--font-display)] text-sm", state === "winner" ? "text-amber-200" : "text-zinc-400")}>
          {score}
        </span>
      ) : (
        <span className="text-xs text-zinc-600">–</span>
      )}
    </div>
  );
}

function BracketColumns({
  camp,
  fixtures,
  revealedAll,
  revealedIds,
  onReveal,
  title,
  accent,
}: {
  camp: ChampionshipDetail;
  fixtures: ChampionshipFixture[];
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (id: string) => void;
  title?: string;
  accent?: string;
}) {
  const visible = fixtures.filter((fixture) => !fixture.isHidden && !fixture.isBye);
  if (visible.length === 0) return null;
  const rounds = [...new Set(visible.map((fixture) => fixture.roundIndex ?? 0))].sort((a, b) => a - b);

  return (
    <section className="space-y-3">
      {title ? (
        <h3 className={cn("font-[family-name:var(--font-display)] text-sm tracking-[0.18em] uppercase", accent || "text-amber-100")}>
          {title}
        </h3>
      ) : null}
      <div className="flex gap-0 overflow-x-auto pb-4">
        {rounds.map((round) => {
          const matches = visible
            .filter((fixture) => (fixture.roundIndex ?? 0) === round)
            .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
          return (
            <div key={round} className="relative flex min-w-[220px] flex-col justify-around gap-3 pr-10 last:pr-0">
              <p className="absolute -top-5 left-0 w-[calc(100%-2.5rem)] text-center text-[10px] tracking-wider text-zinc-500 uppercase last:w-full">
                {matches[0]?.roundLabel || `Rodada ${round + 1}`}
              </p>
              {matches.map((fixture) => (
                <div key={fixture.id} className="relative flex flex-1 items-center py-2">
                  <BracketMatchCard
                    camp={camp}
                    fixture={fixture}
                    revealed={revealedAll || revealedIds.includes(fixture.id)}
                    onReveal={() => onReveal(fixture.id)}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GroupsStageView({
  camp,
  stage,
  fixtures,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  stage: ChampionshipStage;
  fixtures: ChampionshipFixture[];
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (id: string) => void;
}) {
  const groupIndexes = [...new Set(fixtures.map((fixture) => fixture.groupIndex ?? 0))].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {groupIndexes.map((groupIndex) => {
        const groupFixtures = fixtures.filter((fixture) => (fixture.groupIndex ?? 0) === groupIndex);
        const entryIds = [
          ...new Set(
            groupFixtures.flatMap((fixture) => [fixture.playerAId, fixture.playerBId]).filter((id): id is string => Boolean(id)),
          ),
        ];
        const standings = entryIds.map((entryId) => {
          let wins = 0;
          let losses = 0;
          let mapDiff = 0;
          for (const fixture of groupFixtures) {
            if (fixture.status !== "finished") continue;
            const a = fixture.playerAId === entryId;
            const b = fixture.playerBId === entryId;
            if (!a && !b) continue;
            const mine = a ? fixture.scoreA : fixture.scoreB;
            const theirs = a ? fixture.scoreB : fixture.scoreA;
            mapDiff += mine - theirs;
            if (mine > theirs) wins += 1;
            else if (theirs > mine) losses += 1;
          }
          return { entryId, wins, losses, mapDiff };
        });
        standings.sort((a, b) => b.wins - a.wins || b.mapDiff - a.mapDiff);

        return (
          <section key={groupIndex} className="rounded-2xl border border-amber-500/20 bg-black/30 p-4 sm:p-5">
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-lg text-amber-100">
              {stage.name} · Grupo {groupLetter(groupIndex)}
            </h3>
            <div className="mb-5 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] tracking-wider text-zinc-500 uppercase">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Jogador</th>
                    <th className="py-2 pr-3">V</th>
                    <th className="py-2 pr-3">D</th>
                    <th className="py-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr key={row.entryId} className="border-b border-white/5 text-zinc-200">
                      <td className="py-2 pr-3 text-zinc-500">{index + 1}</td>
                      <td className="py-2 pr-3 font-medium">{playerName(camp, row.entryId, null)}</td>
                      <td className="py-2 pr-3 text-emerald-300">{row.wins}</td>
                      <td className="py-2 pr-3 text-red-300">{row.losses}</td>
                      <td className="py-2 text-amber-200/80">{row.mapDiff > 0 ? `+${row.mapDiff}` : row.mapDiff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {groupFixtures.map((fixture) => (
                <BracketMatchCard
                  key={fixture.id}
                  camp={camp}
                  fixture={fixture}
                  revealed={revealedAll || revealedIds.includes(fixture.id)}
                  onReveal={() => onReveal(fixture.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CustomFlowStageView({
  camp,
  stage,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  stage: ChampionshipStage;
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (fixtureId: string) => void;
}) {
  const CARD_W = 200;
  const CARD_H = 104;
  const width = Math.max(720, ...stage.flowNodes.map((node) => node.x + CARD_W + 48), 720);
  const height = Math.max(360, ...stage.flowNodes.map((node) => node.y + CARD_H + 48), 360);

  function edgePath(edge: (typeof stage.flowEdges)[number]) {
    const from = stage.flowNodes.find((node) => node.id === edge.fromNodeId);
    const to = stage.flowNodes.find((node) => node.id === edge.toNodeId);
    if (!from || !to) return null;
    const x1 = from.x + CARD_W;
    const y1 = from.y + CARD_H / 2;
    const x2 = to.x;
    const y2 = to.y + (edge.toSlot === "B" ? CARD_H * 0.72 : edge.toSlot === "A" ? CARD_H * 0.28 : CARD_H / 2);
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-amber-100">{stage.name}</h2>
        <p className="text-xs text-zinc-500">Personalizada · {seriesLabel(stage.seriesLength)}</p>
      </div>
      <div className="overflow-auto rounded-2xl border border-amber-500/20 bg-black/30">
        <div className="relative" style={{ width, height }}>
          <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
            {stage.flowEdges.map((edge) => {
              const d = edgePath(edge);
              if (!d) return null;
              return <path key={edge.id} d={d} fill="none" stroke="rgba(247,183,51,0.45)" strokeWidth="2" />;
            })}
          </svg>
          {stage.flowNodes.map((node) => {
            const fixture = node.fixtureId ? camp.fixtures.find((item) => item.id === node.fixtureId) : null;
            if (node.type === "match" && fixture) {
              return (
                <div key={node.id} className="absolute" style={{ left: node.x, top: node.y, width: CARD_W }}>
                  <BracketMatchCard
                    camp={camp}
                    fixture={fixture}
                    revealed={revealedAll || revealedIds.includes(fixture.id)}
                    onReveal={() => onReveal(fixture.id)}
                  />
                </div>
              );
            }
            const entryName = node.entryId
              ? camp.players.find((player) => player.id === node.entryId)?.name || "Jogador"
              : node.type === "initializer"
                ? "Entrada"
                : "Saída";
            return (
              <div
                key={node.id}
                className={cn(
                  "absolute rounded-lg border px-3 py-2",
                  node.type === "initializer" && "border-sky-400/40 bg-sky-950/70",
                  node.type === "finalizer" && "border-emerald-400/40 bg-emerald-950/70",
                  node.type === "match" && "border-amber-500/30 bg-zinc-950/90",
                )}
                style={{ left: node.x, top: node.y, width: CARD_W, minHeight: 72 }}
              >
                <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                  {node.type === "initializer" ? "Inicializador" : node.type === "finalizer" ? "Finalizador" : "Confronto"}
                </p>
                <p className="truncate text-sm text-zinc-100">{node.label || entryName}</p>
                <p className="mt-1 truncate text-xs text-zinc-400">{entryName}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ChampionshipBracketView({
  camp,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (fixtureId: string) => void;
}) {
  if (camp.stages.length === 0) {
    return <p className="text-sm text-zinc-500">Configure as fases no painel do campeonato para ver a chave.</p>;
  }

  return (
    <div className="space-y-10">
      {camp.stages.map((stage) => {
        if (stage.format === "custom") {
          if (stage.flowNodes.length === 0) {
            return (
              <section key={stage.id}>
                <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl text-amber-100">{stage.name}</h2>
                <p className="text-sm text-zinc-500">Quadro ainda não configurado.</p>
              </section>
            );
          }
          return (
            <CustomFlowStageView
              key={stage.id}
              camp={camp}
              stage={stage}
              revealedAll={revealedAll}
              revealedIds={revealedIds}
              onReveal={onReveal}
            />
          );
        }
        const stageFixtures = camp.fixtures.filter((fixture) => fixture.stageId === stage.id && !fixture.isHidden);
        if (stageFixtures.length === 0) {
          return (
            <section key={stage.id}>
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl text-amber-100">{stage.name}</h2>
              <p className="text-sm text-zinc-500">Confrontos ainda não gerados.</p>
            </section>
          );
        }
        if (stage.format === "groups") {
          return (
            <GroupsStageView
              key={stage.id}
              camp={camp}
              stage={stage}
              fixtures={stageFixtures}
              revealedAll={revealedAll}
              revealedIds={revealedIds}
              onReveal={onReveal}
            />
          );
        }
        const winners = stageFixtures.filter((fixture) => fixture.section === "winners");
        const losers = stageFixtures.filter((fixture) => fixture.section === "losers");
        const grand = stageFixtures.filter((fixture) => fixture.section === "grand_final");
        return (
          <section key={stage.id} className="space-y-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-amber-100">{stage.name}</h2>
              <p className="text-xs text-zinc-500">
                {stage.format === "double_elim" ? "Mata-mata duplo" : "Mata-mata"} · {seriesLabel(stage.seriesLength)}
              </p>
            </div>
            <BracketColumns
              camp={camp}
              fixtures={winners.length ? winners : stageFixtures}
              revealedAll={revealedAll}
              revealedIds={revealedIds}
              onReveal={onReveal}
              title={stage.format === "double_elim" ? "Winners bracket" : undefined}
              accent="text-emerald-300"
            />
            {losers.length > 0 ? (
              <BracketColumns
                camp={camp}
                fixtures={losers}
                revealedAll={revealedAll}
                revealedIds={revealedIds}
                onReveal={onReveal}
                title="Losers bracket"
                accent="text-red-300"
              />
            ) : null}
            {grand.length > 0 ? (
              <BracketColumns
                camp={camp}
                fixtures={grand}
                revealedAll={revealedAll}
                revealedIds={revealedIds}
                onReveal={onReveal}
                title="Grande final"
                accent="text-amber-200"
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
