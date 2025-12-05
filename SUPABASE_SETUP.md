# Supabase Setup from Your Repo

## Quick Setup (No CLI Needed)

Since you have the schema files in your repo, here's the easiest way to set up Supabase:

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Fill in:
   - Name: `FoodRun`
   - Database Password: **Generate and save it**
   - Region: Europe (Frankfurt recommended for Poland)
   - Plan: Free
5. Click "Create new project"
6. Wait ~2 minutes

### Step 2: Run Schema Files

Once your project is ready:

1. **Click "SQL Editor"** in the left sidebar

2. **Run Main Schema:**
   - Click "New Query"
   - Open `supabase/schema.sql` from your project folder
   - Copy ALL content (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait for "Success. No rows returned"

3. **Run Delivery Requests Table:**
   - Click "New Query" again
   - Open `supabase/delivery_requests.sql`
   - Copy ALL content
   - Paste and Run
   - Verify success

### Step 3: Create Storage Bucket

1. Click "Storage" in left sidebar
2. Click "Create a new bucket"
3. Name: `documents`
4. Public bucket: ✓ Yes
5. Click "Create bucket"

### Step 4: Get Your Credentials

1. Go to Project Settings (gear icon) → API
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGci...
service_role: eyJhbGci...
```

### Step 5: Update Your .env.local

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

NEXT_PUBLIC_OPENROUTE_API_KEY=your-key-from-openrouteservice.org

P24_MERCHANT_ID=test
P24_POS_ID=test
P24_API_KEY=test
P24_CRC_KEY=test

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Verify Tables

1. Click "Table Editor"
2. You should see all tables:
   - profiles
   - restaurants
   - drivers
   - driver_documents
   - delivery_requests
   - menu_items
   - restaurant_categories
   - orders
   - order_items
   - payouts

### Step 7: Create Admin User

1. Go to Authentication → Users
2. Click "Add user"
3. Email: `admin@foodrun.pl`
4. Password: (your choice)
5. Auto Confirm: ✓ Yes
6. Click "Create user"
7. Copy the UUID
8. Go to SQL Editor and run:

```sql
INSERT INTO profiles (id, user_type, full_name, phone)
VALUES ('PASTE-UUID-HERE', 'admin', 'Administrator', '+48123456789');
```

### Step 8: Test Locally

```bash
npm run dev
```

Go to http://localhost:3000 and test login with your admin credentials.

---

## ✅ You're Done!

Your Supabase is now set up from your repo schema files.

**Next:** Deploy to Vercel (see QUICK_DEPLOY.md)

---

## Alternative: Using Supabase CLI (Advanced)

If you want to use CLI for version control:

### Install Supabase CLI

```bash
# Windows (with Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or with npm
npm install -g supabase
```

### Initialize and Link

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

But for now, the web dashboard method above is simpler and works perfectly!
