import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../firebase-admin';

export interface FirebaseRequest extends Request {
  firebaseUser?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
}

export async function firebaseAuthMiddleware(
  req: FirebaseRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-firebase-token'] as string;

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name
    };

    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    res.status(401).json({ message: 'Invalid authentication token' });
  }
}

// Optional Firebase auth (doesn't fail if no token)
export async function optionalFirebaseAuth(
  req: FirebaseRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-firebase-token'] as string;

    if (token) {
      const decodedToken = await verifyFirebaseToken(token);
      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name
      };
    }

    next();
  } catch (error) {
    // Silently continue without auth if token is invalid
    next();
  }
}