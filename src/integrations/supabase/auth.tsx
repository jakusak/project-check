import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./client";
import { useToast } from "@/hooks/use-toast";

type AppRole = 'admin' | 'super_admin' | 'field_staff' | 'opx' | 'hub_admin' | 'user' | 'tps';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOPX: boolean;
  isHubAdmin: boolean;
  isFieldStaff: boolean;
  isTPS: boolean;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isOPX = roles.includes('opx') || isSuperAdmin;
  const isHubAdmin = roles.includes('hub_admin') || isSuperAdmin;
  const isFieldStaff = roles.includes('field_staff');
  const isTPS = roles.includes('tps') || isSuperAdmin || isAdmin;

  useEffect(() => {
    console.log('[Auth] Setting up auth listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, 'user:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
        
        // Always set loading to false when auth state changes
        setLoading(false);
        console.log('[Auth] Loading set to false after auth change');
      }
    );

    // THEN check for existing session
    console.log('[Auth] Checking existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] getSession result:', session?.user?.email ?? 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRoles(session.user.id);
      }
      setLoading(false);
      console.log('[Auth] Loading set to false after getSession');
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      // Handle error case - still set loading to false
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (data) {
      setRoles(data.map(r => r.role as AppRole));
    } else {
      setRoles([]);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created",
        description: "You can now sign in with your credentials.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin,
      isSuperAdmin,
      isOPX, 
      isHubAdmin, 
      isFieldStaff,
      isTPS,
      roles,
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
