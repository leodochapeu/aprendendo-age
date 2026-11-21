import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from "react";
import { StartAuthorAvatar } from "@/components/start/StartAuthorAvatar";
import { cn } from "@/lib/cn";
import { formatStartAuthors } from "@/lib/startAuthor";
export function StartAuthorsMeta({ authors, separator = " · ", className }) {
    if (!authors.length) {
        return (_jsx("span", { className: className ?? "invisible select-none", "aria-hidden": true, children: "\u2014" }));
    }
    return (_jsx("span", { className: cn("inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1.5", className), children: authors.map((author, i) => (_jsxs(Fragment, { children: [i > 0 ? (_jsx("span", { className: "shrink-0 self-center text-zinc-500", "aria-hidden": true, children: separator })) : null, _jsxs("span", { className: "inline-flex min-w-0 items-center gap-1.5", children: [_jsx("span", { className: "inline-flex h-5 w-5 shrink-0 items-center justify-center", children: _jsx(StartAuthorAvatar, { name: author.name, imageUrl: author.imageUrl, className: "h-5 w-5" }) }), _jsx("span", { className: "min-w-0 truncate leading-5", children: author.name })] })] }, `${author.name}-${i}`))) }));
}
/** Texto plano para busca / aria quando só o nome importa. */
export function startAuthorsSearchText(authors) {
    return formatStartAuthors(authors, " ");
}
