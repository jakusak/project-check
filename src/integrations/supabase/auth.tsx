/**
 * @deprecated Import from '@/lib/auth' instead
 * This file is kept for backward compatibility during migration.
 */

// Re-export everything from the new auth module
export { AuthProvider, useAuth } from "@/lib/auth";

// Re-export types for backward compatibility
export type { AppRole } from "@/lib/auth";
