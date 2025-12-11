/**
 * Auth Service - Centralized authentication abstraction
 * 
 * Currently uses Supabase Auth internally.
 * To integrate Azure AD SSO later:
 * 1. Implement signInWithSSO() using @azure/msal-browser
 * 2. Map Azure AD tokens to the AuthSession format
 * 3. Sync Azure AD groups to AppRole in getUserRoles()
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  AuthUser, 
  AuthSession, 
  AppRole, 
  SignInCredentials, 
  SignUpCredentials, 
  AuthResult,
  SSOProvider 
} from "./types";

// ============================================
// Core Auth Functions
// ============================================

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return null;
  
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    fullName: session.user.user_metadata?.full_name,
  };
}

/**
 * Get roles for a specific user
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  
  if (error || !data) {
    console.error("[AuthService] Error fetching roles:", error);
    return [];
  }
  
  return data.map(r => r.role as AppRole);
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  
  if (error) {
    return { error: new Error(error.message) };
  }
  
  return {
    error: null,
    user: data.user ? {
      id: data.user.id,
      email: data.user.email ?? null,
      fullName: data.user.user_metadata?.full_name,
    } : undefined,
  };
}

/**
 * Sign up with email and password
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: credentials.fullName,
      },
    },
  });
  
  if (error) {
    return { error: new Error(error.message) };
  }
  
  return {
    error: null,
    user: data.user ? {
      id: data.user.id,
      email: data.user.email ?? null,
      fullName: credentials.fullName,
    } : undefined,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const redirectUrl = `${window.location.origin}/auth`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  
  if (error) {
    return { error: new Error(error.message) };
  }
  
  return { error: null };
}

/**
 * Sign in with SSO provider (Azure AD, etc.)
 * 
 * STUB: This will be implemented when Azure AD is configured.
 * 
 * To implement Azure AD SSO:
 * 1. Install @azure/msal-browser
 * 2. Configure MSAL with your Azure AD tenant
 * 3. Exchange Azure tokens for Supabase session OR
 *    switch to Azure-native auth entirely
 */
export async function signInWithSSO(provider: SSOProvider): Promise<AuthResult> {
  // Currently not implemented - placeholder for Azure AD integration
  throw new Error(
    `SSO with ${provider} is not yet implemented. ` +
    `Contact IT to configure Azure AD integration.`
  );
}

// ============================================
// Auth State Subscription
// ============================================

type AuthStateCallback = (user: AuthUser | null, session: AuthSession | null) => void;

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback: AuthStateCallback): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email ?? null,
        fullName: session.user.user_metadata?.full_name,
      } : null;
      
      const authSession = session ? {
        user: user!,
        accessToken: session.access_token,
        expiresAt: session.expires_at,
      } : null;
      
      callback(user, authSession);
    }
  );
  
  return () => subscription.unsubscribe();
}

// ============================================
// Role Helpers
// ============================================

/**
 * Check if user has a specific role
 */
export function hasRole(roles: AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: AppRole[], requiredRoles: AppRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: AppRole[], requiredRoles: AppRole[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Derive role flags from role array
 */
export function deriveRoleFlags(roles: AppRole[]) {
  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isOPX = roles.includes('opx') || isSuperAdmin;
  const isHubAdmin = roles.includes('hub_admin') || isSuperAdmin;
  const isFieldStaff = roles.includes('field_staff');
  const isTPS = roles.includes('tps') || isSuperAdmin || isAdmin;
  
  return { isSuperAdmin, isAdmin, isOPX, isHubAdmin, isFieldStaff, isTPS };
}
