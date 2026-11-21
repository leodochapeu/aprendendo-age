import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
import { StartStructuredContent } from "@/components/starts/StartStructuredContent";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { START_TABLE_ROW_TYPE_OPTIONS, deuses, panteoes, startBySlug, startsBuildOrder, } from "@/data/catalog";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { resolveStartImageToken } from "@/lib/resolveStartImageToken";
import { startAuthorFromString } from "@/lib/startAuthor";
import { buildStartSlug } from "@/lib/startSlug";
const RESOURCE_FIELD_ICONS = {
    food: "foodaom",
    wood: "woodaom",
    gold: "goldaom",
    favor: "favoraom",
    pop: "aomr_population_provision_icon",
};
const inputClass = "w-full rounded-lg border border-aom-border bg-aom-card px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function normalizeCell(v) {
    const t = v.trim();
    return t.length ? t : null;
}
function emptyRow() {
    return {
        id: uid(),
        description: "",
        food: "",
        wood: "",
        gold: "",
        favor: "",
        pop: "",
        type: "",
    };
}
/** Nova linha: copia food/wood/gold/favor/pop da linha anterior (descrição e tipo vazios). */
function newTableRowAfter(previous) {
    if (!previous)
        return emptyRow();
    return {
        id: uid(),
        description: "",
        food: previous.food,
        wood: previous.wood,
        gold: previous.gold,
        favor: previous.favor,
        pop: previous.pop,
        type: "",
    };
}
function emptyLeadCallout() {
    return { id: uid(), text: "" };
}
function newLeadCalloutAfter(previous) {
    if (!previous)
        return emptyLeadCallout();
    return { id: uid(), text: previous.text };
}
function emptySegment() {
    return {
        id: uid(),
        heading: "",
        callouts: [emptyLeadCallout()],
        footer: "",
        rows: [emptyRow()],
    };
}
function editorRowHasContent(row) {
    return !!(row.description.trim() ||
        row.food.trim() ||
        row.wood.trim() ||
        row.gold.trim() ||
        row.favor.trim() ||
        row.pop.trim() ||
        row.type);
}
function editorCalloutHasContent(c) {
    return !!c.text.trim();
}
function editorSegmentHasContent(seg) {
    return !!(seg.heading.trim() ||
        seg.footer.trim() ||
        seg.callouts.some(editorCalloutHasContent) ||
        seg.rows.some(editorRowHasContent));
}
/** Botão remover: visível se o item tem conteúdo ou há mais de um no grupo. */
function canShowRemoveButton(hasContent, count) {
    return hasContent || count > 1;
}
function cellToEditor(v) {
    if (v == null)
        return "";
    return String(v);
}
function tableRowToEditor(r) {
    return {
        id: uid(),
        description: r.description ?? "",
        food: cellToEditor(r.food),
        wood: cellToEditor(r.wood),
        gold: cellToEditor(r.gold),
        favor: cellToEditor(r.favor),
        pop: cellToEditor(r.pop),
        type: r.type ?? "",
    };
}
function segmentFromStructured(seg) {
    let heading = "";
    const callouts = [];
    for (const block of seg.lead ?? []) {
        if (block.kind === "heading" && block.level === 1 && !heading) {
            heading = block.text;
        }
        else if (block.kind === "callout") {
            callouts.push({ id: uid(), text: block.text });
        }
        else if (block.kind === "heading") {
            callouts.push({ id: uid(), text: block.text });
        }
    }
    let footer = "";
    for (const block of seg.footer ?? []) {
        if (block.kind === "paragraph") {
            footer = block.text;
        }
        else if (block.kind === "callout" || block.kind === "heading") {
            footer = footer ? `${footer}\n\n${block.text}` : block.text;
        }
    }
    const rows = (seg.table ?? []).map(tableRowToEditor);
    return {
        id: uid(),
        heading,
        callouts: callouts.length ? callouts : [emptyLeadCallout()],
        footer,
        rows: rows.length ? rows : [emptyRow()],
    };
}
function isStartBuildOrder(obj) {
    if (!obj || typeof obj !== "object")
        return false;
    const o = obj;
    return typeof o.titulo === "string" && typeof o.structured === "object" && o.structured !== null;
}
function parseImportJson(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        throw new Error("Cole um JSON ou escolha um arquivo .json.");
    let parsed;
    try {
        parsed = JSON.parse(trimmed);
    }
    catch {
        throw new Error("JSON inválido — verifique vírgulas, aspas e chaves.");
    }
    if (!isStartBuildOrder(parsed)) {
        throw new Error("O JSON precisa ser um start com «titulo» e «structured» (como no export desta página).");
    }
    return parsed;
}
function segmentToStructured(seg) {
    const lead = [];
    if (seg.heading.trim()) {
        lead.push({ kind: "heading", level: 1, text: seg.heading.trim() });
    }
    for (const c of seg.callouts) {
        if (c.text.trim()) {
            lead.push({ kind: "callout", text: c.text.trim() });
        }
    }
    const table = seg.rows
        .filter((r) => r.description.trim())
        .map((r) => ({
        description: r.description.trim(),
        food: normalizeCell(r.food),
        wood: normalizeCell(r.wood),
        gold: normalizeCell(r.gold),
        favor: normalizeCell(r.favor),
        pop: normalizeCell(r.pop),
        type: r.type ? r.type : null,
    }));
    const footer = [];
    if (seg.footer.trim()) {
        footer.push({ kind: "paragraph", text: seg.footer.trim() });
    }
    return {
        lead: lead.length ? lead : undefined,
        table: table.length ? table : undefined,
        footer: footer.length ? footer : undefined,
    };
}
const deusesSorted = [...deuses]
    .filter((d) => d.hierarquia?.toLowerCase() === "maior")
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
export function SecretStartBuilderPage() {
    const [nome, setNome] = useState("");
    const [titulo, setTitulo] = useState("");
    const [youtubeText, setYoutubeText] = useState("");
    const [authors, setAuthors] = useState([""]);
    const [godFilter, setGodFilter] = useState("");
    const [godsChecked, setGodsChecked] = useState({});
    const [pantheon, setPantheon] = useState("");
    const [slugOverride, setSlugOverride] = useState("");
    const [segments, setSegments] = useState([emptySegment()]);
    const [copyState, setCopyState] = useState("idle");
    const [importText, setImportText] = useState("");
    const [importMessage, setImportMessage] = useState(null);
    const maxStartId = useMemo(() => Math.max(0, ...startsBuildOrder.map((s) => s.id)), []);
    const filteredDeuses = useMemo(() => {
        const q = godFilter.trim().toLowerCase();
        if (!q)
            return deusesSorted;
        return deusesSorted.filter((d) => d.nome.toLowerCase().includes(q));
    }, [godFilter]);
    const godNamesSelected = useMemo(() => deusesSorted.filter((d) => godsChecked[d.id]).map((d) => d.nome), [godsChecked]);
    const structuredPreview = useMemo(() => ({ segments: segments.map(segmentToStructured).filter((s) => s.lead?.length || s.table?.length || s.footer?.length) }), [segments]);
    const builtStart = useMemo(() => {
        const t = titulo.trim();
        if (!t)
            return null;
        const author = authors.map((a) => a.trim()).filter(Boolean).map(startAuthorFromString);
        const youtube = youtubeText
            .split(/[\s,]+/)
            .map((u) => u.trim())
            .filter(Boolean);
        const segs = segments.map(segmentToStructured).filter((s) => s.lead?.length || s.table?.length || s.footer?.length);
        if (!segs.some((s) => (s.table?.length ?? 0) > 0))
            return null;
        const pTrim = pantheon.trim();
        const base = {
            id: maxStartId + 1,
            titulo: t,
            author,
            god: godNamesSelected,
            image: resolveStartImageToken(godNamesSelected, pTrim || undefined),
            youtube,
            descricao_curta: nome.trim() || "Rascunho gerado pelo builder secreto.",
            structured: { segments: segs },
        };
        const slug = slugOverride.trim() ? slugifyManual(slugOverride) : buildStartSlug(base) || "start";
        const out = {
            ...base,
            slug,
        };
        if (pTrim) {
            out.pantheon = pTrim;
        }
        return out;
    }, [titulo, authors, youtubeText, godNamesSelected, segments, nome, slugOverride, pantheon, maxStartId]);
    const slugPreview = builtStart?.slug ?? "";
    const slugCollision = slugPreview && startBySlug.has(slugPreview);
    const jsonText = useMemo(() => (builtStart ? JSON.stringify(builtStart, null, 2) : ""), [builtStart]);
    const reorderSegments = useCallback((from, to) => {
        if (from === to || from < 0 || to < 0)
            return;
        setSegments((prev) => {
            const next = [...prev];
            const [m] = next.splice(from, 1);
            next.splice(to, 0, m);
            return next;
        });
    }, []);
    const reorderRows = useCallback((segmentIndex, from, to) => {
        if (from === to || from < 0 || to < 0)
            return;
        setSegments((prev) => prev.map((s, j) => {
            if (j !== segmentIndex)
                return s;
            const rows = [...s.rows];
            const [m] = rows.splice(from, 1);
            rows.splice(to, 0, m);
            return { ...s, rows };
        }));
    }, []);
    const applyImportedStart = useCallback((start) => {
        setNome(start.descricao_curta ?? "");
        setTitulo(start.titulo ?? "");
        setYoutubeText((start.youtube ?? []).join("\n"));
        const names = (start.author ?? []).map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean);
        setAuthors(names.length ? names : [""]);
        setPantheon(start.pantheon ?? "");
        setSlugOverride(start.slug ?? "");
        const checked = {};
        for (const d of deusesSorted) {
            if ((start.god ?? []).includes(d.nome))
                checked[d.id] = true;
        }
        setGodsChecked(checked);
        const segs = (start.structured?.segments ?? []).map(segmentFromStructured);
        setSegments(segs.length ? segs : [emptySegment()]);
    }, []);
    const runImport = useCallback((raw, successLabel) => {
        try {
            const parsed = parseImportJson(raw);
            applyImportedStart(parsed);
            setImportText(JSON.stringify(parsed, null, 2));
            setImportMessage({
                kind: "ok",
                text: successLabel ?? "Importado — revise os campos e exporte quando estiver pronto.",
            });
        }
        catch (err) {
            setImportMessage({
                kind: "err",
                text: err instanceof Error ? err.message : "Não foi possível importar.",
            });
        }
    }, [applyImportedStart]);
    const copyJson = useCallback(async () => {
        if (!jsonText)
            return;
        try {
            await navigator.clipboard.writeText(jsonText);
            setCopyState("ok");
            setTimeout(() => setCopyState("idle"), 2000);
        }
        catch {
            setCopyState("err");
            setTimeout(() => setCopyState("idle"), 3000);
        }
    }, [jsonText]);
    const downloadJson = useCallback(() => {
        if (!builtStart || !jsonText)
            return;
        const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${builtStart.slug || "start"}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }, [builtStart, jsonText]);
    return (_jsxs("div", { className: "pb-16", children: [_jsx(BackLink, { to: "/", children: "In\u00EDcio" }), _jsx(PageHeader, { title: "Builder secreto de starts", description: "Apenas por URL. Gera um objeto JSON para colar em starts_build_order.json (o site n\u00E3o grava arquivo no disco). Campos nome e t\u00EDtulo: nome \u2192 descri\u00E7\u00E3o curta da p\u00E1gina; t\u00EDtulo \u2192 titulo do card e da entrada." }), _jsxs("div", { className: "mt-6 grid gap-8 xl:grid-cols-[1fr_minmax(0,420px)]", children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsx("h2", { className: "mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Metadados" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "block sm:col-span-2", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Nome (descri\u00E7\u00E3o curta / subt\u00EDtulo)" }), _jsx("input", { className: inputClass, value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Ex.: Rush com 2 alde\u00F5es no ouro" })] }), _jsxs("label", { className: "block sm:col-span-2", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "T\u00EDtulo" }), _jsx("input", { className: inputClass, value: titulo, onChange: (e) => setTitulo(e.target.value), placeholder: "Ex.: Zeus - por Fulano" })] }), _jsxs("label", { className: "block sm:col-span-2", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "YouTube (URLs, uma por linha ou separadas por v\u00EDrgula)" }), _jsx("textarea", { className: cnTextarea(), value: youtubeText, onChange: (e) => setYoutubeText(e.target.value), rows: 3, placeholder: "https://youtu.be/..." })] }), _jsxs("label", { className: "block sm:col-span-2", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Slug manual (opcional)" }), _jsx("input", { className: inputClass, value: slugOverride, onChange: (e) => setSlugOverride(e.target.value), placeholder: "Deixe vazio para gerar a partir do t\u00EDtulo e autores" })] }), _jsxs("label", { className: "block sm:col-span-2", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-zinc-400", children: "Pante\u00E3o (opcional, como em panteoes.json)" }), _jsxs("select", { className: inputClass, value: pantheon, onChange: (e) => setPantheon(e.target.value), children: [_jsx("option", { value: "", children: "\u2014" }), panteoes.map((p) => (_jsx("option", { value: p.nome, children: p.nome }, p.id)))] })] })] })] }), _jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsx("h2", { className: "mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Autores" }), _jsx("ul", { className: "space-y-2", children: authors.map((a, i) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("input", { className: inputClass, value: a, onChange: (e) => {
                                                        const v = e.target.value;
                                                        setAuthors((prev) => prev.map((x, j) => (j === i ? v : x)));
                                                    }, placeholder: `Autor ${i + 1}` }), _jsx("button", { type: "button", className: "shrink-0 rounded-lg border border-zinc-600 px-2 text-xs text-zinc-300 hover:bg-zinc-800", onClick: () => setAuthors((prev) => prev.filter((_, j) => j !== i)), disabled: authors.length <= 1, children: "Remover" })] }, i))) }), _jsx("button", { type: "button", className: "mt-3 rounded-lg border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/20", onClick: () => setAuthors((prev) => [...prev, ""]), children: "+ Autor" })] }), _jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsx("h2", { className: "mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Deuses (god)" }), _jsxs("p", { className: "mb-3 text-xs text-zinc-500", children: ["Apenas deuses maiores (", _jsx("code", { className: "text-zinc-400", children: "hierarquia: Maior" }), ")."] }), _jsx("input", { className: `${inputClass} mb-3`, value: godFilter, onChange: (e) => setGodFilter(e.target.value), placeholder: "Filtrar por nome\u2026" }), _jsx("div", { className: "max-h-56 overflow-y-auto rounded-lg border border-aom-border/80 p-2", children: _jsx("ul", { className: "grid gap-1 sm:grid-cols-2", children: filteredDeuses.map((d) => (_jsx("li", { children: _jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-zinc-800/60", children: [_jsx("input", { type: "checkbox", checked: !!godsChecked[d.id], onChange: (e) => setGodsChecked((prev) => ({
                                                                ...prev,
                                                                [d.id]: e.target.checked,
                                                            })) }), _jsx("span", { className: "truncate text-zinc-200", children: d.nome })] }) }, d.id))) }) })] }), _jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Segmentos" }), _jsx("button", { type: "button", className: "rounded-lg border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/20", onClick: () => setSegments((prev) => [...prev, emptySegment()]), children: "+ Segmento" })] }), _jsxs("p", { className: "mb-4 text-xs text-zinc-500", children: ["Arraste pelo \u00EDcone \u22EE\u22EE para reordenar segmentos ou linhas da tabela. Cada segmento pode ter t\u00EDtulo (heading), v\u00E1rios callouts antes da tabela, a tabela e rodap\u00E9 opcional. Tipos de linha da tabela: os mesmos usados em", " ", _jsx("code", { className: "text-zinc-400", children: "starts_build_order.json" }), " (hint, blue, pink, \u2026)."] }), _jsx("ul", { className: "space-y-4", children: segments.map((seg, si) => (_jsxs("li", { onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                                                e.preventDefault();
                                                const raw = e.dataTransfer.getData("text/plain");
                                                if (!raw.startsWith("segment:"))
                                                    return;
                                                const from = Number.parseInt(raw.slice(8), 10);
                                                if (Number.isNaN(from) || from === si)
                                                    return;
                                                reorderSegments(from, si);
                                            }, className: "rounded-xl border border-zinc-700/80 bg-zinc-950/40 p-3", children: [_jsxs("div", { className: "mb-2 flex items-start gap-2", children: [_jsx("span", { draggable: true, onDragStart: (e) => {
                                                                e.dataTransfer.effectAllowed = "move";
                                                                e.dataTransfer.setData("text/plain", `segment:${si}`);
                                                            }, className: "cursor-grab select-none px-1.5 py-2 text-zinc-500 active:cursor-grabbing", title: "Arrastar para reordenar", role: "button", tabIndex: 0, children: "\u22EE\u22EE" }), _jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx("input", { className: inputClass, value: seg.heading, onChange: (e) => {
                                                                        const v = e.target.value;
                                                                        setSegments((prev) => prev.map((s, j) => (j === si ? { ...s, heading: v } : s)));
                                                                    }, placeholder: "T\u00EDtulo do segmento (heading n\u00EDvel 1), opcional" }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-xs font-medium text-zinc-400", children: "Callouts antes da tabela (opcional)" }), seg.callouts.map((c, ci) => (_jsxs("div", { className: "rounded-lg border border-aom-border/60 bg-aom-card/25 p-2", children: [_jsxs("div", { className: "mb-1 flex flex-wrap items-center justify-between gap-2", children: [_jsxs("span", { className: "text-xs text-zinc-500", children: ["Callout ", ci + 1] }), canShowRemoveButton(editorCalloutHasContent(c), seg.callouts.length) ? (_jsx("button", { type: "button", className: "rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800", onClick: () => setSegments((prev) => prev.map((s, j) => j === si
                                                                                                ? {
                                                                                                    ...s,
                                                                                                    callouts: s.callouts.length <= 1 ? s.callouts : s.callouts.filter((_, k) => k !== ci),
                                                                                                }
                                                                                                : s)), children: "Remover callout" })) : null] }), _jsx("textarea", { className: cnTextarea(), value: c.text, onChange: (e) => {
                                                                                        const v = e.target.value;
                                                                                        setSegments((prev) => prev.map((s, j) => j === si
                                                                                            ? {
                                                                                                ...s,
                                                                                                callouts: s.callouts.map((x, k) => (k === ci ? { ...x, text: v } : x)),
                                                                                            }
                                                                                            : s));
                                                                                    }, rows: 2, placeholder: "Texto do callout (:tokens:, mini-markup\u2026)" })] }, c.id))), _jsx("button", { type: "button", className: "text-sm text-amber-200/90 underline-offset-2 hover:underline", onClick: () => setSegments((prev) => prev.map((s, j) => {
                                                                                if (j !== si)
                                                                                    return s;
                                                                                const last = s.callouts[s.callouts.length - 1];
                                                                                return { ...s, callouts: [...s.callouts, newLeadCalloutAfter(last)] };
                                                                            })), children: "+ Callout" })] })] }), canShowRemoveButton(editorSegmentHasContent(seg), segments.length) ? (_jsx("button", { type: "button", className: "shrink-0 rounded border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40", onClick: () => setSegments((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== si))), children: "Remover segmento" })) : null] }), _jsxs("div", { className: "ml-8 space-y-2 border-l border-zinc-700/60 pl-3", children: [seg.rows.map((row, ri) => (_jsxs("div", { onDragOver: (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }, onDrop: (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const raw = e.dataTransfer.getData("text/plain");
                                                                if (!raw.startsWith("row:"))
                                                                    return;
                                                                const [, segPart, rowPart] = raw.split(":");
                                                                const fromSi = Number.parseInt(segPart ?? "", 10);
                                                                const fromRi = Number.parseInt(rowPart ?? "", 10);
                                                                if (fromSi !== si || Number.isNaN(fromRi) || fromRi === ri)
                                                                    return;
                                                                reorderRows(si, fromRi, ri);
                                                            }, className: "rounded-lg border border-aom-border/60 bg-aom-card/30 p-2", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { draggable: true, onDragStart: (e) => {
                                                                                e.stopPropagation();
                                                                                e.dataTransfer.effectAllowed = "move";
                                                                                e.dataTransfer.setData("text/plain", `row:${si}:${ri}`);
                                                                            }, className: "cursor-grab select-none px-1 text-zinc-500 active:cursor-grabbing", title: "Arrastar para reordenar linha", role: "button", tabIndex: 0, children: "\u22EE\u22EE" }), _jsxs("span", { className: "text-xs text-zinc-500", children: ["Linha ", ri + 1] }), _jsxs("label", { className: "ml-auto flex items-center gap-1 text-xs text-zinc-400", children: ["Tipo", _jsx("select", { className: `${inputClass} !py-1 text-xs`, value: row.type, onChange: (e) => {
                                                                                        const v = e.target.value;
                                                                                        setSegments((prev) => prev.map((s, j) => j === si
                                                                                            ? {
                                                                                                ...s,
                                                                                                rows: s.rows.map((r, k) => (k === ri ? { ...r, type: v } : r)),
                                                                                            }
                                                                                            : s));
                                                                                    }, children: START_TABLE_ROW_TYPE_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value || "null"))) })] }), canShowRemoveButton(editorRowHasContent(row), seg.rows.length) ? (_jsx("button", { type: "button", className: "rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800", onClick: () => setSegments((prev) => prev.map((s, j) => j === si
                                                                                ? {
                                                                                    ...s,
                                                                                    rows: s.rows.length <= 1 ? s.rows : s.rows.filter((_, k) => k !== ri),
                                                                                }
                                                                                : s)), children: "Remover linha" })) : null] }), _jsx("input", { className: `${inputClass} mb-1`, value: row.description, onChange: (e) => {
                                                                        const v = e.target.value;
                                                                        setSegments((prev) => prev.map((s, j) => j === si ? { ...s, rows: s.rows.map((r, k) => (k === ri ? { ...r, description: v } : r)) } : s));
                                                                    }, placeholder: "Descri\u00E7\u00E3o (mini-markup / :aomr_\u2026:)" }), _jsx("div", { className: "grid grid-cols-2 gap-1 sm:grid-cols-5", children: ["food", "wood", "gold", "favor", "pop"].map((field) => {
                                                                        const iconSrc = getTokenAssetUrl(RESOURCE_FIELD_ICONS[field]);
                                                                        return (_jsxs("div", { className: "flex min-w-0 items-center gap-1", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", className: "h-4 w-4 shrink-0 object-contain opacity-90", title: field })) : null, _jsx("input", { className: `${inputClass} min-w-0 !py-1.5 text-xs`, value: row[field], onChange: (e) => {
                                                                                        const v = e.target.value;
                                                                                        setSegments((prev) => prev.map((s, j) => j === si
                                                                                            ? { ...s, rows: s.rows.map((r, k) => (k === ri ? { ...r, [field]: v } : r)) }
                                                                                            : s));
                                                                                    }, placeholder: field })] }, field));
                                                                    }) })] }, row.id))), _jsx("button", { type: "button", className: "text-sm text-amber-200/90 underline-offset-2 hover:underline", onClick: () => setSegments((prev) => prev.map((s, j) => {
                                                                if (j !== si)
                                                                    return s;
                                                                const last = s.rows[s.rows.length - 1];
                                                                return { ...s, rows: [...s.rows, newTableRowAfter(last)] };
                                                            })), children: "+ Linha na tabela" })] }), _jsxs("label", { className: "ml-8 mt-2 block border-l border-zinc-700/60 pl-3", children: [_jsx("span", { className: "mb-1 block text-xs text-zinc-500", children: "Rodap\u00E9 do segmento (par\u00E1grafo, opcional)" }), _jsx("textarea", { className: cnTextarea(), value: seg.footer, onChange: (e) => {
                                                                const v = e.target.value;
                                                                setSegments((prev) => prev.map((s, j) => (j === si ? { ...s, footer: v } : s)));
                                                            }, rows: 2 })] })] }, seg.id))) })] }), _jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Importar" }), _jsxs("p", { className: "mb-3 text-sm text-zinc-400", children: ["Cole o JSON exportado desta p\u00E1gina (ou de ", _jsx("code", { className: "text-zinc-500", children: "starts_build_order.json" }), ") ou escolha um arquivo", " ", _jsx("code", { className: "text-zinc-500", children: ".json" }), ". Metadados e segmentos substituem o formul\u00E1rio atual."] }), _jsx("textarea", { className: cnTextarea(), value: importText, onChange: (e) => setImportText(e.target.value), rows: 6, placeholder: '{ "titulo": "...", "structured": { "segments": [...] }, ... }' }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", className: "rounded-lg border border-amber-600/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20", onClick: () => runImport(importText), children: "Importar do texto" }), _jsxs("label", { className: "cursor-pointer rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800", children: ["Escolher .json", _jsx("input", { type: "file", accept: ".json,application/json", className: "sr-only", onChange: (e) => {
                                                            const file = e.target.files?.[0];
                                                            e.target.value = "";
                                                            if (!file)
                                                                return;
                                                            const reader = new FileReader();
                                                            reader.onload = () => {
                                                                const text = String(reader.result ?? "");
                                                                runImport(text, `Arquivo «${file.name}» importado.`);
                                                            };
                                                            reader.onerror = () => setImportMessage({ kind: "err", text: "Não foi possível ler o arquivo." });
                                                            reader.readAsText(file);
                                                        } })] })] }), importMessage ? (_jsx("p", { className: `mt-2 text-sm ${importMessage.kind === "ok" ? "text-emerald-400" : "text-red-400"}`, children: importMessage.text })) : null] }), _jsxs("section", { className: "rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5", children: [_jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95", children: "Exportar" }), _jsxs("p", { className: "mb-3 text-sm text-zinc-400", children: ["Pr\u00F3ximo ", _jsx("code", { className: "text-zinc-500", children: "id" }), " sugerido: ", _jsx("strong", { className: "text-zinc-200", children: maxStartId + 1 }), ". Ajuste no JSON se j\u00E1 tiver adicionado entradas."] }), slugCollision ? (_jsxs("p", { className: "mb-2 text-sm text-amber-300", children: ["Aten\u00E7\u00E3o: o slug \u00AB", slugPreview, "\u00BB j\u00E1 existe em starts_build_order.json."] })) : null, !builtStart ? (_jsx("p", { className: "text-sm text-zinc-500", children: "Preencha o t\u00EDtulo e pelo menos uma linha de tabela com descri\u00E7\u00E3o para gerar o JSON." })) : (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", className: "rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500", onClick: () => void copyJson(), children: "Copiar JSON" }), _jsx("button", { type: "button", className: "rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800", onClick: downloadJson, children: "Baixar .json" }), copyState === "ok" ? _jsx("span", { className: "self-center text-sm text-emerald-400", children: "Copiado." }) : null, copyState === "err" ? _jsx("span", { className: "self-center text-sm text-red-400", children: "N\u00E3o foi poss\u00EDvel copiar." }) : null] }))] })] }), _jsxs("aside", { className: "xl:sticky xl:top-4 xl:self-start", children: [_jsx("h2", { className: "mb-2 font-[family-name:var(--font-display)] text-sm font-semibold text-amber-100/90", children: "Pr\u00E9-visualiza\u00E7\u00E3o" }), structuredPreview.segments.length ? (_jsx("div", { className: "rounded-xl border border-aom-border bg-zinc-950/50 p-3", children: _jsx(StartStructuredContent, { segments: structuredPreview.segments }) })) : (_jsx("p", { className: "text-sm text-zinc-500", children: "Adicione conte\u00FAdo a um segmento para ver a tabela aqui." }))] })] })] }));
}
function cnTextarea() {
    return `${inputClass} min-h-[4.5rem] resize-y font-mono text-[13px] leading-snug`;
}
/** Slug digitado livremente: só normaliza espaços e barras. */
function slugifyManual(raw) {
    return raw
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
