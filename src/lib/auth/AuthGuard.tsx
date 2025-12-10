import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { AppRole } from "./types";

interface AuthGuardProps {
  children: ReactNode;
  /** Required roles - user must have at least one of these */
  allowedRoles?: AppRole[];
  /** If true, user must have ALL allowedRoles instead of ANY */
  requireAllRoles?: boolean;
  /** Custom redirect path (defaults to /auth) */
  redirectTo?: string;
  /** Fallback component while loading */
  loadingFallback?: ReactNode;
  /** Component to show when access is denied */
  accessDeniedFallback?: ReactNode;
}

/**
 * AuthGuard - Protects routes based on authentication and role requirements
 * 
 * Usage:
 * <AuthGuard allowedRoles={['admin', 'opx']}>
 *   <ProtectedPage />
 * </AuthGuard>
 * 
 * Or for any authenticated user:
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  allowedRoles,
  requireAllRoles = false,
  redirectTo = "/auth",
  loadingFallback,
  accessDeniedFallback,
}: AuthGuardProps) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = requireAllRoles
      ? allowedRoles.every(role => roles.includes(role))
      : allowedRoles.some(role => roles.includes(role));

    if (!hasRequiredRole) {
      // User is authenticated but lacks required role
      return accessDeniedFallback ? (
        <>{accessDeniedFallback}</>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <a href="/" className="text-primary hover:underline">
              Return to Home
            </a>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required roles
  return <>{children}</>;
}

/**
 * Hook version of AuthGuard for programmatic checks
 */
export function useAuthGuard(options?: {
  allowedRoles?: AppRole[];
  requireAllRoles?: boolean;
}) {
  const { user, roles, loading } = useAuth();

  const isAuthenticated = !!user;
  
  let hasAccess = isAuthenticated;
  
  if (options?.allowedRoles && options.allowedRoles.length > 0) {
    hasAccess = options.requireAllRoles
      ? options.allowedRoles.every(role => roles.includes(role))
      : options.allowedRoles.some(role => roles.includes(role));
  }

  return {
    isAuthenticated,
    hasAccess,
    loading,
    user,
    roles,
  };
}
