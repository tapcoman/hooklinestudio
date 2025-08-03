import { ReactNode } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthReady } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if auth is fully ready and user is definitely not authenticated
    if (isAuthReady && !loading && !user && auth) {
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

  // If Firebase is not configured, show helpful error message
  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md mx-4 p-6 bg-white rounded-lg shadow-lg border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <h1 className="text-xl font-semibold text-slate-900">Configuration Required</h1>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <p>Firebase authentication is not properly configured. This is likely due to missing environment variables.</p>
            
            <div className="bg-slate-50 p-3 rounded border">
              <p className="font-medium text-slate-800 mb-2">Required Environment Variables:</p>
              <ul className="space-y-1 text-xs font-mono">
                <li>• VITE_FIREBASE_API_KEY</li>
                <li>• VITE_FIREBASE_APP_ID</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">For Railway Deployment:</p>
              <p className="text-xs text-blue-600">
                Set these variables in your Railway project's environment settings and redeploy.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Check the browser console for detailed Firebase configuration logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}