import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    
    // Using the RPC function to get consolidated profile data
    const { data, error } = await supabase.rpc('get_or_create_profile');

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar perfil",
        description: "Não foi possível carregar os dados do seu perfil.",
      });
      setProfile(null);
    } else {
      setProfile(data?.profile);
    }
  }, [toast]);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    await fetchProfile(currentUser?.id);
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // On SIGNED_OUT, clear profile before user is set to null
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        await handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const hasPermission = useCallback((permissionKey, entityId = null) => {
    if (!profile) return false;
    if (profile.user_type === 'super_admin') return true;
    if (!permissionKey) return true; // Allows access if no specific permission is required

    // Handle module access check
    if (permissionKey === 'module_access' && entityId) {
      // Check if module is in user's plan modules
      const planHasModule = profile.plan_modules?.includes(entityId);
      // Check if module is directly assigned to user
      const userHasModule = profile.user_modules?.includes(entityId);
      
      return planHasModule || userHasModule;
    }

    // Handle general feature access checks (e.g., 'site_builder', 'ads')
    const profileKey = `has_${permissionKey}_access`;
    return !!profile[profileKey];
  }, [profile]);


  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    hasPermission,
  }), [user, session, profile, loading, signUp, signIn, signOut, hasPermission]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};