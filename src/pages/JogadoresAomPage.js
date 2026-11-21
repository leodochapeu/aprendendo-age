import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CorridaAomTab } from "@/components/jogadores/CorridaAomTab";
import { JogadoresAomTab } from "@/components/jogadores/JogadoresAomTab";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { fetchAomRacePlayers } from "@/lib/playersApi";
import { RankPage } from "@/pages/RankPage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
const PLAYER_TABS = ["corrida", "jogadores", "rank"];
function tabFromSearch(value) {
    return PLAYER_TABS.includes(value) ? value : "corrida";
}
export function JogadoresAomPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const headerIcon = getTokenAssetUrl("aomr_wonder_age_icon");
    const supabaseConfigured = isSupabaseConfigured();
    const activeTab = tabFromSearch(searchParams.get("tab"));
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(supabaseConfigured);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!supabaseConfigured) {
            setLoading(false);
            setPlayers([]);
            setError(null);
            return;
        }
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            if (!cancelled) {
                setError(t("pages.players.loadTimeout"));
                setLoading(false);
            }
        }, 20_000);
        void (async () => {
            setLoading(true);
            setError(null);
            try {
                const list = await fetchAomRacePlayers();
                if (cancelled)
                    return;
                window.clearTimeout(timeoutId);
                setPlayers(list);
                setError(null);
            }
            catch (err) {
                if (cancelled)
                    return;
                window.clearTimeout(timeoutId);
                setError(err instanceof Error ? err.message : t("pages.players.loadError"));
                setPlayers([]);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [supabaseConfigured, t]);
    const tabs = [
        { id: "corrida", labelKey: "pages.players.tabCorrida" },
        { id: "jogadores", labelKey: "pages.players.tabJogadores" },
        { id: "rank", labelKey: "pages.players.tabRank" },
    ];
    function selectTab(id) {
        setSearchParams(id === "corrida" ? {} : { tab: id }, { replace: true });
    }
    return (_jsxs("div", { className: "space-y-8 pb-16", children: [_jsx(PageHeader, { title: t("pages.players.pageTitle"), headerIconSrc: headerIcon, description: t("pages.players.pageDescription") }), _jsx("div", { role: "tablist", "aria-label": t("pages.players.tabsLabel"), className: "flex flex-wrap gap-2 border-b border-aom-border/60 pb-3", children: tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (_jsx("button", { type: "button", role: "tab", "aria-selected": active, onClick: () => selectTab(tab.id), className: cn("rounded-lg px-4 py-2 text-sm font-medium transition", active
                            ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35"
                            : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"), children: t(tab.labelKey) }, tab.id));
                }) }), activeTab === "rank" ? (_jsx(RankPage, { embedded: true })) : loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-2xl border border-aom-border/50 bg-zinc-950/60 py-16", children: [_jsx("span", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500", "aria-hidden": true }), _jsx("p", { className: "mt-4 text-sm text-zinc-500", children: t("pages.players.loading") })] })) : !supabaseConfigured ? (_jsx("p", { className: "rounded-xl border border-amber-900/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100/90", role: "status", children: t("pages.players.unconfigured") })) : error ? (_jsx("p", { className: "rounded-xl border border-red-900/45 bg-red-950/35 px-4 py-3 text-sm text-red-200", role: "alert", children: error })) : activeTab === "corrida" ? (_jsx(CorridaAomTab, { players: players })) : (_jsx(JogadoresAomTab, { players: players }))] }));
}
