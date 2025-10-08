# Privy Social Login Troubleshooting Guide

## 🔍 Current Issue: Social Login Not Working

### Quick Checklist ✅

1. **✅ Privy App ID Configured**: `cmgakt9wj0005l20b5epdxws8`
2. **✅ Packages Installed**: `@privy-io/react-auth` installed
3. **✅ Provider Setup**: AuthProvider wrapping app
4. **⚠️ Dashboard Configuration**: Needs verification

### 🚨 Most Common Issues & Fixes

#### Issue 1: Domain Not Whitelisted in Privy Dashboard
**Symptoms**: Login modal opens but fails with CORS or domain errors

**Fix**:
1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Select your app: `cmgakt9wj0005l20b5epdxws8`
3. Navigate to **Settings** → **Domains**
4. Add these domains:
   - `localhost:3000` (for development)
   - `localhost:3001` (backup port)
   - `localhost:3002` (backup port)
   - `tictactoe-three-eta.vercel.app` (production)
   - `*.vercel.app` (for preview deployments)

#### Issue 2: Login Methods Not Enabled
**Symptoms**: Login modal shows but no social options appear

**Fix**:
1. In Privy Dashboard → **Authentication** → **Login Methods**
2. Enable these methods:
   - ✅ **Google**
   - ✅ **Twitter/X**
   - ✅ **Email**
   - ✅ **Wallet** (optional)

#### Issue 3: Identity Tokens Not Enabled
**Symptoms**: Login works but server-side auth fails

**Fix**:
1. In Privy Dashboard → **Authentication** → **Advanced**
2. Enable: **"Return user data in identity token"**
3. This allows server-side user verification

#### Issue 4: OAuth App Configuration
**Symptoms**: Social login redirects fail

**Fix**: Configure OAuth apps in respective platforms:

**Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URIs:
   - `https://auth.privy.io/api/oauth/google/callback`
4. Add authorized domains: your domains

**Twitter/X OAuth**:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create app and get credentials
3. Configure callback URLs

### 🛠️ Testing Steps

#### Test 1: Check Privy Provider Status
```javascript
// Add this to your component to debug
const { ready, authenticated, user } = usePrivy()
console.log('Privy Status:', { ready, authenticated, user })
```

#### Test 2: Test Identity Token
```javascript
const { identityToken } = useIdentityToken()
console.log('Identity Token:', identityToken ? 'Available' : 'Not available')
```

#### Test 3: Server-side Verification
Visit: `http://localhost:3000/api/auth/verify`
- Should show user info if logged in
- Should show error if not authenticated

### 🔧 Debug Configuration

#### Check Current Environment
```bash
# In your terminal
echo $NEXT_PUBLIC_PRIVY_APP_ID
# Should output: cmgakt9wj0005l20b5epdxws8
```

#### Enable Debug Logging
Add to your `.env.local`:
```bash
NEXT_PUBLIC_DEBUG=true
```

#### Browser Console Debugging
1. Open browser dev tools (F12)
2. Go to **Console** tab
3. Try logging in - look for:
   - Privy SDK messages
   - CORS errors
   - Network request failures

### 🎯 Step-by-Step Fix Process

#### Step 1: Verify Privy Dashboard
1. ✅ Login to [dashboard.privy.io](https://dashboard.privy.io)
2. ✅ Select app ID: `cmgakt9wj0005l20b5epdxws8`
3. ✅ Check **Domains** section - add localhost and vercel domains
4. ✅ Check **Login Methods** - enable Google, Twitter, Email
5. ✅ Check **Advanced** - enable identity tokens

#### Step 2: Test Local Development
```bash
cd c:\tictactoe
npm run dev:next
# Visit http://localhost:3000
# Try social login
```

#### Step 3: Check Browser Network Tab
1. Open dev tools → **Network** tab
2. Try logging in
3. Look for failed requests to:
   - `auth.privy.io`
   - OAuth providers (Google, Twitter)

#### Step 4: Test API Integration
1. Login successfully
2. Visit: `/api/auth/verify`
3. Should see user data if working

### 🚀 Production Deployment

#### Vercel Environment Variables
Add in Vercel dashboard:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=cmgakt9wj0005l20b5epdxws8
```

#### Domain Configuration
In Privy Dashboard, ensure production domain is added:
- `tictactoe-three-eta.vercel.app`

### 📞 Need Help?

**Privy Support**:
- [Discord](https://discord.gg/privy)
- [Documentation](https://docs.privy.io/)
- [Support Email](mailto:support@privy.io)

**Common Error Messages**:
- `"Invalid domain"` → Check domain whitelist
- `"Login method not available"` → Enable in dashboard
- `"OAuth configuration error"` → Check OAuth app setup
- `"Token verification failed"` → Enable identity tokens

---

**Expected Result**: After fixing these issues, social login should work perfectly! 🎉