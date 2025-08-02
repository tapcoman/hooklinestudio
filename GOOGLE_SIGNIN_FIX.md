# Google Sign-In Fix for auth/internal-error

## The Problem
You're getting `auth/internal-error` because there's a mismatch between your Firebase Console and Google Cloud Console OAuth configurations.

## The Solution (Step-by-Step)

### Step 1: Check Firebase Console Google Sign-In Configuration
1. Go to: https://console.firebase.google.com/project/hook-line-studio/authentication/providers
2. Click on **Google** provider
3. Look at the **Web SDK configuration** section
4. **Write down** the Web client ID and Web client secret shown there

### Step 2: Check Google Cloud Console OAuth Client
1. Go to: https://console.cloud.google.com/apis/credentials?project=hook-line-studio
2. Look for **OAuth 2.0 Client IDs** section
3. Find your **Web application** client (might be called "Web client (auto created by Google Service)")
4. **Write down** the Client ID and Client secret

### Step 3: Match the IDs
**The Web client ID in Firebase Console MUST exactly match the Client ID in Google Cloud Console.**

If they don't match:
- In Firebase Console → Authentication → Sign-in method → Google
- Update the **Web client ID** to match the one from Google Cloud Console
- Update the **Web client secret** to match the one from Google Cloud Console
- Click **Save**

### Step 4: Verify Authorized Domains
In Google Cloud Console OAuth client, make sure these are added:

**Authorized JavaScript origins:**
- `https://002a07ab-27bf-48d9-a51d-97a9fa43368d-00-1u4xy426q1j27.picard.replit.dev`
- `https://hook-line-studio.firebaseapp.com`

**Authorized redirect URIs:**
- `https://002a07ab-27bf-48d9-a51d-97a9fa43368d-00-1u4xy426q1j27.picard.replit.dev/__/auth/handler`
- `https://hook-line-studio.firebaseapp.com/__/auth/handler`

### Step 5: Wait and Test
- Changes can take 5-60 minutes to propagate
- Clear your browser cache/cookies for the site
- Test Google Sign-In again

## Alternative: Temporarily Disable Google Sign-In
If you want to move forward while fixing this, I can temporarily hide the Google Sign-In button so users only see email/password authentication, which is working perfectly.

## Common Issues
- **Multiple projects**: Make sure both Firebase and Google Cloud are using the same project
- **Web client secret**: Some setups require the client secret to be set even for web apps
- **Project migration**: Firebase sometimes creates duplicate OAuth clients during migrations

Let me know if you want me to check the configuration or temporarily disable Google Sign-In while we sort this out!