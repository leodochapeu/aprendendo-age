import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CommunityVideoTagBadge } from "@/components/community/CommunityVideoTagBadge";
import { cn } from "@/lib/cn";
import { hexToRgba } from "@/lib/tagColorUtils";
export function CommunityVideoTagMultiselect({ tags, selectedIds, onChange, disabled, label, }) {
    function toggle(tagId) {
        if (disabled)
            return;
        if (selectedIds.includes(tagId)) {
            onChange(selectedIds.filter((id) => id !== tagId));
        }
        else {
            onChange([...selectedIds, tagId]);
        }
    }
    return (_jsxs("fieldset", { className: "space-y-2", disabled: disabled, children: [_jsx("legend", { className: "text-sm text-zinc-400", children: label }), _jsx("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": label, children: tags.map((tag) => {
                    const selected = selectedIds.includes(tag.id);
                    return (_jsx("button", { type: "button", onClick: () => toggle(tag.id), className: cn("cursor-pointer rounded-full transition focus:outline-none focus:ring-2 focus:ring-amber-500/35", selected ? "ring-2 ring-offset-1 ring-offset-zinc-950" : "opacity-75 hover:opacity-100"), style: selected ? { boxShadow: `0 0 0 2px ${hexToRgba(tag.colorHex, 0.55)}` } : undefined, "aria-pressed": selected, children: _jsx(CommunityVideoTagBadge, { tag: tag, size: "sm" }) }, tag.id));
                }) })] }));
}
