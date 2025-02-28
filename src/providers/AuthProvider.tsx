
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
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<{ error: any | null; data: any | null }>;
}

interface UserProfile {
  username?: string;
  avatar_url?: string;
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
  updateUserProfile: async () => ({ error: null, data: null }),
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
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
        
        if (currentSession?.user) {
          // Determine user type based on user metadata
          const userData = currentSession.user.user_metadata;
          if (userData.user_type) {
            setUserType(userData.user_type as UserType);
          }
          
          // Check if profile exists and create it if it doesn't
          if (event === 'SIGNED_IN') {
            await ensureProfileExists(currentSession.user);
          }
        } else {
          setUserType(null);
        }
        
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsAuthenticated(!!initialSession);
      
      if (initialSession?.user) {
        const userData = initialSession.user.user_metadata;
        if (userData.user_type) {
          setUserType(userData.user_type as UserType);
        }
        
        // Ensure profile exists for current user
        await ensureProfileExists(initialSession.user);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to ensure the user profile exists
  const ensureProfileExists = async (user: User) => {
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // If profile doesn't exist or there was an error fetching it, create one
      if (fetchError || !profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.user_metadata.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata.avatar_url,
          });
          
        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  const login = (type: UserType) => {
    setUserType(type);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    
    // Reset auth state regardless of error
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    setSession(null);
    
    // If there's an error, log it but don't return it
    if (error) {
      console.error("Error during logout:", error);
    }
  };

  const signUp = async (email: string, password: string, type: UserType) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: type,
            full_name: email.split('@')[0], // Default username from email
          },
        },
      });
      
      // If signup successful, ensure profile is created
      if (data.user && !error) {
        await ensureProfileExists(data.user);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error during signup:', error);
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
      console.error('Error during sign in:', error);
      return { data: null, error };
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }
    
    try {
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
      } else {
        console.log('Profile updated successfully:', data);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
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
        signIn,
        updateUserProfile
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
