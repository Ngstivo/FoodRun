# FoodRun - Quick Deployment Guide

## 🎯 Step-by-Step Setup (30 minutes)

Follow these steps in order to get FoodRun running in production.

---

## PART 1: Supabase Setup (15 minutes)

### Step 1: Create Supabase Project

1. **Go to** https://supabase.com
2. **Click** "Start your project" or "New Project"
3. **Sign in** with GitHub (recommended) or email
4. **Click** "New Project"
5. **Fill in:**
   - Organization: Choose or create one
   - Name: `FoodRun` (or your choice)
   - Database Password: **Generate a strong password and SAVE IT**
   - Region: Choose closest to Poland (e.g., Frankfurt, Europe)
   - Pricing Plan: **Free** (sufficient for testing)
6. **Click** "Create new project"
7. **Wait** ~2 minutes for provisioning

### Step 2: Get Supabase Credentials

1. **When project is ready**, go to **Project Settings** (gear icon on left sidebar)
2. **Click** "API" in the settings menu
3. **Copy these values** (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANT:** Keep the `service_role` key secret! Never expose it in client-side code.

### Step 3: Run Database Schema

1. **Click** "SQL Editor" in the left sidebar
2. **Click** "New Query"
3. **Open** `supabase/schema.sql` from your project folder
4. **Copy ALL content** from the file
5. **Paste** into the Supabase SQL Editor
6. **Click** "Run" (or press Ctrl+Enter)
7. **Wait** for completion - you should see "Success. No rows returned"

### Step 4: Run Delivery Requests Table

1. **Click** "New Query" again
2. **Open** `supabase/delivery_requests.sql`
3. **Copy ALL content**
4. **Paste** into SQL Editor
5. **Click** "Run"
6. **Verify** success

### Step 5: Create Storage Bucket

1. **Click** "Storage" in the left sidebar
2. **Click** "Create a new bucket"
3. **Fill in:**
   - Name: `documents`
   - Public bucket: **Yes** ✓
4. **Click** "Create bucket"

### Step 6: Verify Tables Created

1. **Click** "Table Editor" in the left sidebar
2. **You should see these tables:**
   - profiles
   - restaurants
   - drivers
   - driver_documents
   - delivery_requests
   - restaurant_categories
   - menu_items
   - orders
   - order_items
   - payouts

✅ **Supabase setup complete!**

---

## PART 2: Get OpenRouteService API Key (5 minutes)

FoodRun uses OpenRouteService for geocoding and distance calculation.

1. **Go to** https://openrouteservice.org/dev/#/signup
2. **Sign up** for a free account
3. **Verify** your email
4. **Login** and go to Dashboard
5. **Click** "Request a Token"
6. **Name it:** FoodRun
7. **Copy** the API key (starts with `5b3ce3...`)

Free tier: **2,000 requests per day** (sufficient for testing)

---

## PART 3: Vercel Deployment (10 minutes)

### Step 1: Connect GitHub to Vercel

1. **Go to** https://vercel.com
2. **Click** "Sign Up" or "Login"
3. **Sign in with GitHub**
4. **Authorize** Vercel

### Step 2: Import Repository

1. **Click** "Add New..." → "Project"
2. **Find** your `FoodRun` repository
3. **Click** "Import"

### Step 3: Configure Project

1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `./` (leave as default)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install --legacy-peer-deps`

⚠️ **IMPORTANT:** Change "Install Command" to:
```
npm install --legacy-peer-deps
```

### Step 4: Add Environment Variables

**Click** "Environment Variables" and add these:

```env
# Supabase (paste your values from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouteService (paste your API key)
NEXT_PUBLIC_OPENROUTE_API_KEY=5b3ce3...

# Przelewy24 (use test values for now)
P24_MERCHANT_ID=test
P24_POS_ID=test
P24_API_KEY=test
P24_CRC_KEY=test

# App URL (leave empty for now, will update after deployment)
NEXT_PUBLIC_APP_URL=
```

**Important:** Add each variable one by one:
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Your Supabase URL
- Click "Add"
- Repeat for all variables

### Step 5: Deploy!

1. **Click** "Deploy"
2. **Wait** 2-5 minutes for build
3. **Watch** the build logs

If build succeeds, you'll see: ✅ "Deployment Ready"

### Step 6: Update App URL

1. **Copy** your Vercel deployment URL (e.g., `foodrun.vercel.app`)
2. **Go to** Vercel Project Settings → Environment Variables
3. **Edit** `NEXT_PUBLIC_APP_URL`
4. **Set value to:** `https://foodrun.vercel.app` (your actual URL)
5. **Save**
6. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy)

### Step 7: Update Supabase Auth URLs

1. **Go to** Supabase Project Settings → Authentication
2. **Site URL:** `https://foodrun.vercel.app` (your Vercel URL)
3. **Redirect URLs:** Add `https://foodrun.vercel.app/**`
4. **Save**

✅ **Deployment complete!**

---

## PART 4: Create Admin User

1. **Go to** Supabase → Authentication → Users
2. **Click** "Add user" → "Create new user"
3. **Email:** `admin@foodrun.pl`
4. **Password:** Create a strong password
5. **Auto Confirm User:** ✓ Yes
6. **Click** "Create user"
7. **Copy** the UUID from the user list
8. **Go to** SQL Editor
9. **Run this query** (replace UUID):

```sql
INSERT INTO profiles (id, user_type, full_name, phone)
VALUES ('PASTE-UUID-HERE', 'admin', 'Administrator', '+48123456789');
```

---

## PART 5: Test Your Deployment! 🎉

1. **Visit** your Vercel URL (e.g., https://foodrun.vercel.app)
2. **You should see** the FoodRun homepage
3. **Test admin login:**
   - Go to homepage
   - Click "Restauracja" or any user type
   - Click "Zaloguj się"
   - Login with: `admin@foodrun.pl` and your password
   - **You should see** the admin dashboard

### Create Test Restaurant

1. **On homepage**, click "Restauracja" → "Zarejestruj się"
2. **Fill in:**
   - Email: `test@restaurant.pl`
   - Password: `Test@123`
   - Name, phone
3. **Complete onboarding:**
   - NIP: `5252534380` (valid test)
   - IBAN: `PL27114020040000300201355387`
   - Address: Any Polish address
4. **Submit**
5. **As admin**, verify the restaurant:
   - Go to Admin Panel → Verify Restaurants
   - Click "Zatwierdź" (Approve)

### Test Driver Dispatch

1. **Login as restaurant** (`test@restaurant.pl`)
2. **Click** "Zamów kierowcę"
3. **Enter delivery address** (any Polish address)
4. **Click** "Oblicz koszt"
5. **You should see:**
   - Distance calculated
   - Cost breakdown
   - Map showing route
6. **Click** "Zamów kierowcę"
7. **Success!** You've created a delivery request

---

## 🐛 Troubleshooting

### Build fails on Vercel
- Check that install command is: `npm install --legacy-peer-deps`
- Verify all environment variables are set
- Check build logs for specific errors

### Can't login
- Verify Supabase URL and keys are correct
- Check that user exists in Supabase Auth
- Check that profile exists in `profiles` table

### Maps not loading
- Verify `NEXT_PUBLIC_OPENROUTE_API_KEY` is set
- Check OpenRouteService API key is valid
- Check browser console for errors

### "Address not found" when geocoding
- OpenRouteService may have temporary issues
- Try a different, well-known Polish address
- Check API key quota (2,000/day limit)

---

## 📊 What's Working Now

After setup, you have:
- ✅ Admin panel to verify restaurants and drivers
- ✅ Restaurant signup and onboarding
- ✅ Driver signup and onboarding
- ✅ Restaurant can request drivers
- ✅ Real distance calculation
- ✅ Maps showing routes
- ✅ Real-time notifications

## ❌ What's Still Missing

- Payment integration (Przelewy24)
- Email notifications
- Terms of Service / Privacy Policy

See `PRODUCTION_READINESS.md` for details.

---

## 🎯 Next Steps

1. **Test the platform** thoroughly
2. **Create test drivers** and verify them
3. **Test full dispatch flow**
4. **When ready for payments**, implement Przelewy24 (see docs)
5. **Add your own domain** in Vercel settings

---

**Need help?** Check:
- `README.md` - Complete documentation
- `SETUP.md` - Quick setup guide
- `DEPLOYMENT.md` - Detailed deployment guide
- `ARCHITECTURE.md` - Platform architecture
- `PRODUCTION_READINESS.md` - What's left to build

**Enjoy your FoodRun platform! 🚀**
