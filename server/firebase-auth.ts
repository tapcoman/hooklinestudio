import { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "./firebase-admin";
import { storage } from "./storage";

export interface FirebaseRequest extends Request {
  firebaseUser?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

function getBearerToken(req: Request): string | undefined {
  const auth = req.header("authorization") || req.header("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const xTok = req.header("x-firebase-token"); // optional fallback
  return xTok?.trim();
}

export async function firebaseAuthMiddleware(
  req: FirebaseRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "No authentication token provided" });
    }

    // IMPORTANT: inside verifyFirebaseToken, call admin.auth().verifyIdToken(token, true)
    // and optionally assert iss/aud match your project.
    const decoded = await verifyFirebaseToken(token);

    // For development, skip email verification check
    // if (decoded.email_verified === false) {
    //   return res.status(403).json({ message: "Email not verified. Please verify your email." });
    // }

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      email_verified: decoded.email_verified,
      name: decoded.name,
      picture: (decoded as any).picture,
    };

    // Also fetch user from database for compatibility
    try {
      const user = await storage.getUserByFirebaseUid(decoded.uid);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || decoded.email || '',
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          industry: user.industry,
          role: user.role,
          audience: user.audience,
          voice: user.voice,
          bannedTerms: user.bannedTerms,
          freeCredits: user.freeCredits,
          usedCredits: user.usedCredits,
          isPremium: user.isPremium
        };
      } else {
        // Create a minimal user object for Firebase-only routes
        req.user = {
          id: decoded.uid,
          email: decoded.email || '',
        };
      }
    } catch (dbError) {
      console.warn('Could not fetch user from database:', dbError);
      // Create a minimal user object for Firebase-only routes
      req.user = {
        id: decoded.uid,
        email: decoded.email || '',
      };
    }

    next();
  } catch (err: any) {
    // Provide clearer messages
    const msg = String(err?.message || "");
    if (msg.includes("expired")) {
      return res.status(401).json({ message: "Authentication token expired" });
    }
    return res.status(401).json({ message: "Invalid authentication token" });
  }
}

export async function optionalFirebaseAuth(
  req: FirebaseRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    if (token) {
      const d = await verifyFirebaseToken(token);
      req.firebaseUser = {
        uid: d.uid,
        email: d.email,
        email_verified: d.email_verified,
        name: d.name,
        picture: (d as any).picture,
      };
    }
  } catch (err) {
    if (process.env.LOG_OPTIONAL_AUTH === "1") {
      console.warn("[optionalFirebaseAuth] token invalid:", err);
    }
  } finally {
    next();
  }
}