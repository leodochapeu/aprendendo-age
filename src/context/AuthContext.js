import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { AOMSTATS_UNSYNC_DB_UPDATE, aomStatsSyncPayloadToDbUpdate, buildAomStatsClanDbUpdate, profileRowToAomStatsFields, } from "@/lib/aomstatsProfileSync";
import { fetchGodStats } from "@/lib/formRetoldApi";
import { deleteProfileGods, upsertProfileGodsFromApi } from "@/lib/profileGodsSync";
import { authErrorMessage } from "@/lib/auth/authErrors";
import { MIN_PASSWORD_LENGTH, SIGNUP_APP, parseUserRole } from "@/lib/auth/constants";
import { createSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const PROFILE_SELECT = "role, display_name, created_at, aomstats_id, logo_path, logo_path_locked, aomstats_alias, aomstats_rr, aomstats_wins, aomstats_losses, aomstats_win_rate, aomstats_rank, aomstats_snapshot_at, aomstats_clan, clan_id";
const AuthContext = createContext(null);
/** GoTrue mantém lock durante onAuthStateChange — adiar evita deadlock ao consultar profiles. */
function deferAuthSideEffect(fn) {
    window.setTimeout(fn, 0);
}
function mapRowToProfile(user, row) {
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
export function AuthProvider({ children }) {
    const supabase = useMemo(() => createSupabaseClient(), []);
    const configured = isSupabaseConfigured();
    const [status, setStatus] = useState(() => (configured ? "loading" : "unconfigured"));
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoadState, setProfileLoadState] = useState("idle");
    const profileReadyUserId = useRef(null);
    const clearLocalAuth = useCallback(() => {
        profileReadyUserId.current = null;
        setUser(null);
        setSession(null);
        setProfile(null);
        setProfileLoadState("idle");
        setStatus(configured ? "unauthenticated" : "unconfigured");
    }, [configured]);
    const loadProfileForUser = useCallback(async (u) => {
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
            }
            else {
                setProfile(mapRowToProfile(u, null));
            }
        }
        catch {
            setProfile(mapRowToProfile(u, null));
        }
        finally {
            profileReadyUserId.current = u.id;
            setProfileLoadState("ready");
        }
    }, [supabase]);
    const refreshProfile = useCallback(async () => {
        if (!supabase)
            return;
        const { data: { user: u }, } = await supabase.auth.getUser();
        if (!u) {
            clearLocalAuth();
            return;
        }
        await loadProfileForUser(u);
    }, [clearLocalAuth, loadProfileForUser, supabase]);
    const signIn = useCallback(async (email, password) => {
        if (!supabase)
            return { ok: false, message: "Auth não configurado." };
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error)
            return { ok: false, message: authErrorMessage(error.message) };
        return { ok: true };
    }, [supabase]);
    const signUp = useCallback(async (nickname, email, password) => {
        if (!supabase)
            return { ok: false, message: "Auth não configurado." };
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
        if (error)
            return { ok: false, message: authErrorMessage(error.message) };
        return { ok: true };
    }, [supabase]);
    const syncAomStats = useCallback(async (payload) => {
        if (!supabase)
            return { ok: false, message: "Auth não configurado." };
        const { data: { user: u }, } = await supabase.auth.getUser();
        if (!u)
            return { ok: false, message: "Sessão inválida." };
        const clanFields = await buildAomStatsClanDbUpdate(payload, profile?.aomstatsClan, profile?.clanId);
        const { error } = await supabase
            .from("profiles")
            .update({
            ...aomStatsSyncPayloadToDbUpdate(payload, { skipLogoPath: profile?.logoPathLocked }),
            ...(clanFields ?? {}),
        })
            .eq("id", u.id);
        if (error)
            return { ok: false, message: error.message };
        const aomstatsId = Number.parseInt(payload.aomstatsId, 10);
        if (Number.isFinite(aomstatsId) && aomstatsId > 0) {
            try {
                const gods = await fetchGodStats(aomstatsId);
                const godsResult = await upsertProfileGodsFromApi(supabase, u.id, gods);
                if (!godsResult.ok) {
                    console.warn("[syncAomStats] gods persist failed:", godsResult.message);
                }
            }
            catch (err) {
                console.warn("[syncAomStats] gods fetch failed:", err);
            }
        }
        await loadProfileForUser(u);
        return { ok: true };
    }, [loadProfileForUser, profile?.aomstatsClan, profile?.clanId, profile?.logoPathLocked, supabase]);
    const unsyncAomStats = useCallback(async () => {
        if (!supabase)
            return { ok: false, message: "Auth não configurado." };
        const { data: { user: u }, } = await supabase.auth.getUser();
        if (!u)
            return { ok: false, message: "Sessão inválida." };
        const { error } = await supabase.from("profiles").update(AOMSTATS_UNSYNC_DB_UPDATE).eq("id", u.id);
        if (error)
            return { ok: false, message: error.message };
        const godsDelete = await deleteProfileGods(supabase, u.id);
        if (!godsDelete.ok) {
            console.warn("[unsyncAomStats] gods delete failed:", godsDelete.message);
        }
        await loadProfileForUser(u);
        return { ok: true };
    }, [loadProfileForUser, supabase]);
    const signOut = useCallback(async () => {
        if (supabase)
            await supabase.auth.signOut();
        clearLocalAuth();
    }, [clearLocalAuth, supabase]);
    useEffect(() => {
        if (!supabase)
            return;
        let cancelled = false;
        function scheduleProfileLoad(u) {
            deferAuthSideEffect(() => {
                if (cancelled)
                    return;
                void loadProfileForUser(u);
            });
        }
        function applySession(s) {
            if (!s?.user) {
                clearLocalAuth();
                return;
            }
            setUser(s.user);
            setSession(s);
            scheduleProfileLoad(s.user);
        }
        const { data: { subscription }, } = supabase.auth.onAuthStateChange((event, sess) => {
            if (cancelled)
                return;
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
    const value = useMemo(() => ({
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
    }), [profile, profileLoadState, refreshProfile, session, signIn, signOut, signUp, status, syncAomStats, unsyncAomStats, user]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
