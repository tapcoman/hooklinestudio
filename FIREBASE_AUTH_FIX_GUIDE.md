# Firebase Google Sign-In Fix Guide

## The Problem
You're getting `auth/internal-error` because the OAuth client ID in Firebase Console doesn't match the one in Google Cloud Console.

## Quick Fix Steps

### Step 1: Reset Google Provider in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/project/hook-line-studio/authentication/providers)
2. Click on **Google** provider
3. Click **Disable** → Save
4. Wait 10 seconds
5. Click **Enable** → Save
6. This regenerates matching OAuth clients automatically

### Step 2: Verify OAuth Client Match
1. In Firebase Console (from Step 1), copy the **Web client ID** shown
2. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=hook-line-studio)
3. Find the OAuth 2.0 Client ID that matches
4. Click on it to verify settings

### Step 3: Add Your Domain to Authorized Lists
In the Google Cloud OAuth client settings, ensure these are added:

**Authorized JavaScript origins:**
- `http://localhost:5000`
- `https://hook-line-studio.firebaseapp.com`
- Your Replit dev URL (e.g., `https://your-repl-name.repl.co`)

**Authorized redirect URIs:**
- `http://localhost:5000/__/auth/handler`
- `https://hook-line-studio.firebaseapp.com/__/auth/handler`
- Your Replit URL + `/__/auth/handler`

### Step 4: Clear Browser Cache
1. Open browser dev tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## Alternative: Create New OAuth Client
If the above doesn't work:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=hook-line-studio)
2. Click **+ CREATE CREDENTIALS** → OAuth client ID
3. Choose **Web application**
4. Add your domains to authorized origins and redirect URIs
5. Copy the new Client ID
6. In Firebase Console, update the Google provider to use this new Client ID

## Test Your Fix
After making changes, test with the debug tool:
1. Open `debug-google-signin.html` in your browser
2. Click "Test Google Sign-In"
3. It should now work!

## Still Having Issues?
The most common causes:
- Domain not in authorized list (add your current domain)
- Browser cache (clear it completely)
- Multiple Google accounts (try incognito mode)
- OAuth consent screen not configured (check Google Cloud Console)

Remember: Changes can take 5-10 minutes to propagate through Google's systems.