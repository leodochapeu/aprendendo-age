import { useCallback, useMemo, useRef, useState } from "react";

import { startAuthorsSearchText } from "@/components/start/StartAuthorsMeta";
import { StartStructuredContent } from "@/components/starts/StartStructuredContent";
import { BackLink } from "@/components/ui/BackLink";
import { ModalApp } from "@/components/ui/ModalApp";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  START_TABLE_ROW_TYPE_OPTIONS,
  type StartBuildOrder,
  type StartBuildSegment,
  type StartTableRow,
  deuses,
  panteoes,
  startBySlug,
  startsBuildOrder,
} from "@/data/catalog";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { resolveStartImageToken } from "@/lib/resolveStartImageToken";
import { nextPopulation, populationSumMismatch } from "@/lib/startPopulation";
import { startAuthorFromString } from "@/lib/startAuthor";
import { buildStartSlug } from "@/lib/startSlug";

const RESOURCE_FIELD_ICONS = {
  food: "foodaom",
  wood: "woodaom",
  gold: "goldaom",
  favor: "favoraom",
  pop: "aomr_population_provision_icon",
} as const;

const inputClass =
  "w-full rounded-lg border border-aom-border bg-aom-card px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function duplicateEditorRow(row: EditorRow): EditorRow {
  return { ...row, id: uid() };
}

/** Cartão quadrado que o navegador mostra preso ao cursor enquanto a linha é arrastada. */
function mountRowDragGhost(label: string): HTMLElement {
  const ghost = document.createElement("div");
  ghost.textContent = label;
  Object.assign(ghost.style, {
    position: "fixed",
    top: "-240px",
    left: "-240px",
    width: "96px",
    height: "96px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "12px",
    border: "2px solid rgb(251 191 36)",
    background: "rgb(24 24 27)",
    color: "rgb(254 243 199)",
    font: "600 12px/1.3 system-ui, sans-serif",
    textAlign: "center",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgb(0 0 0 / 0.45)",
  });
  document.body.appendChild(ghost);
  return ghost;
}

function normalizeCell(v: string): string | null {
  const t = v.trim();
  return t.length ? t : null;
}

type EditorRow = {
  id: string;
  description: string;
  food: string;
  wood: string;
  gold: string;
  favor: string;
  pop: string;
  type: string;
};

type EditorLeadCallout = {
  id: string;
  text: string;
};

type EditorSegment = {
  id: string;
  heading: string;
  /** Vários callouts em sequência no `lead` (antes da tabela), como no JSON. */
  callouts: EditorLeadCallout[];
  footer: string;
  rows: EditorRow[];
};

function emptyRow(): EditorRow {
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
function newTableRowAfter(previous: EditorRow | undefined): EditorRow {
  if (!previous) return emptyRow();
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

function emptyLeadCallout(): EditorLeadCallout {
  return { id: uid(), text: "" };
}

function newLeadCalloutAfter(previous: EditorLeadCallout | undefined): EditorLeadCallout {
  if (!previous) return emptyLeadCallout();
  return { id: uid(), text: previous.text };
}

function emptySegment(): EditorSegment {
  return {
    id: uid(),
    heading: "",
    callouts: [emptyLeadCallout()],
    footer: "",
    rows: [emptyRow()],
  };
}

function populationSumWarning(row: EditorRow): string | null {
  const expected = populationSumMismatch(row);
  if (expected == null) return null;
  return `O primeiro número deveria ser ${expected} (soma de comida, madeira, ouro e favor). O número depois da barra é o limite de casas e não entra nessa conta.`;
}

function editorRowHasContent(row: EditorRow): boolean {
  return !!(
    row.description.trim() ||
    row.food.trim() ||
    row.wood.trim() ||
    row.gold.trim() ||
    row.favor.trim() ||
    row.pop.trim() ||
    row.type
  );
}

function editorCalloutHasContent(c: EditorLeadCallout): boolean {
  return !!c.text.trim();
}

function editorSegmentHasContent(seg: EditorSegment): boolean {
  return !!(
    seg.heading.trim() ||
    seg.footer.trim() ||
    seg.callouts.some(editorCalloutHasContent) ||
    seg.rows.some(editorRowHasContent)
  );
}

function editorFormHasContent(input: {
  nome: string;
  titulo: string;
  youtubeText: string;
  authors: string[];
  pantheon: string;
  slugOverride: string;
  godsChecked: Record<number, boolean>;
  segments: EditorSegment[];
}): boolean {
  if (input.nome.trim() || input.titulo.trim() || input.youtubeText.trim()) return true;
  if (input.pantheon.trim() || input.slugOverride.trim()) return true;
  if (input.authors.some((author) => author.trim())) return true;
  if (Object.values(input.godsChecked).some(Boolean)) return true;
  return input.segments.some(editorSegmentHasContent);
}

type PendingReplace =
  | { source: "import"; raw: string; successLabel?: string; fileName?: string }
  | { source: "template"; start: StartBuildOrder };

/** Botão remover: visível se o item tem conteúdo ou há mais de um no grupo. */
function canShowRemoveButton(hasContent: boolean, count: number): boolean {
  return hasContent || count > 1;
}

function cellToEditor(v: string | null | undefined): string {
  if (v == null) return "";
  return String(v);
}

function tableRowToEditor(r: StartTableRow): EditorRow {
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

function segmentFromStructured(seg: StartBuildSegment): EditorSegment {
  let heading = "";
  const callouts: EditorLeadCallout[] = [];
  for (const block of seg.lead ?? []) {
    if (block.kind === "heading" && block.level === 1 && !heading) {
      heading = block.text;
    } else if (block.kind === "callout") {
      callouts.push({ id: uid(), text: block.text });
    } else if (block.kind === "heading") {
      callouts.push({ id: uid(), text: block.text });
    }
  }
  let footer = "";
  for (const block of seg.footer ?? []) {
    if (block.kind === "paragraph") {
      footer = block.text;
    } else if (block.kind === "callout" || block.kind === "heading") {
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

function isStartBuildOrder(obj: unknown): obj is StartBuildOrder {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.titulo === "string" && typeof o.structured === "object" && o.structured !== null;
}

function parseImportJson(raw: string): StartBuildOrder {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Cole um JSON ou escolha um arquivo .json.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("JSON inválido — verifique vírgulas, aspas e chaves.");
  }
  if (!isStartBuildOrder(parsed)) {
    throw new Error("O JSON precisa ser um start com «titulo» e «structured» (como no export desta página).");
  }
  return parsed;
}

function segmentToStructured(seg: EditorSegment): StartBuildSegment {
  const lead: StartBuildSegment["lead"] = [];
  if (seg.heading.trim()) {
    lead.push({ kind: "heading", level: 1, text: seg.heading.trim() });
  }
  for (const c of seg.callouts) {
    if (c.text.trim()) {
      lead.push({ kind: "callout", text: c.text.trim() });
    }
  }
  const table: StartTableRow[] = seg.rows
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
  const footer: StartBuildSegment["footer"] = [];
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
  const [authors, setAuthors] = useState<string[]>([""]);
  const [godFilter, setGodFilter] = useState("");
  const [godsChecked, setGodsChecked] = useState<Record<number, boolean>>({});
  const [pantheon, setPantheon] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [segments, setSegments] = useState<EditorSegment[]>([emptySegment()]);
  const [rowDrag, setRowDrag] = useState<{ si: number; from: number; over: number } | null>(null);
  const rowDragGhost = useRef<HTMLElement | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null);

  const maxStartId = useMemo(() => Math.max(0, ...startsBuildOrder.map((s) => s.id)), []);

  const filteredDeuses = useMemo(() => {
    const q = godFilter.trim().toLowerCase();
    if (!q) return deusesSorted;
    return deusesSorted.filter((d) => d.nome.toLowerCase().includes(q));
  }, [godFilter]);

  const godNamesSelected = useMemo(
    () => deusesSorted.filter((d) => godsChecked[d.id]).map((d) => d.nome),
    [godsChecked],
  );

  const structuredPreview = useMemo(
    () => ({ segments: segments.map(segmentToStructured).filter((s) => s.lead?.length || s.table?.length || s.footer?.length) }),
    [segments],
  );

  const builtStart = useMemo((): StartBuildOrder | null => {
    const t = titulo.trim();
    if (!t) return null;
    const author = authors.map((a) => a.trim()).filter(Boolean).map(startAuthorFromString);
    const youtube = youtubeText
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    const segs = segments.map(segmentToStructured).filter((s) => s.lead?.length || s.table?.length || s.footer?.length);
    if (!segs.some((s) => (s.table?.length ?? 0) > 0)) return null;

    const pTrim = pantheon.trim();
    const base: Omit<StartBuildOrder, "slug"> = {
      id: maxStartId + 1,
      titulo: t,
      author,
      god: godNamesSelected,
      image: resolveStartImageToken(
        godNamesSelected,
        pTrim || undefined,
      ),
      youtube,
      descricao_curta: nome.trim() || "Rascunho gerado pelo builder secreto.",
      structured: { segments: segs },
    };
    const slug = slugOverride.trim() ? slugifyManual(slugOverride) : buildStartSlug(base) || "start";
    const out: StartBuildOrder = {
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

  const reorderSegments = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setSegments((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }, []);

  const clearRowDrag = useCallback(() => {
    rowDragGhost.current?.remove();
    rowDragGhost.current = null;
    setRowDrag(null);
  }, []);

  const reorderRows = useCallback((segmentIndex: number, from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setSegments((prev) =>
      prev.map((s, j) => {
        if (j !== segmentIndex) return s;
        const rows = [...s.rows];
        const [m] = rows.splice(from, 1);
        rows.splice(to, 0, m);
        return { ...s, rows };
      }),
    );
  }, []);

  const applyImportedStart = useCallback((start: StartBuildOrder) => {
    setNome(start.descricao_curta ?? "");
    setTitulo(start.titulo ?? "");
    setYoutubeText((start.youtube ?? []).join("\n"));
    const names = (start.author ?? []).map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean);
    setAuthors(names.length ? names : [""]);
    setPantheon(start.pantheon ?? "");
    setSlugOverride(start.slug ?? "");
    const checked: Record<number, boolean> = {};
    for (const d of deusesSorted) {
      if ((start.god ?? []).includes(d.nome)) checked[d.id] = true;
    }
    setGodsChecked(checked);
    const segs = (start.structured?.segments ?? []).map(segmentFromStructured);
    setSegments(segs.length ? segs : [emptySegment()]);
  }, []);

  const runImport = useCallback(
    (raw: string, successLabel?: string) => {
      try {
        const parsed = parseImportJson(raw);
        applyImportedStart(parsed);
        setImportText(JSON.stringify(parsed, null, 2));
        setTemplateNotice(null);
        setImportMessage({
          kind: "ok",
          text: successLabel ?? "Importado — revise os campos e exporte quando estiver pronto.",
        });
      } catch (err) {
        setImportMessage({
          kind: "err",
          text: err instanceof Error ? err.message : "Não foi possível importar.",
        });
      }
    },
    [applyImportedStart],
  );

  const formDirty = useMemo(
    () =>
      editorFormHasContent({
        nome,
        titulo,
        youtubeText,
        authors,
        pantheon,
        slugOverride,
        godsChecked,
        segments,
      }),
    [nome, titulo, youtubeText, authors, pantheon, slugOverride, godsChecked, segments],
  );

  const templateStarts = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    const list = [...startsBuildOrder].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt"));
    if (!q) return list;
    return list.filter((start) => {
      const hay = [start.titulo, startAuthorsSearchText(start.author), start.pantheon ?? "", ...start.god]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [templateQuery]);

  const requestImport = useCallback((raw: string, meta?: { successLabel?: string; fileName?: string }) => {
    try {
      parseImportJson(raw);
      setImportMessage(null);
      setPendingReplace({
        source: "import",
        raw,
        successLabel: meta?.successLabel,
        fileName: meta?.fileName,
      });
    } catch (err) {
      setImportMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Não foi possível importar.",
      });
    }
  }, []);

  const confirmReplace = useCallback(() => {
    if (!pendingReplace) return;
    if (pendingReplace.source === "import") {
      runImport(pendingReplace.raw, pendingReplace.successLabel);
    } else {
      applyImportedStart(pendingReplace.start);
      setImportMessage(null);
      setTemplateNotice("Template carregado — revise os campos e exporte quando estiver pronto.");
    }
    setPendingReplace(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pendingReplace, runImport, applyImportedStart]);

  const copyJson = useCallback(async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopyState("ok");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("err");
      setTimeout(() => setCopyState("idle"), 3000);
    }
  }, [jsonText]);

  const downloadJson = useCallback(() => {
    if (!builtStart || !jsonText) return;
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${builtStart.slug || "start"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [builtStart, jsonText]);

  return (
    <div className="pb-16">
      <BackLink to="/">Início</BackLink>
      <PageHeader
        title="Builder secreto de starts"
        description="Apenas por URL. Gera um objeto JSON para colar em starts_build_order.json (o site não grava arquivo no disco). Campos nome e título: nome → descrição curta da página; título → titulo do card e da entrada."
      />

      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_minmax(0,420px)]">
        <div className="space-y-8">
          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">
              Metadados
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-zinc-400">Nome (descrição curta / subtítulo)</span>
                <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Rush com 2 aldeões no ouro" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-zinc-400">Título</span>
                <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Zeus - por Fulano" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-zinc-400">YouTube (URLs, uma por linha ou separadas por vírgula)</span>
                <textarea
                  className={cnTextarea()}
                  value={youtubeText}
                  onChange={(e) => setYoutubeText(e.target.value)}
                  rows={3}
                  placeholder="https://youtu.be/..."
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-zinc-400">Slug manual (opcional)</span>
                <input
                  className={inputClass}
                  value={slugOverride}
                  onChange={(e) => setSlugOverride(e.target.value)}
                  placeholder="Deixe vazio para gerar a partir do título e autores"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-zinc-400">Panteão (opcional, como em panteoes.json)</span>
                <select className={inputClass} value={pantheon} onChange={(e) => setPantheon(e.target.value)}>
                  <option value="">—</option>
                  {panteoes.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">Autores</h2>
            <ul className="space-y-2">
              {authors.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={a}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAuthors((prev) => prev.map((x, j) => (j === i ? v : x)));
                    }}
                    placeholder={`Autor ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-zinc-600 px-2 text-xs text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setAuthors((prev) => prev.filter((_, j) => j !== i))}
                    disabled={authors.length <= 1}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 rounded-lg border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/20"
              onClick={() => setAuthors((prev) => [...prev, ""])}
            >
              + Autor
            </button>
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">Deuses (god)</h2>
            <p className="mb-3 text-xs text-zinc-500">Apenas deuses maiores (<code className="text-zinc-400">hierarquia: Maior</code>).</p>
            <input
              className={`${inputClass} mb-3`}
              value={godFilter}
              onChange={(e) => setGodFilter(e.target.value)}
              placeholder="Filtrar por nome…"
            />
            <div className="max-h-56 overflow-y-auto rounded-lg border border-aom-border/80 p-2">
              <ul className="grid gap-1 sm:grid-cols-2">
                {filteredDeuses.map((d) => (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-zinc-800/60">
                      <input
                        type="checkbox"
                        checked={!!godsChecked[d.id]}
                        onChange={(e) =>
                          setGodsChecked((prev) => ({
                            ...prev,
                            [d.id]: e.target.checked,
                          }))
                        }
                      />
                      <span className="truncate text-zinc-200">{d.nome}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">Segmentos</h2>
              <button
                type="button"
                className="rounded-lg border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/20"
                onClick={() => setSegments((prev) => [...prev, emptySegment()])}
              >
                + Segmento
              </button>
            </div>
            <p className="mb-4 text-xs text-zinc-500">
              Arraste pelo ícone ⋮⋮ para reordenar segmentos ou linhas da tabela. Cada segmento pode ter título (heading), vários callouts antes da tabela, a tabela e rodapé opcional.
              Tipos de linha da tabela: os mesmos usados em{" "}
              <code className="text-zinc-400">starts_build_order.json</code> (hint, blue, pink, …).
            </p>
            <ul className="space-y-4">
              {segments.map((seg, si) => (
                <li
                  key={seg.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const raw = e.dataTransfer.getData("text/plain");
                    if (!raw.startsWith("segment:")) return;
                    const from = Number.parseInt(raw.slice(8), 10);
                    if (Number.isNaN(from) || from === si) return;
                    reorderSegments(from, si);
                  }}
                  className="rounded-xl border border-zinc-700/80 bg-zinc-950/40 p-3"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", `segment:${si}`);
                      }}
                      className="cursor-grab select-none px-1.5 py-2 text-zinc-500 active:cursor-grabbing"
                      title="Arrastar para reordenar"
                      role="button"
                      tabIndex={0}
                    >
                      ⋮⋮
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        className={inputClass}
                        value={seg.heading}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSegments((prev) => prev.map((s, j) => (j === si ? { ...s, heading: v } : s)));
                        }}
                        placeholder="Título do segmento (heading nível 1), opcional"
                      />
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-zinc-400">Callouts antes da tabela (opcional)</span>
                        {seg.callouts.map((c, ci) => (
                          <div key={c.id} className="rounded-lg border border-aom-border/60 bg-aom-card/25 p-2">
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs text-zinc-500">Callout {ci + 1}</span>
                              {canShowRemoveButton(editorCalloutHasContent(c), seg.callouts.length) ? (
                                <button
                                  type="button"
                                  className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800"
                                  onClick={() =>
                                    setSegments((prev) =>
                                      prev.map((s, j) =>
                                        j === si
                                          ? {
                                              ...s,
                                              callouts:
                                                s.callouts.length <= 1 ? s.callouts : s.callouts.filter((_, k) => k !== ci),
                                            }
                                          : s,
                                      ),
                                    )
                                  }
                                >
                                  Remover callout
                                </button>
                              ) : null}
                            </div>
                            <textarea
                              className={cnTextarea()}
                              value={c.text}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSegments((prev) =>
                                  prev.map((s, j) =>
                                    j === si
                                      ? {
                                          ...s,
                                          callouts: s.callouts.map((x, k) => (k === ci ? { ...x, text: v } : x)),
                                        }
                                      : s,
                                  ),
                                );
                              }}
                              rows={2}
                              placeholder="Texto do callout (:tokens:, mini-markup…)"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-sm text-amber-200/90 underline-offset-2 hover:underline"
                          onClick={() =>
                            setSegments((prev) =>
                              prev.map((s, j) => {
                                if (j !== si) return s;
                                const last = s.callouts[s.callouts.length - 1];
                                return { ...s, callouts: [...s.callouts, newLeadCalloutAfter(last)] };
                              }),
                            )
                          }
                        >
                          + Callout
                        </button>
                      </div>
                    </div>
                    {canShowRemoveButton(editorSegmentHasContent(seg), segments.length) ? (
                      <button
                        type="button"
                        className="shrink-0 rounded border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                        onClick={() => setSegments((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== si)))}
                      >
                        Remover segmento
                      </button>
                    ) : null}
                  </div>

                  <div className="ml-8 space-y-2 border-l border-zinc-700/60 pl-3">
                    {seg.rows.map((row, ri) => (
                      <div
                        key={row.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRowDrag((current) => {
                            if (!current || current.si !== si || current.over === ri) return current;
                            return { ...current, over: ri };
                          });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const raw = e.dataTransfer.getData("text/plain");
                          clearRowDrag();
                          if (!raw.startsWith("row:")) return;
                          const [, segPart, rowPart] = raw.split(":");
                          const fromSi = Number.parseInt(segPart ?? "", 10);
                          const fromRi = Number.parseInt(rowPart ?? "", 10);
                          if (fromSi !== si || Number.isNaN(fromRi) || fromRi === ri) return;
                          reorderRows(si, fromRi, ri);
                        }}
                        className={`relative rounded-lg border bg-aom-card/30 p-2 ${
                          rowDrag?.si === si && rowDrag.over === ri && rowDrag.from !== ri
                            ? "border-dashed border-amber-400/90"
                            : "border-aom-border/60"
                        } ${rowDrag?.si === si && rowDrag.from === ri ? "opacity-40" : ""}`}
                      >
                        {rowDrag?.si === si && rowDrag.over === ri && rowDrag.from !== ri ? (
                          <div
                            className="pointer-events-none absolute -top-3 left-3 z-10 h-16 w-16 rounded-xl border-2 border-dashed border-amber-300 bg-zinc-950/95 shadow-lg shadow-black/40"
                            aria-hidden
                          />
                        ) : null}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", `row:${si}:${ri}`);
                              clearRowDrag();
                              const label = row.description.trim() || `Linha ${ri + 1}`;
                              const ghost = mountRowDragGhost(label);
                              rowDragGhost.current = ghost;
                              e.dataTransfer.setDragImage(ghost, 48, 48);
                              setRowDrag({ si, from: ri, over: ri });
                            }}
                            onDragEnd={clearRowDrag}
                            className="cursor-grab select-none px-1 text-zinc-500 active:cursor-grabbing"
                            title="Arrastar para reordenar linha"
                            role="button"
                            tabIndex={0}
                          >
                            ⋮⋮
                          </span>
                          <span className="text-xs text-zinc-500">Linha {ri + 1}</span>
                          <label className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
                            Tipo
                            <select
                              className={`${inputClass} !py-1 text-xs`}
                              value={row.type}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSegments((prev) =>
                                  prev.map((s, j) =>
                                    j === si
                                      ? {
                                          ...s,
                                          rows: s.rows.map((r, k) => (k === ri ? { ...r, type: v } : r)),
                                        }
                                      : s,
                                  ),
                                );
                              }}
                            >
                              {START_TABLE_ROW_TYPE_OPTIONS.map((o) => (
                                <option key={o.value || "null"} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="rounded border border-amber-600/50 px-2 py-0.5 text-xs text-amber-100 hover:bg-amber-500/10"
                            onClick={() =>
                              setSegments((prev) =>
                                prev.map((s, j) => {
                                  if (j !== si) return s;
                                  const source = s.rows[ri];
                                  if (!source) return s;
                                  const rows = [...s.rows];
                                  rows.splice(ri + 1, 0, duplicateEditorRow(source));
                                  return { ...s, rows };
                                }),
                              )
                            }
                          >
                            Duplicar linha
                          </button>
                          {canShowRemoveButton(editorRowHasContent(row), seg.rows.length) ? (
                            <button
                              type="button"
                              className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800"
                              onClick={() =>
                                setSegments((prev) =>
                                  prev.map((s, j) =>
                                    j === si
                                      ? {
                                          ...s,
                                          rows: s.rows.length <= 1 ? s.rows : s.rows.filter((_, k) => k !== ri),
                                        }
                                      : s,
                                  ),
                                )
                              }
                            >
                              Remover linha
                            </button>
                          ) : null}
                        </div>
                        <input
                          className={`${inputClass} mb-1`}
                          value={row.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSegments((prev) =>
                              prev.map((s, j) =>
                                j === si ? { ...s, rows: s.rows.map((r, k) => (k === ri ? { ...r, description: v } : r)) } : s,
                              ),
                            );
                          }}
                          placeholder="Descrição (mini-markup / :aomr_…:)"
                        />
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
                          {(["food", "wood", "gold", "favor", "pop"] as const).map((field) => {
                            const iconSrc = getTokenAssetUrl(RESOURCE_FIELD_ICONS[field]);
                            const sumWarning = field === "pop" ? populationSumWarning(row) : null;
                            return (
                              <div key={field} className="flex min-w-0 items-center gap-1">
                                {iconSrc ? (
                                  <img
                                    src={iconSrc}
                                    alt=""
                                    className="h-4 w-4 shrink-0 object-contain opacity-90"
                                    title={field}
                                  />
                                ) : null}
                                <input
                                  className={`${inputClass} min-w-0 !py-1.5 text-xs`}
                                  value={row[field]}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSegments((prev) =>
                                      prev.map((s, j) =>
                                        j === si
                                          ? {
                                              ...s,
                                              rows: s.rows.map((r, k) => {
                                                if (k !== ri) return r;
                                                if (field === "pop") return { ...r, pop: v };
                                                const next = { ...r, [field]: v };
                                                return { ...next, pop: nextPopulation(r, next) };
                                              }),
                                            }
                                          : s,
                                      ),
                                    );
                                  }}
                                  placeholder={field}
                                />
                                {sumWarning ? (
                                  <span className="group relative shrink-0">
                                    <span
                                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold leading-none text-amber-300"
                                      aria-label={sumWarning}
                                    >
                                      !
                                    </span>
                                    <span
                                      role="tooltip"
                                      className="pointer-events-none absolute bottom-full right-0 z-30 mb-1 hidden w-56 rounded-lg border border-amber-500/40 bg-zinc-950 px-2 py-1.5 text-left text-[11px] font-normal leading-snug text-amber-50 shadow-lg shadow-black/40 group-hover:block"
                                    >
                                      {sumWarning}
                                    </span>
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-sm text-amber-200/90 underline-offset-2 hover:underline"
                      onClick={() =>
                        setSegments((prev) =>
                          prev.map((s, j) => {
                            if (j !== si) return s;
                            const last = s.rows[s.rows.length - 1];
                            return { ...s, rows: [...s.rows, newTableRowAfter(last)] };
                          }),
                        )
                      }
                    >
                      + Linha na tabela
                    </button>
                  </div>

                  <label className="ml-8 mt-2 block border-l border-zinc-700/60 pl-3">
                    <span className="mb-1 block text-xs text-zinc-500">Rodapé do segmento (parágrafo, opcional)</span>
                    <textarea
                      className={cnTextarea()}
                      value={seg.footer}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSegments((prev) => prev.map((s, j) => (j === si ? { ...s, footer: v } : s)));
                      }}
                      rows={2}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">
              Usar template
            </h2>
            <p className="mb-3 text-sm text-zinc-400">
              Escolha um start já cadastrado. Uma cópia preenche o formulário inteiro (metadados, deuses e segmentos). O{" "}
              <code className="text-zinc-500">id</code> do JSON exportado continua sendo o próximo livre.
            </p>
            <input
              className={`${inputClass} mb-3`}
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              placeholder="Buscar por título, autor, deus ou panteão…"
            />
            <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-aom-border/80 p-1">
              {templateStarts.map((start) => {
                const meta = [startAuthorsSearchText(start.author), start.pantheon, start.god.join(", ")].filter(Boolean);
                return (
                  <li key={start.slug}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-zinc-900/70"
                      onClick={() => setPendingReplace({ source: "template", start })}
                    >
                      <span className="text-sm text-zinc-100">
                        <NotionText text={start.titulo} />
                      </span>
                      {meta.length ? <span className="text-xs text-zinc-500">{meta.join(" · ")}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {templateStarts.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Nenhum start corresponde à busca.</p>
            ) : null}
            {templateNotice ? <p className="mt-2 text-sm text-emerald-400">{templateNotice}</p> : null}
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">Importar</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Cole o JSON exportado desta página (ou de <code className="text-zinc-500">starts_build_order.json</code>) ou escolha um arquivo{" "}
              <code className="text-zinc-500">.json</code>. A importação pede confirmação antes de substituir o formulário.
            </p>
            <textarea
              className={cnTextarea()}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder='{ "titulo": "...", "structured": { "segments": [...] }, ... }'
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-amber-600/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20"
                onClick={() => requestImport(importText)}
              >
                Importar do texto
              </button>
              <label className="cursor-pointer rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800">
                Escolher .json
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const text = String(reader.result ?? "");
                      requestImport(text, {
                        successLabel: `Arquivo «${file.name}» importado.`,
                        fileName: file.name,
                      });
                    };
                    reader.onerror = () =>
                      setImportMessage({ kind: "err", text: "Não foi possível ler o arquivo." });
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
            {importMessage ? (
              <p className={`mt-2 text-sm ${importMessage.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {importMessage.text}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-aom-border bg-aom-card/40 p-4 sm:p-5">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-base font-semibold text-amber-100/95">Exportar</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Próximo <code className="text-zinc-500">id</code> sugerido: <strong className="text-zinc-200">{maxStartId + 1}</strong>. Ajuste no JSON se já tiver adicionado entradas.
            </p>
            {slugCollision ? (
              <p className="mb-2 text-sm text-amber-300">Atenção: o slug «{slugPreview}» já existe em starts_build_order.json.</p>
            ) : null}
            {!builtStart ? (
              <p className="text-sm text-zinc-500">Preencha o título e pelo menos uma linha de tabela com descrição para gerar o JSON.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
                  onClick={() => void copyJson()}
                >
                  Copiar JSON
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
                  onClick={downloadJson}
                >
                  Baixar .json
                </button>
                {copyState === "ok" ? <span className="self-center text-sm text-emerald-400">Copiado.</span> : null}
                {copyState === "err" ? <span className="self-center text-sm text-red-400">Não foi possível copiar.</span> : null}
              </div>
            )}
          </section>
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <h2 className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold text-amber-100/90">Pré-visualização</h2>
          {structuredPreview.segments.length ? (
            <div className="rounded-xl border border-aom-border bg-zinc-950/50 p-3">
              <StartStructuredContent segments={structuredPreview.segments} />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Adicione conteúdo a um segmento para ver a tabela aqui.</p>
          )}
        </aside>
      </div>

      <ModalApp
        open={pendingReplace != null}
        onClose={() => setPendingReplace(null)}
        title={formDirty ? "Substituir o que está no editor?" : "Carregar no editor?"}
        description={
          pendingReplace == null ? undefined : pendingReplace.source === "template" ? (
            <span>
              Usar como template: <NotionText text={pendingReplace.start.titulo} />
            </span>
          ) : pendingReplace.fileName ? (
            `Arquivo «${pendingReplace.fileName}».`
          ) : (
            "O JSON colado será aplicado ao formulário."
          )
        }
        className="!max-w-lg"
      >
        {formDirty ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            O editor já tem conteúdo. Confirmar apaga o que está preenchido e coloca este start no lugar.
          </p>
        ) : (
          <p className="text-sm text-zinc-400">O formulário será preenchido com esta cópia.</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
            onClick={() => setPendingReplace(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
            onClick={confirmReplace}
          >
            {formDirty ? "Substituir" : "Carregar"}
          </button>
        </div>
      </ModalApp>
    </div>
  );
}

function cnTextarea(): string {
  return `${inputClass} min-h-[4.5rem] resize-y font-mono text-[13px] leading-snug`;
}

/** Slug digitado livremente: só normaliza espaços e barras. */
function slugifyManual(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
