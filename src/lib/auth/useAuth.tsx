/**
 * useAuth Hook - React hook for auth state management
 * 
 * This hook provides reactive auth state and role information.
 * It uses the authService internally but provides a React-friendly API.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import * as authService from "./authService";
import type { AuthUser, AuthSession, AppRole, SignInCredentials, SignUpCredentials } from "./types";

interface AuthContextType {
  // State
  user: AuthUser | null;
  session: AuthSession | null;
  roles: AppRole[];
  loading: boolean;
  
  // Role flags (derived for convenience)
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOPX: boolean;
  isHubAdmin: boolean;
  isFieldStaff: boolean;
  isTPS: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithSSO: (provider: 'azure' | 'google') => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Derive role flags
  const roleFlags = authService.deriveRoleFlags(roles);

  useEffect(() => {
    console.log('[Auth] Setting up auth listener...');
    
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((authUser, authSession) => {
      console.log('[Auth] Auth state changed:', authUser?.email ?? 'no user');
      setUser(authUser);
      setSession(authSession);
      
      if (authUser) {
        // Fetch roles in next tick to avoid Supabase auth deadlock
        setTimeout(() => {
          authService.getUserRoles(authUser.id).then(setRoles);
        }, 0);
      } else {
        setRoles([]);
      }
      
      setLoading(false);
    });

    // Check for existing session
    authService.getCurrentUser().then((existingUser) => {
      console.log('[Auth] Existing user check:', existingUser?.email ?? 'none');
      if (existingUser) {
        setUser(existingUser);
        authService.getUserRoles(existingUser.id).then(setRoles);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('[Auth] Session check error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const result = await authService.signIn({ email, password });
    
    if (result.error) {
      toast({
        title: "Login failed",
        description: result.error.message,
        variant: "destructive",
      });
    }
    
    return { error: result.error };
  };

  const handleSignUp = async (email: string, password: string) => {
    const result = await authService.signUp({ email, password });
    
    if (result.error) {
      toast({
        title: "Signup failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created",
        description: "You can now sign in with your credentials.",
      });
    }
    
    return { error: result.error };
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setRoles([]);
  };

  const handleSignInWithSSO = async (provider: 'azure' | 'google') => {
    try {
      await authService.signInWithSSO(provider);
      return { error: null };
    } catch (err: any) {
      toast({
        title: "SSO Login",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      roles,
      loading,
      ...roleFlags,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      signInWithSSO: handleSignInWithSSO,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
