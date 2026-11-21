import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChampionshipEmblem } from "@/components/campeonato/ChampionshipEmblem";
import { ChampionshipMarkdown } from "@/components/campeonato/ChampionshipMarkdown";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchPublicChampionships } from "@/lib/championshipsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const PHASE_KEY = {
    registration: "pages.championship.phase.registration",
    ongoing: "pages.championship.phase.ongoing",
    finished: "pages.championship.phase.finished",
};
export function CampeonatosPage() {
    const { t } = useTranslation();
    const { status, profileLoadState } = useAuth();
    // Qualquer logado: RLS libera Modo Dev só para admin, dono ou quem pode lançar.
    const includeDev = status === "authenticated" && profileLoadState === "ready";
    const authReady = status !== "loading" && (status !== "authenticated" || profileLoadState === "ready");
    const [rows, setRows] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!authReady)
            return;
        if (!isSupabaseConfigured()) {
            setLoading(false);
            setError(t("pages.championship.unconfigured"));
            return;
        }
        let cancelled = false;
        setLoading(true);
        void fetchPublicChampionships(includeDev)
            .then((list) => {
            if (!cancelled)
                setRows(list);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err instanceof Error ? err.message : t("pages.championship.loadError"));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [authReady, includeDev, t]);
    return (_jsxs("div", { className: "mx-auto max-w-5xl", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-3xl text-amber-100", children: t("pages.championship.indexTitle") }), _jsx("p", { className: "mt-2 max-w-2xl text-sm text-zinc-400", children: t("pages.championship.indexLead") }), loading ? _jsx("p", { className: "mt-8 text-sm text-zinc-500", children: t("pages.championship.loading") }) : null, error ? _jsx("p", { className: "mt-8 text-sm text-red-200", children: error }) : null, _jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-2", children: rows.map((camp) => (_jsx(Link, { to: `/campeonato/${camp.slug}`, className: "group rounded-2xl border border-amber-900/40 bg-zinc-950/80 p-5 shadow-lg shadow-black/30 transition hover:border-amber-500/40", children: _jsxs("div", { className: "flex items-start gap-7", children: [camp.logoUrl ? (_jsx(ChampionshipEmblem, { src: camp.logoUrl, className: "h-16 w-16", burst: 1.62 })) : (_jsx("div", { className: "h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-black/40" })), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-[family-name:var(--font-display)] text-xl text-amber-50 group-hover:text-amber-200", children: camp.name }), _jsxs("div", { className: "mt-1 text-xs uppercase tracking-wide text-amber-200/80", children: [t(PHASE_KEY[camp.phase]), camp.devMode ? " · Modo Dev" : ""] }), camp.subtitle ? (_jsx(ChampionshipMarkdown, { source: camp.subtitle, className: "mt-2 line-clamp-3 text-sm text-zinc-400" })) : null] })] }) }, camp.id))) }), !loading && !error && rows.length === 0 ? (_jsx("p", { className: "mt-8 text-sm text-zinc-500", children: t("pages.championship.empty") })) : null] }));
}
