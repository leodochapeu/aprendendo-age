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
  NOTIFICATION_READS_KEY,
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
  markRead: (ids: readonly string[]) => void;
  refresh: () => Promise<void>;
  bannerOffset: number;
  setBannerOffset: (height: number) => void;
};

const SiteNotificationsContext = createContext<SiteNotificationsContextValue | null>(null);

function readStoredIds(): string[] {
  try {
    return parseStoredReadIds(localStorage.getItem(NOTIFICATION_READS_KEY));
  } catch {
    return [];
  }
}

function writeStoredIds(ids: readonly string[]): void {
  try {
    localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(ids));
  } catch {
    /* storage indisponível */
  }
}

export function SiteNotificationsProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<SiteNotification[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(readStoredIds);
  const [bannerOffset, setBannerOffsetState] = useState(0);
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
      writeStoredIds(next);
      return next;
    });
  }, []);

  const setBannerOffset = useCallback((height: number) => {
    const next = Math.max(0, Math.ceil(height));
    setBannerOffsetState((current) => (current === next ? current : next));
  }, []);

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = useMemo(
    () => activeIds.reduce((count, id) => count + (readSet.has(id) ? 0 : 1), 0),
    [activeIds, readSet],
  );

  const value = useMemo<SiteNotificationsContextValue>(
    () => ({
      preview,
      unreadCount,
      hasMore: total > preview.length,
      loading,
      error,
      readIds,
      markRead,
      refresh,
      bannerOffset,
      setBannerOffset,
    }),
    [preview, unreadCount, total, loading, error, readIds, markRead, refresh, bannerOffset, setBannerOffset],
  );

  return <SiteNotificationsContext.Provider value={value}>{children}</SiteNotificationsContext.Provider>;
}

export function useSiteNotifications(): SiteNotificationsContextValue {
  const value = useContext(SiteNotificationsContext);
  if (!value) throw new Error("useSiteNotifications must be used within SiteNotificationsProvider");
  return value;
}
