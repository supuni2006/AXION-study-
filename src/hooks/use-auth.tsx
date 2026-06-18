import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  full_name: string | null;
  xp: number;
  streak: number;
  avatar_url: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  profile: Profile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  isTeacher: false,
  isAdmin: false,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, xp, streak, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user) await loadProfile(sess.session.user.id);
  }, [loadProfile]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) loadProfile(sess.user.id);
      else setProfile(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!session?.user) { setIsTeacher(false); setIsAdmin(false); return; }
    setTimeout(async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      setIsTeacher(!!data?.some((r) => r.role === "teacher" || r.role === "admin"));
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
    }, 0);
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      isTeacher,
      isAdmin,
      profile,
      signOut,
      refreshProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);