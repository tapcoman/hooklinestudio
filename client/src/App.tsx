import React, { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FirebaseAuthProvider, useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import FirebaseAuthPage from "@/pages/firebase-auth-page";
import Landing from "./pages/landing";
import ErrorBoundary from "@/components/error-boundary";

// Lazy load heavy components for better performance
const Onboarding = lazy(() => import("./pages/onboarding"));
const AppPage = lazy(() => import("./pages/app"));
const Favorites = lazy(() => import("./pages/favorites"));
const Profile = lazy(() => import("./pages/profile"));
const ManageCompanies = lazy(() => import("./pages/profile/companies"));
const Pricing = lazy(() => import("./pages/pricing"));
const Billing = lazy(() => import("./pages/billing"));
const History = lazy(() => import("./pages/history"));

// Loading component for suspense fallback
const PageLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate">{message}</p>
    </div>
  </div>
);

function AppRouter() {
  const { user, loading, isAuthReady, loginMutation } = useFirebaseAuth();
  const isAuthenticated = !!user;
  const isLoading = loading;

  // Show loading until auth is ready to prevent "page not found" flash
  if (!isAuthReady || isLoading || loginMutation.isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate">{loginMutation.isPending ? 'Signing you in...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Handle authentication transitions more gracefully
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={FirebaseAuthPage} />
        <Route path="/pricing" component={() => (
          <Suspense fallback={<PageLoader message="Loading pricing..." />}>
            <Pricing />
          </Suspense>
        )} />
        <Route path="/demo" component={Landing} />
        {/* Redirect other protected routes to landing for logged out users */}
        <Route path="/onboarding" component={() => { window.location.replace("/auth"); return null; }} />
        <Route path="/app" component={() => { window.location.replace("/"); return null; }} />
        <Route path="/favorites" component={() => { window.location.replace("/"); return null; }} />
        <Route path="/history" component={() => { window.location.replace("/"); return null; }} />
        <Route path="/profile" component={() => { window.location.replace("/"); return null; }} />
        <Route path="/billing" component={() => { window.location.replace("/"); return null; }} />
        <Route>
          {/* Show loading instead of NotFound during auth transitions */}
          <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate">Loading...</p>
            </div>
          </div>
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Redirect root to app for authenticated users */}
      <Route path="/" component={() => { window.location.replace("/app"); return null; }} />
      <Route path="/onboarding" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading onboarding..." />}>
              <Onboarding />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/app" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading app..." />}>
              <AppPage />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/favorites" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading favorites..." />}>
              <Favorites />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/history" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading history..." />}>
              <History />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/profile" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading profile..." />}>
              <Profile />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/profile/companies" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading companies..." />}>
              <ManageCompanies />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route path="/pricing" component={() => (
        <Suspense fallback={<PageLoader message="Loading pricing..." />}>
          <Pricing />
        </Suspense>
      )} />
      <Route path="/billing" component={() => (
        <ProtectedRoute>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading billing..." />}>
              <Billing />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      )} />
      <Route>
        {/* Show NotFound for truly unknown routes when authenticated and stable */}
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  );
}