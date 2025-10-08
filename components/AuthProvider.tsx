'use client';

// Simple auth provider wrapper - no external dependencies
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}