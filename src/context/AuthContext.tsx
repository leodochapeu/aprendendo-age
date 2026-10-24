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
import type { Session, User } from "@supabase/supabase-js";

import {
  AOMSTATS_UNSYNC_DB_UPDATE,
  aomStatsSyncPayloadToDbUpdate,
  buildAomStatsClanDbUpdate,
  profileRowToAomStatsFields,
  type AomStatsProfileSyncPayload,
} from "@/lib/aomstatsProfileSync";
import { fetchGodStats } from "@/lib/formRetoldApi";
import { deleteProfileGods, upsertProfileGodsFromApi } from "@/lib/profileGodsSync";
import { authErrorMessage } from "@/lib/auth/authErrors";
import { MIN_PASSWORD_LENGTH, SIGNUP_APP, parseUserRole, type UserRole } from "@/lib/auth/constants";
import { createSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AppUserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
  createdAt: string | null;
  aomstatsId: string | null;
  logoPath: string | null;
  aomstatsAlias: string | null;
  aomstatsRr: number | null;
  aomstatsWins: number | null;
  aomstatsLosses: number | null;
  aomstatsWinRate: string | null;
  aomstatsRank: string | null;
  aomstatsSnapshotAt: string | null;
  aomstatsClan: string | null;
  clanId: string | null;
  logoPathLocked: boolean;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unconfigured";

export type ProfileLoadState = "idle" | "loading" | "ready";

type AuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: AppUserProfile | null;
  profileLoadState: ProfileLoadState;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (nickname: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  syncAomStats: (payload: AomStatsProfileSyncPayload) => Promise<AuthResult>;
  unsyncAomStats: () => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
};

const PROFILE_SELECT =
  "role, display_name, created_at, aomstats_id, logo_path, logo_path_locked, aomstats_alias, aomstats_rr, aomstats_wins, aomstats_losses, aomstats_win_rate, aomstats_rank, aomstats_snapshot_at, aomstats_clan, clan_id";

const AuthContext = createContext<AuthContextValue | null>(null);

/** GoTrue mantém lock durante onAuthStateChange — adiar evita deadlock ao consultar profiles. */
function deferAuthSideEffect(fn: () => void): void {
  window.setTimeout(fn, 0);
}

function mapRowToProfile(
  user: User,
  row: {
    role: string | null;
    display_name: string | null;
    created_at: string | null;
    aomstats_id: string | null;
    logo_path: string | null;
    logo_path_locked?: boolean | null;
    aomstats_alias: string | null;
    aomstats_rr: number | null;
    aomstats_wins: number | null;
    aomstats_losses: number | null;
    aomstats_win_rate: string | null;
    aomstats_rank: string | null;
    aomstats_snapshot_at: string | null;
    aomstats_clan?: string | null;
    clan_id?: string | null;
  } | null,
): AppUserProfile {
  const aom = row
    ? profileRowToAomStatsFields(row)
    : {
        aomstatsId: null,
        logoPath: null,
        logoPathLocked: false,
        aomstatsAlias: null,
        aomstatsRr: null,
        aomstatsWins: null,
        aomstatsLosses: null,
        aomstatsWinRate: null,
        aomstatsRank: null,
        aomstatsSnapshotAt: null,
        aomstatsClan: null,
        clanId: null,
      };

  return {
    id: user.id,
    email: user.email ?? null,
    role: parseUserRole(row?.role),
    displayName: row?.display_name ?? null,
    createdAt: row?.created_at ?? null,
    ...aom,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const configured = isSupabaseConfigured();

  const [status, setStatus] = useState<AuthStatus>(() => (configured ? "loading" : "unconfigured"));
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [profileLoadState, setProfileLoadState] = useState<ProfileLoadState>("idle");
  const profileReadyUserId = useRef<string | null>(null);

  const clearLocalAuth = useCallback(() => {
    profileReadyUserId.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setProfileLoadState("idle");
    setStatus(configured ? "unauthenticated" : "unconfigured");
  }, [configured]);

  const loadProfileForUser = useCallback(
    async (u: User) => {
      if (!supabase) {
        setProfileLoadState("ready");
        return;
      }
      const alreadyReady = profileReadyUserId.current === u.id;
      if (!alreadyReady) {
        setProfileLoadState("loading");
        setProfile(mapRowToProfile(u, null));
      }
      setStatus("authenticated");

      try {
        const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", u.id).single();

        if (!error && data) {
          setProfile(mapRowToProfile(u, data));
        } else {
          setProfile(mapRowToProfile(u, null));
        }
      } catch {
        setProfile(mapRowToProfile(u, null));
      } finally {
        profileReadyUserId.current = u.id;
        setProfileLoadState("ready");
      }
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      clearLocalAuth();
      return;
    }
    await loadProfileForUser(u);
  }, [clearLocalAuth, loadProfileForUser, supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, message: "Auth não configurado." };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { ok: false, message: authErrorMessage(error.message) };
      return { ok: true };
    },
    [supabase],
  );

  const signUp = useCallback(
    async (nickname: string, email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, message: "Auth não configurado." };
      const trimmedNickname = nickname.trim();
      if (!trimmedNickname) {
        return { ok: false, message: "Informe um nickname." };
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return {
          ok: false,
          message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        };
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: trimmedNickname,
            signup_app: SIGNUP_APP,
          },
        },
      });
      if (error) return { ok: false, message: authErrorMessage(error.message) };
      return { ok: true };
    },
    [supabase],
  );

  const syncAomStats = useCallback(
    async (payload: AomStatsProfileSyncPayload): Promise<AuthResult> => {
      if (!supabase) return { ok: false, message: "Auth não configurado." };
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) return { ok: false, message: "Sessão inválida." };

      const clanFields = await buildAomStatsClanDbUpdate(payload, profile?.aomstatsClan);
      const { error } = await supabase
        .from("profiles")
        .update({
          ...aomStatsSyncPayloadToDbUpdate(payload, { skipLogoPath: profile?.logoPathLocked }),
          ...(clanFields ?? {}),
        })
        .eq("id", u.id);

      if (error) return { ok: false, message: error.message };

      const aomstatsId = Number.parseInt(payload.aomstatsId, 10);
      if (Number.isFinite(aomstatsId) && aomstatsId > 0) {
        try {
          const gods = await fetchGodStats(aomstatsId);
          const godsResult = await upsertProfileGodsFromApi(supabase, u.id, gods);
          if (!godsResult.ok) {
            console.warn("[syncAomStats] gods persist failed:", godsResult.message);
          }
        } catch (err) {
          console.warn("[syncAomStats] gods fetch failed:", err);
        }
      }

      await loadProfileForUser(u);
      return { ok: true };
    },
    [loadProfileForUser, profile?.aomstatsClan, profile?.logoPathLocked, supabase],
  );

  const unsyncAomStats = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { ok: false, message: "Auth não configurado." };
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return { ok: false, message: "Sessão inválida." };

    const { error } = await supabase.from("profiles").update(AOMSTATS_UNSYNC_DB_UPDATE).eq("id", u.id);
    if (error) return { ok: false, message: error.message };

    const godsDelete = await deleteProfileGods(supabase, u.id);
    if (!godsDelete.ok) {
      console.warn("[unsyncAomStats] gods delete failed:", godsDelete.message);
    }

    await loadProfileForUser(u);
    return { ok: true };
  }, [loadProfileForUser, supabase]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    clearLocalAuth();
  }, [clearLocalAuth, supabase]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    function scheduleProfileLoad(u: User) {
      deferAuthSideEffect(() => {
        if (cancelled) return;
        void loadProfileForUser(u);
      });
    }

    function applySession(s: Session | null) {
      if (!s?.user) {
        clearLocalAuth();
        return;
      }
      setUser(s.user);
      setSession(s);
      scheduleProfileLoad(s.user);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      if (cancelled) return;

      if (event === "TOKEN_REFRESHED" && sess?.user) {
        setUser(sess.user);
        setSession(sess);
        return;
      }

      applySession(sess);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearLocalAuth, loadProfileForUser, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      session,
      profile,
      profileLoadState,
      signIn,
      signUp,
      signOut,
      syncAomStats,
      unsyncAomStats,
      refreshProfile,
    }),
    [profile, profileLoadState, refreshProfile, session, signIn, signOut, signUp, status, syncAomStats, unsyncAomStats, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
