
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'resident' | 'authority' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userType: UserType;
  user: User | null;
  session: Session | null;
  login: (type: UserType) => void;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, type: UserType) => Promise<{ error: any | null; data: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userType: null,
  user: null,
  session: null,
  login: () => {},
  logout: async () => {},
  signUp: async () => ({ error: null, data: null }),
  signIn: async () => ({ error: null, data: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
        
        if (currentSession?.user) {
          // Determine user type based on user metadata
          const userData = currentSession.user.user_metadata;
          if (userData.user_type) {
            setUserType(userData.user_type as UserType);
          }
        } else {
          setUserType(null);
        }
        
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsAuthenticated(!!initialSession);
      
      if (initialSession?.user) {
        const userData = initialSession.user.user_metadata;
        if (userData.user_type) {
          setUserType(userData.user_type as UserType);
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (type: UserType) => {
    setUserType(type);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setIsAuthenticated(false);
      setUserType(null);
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, type: UserType) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: type,
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        userType, 
        user, 
        session,
        login, 
        logout, 
        signUp,
        signIn
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
