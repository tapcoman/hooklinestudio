import { ReactNode } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthReady } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if auth is fully ready and user is definitely not authenticated
    if (isAuthReady && !loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, isAuthReady, setLocation]);

  // Show loading until auth is completely ready
  if (!isAuthReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-heritage-600" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}