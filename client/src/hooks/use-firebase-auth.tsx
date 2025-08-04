import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from "firebase/auth";
import { useMutation, useQuery, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { auth, logoutUser, getFirebaseToken, signInWithGoogle, handleGoogleRedirect } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as BackendUser } from "@shared/schema";
import { debugLogger } from "@/utils/debugLogger";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<void, Error, LoginData>;
  registerMutation: UseMutationResult<void, Error, RegisterData>;
  googleSignInMutation: UseMutationResult<void, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  backendUser: BackendUser | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen to Firebase auth state changes
  useEffect(() => {
    debugLogger.logInfo('Firebase auth provider initializing', 'FirebaseAuth');
    
    if (!auth) {
      console.warn("[Auth] Firebase authentication not available - environment variables not configured");
      debugLogger.logError({
        message: 'Firebase auth not available - environment variables not configured',
        component: 'FirebaseAuth',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      setLoading(false);
      setIsAuthReady(true); // Mark as ready so UI can show appropriate messaging
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Get the ID token and sync with backend
        try {
          const token = await firebaseUser.getIdToken();
          // Store token for API requests
          localStorage.setItem('firebase_token', token);
          
          // Sync user with backend (secure - token auth only)
          try {
            const response = await fetch('/api/auth/firebase-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Secure token authentication
              }
              // No body needed - all data comes from verified token
            });
            
            if (response.ok) {
              const backendUserData = await response.json();
              setBackendUser(backendUserData.user);
              
              // Only redirect once from auth page after successful Google Sign-in
              const isAuthPage = window.location.pathname === '/auth';
              const hasRedirected = sessionStorage.getItem('auth_redirected') === 'true';
              
              if (isAuthPage && !hasRedirected) {
                sessionStorage.setItem('auth_redirected', 'true');
                
                if (backendUserData.needsOnboarding) {
                  window.location.replace('/onboarding');
                } else {
                  window.location.replace('/app');
                }
              }
            } else {
              const errorText = await response.text();
              console.error('Backend sync failed:', response.status, errorText);
              // Don't throw error - user can still use the app
            }
          } catch (fetchError) {
            console.error('Network error during backend sync:', fetchError);
            // Still set user even if backend sync fails
          }
          
          // Invalidate user queries to refetch with new auth
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        } catch (error) {
          console.error('Error syncing with backend:', error);
        }
      } else {
        localStorage.removeItem('firebase_token');
        sessionStorage.removeItem('auth_redirected'); // Clear redirect flag on logout
        setBackendUser(null);
        queryClient.setQueryData(['/api/user'], null);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      
      // Use Firebase client SDK for password validation
      if (!auth) {
        throw new Error('Firebase authentication is not configured. Please check your environment variables (VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID).');
      }
      
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      return userCredential.user;
    },
    onSuccess: (user) => {
      // For development, skip email verification check
      // if (!user.emailVerified) {
      //   toast({
      //     title: "Email verification required", 
      //     description: "Please check your email and verify your account before continuing.",
      //     variant: "destructive",
      //   });
      //   return;
      // }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      let message = "Login failed";
      if (error.code === 'auth/user-not-found') {
        message = "No account found with this email";
      } else if (error.code === 'auth/wrong-password') {
        message = "Invalid password";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email address";
      }
      
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string;
    }) => {
      
      // Use server-side registration endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password, 
          firstName,
          lastName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Sign in with the custom token
      if (auth && data.customToken) {
        const { signInWithCustomToken } = await import('firebase/auth');
        await signInWithCustomToken(auth, data.customToken);
      }
      
      return data.user;
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Welcome! You've been automatically signed in.",
      });
      // User will be automatically redirected by the auth state change
    },
    onError: (error: Error) => {
      let message = "Registration failed";
      if (error.message.includes("already exists")) {
        message = "An account with this email already exists. Try logging in instead.";
      } else if (error.message.includes("weak-password")) {
        message = "Password should be at least 6 characters";
      } else if (error.message.includes("invalid-email")) {
        message = "Invalid email address";
      } else {
        message = error.message || "Registration failed";
      }
      
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      const user = await signInWithGoogle();
      return user;
    },
    onSuccess: () => {
      toast({
        title: "Google Sign-In successful",
        description: "Welcome! You've been signed in with Google.",
      });
    },
    onError: (error: Error) => {
      console.error('Google Sign-In mutation error:', error);
      
      let message = "Google Sign-In failed";
      let diagnosis = "";
      
      if (error.code === 'auth/popup-blocked') {
        message = "Popup was blocked. Please allow popups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Sign-in was cancelled.";
      } else if (error.code === 'auth/internal-error') {
        message = "Configuration error detected.";
        diagnosis = " This is usually caused by OAuth client ID mismatch between Firebase Console and Google Cloud Console. Check the debug tool for detailed steps.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Google Sign-In.";
        diagnosis = " Add this domain to Firebase authorized domains and Google Cloud Console authorized origins.";
      } else {
        message = error.message || "Google Sign-In failed";
      }
      
      toast({
        title: "Google Sign-In failed",
        description: message + diagnosis,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutUser();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthReady,
        error,
        loginMutation,
        registerMutation,
        googleSignInMutation,
        logoutMutation,
        backendUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}