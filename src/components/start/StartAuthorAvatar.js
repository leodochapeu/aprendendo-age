import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { resolveStartAuthorImageSrc } from "@/lib/startAuthor";
export function StartAuthorAvatar({ name, imageUrl, className }) {
    const [failed, setFailed] = useState(false);
    const src = resolveStartAuthorImageSrc(name, imageUrl);
    if (!src || failed)
        return null;
    return (_jsx("img", { src: src, alt: "", width: 20, height: 20, className: cn("h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-zinc-600/80", className), loading: "lazy", decoding: "async", referrerPolicy: "no-referrer", onError: () => setFailed(true) }));
}
