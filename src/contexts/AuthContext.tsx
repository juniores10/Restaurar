import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { sessionService } from '../services/sessionService';

interface EmployeeProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  user_type_id: number;
  user_type_name?: string;
  position_name?: string;
  photo_url: string | null;
  birth_date: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  employeeProfile: EmployeeProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceLogout: () => Promise<void>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isEmployee: () => boolean;
  isTerceirizado: () => boolean;
  isLider: () => boolean;
  canManageSystem: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const employeeProfileRef = useRef<EmployeeProfile | null>(null);

  useEffect(() => {
    employeeProfileRef.current = employeeProfile;
  }, [employeeProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployeeProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployeeProfile(session.user.id);
      } else {
        setEmployeeProfile(null);
        setLoading(false);
      }
    });

    const sessionCheckInterval = setInterval(async () => {
      const profile = employeeProfileRef.current;
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && profile && !sessionService.isAdminEmail(profile.email)) {
          const { data: sessionData, error } = await supabase
            .from('user_sessions')
            .select('is_active')
            .eq('user_id', data.session.user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            console.warn('Session check query failed, skipping logout:', error);
            return;
          }

          if (!sessionData) {
            alert('Sua sessão foi encerrada porque você acessou o sistema em outro dispositivo.');
            await forceLogout();
          } else {
            await sessionService.ensureSessionValid(
              data.session.user.id,
              profile.email,
              data.session.access_token
            );
          }
        }
      } catch (err) {
        console.warn('Session check interval error, skipping:', err);
      }
    }, 30000);

    return () => {
      subscription?.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  async function fetchEmployeeProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, user_types(name)')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let positionName = null;
        if (data.position_id) {
          const { data: positionData } = await supabase
            .from('data_types')
            .select('description')
            .eq('id', data.position_id)
            .maybeSingle();
          positionName = positionData?.description;
        }

        setEmployeeProfile({
          ...data,
          full_name: data.name,
          user_type_name: (data.user_types as any)?.name,
          position_name: positionName,
          is_active: data.is_active ?? (data.status === 0),
        });
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const hasActiveSession = await sessionService.checkExistingSession(email);

      if (hasActiveSession && !sessionService.isAdminEmail(email)) {
        await sessionService.invalidateUserSessions(email);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        await sessionService.createSession({
          userId: data.user.id,
          email: email,
          sessionToken: data.session.access_token,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await sessionService.invalidateSession(data.session.access_token);
      }

      setEmployeeProfile(null);
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setEmployeeProfile(null);
      setUser(null);
    }
  }

  async function forceLogout() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await sessionService.invalidateSession(data.session.access_token);
      }

      setEmployeeProfile(null);
      setUser(null);
      await supabase.auth.signOut({ scope: 'global' });
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.includes('supabase') || key.includes('sb-')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    } catch (error) {
      console.error('Error force logging out:', error);
      localStorage.clear();
      window.location.reload();
    }
  }

  function isAdmin() {
    return employeeProfile?.user_type_id === 1;
  }

  function isManager() {
    return employeeProfile?.user_type_id === 2;
  }

  function isEmployee() {
    return employeeProfile?.user_type_id === 3;
  }

  function isTerceirizado() {
    return employeeProfile?.user_type_id === 4;
  }

  function isLider() {
    return employeeProfile?.user_type_id === 5;
  }

  function canManageSystem() {
    return employeeProfile?.user_type_id === 1 || employeeProfile?.user_type_id === 2 || employeeProfile?.user_type_id === 5;
  }

  async function refreshProfile() {
    if (user) {
      await fetchEmployeeProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      employeeProfile,
      loading,
      signIn,
      signOut,
      forceLogout,
      isAdmin,
      isManager,
      isEmployee,
      isTerceirizado,
      isLider,
      canManageSystem,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
