// Auth types - centralized type definitions
// These can be extended when integrating Azure AD SSO

export type AppRole = 'admin' | 'super_admin' | 'field_staff' | 'opx' | 'hub_admin' | 'user' | 'tps';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt?: number;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOPX: boolean;
  isHubAdmin: boolean;
  isFieldStaff: boolean;
  isTPS: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResult {
  error: Error | null;
  user?: AuthUser;
}

// SSO Provider types for future Azure AD integration
export type SSOProvider = 'azure' | 'google';

export interface SSOConfig {
  provider: SSOProvider;
  clientId?: string;
  tenantId?: string; // For Azure AD
  redirectUri?: string;
}

// Role check utility types
export interface RoleRequirement {
  roles?: AppRole[];
  requireAll?: boolean; // If true, user must have ALL roles; if false, ANY role
}
