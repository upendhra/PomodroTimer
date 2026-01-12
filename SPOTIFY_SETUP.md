# Spotify OAuth Integration Setup Guide

This guide will help you set up Spotify OAuth integration for your Pomodoro Timer app, allowing users to access their personal playlists directly.

## 🎯 Overview

Users will be able to:
- ✅ Connect their Spotify account with one click
- ✅ Browse and select from their personal playlists
- ✅ Play full playlists without manual URL copying
- ✅ Still use manual URL input as a fallback

---

## 📋 Step 1: Register Your App with Spotify

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account (free account works fine)

2. **Create a New App**
   - Click "Create app" button
   - Fill in the details:
     - **App name**: `Pomodoro Timer` (or your preferred name)
     - **App description**: `Focus timer with Spotify integration`
     - **Website**: Your app URL (e.g., `http://localhost:3000` for development)
     - **Redirect URI**: `http://localhost:3000/api/spotify/callback`
   - Check the boxes to agree to terms
   - Click "Save"

3. **Get Your Credentials**
   - After creating the app, you'll see your dashboard
   - Click "Settings" button
   - Copy your **Client ID**
   - Click "View client secret" and copy your **Client Secret**
   - **IMPORTANT**: Keep these credentials secure and never commit them to Git!

---

## 🔧 Step 2: Configure Environment Variables

1. **Create/Update `.env.local` file** in your project root:

```bash
# Existing Supabase config (keep these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Add these Spotify OAuth credentials
SPOTIFY_CLIENT_ID=your-client-id-from-spotify-dashboard
SPOTIFY_CLIENT_SECRET=your-client-secret-from-spotify-dashboard
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

2. **Replace the placeholder values** with your actual credentials from Step 1

3. **For Production Deployment**:
   - Update `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` to your production URL
   - Example: `https://yourdomain.com/api/spotify/callback`
   - Add this production URL to your Spotify app's Redirect URIs in the dashboard

---

## 🚀 Step 3: Install and Run

1. **Restart your development server** to load the new environment variables:

```bash
npm run dev
```

2. **Test the Integration**:
   - Navigate to your app
   - You should see a "Connect Spotify Account" button in the Spotify player
   - Click it to test the OAuth flow
   - After logging in, you should see your playlists!

---

## 🎵 How It Works

### User Flow:
1. **User clicks "Connect Spotify Account"**
   - Redirects to Spotify login page
   - User authorizes your app

2. **After Authorization**:
   - User returns to your app
   - Access token is stored securely in HTTP-only cookies
   - User's playlists are automatically fetched

3. **Selecting a Playlist**:
   - Click the playlist dropdown
   - Choose any playlist
   - It loads instantly in the embed player

4. **Fallback Option**:
   - Manual URL input still available below
   - Users can paste any Spotify URL if preferred

---

## 🔒 Security Features

- ✅ **HTTP-only cookies**: Tokens stored securely, not accessible via JavaScript
- ✅ **State parameter**: CSRF protection in OAuth flow
- ✅ **Token refresh**: Automatic token renewal when expired
- ✅ **Secure credentials**: Client secret never exposed to frontend

---

## 🛠️ Troubleshooting

### "Spotify credentials not configured" error
- Check that `.env.local` file exists and has correct values
- Restart your dev server after adding environment variables

### "Redirect URI mismatch" error
- Ensure the redirect URI in your `.env.local` matches exactly what's in Spotify Dashboard
- Include the protocol (`http://` or `https://`)
- No trailing slashes

### "Invalid client" error
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces or quotes

### Playlists not loading
- Check browser console for errors
- Verify you're logged into Spotify in the same browser
- Try refreshing the token by logging out and back in

---

## 📝 API Endpoints Created

Your app now has these new endpoints:

- `GET /api/spotify/auth` - Initiates OAuth flow
- `GET /api/spotify/callback` - Handles OAuth callback
- `GET /api/spotify/status` - Check authentication status
- `GET /api/spotify/playlists` - Fetch user's playlists
- `POST /api/spotify/refresh` - Refresh access token
- `POST /api/spotify/logout` - Clear Spotify session

---

## 🎉 You're Done!

Your users can now:
- Connect their Spotify account with one click
- Browse their personal playlists
- Play full playlists during focus sessions
- Enjoy seamless music integration

**No ongoing costs** - Spotify API is completely free! 🚀

---

## 📚 Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Spotify Dashboard](https://developer.spotify.com/dashboard)

---

**Need help?** Check the troubleshooting section or review the Spotify Developer documentation.
