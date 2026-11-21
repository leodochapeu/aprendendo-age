import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { ModalApp } from "@/components/ui/ModalApp";
import { useToast } from "@/context/ToastContext";
import { CHANNEL_CATEGORIES } from "@/data/channels";
import { useTranslation } from "@/hooks/useTranslation";
import { ChannelMetadataFetchError, fetchChannelLinkMetadata, YouTubeApiNotConfiguredError, } from "@/lib/channelMetadata";
import { createStreamerChannel } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
const inputClass = "mt-1 w-full rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";
export function ChannelSubmitModal({ open, onClose, onSuccess, channels }) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const prefix = "pages.streamerLinks.adminSubmit";
    const [name, setName] = useState("");
    const [urlLink, setUrlLink] = useState("");
    const [category, setCategory] = useState("youtube");
    const [insertAfterId, setInsertAfterId] = useState("__last__");
    const [imagePath, setImagePath] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const positionOptions = useMemo(() => [
        { value: "__first__", label: t(`${prefix}.positionFirst`) },
        ...channels.map((channel) => ({
            value: channel.id,
            label: t(`${prefix}.positionAfter`, { name: channel.name }),
        })),
        { value: "__last__", label: t(`${prefix}.positionLast`) },
    ], [channels, t]);
    useEffect(() => {
        if (!open)
            return;
        if (channels.length === 0) {
            setInsertAfterId("__first__");
        }
        else if (insertAfterId !== "__first__" && insertAfterId !== "__last__") {
            const stillExists = channels.some((c) => c.id === insertAfterId);
            if (!stillExists)
                setInsertAfterId("__last__");
        }
    }, [channels, insertAfterId, open]);
    function resetForm() {
        setName("");
        setUrlLink("");
        setCategory("youtube");
        setInsertAfterId(channels.length === 0 ? "__first__" : "__last__");
        setImagePath("");
        setError(null);
    }
    function handleClose() {
        if (saving || syncing)
            return;
        resetForm();
        onClose();
    }
    async function handleSync() {
        setError(null);
        if (!urlLink.trim()) {
            setError(t(`${prefix}.urlRequired`));
            return;
        }
        setSyncing(true);
        try {
            const meta = await fetchChannelLinkMetadata(category, urlLink);
            if (meta.urlLink)
                setUrlLink(meta.urlLink);
            if (meta.name && !name.trim())
                setName(meta.name);
            setImagePath(meta.imagePath);
            if (!meta.imagePath) {
                setError(t(`${prefix}.imageNotFound`));
            }
        }
        catch (e) {
            if (e instanceof YouTubeApiNotConfiguredError) {
                setError(t(`${prefix}.youtubeNotConfigured`));
            }
            else if (e instanceof ChannelMetadataFetchError) {
                if (category === "whatsapp") {
                    setError(t(`${prefix}.whatsappManualImage`));
                }
                else {
                    setError(t(`${prefix}.metadataNotFound`));
                }
            }
            else {
                setError(t(`${prefix}.metadataError`));
            }
        }
        finally {
            setSyncing(false);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError(t(`${prefix}.nameRequired`));
            return;
        }
        if (!urlLink.trim()) {
            setError(t(`${prefix}.urlRequired`));
            return;
        }
        setSaving(true);
        const res = await createStreamerChannel({
            name,
            urlLink,
            category,
            imagePath,
            insertAfterId: insertAfterId,
        });
        setSaving(false);
        if (!res.ok) {
            if (res.message === "NOT_AUTHENTICATED") {
                setError(t(`${prefix}.notAuthenticated`));
            }
            else if (res.message === "SUPABASE_NOT_CONFIGURED") {
                setError(t("pages.streamerLinks.unconfigured"));
            }
            else {
                setError(t(`${prefix}.submitError`));
            }
            return;
        }
        showToast(t(`${prefix}.toastSuccess`));
        resetForm();
        onClose();
        onSuccess();
    }
    return (_jsx(ModalApp, { open: open, onClose: handleClose, title: t(`${prefix}.modalTitle`), description: t(`${prefix}.modalDescription`), className: "max-w-xl", children: _jsxs("form", { onSubmit: (e) => void handleSubmit(e), className: "space-y-4", children: [_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t(`${prefix}.urlLink`) }), _jsx("input", { type: "url", required: true, value: urlLink, onChange: (e) => setUrlLink(e.target.value), className: inputClass, placeholder: "https://\u2026" })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t(`${prefix}.category`) }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: inputClass, children: CHANNEL_CATEGORIES.map((value) => (_jsx("option", { value: value, children: t(`pages.channels.category.${value}`) }, value))) })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: _jsx("button", { type: "button", disabled: syncing || saving, onClick: () => void handleSync(), className: cn("rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm font-medium text-amber-100/90 transition", "hover:border-amber-500/40 hover:bg-zinc-800/90 disabled:cursor-not-allowed disabled:opacity-50"), children: syncing ? t(`${prefix}.syncing`) : t(`${prefix}.syncMetadata`) }) }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t(`${prefix}.name`) }), _jsx("input", { type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), className: inputClass })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t(`${prefix}.position`) }), _jsx("select", { value: insertAfterId, onChange: (e) => setInsertAfterId(e.target.value), className: inputClass, children: positionOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t(`${prefix}.imagePath`) }), _jsx("input", { type: "url", value: imagePath, onChange: (e) => setImagePath(e.target.value), className: inputClass, placeholder: "https://\u2026" })] }), imagePath ? (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-aom-border bg-zinc-900/50 p-3", children: [_jsx("img", { src: imagePath, alt: "", className: "size-12 rounded-xl border border-zinc-700 object-cover" }), _jsx("span", { className: "text-xs text-zinc-500", children: t(`${prefix}.imagePreview`) })] })) : null, error ? (_jsx("p", { className: "rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, _jsxs("div", { className: "flex flex-wrap justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", disabled: saving || syncing, onClick: handleClose, className: "rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/80 disabled:opacity-50", children: t(`${prefix}.cancel`) }), _jsx("button", { type: "submit", disabled: saving || syncing, className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50", children: saving ? t(`${prefix}.saving`) : t(`${prefix}.save`) })] })] }) }));
}
