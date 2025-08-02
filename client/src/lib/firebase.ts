import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  // connectAuthEmulator, // uncomment for local dev
  type User,
} from "firebase/auth";

/** =================================================================================
 *  Environment & configuration
 *  ================================================================================= */
const isBrowser = typeof window !== "undefined";

// IMPORTANT: storageBucket should be "<project-id>.appspot.com"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hook-line-studio.firebaseapp.com",
  projectId: "hook-line-studio",
  storageBucket: "hook-line-studio.appspot.com",
  messagingSenderId: "307352536789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug environment variables at build time
console.log("[Firebase] Environment check:", {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? "present" : "missing",
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? "present" : "missing",
  NODE_ENV: import.meta.env.NODE_ENV,
  buildTime: new Date().toISOString(),
});

// Avoid initializing on server or with missing keys
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isBrowser) {
  // Check for required environment variables with better validation
  const hasValidApiKey = !!(firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "undefined" && 
    firebaseConfig.apiKey !== "missing" &&
    firebaseConfig.apiKey.length > 10);
  
  const hasValidAppId = !!(firebaseConfig.appId && 
    firebaseConfig.appId !== "undefined" && 
    firebaseConfig.appId !== "missing" &&
    firebaseConfig.appId.includes(":"));
  
  if (hasValidApiKey && hasValidAppId) {
    try {
      app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      auth = getAuth(app);

      // Persist sessions across tabs (default is local, but set explicitly)
      setPersistence(auth, browserLocalPersistence).catch(() => { /* fall back */ });
      // Localize emails/flows to device language
      auth.useDeviceLanguage();

      // For local dev (optional):
      // if (location.hostname === "localhost") {
      //   connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      // }

      // Safe logging (no secrets)
      const opts = app.options || {};
      console.log("[Firebase] ✅ Initialization successful", {
        projectId: opts.projectId,
        authDomain: opts.authDomain,
        appId: opts.appId ? "configured" : "missing",
        apiKey: firebaseConfig.apiKey ? "configured" : "missing",
        storageBucket: opts.storageBucket,
      });
    } catch (e) {
      console.error("[Firebase] ❌ Initialization failed:", e);
      // Set auth to null so functions know Firebase is not available
      auth = null;
    }
  } else {
    console.warn("[Firebase] ⚠️ Skipped initialization - missing or invalid environment variables");
    console.warn("[Firebase] Required environment variables for client-side Firebase:");
    console.warn("- VITE_FIREBASE_API_KEY: Client-side Firebase API key");
    console.warn("- VITE_FIREBASE_APP_ID: Firebase App ID");
    console.warn("");
    console.warn("Current status:");
    console.warn(`- VITE_FIREBASE_API_KEY: ${hasValidApiKey ? "✅ Valid" : "❌ Invalid/Missing"}`);
    console.warn(`- VITE_FIREBASE_APP_ID: ${hasValidAppId ? "✅ Valid" : "❌ Invalid/Missing"}`);
    console.warn("");
    console.warn("🔧 For Railway deployment:");
    console.warn("1. Set VITE_FIREBASE_API_KEY in Railway environment variables");
    console.warn("2. Set VITE_FIREBASE_APP_ID in Railway environment variables");
    console.warn("3. Ensure these are build-time variables, not just runtime variables");
    console.warn("");
    console.warn("💡 Note: VITE_ prefix is required for client-side access in Vite");
    
    // Show current values for debugging (masked for security)
    console.warn("Debug info:", {
      apiKeyType: typeof firebaseConfig.apiKey,
      apiKeyValue: firebaseConfig.apiKey ? 
        `${firebaseConfig.apiKey.substring(0, 8)}...` : 
        firebaseConfig.apiKey,
      appIdType: typeof firebaseConfig.appId,
      appIdValue: firebaseConfig.appId ? 
        `${firebaseConfig.appId.substring(0, 8)}...` : 
        firebaseConfig.appId,
    });
  }
} else {
  console.warn("[Firebase] Skipped init (server-side rendering).");
}

export { auth };

/** =================================================================================
 *  Helpers
 *  ================================================================================= */

// Force-refresh helper (use after email verify/profile change)
export const refreshIdToken = async () => {
  if (!auth?.currentUser) return null;
  try {
    const token = await auth.currentUser.getIdToken(true);
    return token;
  } catch (e) {
    console.error("[Firebase] Token refresh failed:", e);
    return null;
  }
};

// Standard token getter (no forced refresh)
export const getFirebaseToken = async (): Promise<string | null> => {
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (e) {
    console.error("[Firebase] Failed to get ID token:", e);
    return null;
  }
};

// Is configured?
export const isFirebaseConfigured = () => !!auth;

/** =================================================================================
 *  Email/password flows
 *  ================================================================================= */

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) {
    console.error("[Firebase] Authentication not available - Firebase not properly configured");
    throw new Error("Firebase authentication is not configured. Please check your environment variables.");
  }
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error?.code === "auth/network-request-failed") {
      // Retry once on transient network errors
      await new Promise((r) => setTimeout(r, 1000));
      return await signInWithEmailAndPassword(auth, email, password);
    }
    throw error;
  }
};

export const registerWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  if (!auth) {
    console.error("[Firebase] Authentication not available - Firebase not properly configured");
    throw new Error("Firebase authentication is not configured. Please check your environment variables.");
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (cred.user) {
      // Display name for profile
      const displayName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      // Optional: customize the verification email (continue URL back to your app)
      // const actionCodeSettings = {
      //   url: `${window.location.origin}/verify-email`,
      //   handleCodeInApp: false,
      // };
      await sendEmailVerification(cred.user /*, actionCodeSettings */);
    }

    return cred;
  } catch (error: any) {
    console.error("[Firebase] Registration failed:", error);
    if (error?.code === "auth/network-request-failed") {
      await new Promise((r) => setTimeout(r, 1000));
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    throw error;
  }
};

export const logoutUser = () => {
  if (!auth) {
    console.error("[Firebase] Authentication not available - Firebase not properly configured");
    throw new Error("Firebase authentication is not configured. Please check your environment variables.");
  }
  return signOut(auth);
};

export const sendVerificationEmail = (user: User) => {
  // You can also pass actionCodeSettings as above if you need deep links
  return sendEmailVerification(user);
};

/** =================================================================================
 *  Google Sign-In
 *  ================================================================================= */

export async function signInWithGoogle() {
  if (!auth) {
    console.error("[Firebase] Authentication not available - Firebase not properly configured");
    throw new Error("Firebase authentication is not configured. Please check your environment variables.");
  }

  const provider = new GoogleAuthProvider();
  // Minimal OpenID scopes
  provider.addScope("openid");
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    // Popup first (best DX), many browsers will allow it on direct user action
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("[Firebase] Google sign-in error:", {
      code: error?.code,
      message: error?.message,
      customData: error?.customData,
    });

    // Fallback to redirect when popups are blocked (iOS/Safari, strict settings)
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, provider);
      return null; // Caller must handle redirect flow (see handleGoogleRedirect)
    }

    if (error?.code === "auth/internal-error") {
      throw new Error(
        "Google Sign-In configuration error. Check Firebase Auth domains and OAuth client on the project."
      );
    }
    throw error;
  }
}

// Handle redirect result on page/app load
export async function handleGoogleRedirect() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (e) {
    console.error("[Firebase] Google redirect error:", e);
    return null;
  }
}
