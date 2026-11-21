import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { fetchNotificationPreview } from "@/lib/siteNotificationsApi";
import { mergeReadIds, NOTIFICATION_BELL_SEEN_KEY, NOTIFICATION_READS_KEY, NOTIFICATION_TICKER_COLLAPSED_KEY, parseStoredReadIds, } from "@/lib/siteNotifications";
const SiteNotificationsContext = createContext(null);
const REFRESH_MS = 5 * 60_000;
const MIN_GAP_MS = 4 * 60_000;
const MAX_BACKOFF_MS = 20 * 60_000;
function readTickerCollapsed() {
    try {
        return localStorage.getItem(NOTIFICATION_TICKER_COLLAPSED_KEY) === "1";
    }
    catch {
        return false;
    }
}
function writeStoredIds(key, ids) {
    try {
        localStorage.setItem(key, JSON.stringify(ids));
    }
    catch {
        /* storage indisponível */
    }
}
function readStoredKey(key) {
    try {
        return parseStoredReadIds(localStorage.getItem(key));
    }
    catch {
        return [];
    }
}
export function SiteNotificationsProvider({ children }) {
    const [preview, setPreview] = useState([]);
    const [activeIds, setActiveIds] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [readIds, setReadIds] = useState(() => readStoredKey(NOTIFICATION_READS_KEY));
    const [bellSeenIds, setBellSeenIds] = useState(() => readStoredKey(NOTIFICATION_BELL_SEEN_KEY));
    const activeIdsRef = useRef([]);
    activeIdsRef.current = activeIds;
    const [bannerOffset, setBannerOffsetState] = useState(0);
    const [tickerOffset, setTickerOffsetState] = useState(0);
    const [tickerCollapsed, setTickerCollapsedState] = useState(readTickerCollapsed);
    const requestId = useRef(0);
    const inFlight = useRef(false);
    const lastFetchAt = useRef(0);
    const failures = useRef(0);
    const load = useCallback(async (force) => {
        const now = Date.now();
        if (inFlight.current)
            return;
        const gap = failures.current === 0 ? MIN_GAP_MS : Math.min(MAX_BACKOFF_MS, MIN_GAP_MS * 2 ** failures.current);
        if (!force && now - lastFetchAt.current < gap)
            return;
        inFlight.current = true;
        lastFetchAt.current = now;
        const id = ++requestId.current;
        try {
            const result = await fetchNotificationPreview();
            if (id !== requestId.current)
                return;
            setLoading(false);
            if (!result.ok) {
                failures.current += 1;
                setError(result.reason === "load");
                return;
            }
            failures.current = 0;
            setError(false);
            setPreview(result.preview);
            setActiveIds(result.activeIds);
            setTotal(result.total);
        }
        catch {
            if (id !== requestId.current)
                return;
            failures.current += 1;
            setLoading(false);
            setError(true);
        }
        finally {
            if (id === requestId.current)
                inFlight.current = false;
        }
    }, []);
    const refresh = useCallback(() => load(true), [load]);
    useEffect(() => {
        void load(true);
        const timer = window.setInterval(() => {
            if (document.visibilityState !== "visible")
                return;
            void load(false);
        }, REFRESH_MS);
        const onVisible = () => {
            if (document.visibilityState === "visible")
                void load(false);
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            requestId.current += 1;
            inFlight.current = false;
        };
    }, [load]);
    const markRead = useCallback((ids) => {
        setReadIds((current) => {
            const next = mergeReadIds(current, ids);
            if (next === current)
                return current;
            writeStoredIds(NOTIFICATION_READS_KEY, next);
            return next;
        });
    }, []);
    const acknowledgeBell = useCallback(() => {
        const ids = activeIdsRef.current;
        setBellSeenIds((current) => {
            const next = mergeReadIds(current, ids);
            if (next === current)
                return current;
            writeStoredIds(NOTIFICATION_BELL_SEEN_KEY, next);
            return next;
        });
    }, []);
    const setBannerOffset = useCallback((height) => {
        const next = Math.max(0, Math.ceil(height));
        setBannerOffsetState((current) => (current === next ? current : next));
    }, []);
    const setTickerOffset = useCallback((height) => {
        const next = Math.max(0, Math.ceil(height));
        setTickerOffsetState((current) => (current === next ? current : next));
    }, []);
    const setTickerCollapsed = useCallback((collapsed) => {
        setTickerCollapsedState(collapsed);
        try {
            localStorage.setItem(NOTIFICATION_TICKER_COLLAPSED_KEY, collapsed ? "1" : "0");
        }
        catch {
            /* storage indisponível */
        }
    }, []);
    const bellSeenSet = useMemo(() => new Set(bellSeenIds), [bellSeenIds]);
    const unreadCount = useMemo(() => activeIds.reduce((count, id) => count + (bellSeenSet.has(id) ? 0 : 1), 0), [activeIds, bellSeenSet]);
    const value = useMemo(() => ({
        preview,
        unreadCount,
        hasMore: total > preview.length,
        loading,
        error,
        readIds,
        bellSeenIds,
        markRead,
        acknowledgeBell,
        refresh,
        bannerOffset,
        setBannerOffset,
        tickerCollapsed,
        setTickerCollapsed,
        tickerOffset,
        setTickerOffset,
    }), [
        preview,
        unreadCount,
        total,
        loading,
        error,
        readIds,
        bellSeenIds,
        markRead,
        acknowledgeBell,
        refresh,
        bannerOffset,
        setBannerOffset,
        tickerCollapsed,
        setTickerCollapsed,
        tickerOffset,
        setTickerOffset,
    ]);
    return _jsx(SiteNotificationsContext.Provider, { value: value, children: children });
}
export function useSiteNotifications() {
    const value = useContext(SiteNotificationsContext);
    if (!value)
        throw new Error("useSiteNotifications must be used within SiteNotificationsProvider");
    return value;
}
