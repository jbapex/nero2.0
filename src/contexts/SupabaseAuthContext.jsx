import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    else setProfile(null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    if (user?.id) return fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const hasPermission = useCallback((key, entityId) => {
    if (profile?.user_type === 'super_admin') return true;
    if (!profile) return false;
    if (key === 'custom_ai' || key === 'ads' || key === 'ads_agent_access' || key === 'module_access') return true;
    return true;
  }, [profile]);

  const getLlmIntegrations = useCallback(async () => {
    if (!user?.id) return [];
    const { data: userConns } = await supabase
      .from('user_ai_connections')
      .select('id, name, provider, default_model, capabilities, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    const userConnections = (userConns || [])
      .filter(conn => conn.capabilities?.text_generation === true)
      .map(conn => ({ ...conn, is_user_connection: true, source: 'personal' }));
    if (userConnections.length > 0) return userConnections;
    const { data: globalData } = await supabase
      .from('llm_integrations')
      .select('id, name, provider, default_model');
    const globalList = (globalData || []).filter(i => i.is_active !== false)
      .map(i => ({ ...i, is_user_connection: false, source: 'global' }));
    return [...userConnections, ...globalList];
  }, [user?.id]);

  const value = {
    user,
    profile,
    session,
    loading,
    profileLoading,
    authLoading: loading,
    signOut,
    refreshProfile,
    hasPermission,
    getLlmIntegrations,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
