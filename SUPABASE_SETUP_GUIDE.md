# 🔧 Supabase Setup & Troubleshooting Guide

## ❌ Console Errors You're Seeing

Based on your screenshot, you have these errors:
1. **"Failed to load transport: the server reconnected with a status of 400"**
2. **"User not authenticated, settings not saved (401)"**
3. **Multiple variable definition warnings**

---

## 🎯 Root Cause Analysis

### **Primary Issue: Supabase Configuration**
The transport error (400 status) indicates your Supabase environment variables are either:
- ❌ Not configured (missing `.env.local` file)
- ❌ Using placeholder values
- ❌ Using incorrect/invalid credentials

### **Secondary Issue: Authentication**
The 401 error is **EXPECTED** if you're not logged in. This is normal behavior and won't break the app - it just means settings won't persist to the database.

---

## ✅ Step-by-Step Fix

### **Step 1: Check Your Environment File**

1. **Look for `.env.local` in your project root:**
   ```
   d:\PomodroTimer\.env.local
   ```

2. **If it doesn't exist, create it:**
   - Copy `.env.example` to `.env.local`
   - Or create a new file named `.env.local`

### **Step 2: Get Your Supabase Credentials**

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project (or create one if you haven't)

2. **Navigate to Project Settings:**
   - Click on the **Settings** icon (gear icon)
   - Go to **API** section

3. **Copy these values:**
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 3: Update Your `.env.local` File**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**⚠️ IMPORTANT:**
- Replace the placeholder values with YOUR actual credentials
- Do NOT use quotes around the values
- Do NOT commit `.env.local` to git (it's already in `.gitignore`)

### **Step 4: Verify Database Schema**

Run the SQL scripts in your Supabase SQL Editor:

1. **Main Schema:**
   ```sql
   -- Run: d:\PomodroTimer\supabase-schema.sql
   ```

2. **Daily Stats Schema:**
   ```sql
   -- Run: d:\PomodroTimer\supabase-schema-daily-stats.sql
   ```

3. **Report Queries:**
   ```sql
   -- Run: d:\PomodroTimer\supabase-report-queries.sql
   ```

4. **RLS Policies:**
   ```sql
   -- Run: d:\PomodroTimer\fix-rls-policies.sql
   ```

### **Step 5: Restart Your Dev Server**

```bash
# Stop the current server (Ctrl+C)

# Clear Next.js cache
rm -rf .next
# Or on Windows:
# rmdir /s /q .next

# Restart the dev server
npm run dev
```

### **Step 6: Hard Refresh Your Browser**

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

---

## 🧪 Verification Steps

### **1. Check Console for Success Messages**

After restarting, you should see:
```
✅ Supabase client initialized successfully
✅ Settings loaded successfully
```

Instead of:
```
❌ Failed to load transport
❌ Supabase environment variables are not configured
```

### **2. Test Authentication**

1. Navigate to: `http://localhost:3000/auth/login`
2. Sign up or log in with your credentials
3. After login, check console for:
   ```
   ✅ Settings saved successfully
   ```

### **3. Verify Database Connection**

Open browser console and run:
```javascript
// Test if Supabase is configured
fetch('/api/settings')
  .then(r => r.json())
  .then(d => console.log('Settings API:', d))
```

**Expected Response:**
```json
{
  "success": true,
  "data": { /* your settings */ }
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Failed to load transport" persists**

**Solution:**
```bash
# 1. Verify .env.local exists and has correct values
cat .env.local  # Linux/Mac
type .env.local  # Windows

# 2. Kill all node processes
taskkill /F /IM node.exe  # Windows
killall node  # Linux/Mac

# 3. Clear everything and restart
rm -rf .next node_modules/.cache
npm run dev
```

### **Issue 2: "401 Unauthorized" when saving settings**

**This is NORMAL if you're not logged in!**

**Solutions:**
- **Option A:** Log in at `/auth/login` to persist settings
- **Option B:** Use the app without login (settings work but won't persist)

The app is designed to work both ways!

### **Issue 3: "Multiple definitions" warnings**

**Cause:** Hot Module Replacement (HMR) in development

**Solution:** These are harmless warnings. To reduce them:
```bash
# Restart dev server
npm run dev
```

### **Issue 4: Database tables don't exist**

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run each SQL file in order:
   - `supabase-schema.sql`
   - `supabase-schema-daily-stats.sql`
   - `supabase-report-queries.sql`
   - `fix-rls-policies.sql`

---

## 📊 Expected Behavior After Fix

### **✅ When NOT Logged In:**
- ✅ App works normally
- ✅ Timer functions correctly
- ✅ Settings can be changed
- ⚠️ Settings don't persist (console shows 401 - this is OK!)
- ⚠️ Tasks stored in localStorage only

### **✅ When Logged In:**
- ✅ App works normally
- ✅ Timer functions correctly
- ✅ Settings persist to database
- ✅ Tasks sync to Supabase
- ✅ Stats tracked in database
- ✅ Data accessible across devices

---

## 🔍 Debug Checklist

Before asking for help, verify:

- [ ] `.env.local` file exists in project root
- [ ] Environment variables are set correctly (not placeholders)
- [ ] Supabase project is active (not paused)
- [ ] Database tables are created (run SQL scripts)
- [ ] Dev server restarted after changing `.env.local`
- [ ] Browser cache cleared (hard refresh)
- [ ] Console shows Supabase client initialized
- [ ] No "Failed to load transport" errors

---

## 🚀 Quick Fix Command

Run this in your terminal:

```bash
# Windows PowerShell
taskkill /F /IM node.exe; Remove-Item -Recurse -Force .next; npm run dev

# Linux/Mac
killall node && rm -rf .next && npm run dev
```

---

## 📞 Still Having Issues?

If you've followed all steps and still see errors:

1. **Check your console output** and share:
   - The exact error message
   - Your `.env.local` file (with credentials redacted)
   - Supabase project status

2. **Verify Supabase project:**
   - Is it active (not paused)?
   - Are the API keys correct?
   - Is the URL correct?

3. **Test Supabase directly:**
   ```javascript
   // In browser console
   fetch('https://your-project.supabase.co/rest/v1/', {
     headers: {
       'apikey': 'your-anon-key',
       'Authorization': 'Bearer your-anon-key'
     }
   }).then(r => console.log('Supabase Status:', r.status))
   ```

---

## 💡 Pro Tips

1. **Development Mode:** You can use the app without Supabase - it will use localStorage
2. **Production Mode:** Supabase is required for multi-device sync and persistence
3. **Free Tier:** Supabase free tier is sufficient for 2000+ users with current schema
4. **Security:** Never commit `.env.local` - it contains sensitive credentials

---

**Last Updated:** December 20, 2024  
**Status:** ✅ Ready for Setup
