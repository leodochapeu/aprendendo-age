import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fetchNotificationPreview } from "@/lib/siteNotificationsApi";
import {
  mergeReadIds,
  NOTIFICATION_BELL_SEEN_KEY,
  NOTIFICATION_READS_KEY,
  NOTIFICATION_TICKER_COLLAPSED_KEY,
  parseStoredReadIds,
  type SiteNotification,
} from "@/lib/siteNotifications";

type SiteNotificationsContextValue = {
  preview: SiteNotification[];
  unreadCount: number;
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  readIds: readonly string[];
  bellSeenIds: readonly string[];
  markRead: (ids: readonly string[]) => void;
  acknowledgeBell: () => void;
  refresh: () => Promise<void>;
  bannerOffset: number;
  setBannerOffset: (height: number) => void;
  tickerCollapsed: boolean;
  setTickerCollapsed: (collapsed: boolean) => void;
  tickerOffset: number;
  setTickerOffset: (height: number) => void;
};

const SiteNotificationsContext = createContext<SiteNotificationsContextValue | null>(null);

function readTickerCollapsed(): boolean {
  try {
    return localStorage.getItem(NOTIFICATION_TICKER_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredIds(key: string, ids: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* storage indisponível */
  }
}

function readStoredKey(key: string): string[] {
  try {
    return parseStoredReadIds(localStorage.getItem(key));
  } catch {
    return [];
  }
}

export function SiteNotificationsProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<SiteNotification[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => readStoredKey(NOTIFICATION_READS_KEY));
  const [bellSeenIds, setBellSeenIds] = useState<string[]>(() => readStoredKey(NOTIFICATION_BELL_SEEN_KEY));
  const activeIdsRef = useRef<string[]>([]);
  activeIdsRef.current = activeIds;
  const [bannerOffset, setBannerOffsetState] = useState(0);
  const [tickerOffset, setTickerOffsetState] = useState(0);
  const [tickerCollapsed, setTickerCollapsedState] = useState(readTickerCollapsed);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    const result = await fetchNotificationPreview();
    if (id !== requestId.current) return;
    setLoading(false);
    if (!result.ok) {
      setError(result.reason === "load");
      return;
    }
    setError(false);
    setPreview(result.preview);
    setActiveIds(result.activeIds);
    setTotal(result.total);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      requestId.current += 1;
    };
  }, [refresh]);

  const markRead = useCallback((ids: readonly string[]) => {
    setReadIds((current) => {
      const next = mergeReadIds(current, ids);
      if (next === current) return current;
      writeStoredIds(NOTIFICATION_READS_KEY, next);
      return next;
    });
  }, []);

  const acknowledgeBell = useCallback(() => {
    const ids = activeIdsRef.current;
    setBellSeenIds((current) => {
      const next = mergeReadIds(current, ids);
      if (next === current) return current;
      writeStoredIds(NOTIFICATION_BELL_SEEN_KEY, next);
      return next;
    });
  }, []);

  const setBannerOffset = useCallback((height: number) => {
    const next = Math.max(0, Math.ceil(height));
    setBannerOffsetState((current) => (current === next ? current : next));
  }, []);

  const setTickerOffset = useCallback((height: number) => {
    const next = Math.max(0, Math.ceil(height));
    setTickerOffsetState((current) => (current === next ? current : next));
  }, []);

  const setTickerCollapsed = useCallback((collapsed: boolean) => {
    setTickerCollapsedState(collapsed);
    try {
      localStorage.setItem(NOTIFICATION_TICKER_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* storage indisponível */
    }
  }, []);

  const bellSeenSet = useMemo(() => new Set(bellSeenIds), [bellSeenIds]);
  const unreadCount = useMemo(
    () => activeIds.reduce((count, id) => count + (bellSeenSet.has(id) ? 0 : 1), 0),
    [activeIds, bellSeenSet],
  );

  const value = useMemo<SiteNotificationsContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return <SiteNotificationsContext.Provider value={value}>{children}</SiteNotificationsContext.Provider>;
}

export function useSiteNotifications(): SiteNotificationsContextValue {
  const value = useContext(SiteNotificationsContext);
  if (!value) throw new Error("useSiteNotifications must be used within SiteNotificationsProvider");
  return value;
}
