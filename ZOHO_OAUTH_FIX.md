# Zoho OAuth Login Flow - Implementation Guide

## Overview
This document explains the fixes applied to the Zoho OAuth login flow to resolve the issue where users were always forced to re-authenticate, even with active Zoho sessions.

## Problem Identified

### Previous Issues
1. **Force Re-authentication**: The authorization URL was using `prompt=login`, which forced users to enter credentials every time, preventing session reuse
2. **Missing OAuth Parameters**: The URL was missing critical OAuth 2.0 parameters:
   - `client_id`
   - `redirect_uri`
   - `scope`
   - `state` (CSRF protection)
   - `response_type=code`

3. **No Token Exchange**: No backend implementation to exchange authorization codes for access tokens
4. **No Session Handling**: Missing session/cookie management for OAuth tokens
5. **Security Issues**: No CSRF protection or state validation

## Solution Implemented

### 1. Frontend Changes

#### LoginScreen.jsx & AuthModal.jsx
- **Removed**: Hardcoded Catalyst login URL (`/__catalyst/auth/login`)
- **Added**: Proper Zoho OAuth 2.0 Authorization URL builder
- **Key Fix**: Removed `prompt=login` parameter to allow session reuse

**How it works now**:
```javascript
const params = new URLSearchParams({
  client_id: ZOHO_OAUTH_CLIENT_ID,
  response_type: 'code',
  scope: 'ZohoMail.accounts.READ ZohoMail.messages.READ',
  redirect_uri: ZOHO_OAUTH_REDIRECT_URI,
  state: state,
  access_type: 'offline'
  // NO prompt=login - this allows Zoho to reuse existing browser session
});
```

**Session Reuse Behavior**:
- If user is already logged into Zoho: Automatically redirects or shows consent screen only
- If no Zoho session exists: Shows Zoho login page

#### OAuthCallback.jsx
- **New Component**: Handles the OAuth redirect callback from Zoho
- **Functionality**:
  - Receives authorization code and state from URL
  - Validates state parameter (CSRF protection)
  - Exchanges code for access token via backend
  - Stores tokens in secure cookies
  - Notifies parent window via postMessage
  - Closes popup gracefully

### 2. Backend Changes

#### index.js - OAuth Endpoints

##### GET /api/oauth/authorize
- Generates authorization URL with proper parameters
- Creates and stores state parameter for CSRF protection
- Returns authorization URL for frontend to use

##### GET/POST /api/oauth/callback
- Handles OAuth redirect from Zoho
- Validates state parameter
- Exchanges authorization code for access token
- Stores tokens in HTTP-only secure cookies
- Supports both traditional redirect flow (GET) and popup flow (POST)

##### POST /api/oauth/refresh-token
- Refreshes expired access tokens using refresh token
- Updates access token cookie
- Handles token expiration gracefully

#### Token Exchange Function
- Securely exchanges authorization code for access tokens
- Makes direct server-to-server request to Zoho
- Never exposes client secret to frontend
- Returns access and refresh tokens

#### Environment Variables Required
```bash
ZOHO_OAUTH_CLIENT_ID=your_client_id
ZOHO_OAUTH_CLIENT_SECRET=your_client_secret
ZOHO_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Key Improvements

#### Session Reuse
- **Before**: `prompt=login` forced new login every time
- **After**: Zoho checks for existing browser session:
  - If found: Reuses session automatically
  - If not found: Shows login form

#### Security
- **CSRF Protection**: State parameter validated on both frontend and backend
- **Secure Cookies**: 
  - HTTP-only (prevents XSS access)
  - Secure flag (HTTPS only in production)
  - SameSite=Lax (prevents CSRF)
- **Token Storage**: Tokens stored in secure HTTP-only cookies
- **Server-to-Server Exchange**: Client secret never exposed to browser

#### Token Management
- **Access Tokens**: Short-lived (typically 1 hour)
- **Refresh Tokens**: Long-lived (30+ days)
- **Automatic Refresh**: Backend can refresh tokens when needed
- **Graceful Expiration**: Expired tokens are detected and refreshed

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory:
```
REACT_APP_ZOHO_CLIENT_ID=1000.abc123def456...
REACT_APP_ZOHO_REDIRECT_URI=http://localhost:5173/auth/callback
```

Backend environment variables:
```
ZOHO_OAUTH_CLIENT_ID=1000.abc123def456...
ZOHO_OAUTH_CLIENT_SECRET=your_client_secret
ZOHO_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 2. Redirect URI Registration

In Zoho Developer Console:
1. Go to your OAuth app settings
2. Under "Authorized Redirect URLs", add:
   - For development: `http://localhost:5173/auth/callback`
   - For production: `https://your-domain.com/auth/callback`

### 3. Route Setup

Add the OAuth callback route to your app router (e.g., React Router):
```jsx
import OAuthCallback from './components/Auth/OAuthCallback';

<Route path="/auth/callback" element={<OAuthCallback />} />
```

## Testing the Flow

### Step 1: User clicks "Sign In with Zoho"
```
Frontend generates OAuth URL with:
- client_id
- response_type=code
- redirect_uri
- state (for CSRF)
- scope (permissions)
```

### Step 2: User is redirected to Zoho login page
```
Zoho checks:
- Is user already logged in? 
  ✓ Yes → Skip login, go to consent (if first time)
  ✗ No → Show login form
```

### Step 3: User completes authentication at Zoho
```
Zoho redirects to callback URL with:
- authorization code
- state (same as sent)
```

### Step 4: Callback handler exchanges code for tokens
```
Backend:
1. Validates state parameter
2. Exchanges code for access token
3. Stores tokens in secure cookies
4. Returns success to frontend
```

### Step 5: User is authenticated
```
Tokens stored in secure HTTP-only cookies
Application can now use access token for API calls
```

## Troubleshooting

### Issue: Still showing login page even with active session
**Cause**: OAuth session might be in different domain or cookies not shared  
**Fix**: Clear browser cookies and try again, or check if Zoho session is actually active

### Issue: "State parameter validation failed"
**Cause**: Session was cleared, popup was refreshed, or cross-domain issues  
**Fix**: This is normal - start authentication flow again

### Issue: "No authorization code received"
**Cause**: User cancelled authorization or network error  
**Fix**: Verify redirect URI matches exactly, check browser console for errors

### Issue: Token refresh failing
**Cause**: Refresh token expired or revoked  
**Fix**: User needs to login again, refresh token should be >= 30 days

## Files Modified

1. **src/components/Auth/LoginScreen.jsx**
   - Implemented proper OAuth URL builder
   - Removed hardcoded Catalyst URL
   - Added state parameter generation

2. **src/components/Auth/AuthModal.jsx**
   - Same OAuth implementation as LoginScreen
   - Consistent security parameters

3. **src/components/Auth/OAuthCallback.jsx** (NEW)
   - Handles OAuth redirect callback
   - Exchanges code for tokens
   - Manages session and user notification

4. **functions/police_fir_api/index.js**
   - Added `/api/oauth/authorize` endpoint
   - Added `/api/oauth/callback` endpoint (GET/POST)
   - Added `/api/oauth/refresh-token` endpoint
   - Added token exchange logic
   - Added cookie-parser middleware

5. **functions/police_fir_api/package.json**
   - Added `cookie-parser` dependency

## OAuth 2.0 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Login Flow                              │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Sign In with Zoho"
   ↓
   Frontend generates OAuth URL (NO prompt=login)
   ↓
2. Opens Zoho authentication page
   ↓
   Zoho checks: "User already logged in?"
   ├─ YES → Skip login, show consent (first-time only)
   └─ NO → Show login page
   ↓
3. User completes authentication at Zoho
   ↓
   Zoho redirects to callback URL with authorization code
   ↓
4. Callback handler (backend) receives code
   ↓
   Validates state (CSRF protection)
   ↓
   Exchanges code for access token (secure server call)
   ↓
5. Stores tokens in HTTP-only secure cookies
   ↓
6. Frontend receives success, user is authenticated
```

## Security Best Practices Implemented

✓ **CSRF Protection**: State parameter validation  
✓ **XSS Protection**: HTTP-only cookies for tokens  
✓ **HTTPS Only**: Secure flag on cookies (production)  
✓ **Same-Site**: SameSite=Lax to prevent cross-site token use  
✓ **Server-Side Secrets**: Client secret never exposed to browser  
✓ **Token Expiration**: Access tokens have limited lifetime  
✓ **Token Refresh**: Refresh tokens stored securely, auto-refresh logic  
✓ **No Token in URL**: Uses cookies, not URL parameters

## Next Steps

1. **Configure Environment Variables**
   - Set ZOHO_OAUTH_CLIENT_ID and ZOHO_OAUTH_CLIENT_SECRET

2. **Register Redirect URI**
   - Add callback URL to Zoho Developer Console

3. **Test OAuth Flow**
   - Try login with existing Zoho session
   - Try login without existing Zoho session
   - Verify tokens are stored securely

4. **Implement API Calls**
   - Use access token from cookies for backend API calls
   - Implement token refresh when needed

5. **Production Deployment**
   - Ensure HTTPS is enabled
   - Update redirect URI to production domain
   - Set secure environment variables
