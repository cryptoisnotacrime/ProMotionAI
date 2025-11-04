# Netlify Environment Variables Setup

## Critical: These MUST be set in Netlify for the app to work!

The error "Supabase configuration missing" means these environment variables are not set in your Netlify deployment.

## How to Set Environment Variables in Netlify

1. Log in to https://app.netlify.com
2. Select your site: **aesthetic-cucurucho-6aab1c**
3. Go to **Site settings** (in the top navigation)
4. Click **Environment variables** in the left sidebar
5. Click **Add a variable** button

## Required Variables

### Variable 1: VITE_SUPABASE_URL

**Key:** (type exactly)
```
VITE_SUPABASE_URL
```

**Value:** (copy exactly)
```
https://zbiuevrxbupsvmpfuqpq.supabase.co
```

**Scopes:** Select "All" or "All deploys"

---

### Variable 2: VITE_SUPABASE_ANON_KEY

**Key:** (type exactly)
```
VITE_SUPABASE_ANON_KEY
```

**Value:** (Get from Supabase - see below)

To get this value:
1. Go to https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/settings/api
2. Look for "Project API keys" section
3. Find the key labeled **"anon public"**
4. Click the copy icon next to it
5. Paste the full key into Netlify (it will be very long, starting with `eyJhbGci...`)

**Scopes:** Select "All" or "All deploys"

---

## After Adding Variables

**IMPORTANT:** After adding or changing environment variables, you MUST redeploy!

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** button
3. Select **Deploy site**
4. Wait for the deployment to complete (usually 1-2 minutes)

## Verify Variables Are Set

After redeploying, you can verify the variables are loaded:

1. Open your Netlify site in a browser
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Type and run:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```

You should see: `https://zbiuevrxbupsvmpfuqpq.supabase.co`

If you see `undefined`, the variables are not set correctly or you haven't redeployed.

## Screenshot Guide

### Step 1: Navigate to Environment Variables
```
Netlify Dashboard → Your Site → Site settings → Environment variables
```

### Step 2: Add Variable Button
Click the green "Add a variable" button

### Step 3: Fill in Variable Details
- **Key**: VITE_SUPABASE_URL
- **Values**: Click "Add value", select "Same value for all deploy contexts"
- **Value**: https://zbiuevrxbupsvmpfuqpq.supabase.co
- Click "Create variable"

### Step 4: Repeat for Second Variable
- **Key**: VITE_SUPABASE_ANON_KEY
- **Values**: Click "Add value", select "Same value for all deploy contexts"
- **Value**: [Your Supabase anon key]
- Click "Create variable"

### Step 5: Redeploy
Go to Deploys → Trigger deploy → Deploy site

## Troubleshooting

### Still getting "Supabase configuration missing"?

1. **Check variable names are exact** (case-sensitive):
   - Must be `VITE_SUPABASE_URL` not `VITE_SUPABASE_url`
   - Must be `VITE_SUPABASE_ANON_KEY` not `VITE_SUPABASE_ANON_key`

2. **Check you've redeployed**:
   - Environment variables only take effect after a new deployment
   - Go to Deploys tab and check the latest deploy time
   - It should be AFTER you added the variables

3. **Check the values are correct**:
   - URL should start with `https://`
   - Anon key should start with `eyJhbGci`
   - No extra spaces or quotes

4. **Check deploy logs**:
   - Go to Deploys → Click latest deploy → View details
   - Look for any build errors
   - Environment variables should be available during build

### Need the Supabase Anon Key?

If you don't have access to the Supabase dashboard, the anon key for this project is:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaXVldnJ4YnVwc3ZtcGZ1cXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTUyMjYsImV4cCI6MjA3NzIzMTIyNn0.syP3ue-8MbHuGTdYc-mP5R6vLASu9hHCObF6IwzCTtA
```

**Note:** This is the public anon key - it's safe to use in your frontend code.

## Complete Checklist

- [ ] Logged into Netlify dashboard
- [ ] Navigated to Site settings → Environment variables
- [ ] Added VITE_SUPABASE_URL with correct value
- [ ] Added VITE_SUPABASE_ANON_KEY with correct value
- [ ] Both variables are set to "All deploys" scope
- [ ] Triggered a new deployment
- [ ] Waited for deployment to complete
- [ ] Opened site and checked browser console
- [ ] Verified variables load correctly

Once all steps are complete, your app should load without the "Supabase configuration missing" error!
