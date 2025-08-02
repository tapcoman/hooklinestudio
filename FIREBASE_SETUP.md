# Firebase Auth Setup Guide

## Why Firebase Auth?

Firebase Auth provides enterprise-grade security with built-in email verification, password reset, and security monitoring - much simpler than building our own system.

## Required Firebase Environment Variables

### Client-Side (Frontend)
Add these to your Replit secrets with the `VITE_` prefix:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Server-Side (Backend)
Add these Firebase Admin SDK credentials:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key-with-newlines
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## How to Get Firebase Credentials

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create new project"
3. Enter project name: `hook-line-studio`
4. Enable Google Analytics (optional)
5. Wait for project creation

### 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Email link (passwordless sign-in)" if desired

### 3. Get Client-Side Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web app (</>) 
4. Register app with name "Hook Line Studio"
5. Copy the config object values to your environment variables with `VITE_` prefix

### 4. Get Server-Side Config (Admin SDK)
1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Features Enabled

✅ **Email/Password Authentication**
- Secure user registration and login
- Automatic email verification
- Password strength validation by Firebase

✅ **Email Verification**
- Automatic verification emails sent
- Users must verify before accessing app features
- Resend verification option available

✅ **Security Features**
- Built-in rate limiting
- Suspicious activity detection
- Account lockout protection
- Secure session management

✅ **Backend Integration**
- Firebase Admin SDK verifies tokens
- User data synced to PostgreSQL
- Seamless integration with existing Stripe system

## Testing Your Setup

1. **Test Registration**: Try creating an account
2. **Check Email**: Verify you receive the verification email
3. **Test Login**: Login only works after email verification
4. **Backend Sync**: User should appear in PostgreSQL users table

## Migration from Current Auth

The system supports both authentication methods:
- Existing users with passwords continue working
- New users can register with Firebase Auth
- Gradual migration path available

## Security Benefits

- **Email Verification**: Required before app access
- **Password Reset**: Built-in secure password reset
- **Rate Limiting**: Automatic protection against brute force
- **Admin Controls**: Firebase Console for user management
- **Compliance**: SOC 2, ISO 27001 certified infrastructure