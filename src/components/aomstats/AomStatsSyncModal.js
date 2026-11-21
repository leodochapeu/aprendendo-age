import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchAomStatsSyncPayload, } from "@/lib/aomstatsProfileSync";
import { cn } from "@/lib/cn";
import { searchPlayersByName, } from "@/lib/formRetoldApi";
export function AomStatsSyncModal({ open, onClose, initialSearchText = "", onConfirm, }) {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState(initialSearchText);
    const [searchBusy, setSearchBusy] = useState(false);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [formError, setFormError] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    useEffect(() => {
        if (!open)
            return;
        setSearchText(initialSearchText);
        setSearchBusy(false);
        setConfirmBusy(false);
        setFormError(null);
        setProfiles([]);
        setSelectedId(null);
        setPreview(null);
        setPreviewError(null);
        setPreviewLoading(false);
        setSearched(false);
    }, [open, initialSearchText]);
    useEffect(() => {
        if (!open || selectedId == null) {
            setPreview(null);
            setPreviewError(null);
            setPreviewLoading(false);
            return;
        }
        let cancelled = false;
        setPreviewLoading(true);
        setPreviewError(null);
        setPreview(null);
        void (async () => {
            try {
                const payload = await fetchAomStatsSyncPayload(selectedId);
                if (cancelled)
                    return;
                if (!payload) {
                    setPreviewError(t("auth.aomstatsNoSup1v1"));
                    return;
                }
                setPreview(payload);
            }
            catch (err) {
                if (!cancelled) {
                    setPreviewError(err instanceof Error ? err.message : t("pages.rank.searchError"));
                }
            }
            finally {
                if (!cancelled)
                    setPreviewLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, selectedId, t]);
    const runSearch = useCallback(async () => {
        const q = searchText.trim();
        if (!q) {
            setFormError(t("pages.rank.enterPlayerName"));
            return;
        }
        setFormError(null);
        setSearchBusy(true);
        setProfiles([]);
        setSelectedId(null);
        setPreview(null);
        setSearched(false);
        try {
            const results = await searchPlayersByName(q);
            setSearched(true);
            if (results.length === 0) {
                setFormError(t("pages.rank.noPlayerFound"));
                return;
            }
            setProfiles(results);
            if (results.length === 1) {
                setSelectedId(results[0].profile_id);
            }
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : t("pages.rank.searchError"));
        }
        finally {
            setSearchBusy(false);
        }
    }, [searchText, t]);
    async function handleConfirm() {
        if (!preview || selectedId == null)
            return;
        setConfirmBusy(true);
        setFormError(null);
        try {
            const result = await onConfirm(preview);
            if (result && "error" in result && result.error) {
                setFormError(result.error);
                return;
            }
            onClose();
        }
        finally {
            setConfirmBusy(false);
        }
    }
    const selectedProfile = profiles.find((p) => p.profile_id === selectedId) ?? null;
    return (_jsx(ModalApp, { open: open, onClose: () => {
            if (!confirmBusy && !searchBusy)
                onClose();
        }, title: t("auth.aomstatsSyncTitle"), description: t("auth.aomstatsSyncDesc"), className: "max-w-lg", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("form", { onSubmit: (e) => {
                        e.preventDefault();
                        void runSearch();
                    }, className: cn("flex flex-col gap-3 sm:flex-row sm:items-stretch", searchBusy && "pointer-events-none opacity-70"), children: [_jsxs("label", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "sr-only", children: t("pages.rank.playerNameLabel") }), _jsx("input", { type: "text", value: searchText, onChange: (ev) => {
                                        setSearchText(ev.target.value);
                                        if (formError)
                                            setFormError(null);
                                    }, disabled: searchBusy || confirmBusy, placeholder: t("pages.rank.playerNamePlaceholder"), autoComplete: "off", className: "w-full rounded-xl border border-zinc-600/90 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25" })] }), _jsx("button", { type: "submit", disabled: searchBusy || confirmBusy, className: "inline-flex shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/80 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-amber-500/35 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60", children: searchBusy ? t("pages.rank.searching") : t("common.search") })] }), formError ? (_jsx("p", { className: "rounded-xl border border-red-900/45 bg-red-950/35 px-3 py-2 text-sm text-red-200", role: "alert", children: formError })) : null, profiles.length > 0 ? (_jsx("ul", { className: "max-h-[min(40vh,18rem)] space-y-2 overflow-y-auto pr-0.5", role: "list", children: profiles.map((p) => {
                        const active = selectedId === p.profile_id;
                        return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedId(p.profile_id), className: cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", "border-zinc-600/80 bg-zinc-900/60 hover:border-amber-500/40", active && "border-amber-500/60 ring-2 ring-amber-500/25"), children: [_jsx(PlayerAvatarMark, { src: p.avatar_link, className: "h-11 w-11 shrink-0 rounded-full", width: 44, height: 44 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "text-sm text-zinc-200", children: [(p.clan_name ?? "").trim() ? (_jsxs("span", { className: "text-amber-200/90", children: ["[", (p.clan_name ?? "").trim(), "] "] })) : null, _jsx("span", { className: "font-medium", children: p.alias || p.profile_id })] }), _jsxs("div", { className: "font-mono text-xs text-zinc-500", children: ["ID ", p.profile_id] })] })] }) }, p.profile_id));
                    }) })) : searched && !searchBusy && !formError ? (_jsx("p", { className: "text-sm text-zinc-500", children: t("pages.rank.noPlayerFound") })) : null, selectedProfile ? (_jsxs("div", { className: "rounded-xl border border-aom-border/60 bg-zinc-900/50 px-3 py-3 text-sm", children: [_jsx("p", { className: "font-medium text-zinc-200", children: t("auth.aomstatsConfirmProfile") }), _jsxs("p", { className: "mt-1 text-zinc-400", children: [(selectedProfile.clan_name ?? "").trim() ? `[${(selectedProfile.clan_name ?? "").trim()}] ` : "", selectedProfile.alias || selectedProfile.profile_id, _jsxs("span", { className: "text-zinc-600", children: [" \u00B7 ID ", selectedProfile.profile_id] })] }), previewLoading ? (_jsx("p", { className: "mt-2 text-zinc-500", children: t("auth.aomstatsLoadingPreview") })) : previewError ? (_jsx("p", { className: "mt-2 text-amber-200/90", children: previewError })) : preview ? (_jsxs("p", { className: "mt-2 tabular-nums text-zinc-300", children: ["RR ", preview.rr, " \u00B7 ", preview.wins, "W / ", preview.losses, "L \u00B7 ", preview.winRate, preview.rank ? ` · ${preview.rank}` : ""] })) : null] })) : null, _jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, disabled: confirmBusy, className: "rounded-xl border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50", children: t("common.cancel") }), _jsx("button", { type: "button", disabled: confirmBusy || previewLoading || !preview || selectedId == null, onClick: () => void handleConfirm(), className: "rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50", children: confirmBusy ? t("common.loading") : t("auth.aomstatsConfirmSync") })] })] }) }));
}
