import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { cn } from "@/lib/cn";
function seriesLabel(length) {
    if (length === 1)
        return "MD1";
    if (length === 5)
        return "MD5";
    if (length === 7)
        return "MD7";
    if (length === 3)
        return "MD3";
    return null;
}
function groupLetter(index) {
    return String.fromCharCode(65 + index);
}
function playerName(camp, entryId, feeder) {
    if (!entryId)
        return feeder || "A definir";
    return camp.players.find((player) => player.id === entryId)?.name || "Jogador";
}
function playerLogo(camp, entryId) {
    if (!entryId)
        return "";
    return camp.players.find((player) => player.id === entryId)?.logoUrl || "";
}
function BracketMatchCard({ camp, fixture, revealed, onReveal, }) {
    const showScore = revealed || fixture.status === "finished";
    const winner = showScore && fixture.scoreA !== fixture.scoreB
        ? fixture.scoreA > fixture.scoreB
            ? "A"
            : "B"
        : null;
    const md = seriesLabel(fixture.seriesLength);
    const nameA = playerName(camp, fixture.playerAId, fixture.feederA);
    const nameB = playerName(camp, fixture.playerBId, fixture.feederB);
    return (_jsxs("div", { className: cn("relative w-full min-w-[200px] overflow-hidden rounded-lg border border-amber-500/25 bg-zinc-950/90 shadow-[0_8px_24px_rgba(0,0,0,0.45)]", fixture.isBye && "opacity-40 border-dashed", winner ? "border-amber-400/50" : false), children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_70%)]" }), _jsxs("div", { className: "relative flex items-center justify-between gap-2 border-b border-white/5 px-2.5 py-1", children: [_jsx("span", { className: "truncate text-[10px] tracking-wider text-zinc-500 uppercase", children: fixture.roundLabel }), md ? (_jsx("span", { className: "rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-200", children: md })) : null] }), _jsx(SlotRow, { name: nameA, logoUrl: playerLogo(camp, fixture.playerAId), score: showScore ? fixture.scoreA : null, state: winner === "A" ? "winner" : winner === "B" ? "loser" : "open" }), _jsx(SlotRow, { name: nameB, logoUrl: playerLogo(camp, fixture.playerBId), score: showScore ? fixture.scoreB : null, state: winner === "B" ? "winner" : winner === "A" ? "loser" : "open" }), !showScore && fixture.status === "scheduled" && (fixture.scoreA > 0 || fixture.scoreB > 0 || fixture.games.length > 0) ? (_jsx("button", { type: "button", onClick: onReveal, className: "relative w-full border-t border-white/5 py-1 text-[10px] tracking-wide text-amber-200/80 hover:bg-amber-400/10", children: "Revelar placar" })) : null, showScore && fixture.games.length > 0 ? (_jsx("div", { className: "relative flex flex-wrap justify-center gap-1 border-t border-white/5 px-2 py-1.5", children: fixture.games.map((game) => (_jsx("span", { className: cn("h-1.5 w-1.5 rounded-full", game.winnerSide === "A" ? "bg-amber-300" : "bg-sky-300"), title: `${game.mapName || "Mapa"} · ${game.winnerSide === "A" ? nameA : nameB}` }, game.id))) })) : null] }));
}
function SlotRow({ name, logoUrl, score, state, }) {
    return (_jsxs("div", { className: cn("relative flex items-center gap-2 border-b border-white/5 px-2.5 py-1.5 last:border-b-0", state === "winner" && "border-l-2 border-l-amber-400 bg-amber-400/10", state === "loser" && "opacity-40"), children: [_jsx("div", { className: "h-6 w-6 shrink-0 overflow-hidden rounded-full border border-amber-200/40 bg-zinc-900", children: _jsx(PlayerAvatarMark, { src: logoUrl, className: "h-full w-full", width: 24, height: 24 }) }), _jsx("span", { className: cn("min-w-0 flex-1 truncate text-xs font-semibold", state === "winner" ? "text-amber-100" : "text-zinc-200", state === "loser" && "line-through text-zinc-500"), children: name }), score != null ? (_jsx("span", { className: cn("font-[family-name:var(--font-display)] text-sm", state === "winner" ? "text-amber-200" : "text-zinc-400"), children: score })) : (_jsx("span", { className: "text-xs text-zinc-600", children: "\u2013" }))] }));
}
function BracketColumns({ camp, fixtures, revealedAll, revealedIds, onReveal, title, accent, }) {
    const visible = fixtures.filter((fixture) => !fixture.isHidden && !fixture.isBye);
    if (visible.length === 0)
        return null;
    const rounds = [...new Set(visible.map((fixture) => fixture.roundIndex ?? 0))].sort((a, b) => a - b);
    return (_jsxs("section", { className: "space-y-3", children: [title ? (_jsx("h3", { className: cn("font-[family-name:var(--font-display)] text-sm tracking-[0.18em] uppercase", accent || "text-amber-100"), children: title })) : null, _jsx("div", { className: "flex gap-0 overflow-x-auto pb-4", children: rounds.map((round) => {
                    const matches = visible
                        .filter((fixture) => (fixture.roundIndex ?? 0) === round)
                        .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
                    return (_jsxs("div", { className: "relative flex min-w-[220px] flex-col justify-around gap-3 pr-10 last:pr-0", children: [_jsx("p", { className: "absolute -top-5 left-0 w-[calc(100%-2.5rem)] text-center text-[10px] tracking-wider text-zinc-500 uppercase last:w-full", children: matches[0]?.roundLabel || `Rodada ${round + 1}` }), matches.map((fixture) => (_jsx("div", { className: "relative flex flex-1 items-center py-2", children: _jsx(BracketMatchCard, { camp: camp, fixture: fixture, revealed: revealedAll || revealedIds.includes(fixture.id), onReveal: () => onReveal(fixture.id) }) }, fixture.id)))] }, round));
                }) })] }));
}
function GroupsStageView({ camp, stage, fixtures, revealedAll, revealedIds, onReveal, }) {
    const groupIndexes = [...new Set(fixtures.map((fixture) => fixture.groupIndex ?? 0))].sort((a, b) => a - b);
    return (_jsx("div", { className: "space-y-8", children: groupIndexes.map((groupIndex) => {
            const groupFixtures = fixtures.filter((fixture) => (fixture.groupIndex ?? 0) === groupIndex);
            const entryIds = [
                ...new Set(groupFixtures.flatMap((fixture) => [fixture.playerAId, fixture.playerBId]).filter((id) => Boolean(id))),
            ];
            const standings = entryIds.map((entryId) => {
                let wins = 0;
                let losses = 0;
                let mapDiff = 0;
                for (const fixture of groupFixtures) {
                    if (fixture.status !== "finished")
                        continue;
                    const a = fixture.playerAId === entryId;
                    const b = fixture.playerBId === entryId;
                    if (!a && !b)
                        continue;
                    const mine = a ? fixture.scoreA : fixture.scoreB;
                    const theirs = a ? fixture.scoreB : fixture.scoreA;
                    mapDiff += mine - theirs;
                    if (mine > theirs)
                        wins += 1;
                    else if (theirs > mine)
                        losses += 1;
                }
                return { entryId, wins, losses, mapDiff };
            });
            standings.sort((a, b) => b.wins - a.wins || b.mapDiff - a.mapDiff);
            return (_jsxs("section", { className: "rounded-2xl border border-amber-500/20 bg-black/30 p-4 sm:p-5", children: [_jsxs("h3", { className: "mb-4 font-[family-name:var(--font-display)] text-lg text-amber-100", children: [stage.name, " \u00B7 Grupo ", groupLetter(groupIndex)] }), _jsx("div", { className: "mb-5 overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[280px] text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-white/10 text-[10px] tracking-wider text-zinc-500 uppercase", children: [_jsx("th", { className: "py-2 pr-3", children: "#" }), _jsx("th", { className: "py-2 pr-3", children: "Jogador" }), _jsx("th", { className: "py-2 pr-3", children: "V" }), _jsx("th", { className: "py-2 pr-3", children: "D" }), _jsx("th", { className: "py-2", children: "Saldo" })] }) }), _jsx("tbody", { children: standings.map((row, index) => (_jsxs("tr", { className: "border-b border-white/5 text-zinc-200", children: [_jsx("td", { className: "py-2 pr-3 text-zinc-500", children: index + 1 }), _jsx("td", { className: "py-2 pr-3 font-medium", children: playerName(camp, row.entryId, null) }), _jsx("td", { className: "py-2 pr-3 text-emerald-300", children: row.wins }), _jsx("td", { className: "py-2 pr-3 text-red-300", children: row.losses }), _jsx("td", { className: "py-2 text-amber-200/80", children: row.mapDiff > 0 ? `+${row.mapDiff}` : row.mapDiff })] }, row.entryId))) })] }) }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: groupFixtures.map((fixture) => (_jsx(BracketMatchCard, { camp: camp, fixture: fixture, revealed: revealedAll || revealedIds.includes(fixture.id), onReveal: () => onReveal(fixture.id) }, fixture.id))) })] }, groupIndex));
        }) }));
}
function hashSeed(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1)
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    return Math.abs(hash);
}
function orbitMotion(id, kind) {
    const seed = hashSeed(id);
    const tilt = ((seed % 900) / 100) - 4.5;
    const ranges = kind === "match"
        ? { min: 2.8, max: 4.2 }
        : kind === "initializer"
            ? { min: 3.2, max: 5.1 }
            : { min: 3.6, max: 5.8 };
    const duration = ranges.min + ((seed % 1000) / 1000) * (ranges.max - ranges.min);
    const delay = -(((seed >> 4) % 1000) / 1000) * duration;
    return {
        "--tilt": `${tilt.toFixed(2)}deg`,
        animationDuration: `${duration.toFixed(2)}s`,
        animationDelay: `${delay.toFixed(2)}s`,
    };
}
function edgeStroke(fromType) {
    if (fromType === "initializer")
        return { glow: "rgba(56,189,248,0.55)", wire: "#7dd3fc", spark: "#e0f2fe" };
    if (fromType === "finalizer")
        return { glow: "rgba(52,211,153,0.5)", wire: "#6ee7b7", spark: "#d1fae5" };
    return { glow: "rgba(251,191,36,0.55)", wire: "#fbbf24", spark: "#fef3c7" };
}
function FlowOrbitShell({ id, kind, left, top, width, children, }) {
    return (_jsx("div", { className: cn("flow-card-orbit", `flow-card-orbit--${kind}`), style: { left, top, width, ...orbitMotion(id, kind) }, children: _jsx("div", { className: cn("flow-card-shell", `flow-card-shell--${kind}`), children: _jsx("div", { className: "flow-card-body", children: children }) }) }));
}
function FlowMatchCard({ camp, fixture, label, revealed, onReveal, }) {
    const showScore = revealed || fixture.status === "finished";
    const winner = showScore && fixture.scoreA !== fixture.scoreB ? (fixture.scoreA > fixture.scoreB ? "A" : "B") : null;
    const md = seriesLabel(fixture.seriesLength);
    const nameA = playerName(camp, fixture.playerAId, fixture.feederA);
    const nameB = playerName(camp, fixture.playerBId, fixture.feederB);
    return (_jsxs("div", { className: cn("relative min-w-0", fixture.isBye && "opacity-45"), children: [_jsxs("div", { className: "relative flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[9px] tracking-[0.22em] text-amber-200/70 uppercase", children: "Confronto" }), _jsx("p", { className: "truncate font-[family-name:var(--font-display)] text-sm text-amber-50", children: label || fixture.roundLabel })] }), md ? (_jsx("span", { className: "rounded-md border border-amber-300/40 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.25)]", children: md })) : null] }), _jsx(SlotRow, { name: nameA, logoUrl: playerLogo(camp, fixture.playerAId), score: showScore ? fixture.scoreA : null, state: winner === "A" ? "winner" : winner === "B" ? "loser" : "open" }), _jsx(SlotRow, { name: nameB, logoUrl: playerLogo(camp, fixture.playerBId), score: showScore ? fixture.scoreB : null, state: winner === "B" ? "winner" : winner === "A" ? "loser" : "open" }), !showScore && fixture.status === "scheduled" && (fixture.scoreA > 0 || fixture.scoreB > 0 || fixture.games.length > 0) ? (_jsx("button", { type: "button", onClick: onReveal, className: "relative w-full border-t border-white/10 py-1.5 text-[10px] tracking-wide text-amber-100/90 hover:bg-amber-400/10", children: "Revelar placar" })) : null, showScore && fixture.games.length > 0 ? (_jsx("div", { className: "relative flex flex-wrap justify-center gap-1 border-t border-white/10 px-2 py-1.5", children: fixture.games.map((game) => (_jsx("span", { className: cn("h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor]", game.winnerSide === "A" ? "bg-amber-300 text-amber-300" : "bg-sky-300 text-sky-300"), title: `${game.mapName || "Mapa"} · ${game.winnerSide === "A" ? nameA : nameB}` }, game.id))) })) : null] }));
}
function FlowPortalCard({ kind, label, entryName, logoUrl, }) {
    const isInit = kind === "initializer";
    return (_jsxs("div", { className: "px-3 py-2.5", children: [_jsx("p", { className: cn("text-[9px] tracking-[0.24em] uppercase", isInit ? "text-sky-300/80" : "text-emerald-300/80"), children: isInit ? "Inicializador" : "Finalizador" }), _jsx("p", { className: cn("mt-0.5 truncate font-[family-name:var(--font-display)] text-base", isInit ? "text-sky-50" : "text-emerald-50"), children: label }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("div", { className: cn("h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-zinc-950 shadow-[0_0_14px_rgba(255,255,255,0.12)]", isInit ? "border-sky-300/50" : "border-emerald-300/50"), children: _jsx(PlayerAvatarMark, { src: logoUrl, className: "h-full w-full", width: 28, height: 28 }) }), _jsx("p", { className: "min-w-0 truncate text-xs text-zinc-300", children: entryName })] })] }));
}
function CustomFlowStageView({ camp, stage, revealedAll, revealedIds, onReveal, }) {
    const CARD_W = 212;
    const CARD_H = 118;
    const PAD = 28;
    const width = Math.max(760, ...stage.flowNodes.map((node) => node.x + CARD_W + PAD * 2), 760);
    const height = Math.max(420, ...stage.flowNodes.map((node) => node.y + CARD_H + PAD * 2), 420);
    function edgePath(edge) {
        const from = stage.flowNodes.find((node) => node.id === edge.fromNodeId);
        const to = stage.flowNodes.find((node) => node.id === edge.toNodeId);
        if (!from || !to)
            return null;
        const x1 = from.x + PAD + CARD_W;
        const y1 = from.y + PAD + CARD_H / 2;
        const x2 = to.x + PAD;
        const y2 = to.y + PAD + (edge.toSlot === "B" ? CARD_H * 0.72 : edge.toSlot === "A" ? CARD_H * 0.28 : CARD_H / 2);
        const mid = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
    }
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-xl text-amber-100", children: stage.name }), _jsxs("p", { className: "text-xs text-zinc-500", children: ["Personalizada \u00B7 ", seriesLabel(stage.seriesLength)] })] }), _jsxs("div", { className: "flow-space-board", children: [_jsx("div", { className: "flow-space-board__stars" }), _jsxs("div", { className: "relative", style: { width, height }, children: [_jsx("svg", { className: "pointer-events-none absolute inset-0 overflow-visible", width: width, height: height, children: stage.flowEdges.map((edge, index) => {
                                    const from = stage.flowNodes.find((node) => node.id === edge.fromNodeId);
                                    const d = edgePath(edge);
                                    if (!from || !d)
                                        return null;
                                    const stroke = edgeStroke(from.type);
                                    const sparkDur = `${(1.8 + (hashSeed(edge.id) % 120) / 100).toFixed(2)}s`;
                                    const sparkDelay = `${((hashSeed(edge.id) % 80) / 100).toFixed(2)}s`;
                                    return (_jsxs("g", { children: [_jsx("path", { d: d, className: "flow-edge-glow", stroke: stroke.glow }), _jsx("path", { d: d, className: "flow-edge-wire", stroke: stroke.wire }), _jsx("path", { d: d, className: "flow-edge-dash", stroke: stroke.spark, style: { animationDelay: `${index * 0.12}s` } }), _jsx("circle", { r: "3.2", fill: stroke.spark, className: "flow-edge-spark", style: { color: stroke.spark }, children: _jsx("animateMotion", { dur: sparkDur, begin: sparkDelay, repeatCount: "indefinite", path: d }) }), _jsx("circle", { r: "1.6", fill: "#fff", opacity: "0.9", children: _jsx("animateMotion", { dur: sparkDur, begin: sparkDelay, repeatCount: "indefinite", path: d }) })] }, edge.id));
                                }) }), stage.flowNodes.map((node) => {
                                const fixture = node.fixtureId ? camp.fixtures.find((item) => item.id === node.fixtureId) : null;
                                if (node.type === "match" && fixture) {
                                    return (_jsx(FlowOrbitShell, { id: node.id, kind: "match", left: node.x + PAD, top: node.y + PAD, width: CARD_W, children: _jsx(FlowMatchCard, { camp: camp, fixture: fixture, label: node.label || fixture.roundLabel, revealed: revealedAll || revealedIds.includes(fixture.id), onReveal: () => onReveal(fixture.id) }) }, node.id));
                                }
                                const entryName = node.entryId
                                    ? camp.players.find((player) => player.id === node.entryId)?.name || "Jogador"
                                    : node.type === "initializer"
                                        ? "Aguardando entrada"
                                        : "Aguardando finalista";
                                const kind = node.type === "initializer" || node.type === "finalizer" ? node.type : "match";
                                return (_jsx(FlowOrbitShell, { id: node.id, kind: kind, left: node.x + PAD, top: node.y + PAD, width: CARD_W, children: kind === "match" ? (_jsxs("div", { className: "px-3 py-2.5", children: [_jsx("p", { className: "text-[9px] tracking-[0.22em] text-amber-200/70 uppercase", children: "Confronto" }), _jsx("p", { className: "truncate font-[family-name:var(--font-display)] text-sm text-amber-50", children: node.label || "Confronto" }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: "Sem partida vinculada" })] })) : (_jsx(FlowPortalCard, { kind: kind, label: node.label || (kind === "initializer" ? "Inicializador" : "Finalizador"), entryName: entryName, logoUrl: playerLogo(camp, node.entryId) })) }, node.id));
                            })] })] })] }));
}
export function ChampionshipBracketView({ camp, revealedAll, revealedIds, onReveal, }) {
    if (camp.stages.length === 0) {
        return _jsx("p", { className: "text-sm text-zinc-500", children: "Configure as fases no painel do campeonato para ver a chave." });
    }
    return (_jsx("div", { className: "space-y-10", children: camp.stages.map((stage) => {
            if (stage.format === "custom") {
                if (stage.flowNodes.length === 0) {
                    return (_jsxs("section", { children: [_jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-xl text-amber-100", children: stage.name }), _jsx("p", { className: "text-sm text-zinc-500", children: "Quadro ainda n\u00E3o configurado." })] }, stage.id));
                }
                return (_jsx(CustomFlowStageView, { camp: camp, stage: stage, revealedAll: revealedAll, revealedIds: revealedIds, onReveal: onReveal }, stage.id));
            }
            const stageFixtures = camp.fixtures.filter((fixture) => fixture.stageId === stage.id && !fixture.isHidden);
            if (stageFixtures.length === 0) {
                return (_jsxs("section", { children: [_jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-xl text-amber-100", children: stage.name }), _jsx("p", { className: "text-sm text-zinc-500", children: "Confrontos ainda n\u00E3o gerados." })] }, stage.id));
            }
            if (stage.format === "groups") {
                return (_jsx(GroupsStageView, { camp: camp, stage: stage, fixtures: stageFixtures, revealedAll: revealedAll, revealedIds: revealedIds, onReveal: onReveal }, stage.id));
            }
            const winners = stageFixtures.filter((fixture) => fixture.section === "winners");
            const losers = stageFixtures.filter((fixture) => fixture.section === "losers");
            const grand = stageFixtures.filter((fixture) => fixture.section === "grand_final");
            return (_jsxs("section", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-xl text-amber-100", children: stage.name }), _jsxs("p", { className: "text-xs text-zinc-500", children: [stage.format === "double_elim" ? "Mata-mata duplo" : "Mata-mata", " \u00B7 ", seriesLabel(stage.seriesLength)] })] }), _jsx(BracketColumns, { camp: camp, fixtures: winners.length ? winners : stageFixtures, revealedAll: revealedAll, revealedIds: revealedIds, onReveal: onReveal, title: stage.format === "double_elim" ? "Winners bracket" : undefined, accent: "text-emerald-300" }), losers.length > 0 ? (_jsx(BracketColumns, { camp: camp, fixtures: losers, revealedAll: revealedAll, revealedIds: revealedIds, onReveal: onReveal, title: "Losers bracket", accent: "text-red-300" })) : null, grand.length > 0 ? (_jsx(BracketColumns, { camp: camp, fixtures: grand, revealedAll: revealedAll, revealedIds: revealedIds, onReveal: onReveal, title: "Grande final", accent: "text-amber-200" })) : null] }, stage.id));
        }) }));
}
