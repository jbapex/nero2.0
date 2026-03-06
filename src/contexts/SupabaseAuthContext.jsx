import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        return;
      }
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          setProfile(null);
          return;
        }

        setProfile(data || null);
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let authSubscription;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }

        const currentSession = data?.session ?? null;
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser?.id) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          const nextUser = newSession?.user ?? null;
          setUser(nextUser);

          if (nextUser?.id) {
            await loadProfile(nextUser.id);
          } else {
            setProfile(null);
          }
        }
      );

      authSubscription = listener;
    };

    init();

    return () => {
      try {
        authSubscription?.subscription?.unsubscribe();
      } catch {
        // ignora erros ao desinscrever
      }
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const hasPermission = useCallback(
    (key, entityId) => {
      if (!profile) return false;

      if (profile.user_type === 'super_admin') {
        return true;
      }

      if (!key) return true;

      if (key === 'ads') {
        return Boolean(
          profile.plans?.has_ads_access ||
            profile.has_ads_access ||
            profile.ads_access
        );
      }

      if (key === 'custom_ai') {
        return Boolean(
          profile.plans?.has_custom_ai ||
            profile.has_custom_ai ||
            profile.custom_ai_enabled
        );
      }

      if (key === 'module_access') {
        if (!entityId) return true;
        if (Array.isArray(profile.allowed_modules)) {
          return profile.allowed_modules.includes(entityId);
        }
        return true;
      }

      if (key === 'ads_agent_access') {
        if (!entityId) return true;
        if (Array.isArray(profile.allowed_ads_agents)) {
          return profile.allowed_ads_agents.includes(entityId);
        }
        return true;
      }

      return true;
    },
    [profile]
  );

  const getLlmIntegrations = useCallback(async () => {
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('user_ai_connections')
      .select('id, name, provider, type, is_default')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar conexões de IA:', error);
      return [];
    }

    return data || [];
  }, [user]);

  const value = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    authLoading: loading || profileLoading,
    signOut,
    refreshProfile,
    hasPermission,
    getLlmIntegrations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

