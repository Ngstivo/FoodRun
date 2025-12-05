# FoodRun - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create project (free tier)
2. Wait ~2 minutes for provisioning

### Step 3: Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` (all tables, functions, RLS)
3. Run `supabase/delivery_requests.sql` (dispatch table)

### Step 4: Create Storage Bucket

1. Go to Storage → Create bucket
2. Name: `documents`
3. Public: Yes (or configure RLS)

### Step 5: Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

P24_MERCHANT_ID=test
P24_POS_ID=test
P24_API_KEY=test
P24_CRC_KEY=test

NEXT_PUBLIC_OPENROUTE_API_KEY=get-from-openrouteservice.org

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 👥 Create Test Users

### Admin User

1. Supabase Dashboard → Authentication → Add user
2. Email: `admin@foodrun.pl`, Password: `Admin@123`
3. Copy UUID
4. SQL Editor:
```sql
INSERT INTO profiles (id, user_type, full_name, phone)
VALUES ('UUID-HERE', 'admin', 'Admin', '+48123456789');
```

### Test Restaurant

1. Signup at http://localhost:3000 → "Restauracja"
2. Email: `restaurant@test.pl`, Password: `Test@123`
3. Complete onboarding:
   - NIP: `5252534380` (valid)
   - IBAN: `PL27114020040000300201355387`
4. Approve as admin:
```sql
UPDATE restaurants SET status = 'verified' 
WHERE business_name = 'Pizza Master';
```

### Test Driver

1. Signup → "Kierowca"
2. Email: `driver@test.pl`, Password: `Test@123`
3. Complete onboarding:
   - PESEL: `44051401359` (valid)
   - Upload test images
4. Approve as admin:
```sql
UPDATE drivers SET status = 'verified'
WHERE pesel = '44051401359';
```

---

## ✅ Test the Dispatch System

### 1. Restaurant Creates Request

1. Login as restaurant
2. Dashboard → "Zamów kierowcę"
3. Enter delivery address
4. Click "Oblicz koszt" → See cost breakdown
5. Submit request

### 2. Driver Accepts

1. Login as driver
2. Toggle "Dostępny"
3. See request appear (real-time!)
4. Click "Przyjmij zlecenie"
5. Mark "Odebrano" → "Dostarczone"

### 3. Verify in Database

```sql
SELECT * FROM delivery_requests ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 What's Different?

### This is NOT Uber Eats

**Customers do NOT order through FoodRun.**

FoodRun is for restaurants to **dispatch drivers** for deliveries from:
- Uber Eats orders
- Glovo orders
- Restaurant website orders
- Phone orders

### Payment Flow

**Customer → Restaurant** (external, not via FoodRun)  
**Restaurant → FoodRun** (driver fee + commission)  
**FoodRun → Driver** (automated payout)

---

## 📁 Key Files Created

**Dispatch System:**
- `supabase/delivery_requests.sql` - Main dispatch table
- `app/restaurant/request-driver/page.tsx` - Request form
- `app/driver/dashboard/page.tsx` - Driver interface

**Authentication:**
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/auth/onboarding/restaurant/page.tsx`
- `app/auth/onboarding/driver/page.tsx`

**Core:**
- `supabase/schema.sql` - Complete database
- `lib/supabase/client.ts` - Supabase setup
- `types/database.types.ts` - TypeScript definitions

---

## 🔧 Troubleshooting

**"Module not found"**
```bash
npm install --legacy-peer-deps
```

**Login doesn't work**
- Check user exists in Supabase Auth
- Verify profile exists in `profiles` table
- Check user_type matches login type

**No pending requests showing**
- Verify driver is "Dostępny" (Available)
- Check delivery_requests table has `status = 'pending'`
- Check browser console for Realtime errors

**Documents won't upload**
- Verify Storage bucket `documents` exists
- Check bucket is public or has RLS policies

---

## 📚 Documentation

- **README.md** - Full setup & deployment guide
- **ARCHITECTURE.md** - Dispatch model explanation
- **walkthrough.md** - Complete feature walkthrough
- **SETUP.md** - This quick start guide

---

## 🚀 Deploy to Production

```bash
# Push to GitHub
git init
git add .
git commit -m "FoodRun dispatch platform"
git push

# Deploy on Vercel
# 1. Import repo at vercel.com
# 2. Add environment variables
# 3. Deploy!
```

---

**You're all set! Start testing the dispatch system! 🎉**

**Remember:** This is a **restaurant-to driver dispatch** platform, not a customer ordering platform.
