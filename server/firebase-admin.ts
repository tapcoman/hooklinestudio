import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK only if credentials are provided
if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    // Only log configuration details in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing Firebase Admin with project:', process.env.FIREBASE_PROJECT_ID);
      console.log('Private key length:', process.env.FIREBASE_PRIVATE_KEY?.length);
      console.log('Client email:', process.env.FIREBASE_CLIENT_EMAIL);
    } else {
      console.log('Initializing Firebase Admin SDK...');
    }
    
    // Check if project_id looks like a service account email (common mistake)
    if (process.env.FIREBASE_PROJECT_ID?.includes('@')) {
      console.error('ERROR: FIREBASE_PROJECT_ID appears to be a service account email, not a project ID!');
      console.error('FIREBASE_PROJECT_ID should be just: hook-line-studio');
      console.error('Current value:', process.env.FIREBASE_PROJECT_ID);
    }
    
    const credentials = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    // Validate all required fields are present
    if (!credentials.projectId || !credentials.privateKey || !credentials.clientEmail) {
      throw new Error('Missing required Firebase credentials');
    }
    
    initializeApp({
      credential: cert(credentials),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw error; // Re-throw to see the exact error
  }
}

export const adminAuth = getApps().length > 0 ? getAuth() : null;

// Verify Firebase ID token and return user info
export async function verifyFirebaseToken(idToken: string, checkRevoked: boolean = false) {
  if (!process.env.FIREBASE_PROJECT_ID || !adminAuth) {
    throw new Error('Firebase not configured');
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken, checkRevoked);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw error; // Return original error for proper handling
  }
}

// Get user by Firebase UID
export async function getFirebaseUser(uid: string) {
  if (!adminAuth) {
    throw new Error('Firebase not configured');
  }
  
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    throw new Error('User not found');
  }
}