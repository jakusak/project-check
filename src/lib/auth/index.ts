/**
 * Auth Module - Centralized authentication abstraction
 * 
 * This module provides a clean API for authentication that can be
 * swapped from Supabase Auth to Azure AD SSO in the future.
 * 
 * Current Implementation: Supabase Auth
 * Future: Azure AD SSO via @azure/msal-browser
 * 
 * === AZURE AD INTEGRATION GUIDE ===
 * 
 * When ready to integrate Azure AD:
 * 
 * 1. Install MSAL: npm install @azure/msal-browser
 * 
 * 2. Create src/lib/auth/azureAuth.ts with MSAL configuration:
 *    - Configure PublicClientApplication with your Azure AD tenant
 *    - Implement token acquisition and refresh
 * 
 * 3. Update authService.ts:
 *    - Implement signInWithSSO() to use MSAL loginPopup/loginRedirect
 *    - Map Azure AD token claims to AuthUser format
 *    - Optionally sync Azure AD groups to user_roles table
 * 
 * 4. Update useAuth.tsx:
 *    - Add MSAL account change listeners
 *    - Handle Azure AD session alongside Supabase (or replace entirely)
 * 
 * 5. Configuration needed:
 *    - Azure AD App Registration (Client ID, Tenant ID)
 *    - Redirect URIs in Azure Portal
 *    - API permissions for user profile and groups
 */

// Types
export type { 
  AppRole, 
  AuthUser, 
  AuthSession, 
  AuthState,
  SignInCredentials,
  SignUpCredentials,
  AuthResult,
  SSOProvider,
  SSOConfig,
  RoleRequirement,
} from "./types";

// Auth Service Functions
export {
  getCurrentUser,
  getUserRoles,
  signIn,
  signUp,
  signOut,
  signInWithSSO,
  onAuthStateChange,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  deriveRoleFlags,
} from "./authService";

// React Components and Hooks
export { AuthProvider, useAuth } from "./useAuth";
export { AuthGuard, useAuthGuard } from "./AuthGuard";
