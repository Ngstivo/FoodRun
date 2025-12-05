# FoodRun - Local Testing Guide

## ✅ Server Running!

Your FoodRun platform is running at: **http://localhost:3001**

---

## 🧪 Testing Checklist

### Before Testing

**IMPORTANT:** Make sure you've run the database schema in Supabase:

1. Go to https://ajwxgejohxmygkeotbqx.supabase.co
2. Click "SQL Editor" → "New Query"
3. Copy and run `supabase/schema.sql`
4. Copy and run `supabase/delivery_requests.sql`
5. Create storage bucket: `documents` (public)

---

### Test 1: Homepage ✓

- [ ] Visit http://localhost:3001
- [ ] Should see FoodRun homepage
- [ ] Should see options for "Restauracja", "Kierowca", "Admin"

---

### Test 2: Create Admin User

**In Supabase Dashboard:**

1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Email: `admin@foodrun.pl`
4. Password: `Admin@123` (or your choice)
5. Auto Confirm User: ✓ Yes
6. Click "Create user"
7. **Copy the UUID**

**In SQL Editor:**

```sql
INSERT INTO profiles (id, user_type, full_name, phone)
VALUES ('PASTE-UUID-HERE', 'admin', 'Administrator', '+48123456789');
```

---

### Test 3: Admin Login ✓

- [ ] Click "Admin" on homepage
- [ ] Click "Zaloguj się" (Login)
- [ ] Email: `admin@foodrun.pl`
- [ ] Password: Your password
- [ ] Should see Admin Dashboard
- [ ] Should show: 0 pending restaurants, 0 pending drivers

---

### Test 4: Restaurant Signup ✓

1. **Signup:**
   - [ ] Go to homepage → "Restauracja" → "Zarejestruj się"
   - [ ] Email: `test@restaurant.pl`
   - [ ] Password: `Test@123`
   - [ ] Full name: `Test Restaurant`
   - [ ] Phone: `+48123456789`
   - [ ] Click "Zarejestruj się"

2. **Onboarding:**
   - [ ] Business name: `Pizza Master`
   - [ ] NIP: `5252534380` (valid test NIP)
   - [ ] IBAN: `PL27114020040000300201355387`
   - [ ] Address: `ul. Marszałkowska 100, Warszawa`
   - [ ] Contact person: `Jan Kowalski`
   - [ ] Phone: `+48123456789`
   - [ ] Submit

3. **Verify Status:**
   - [ ] Should redirect to "Pending Verification" page
   - [ ] Should see "Your application is being reviewed"

---

### Test 5: Verify Restaurant (as Admin) ✓

1. **Login as Admin**
2. **Dashboard should show:** 1 pending restaurant
3. **Click:** "Weryfikuj Restauracje"
4. **You should see:** Pizza Master application
5. **Check:** NIP, IBAN, Address
6. **Click:** "Zatwierdź" (Approve)
7. **Success!** Restaurant verified

---

### Test 6: Restaurant Dashboard ✓

1. **Logout** (as admin)
2. **Login as:** `test@restaurant.pl` / `Test@123`
3. **Should see:** Restaurant Dashboard
4. **Check displays:**
   - [ ] Statistics (0 orders initially)
   - [ ] Commission info (4 PLN standard)
   - [ ] "Zamów kierowcę" button

---

### Test 7: Request Driver ✓

1. **Click:** "Zamów kierowcę"
2. **Form should show:**
   - [ ] Pickup address (auto-filled: Pizza Master)
   - [ ] Delivery address input
   - [ ] Map placeholder

3. **Enter delivery address:**
   - Type: `ul. Nowy Świat 30, Warszawa`
   - Click: "Oblicz koszt dostawy"

4. **Should see:**
   - [ ] Distance calculated (e.g., 2.5 km)
   - [ ] Delivery fee (e.g., 16.00 PLN)
   - [ ] Commission (4.00 PLN)
   - [ ] Total cost (e.g., 20.00 PLN)
   - [ ] Map showing route (green marker = pickup, red = delivery)

5. **Fill optional fields:**
   - Order reference: `Test Order #001`
   - Customer name: `Anna Nowak`
   - Instructions: `Ring doorbell`

6. **Click:** "Zamów kierowcę"

7. **Should redirect to:** Delivery tracking page
8. **Should see:**
   - [ ] Status: "Oczekuje na kierowcę"
   - [ ] Pickup/Delivery addresses
   - [ ] Map with markers

---

### Test 8: Create Driver ✓

1. **Logout**
2. **Homepage → "Kierowca" → "Zarejestruj się"**
3. **Signup:**
   - Email: `test@driver.pl`
   - Password: `Test@123`
   - Name: `Piotr Nowak`
   - Phone: `+48987654321`

4. **Onboarding Step 1:**
   - PESEL: `44051401359` (valid test)
   - Vehicle type: `Samochód osobowy`
   - Vehicle plate: `WA12345`
   - IBAN: `PL61109010140000071219812874`

5. **Onboarding Step 2:**
   - Upload ID card image (any image file)
   - Upload driver's license (any image file)
   - Submit

6. **Should see:** Pending verification page

---

### Test 9: Verify Driver (as Admin) ✓

1. **Login as admin**
2. **Dashboard:** 1 pending driver
3. **Click:** "Weryfikuj Kierowców"
4. **Check:** PESEL, vehicle, documents
5. **Click:** "Zatwierdź"

---

### Test 10: Driver Dashboard ✓

1. **Logout**
2. **Login as:** `test@driver.pl`
3. **Should see:**
   - [ ] Availability toggle (Niedostępny)
   - [ ] Pending requests section
   - [ ] Should see the delivery request from restaurant

4. **Toggle availability to:** "Dostępny"
5. **Click:** "Przyjmij zlecenie" on the request
6. **Should see:**
   - [ ] Request moves to "Active Delivery"
   - [ ] Shows pickup address, delivery address
   - [ ] Earnings displayed

7. **Mark status:**
   - [ ] Click "Odebrano z restauracji"
   - [ ] Status changes to "picked_up"
   - [ ] Click "Dostarczone"
   - [ ] Status changes to "delivered"

---

### Test 11: Track Delivery (as Restaurant) ✓

1. **Login as restaurant** (`test@restaurant.pl`)
2. **Go to active delivery** (if you saved the link)
3. **Should see:**
   - [ ] Status updates in real-time
   - [ ] Driver info (name, phone)
   - [ ] Map with driver marker (if driver location available)

---

## 🐛 Common Issues

### "Can't connect to Supabase"
- Check `.env.local` has correct credentials
- Verify Supabase project is active
- Check schema.sql was run

### "Address not found" when geocoding
- Check OpenRouteService API key is valid
- Try a well-known address: `ul. Marszałkowska 1, Warszawa`
- Free tier limit: 2,000 requests/day

### Maps not showing
- Check browser console for errors
- Verify OpenRouteService API key
- Make sure address was geocoded successfully

### "PESEL/NIP invalid"
- Use test values:
  - NIP: `5252534380`
  - PESEL: `44051401359`

### Server not starting
- Kill any process on port 3000/3001
- Run `npm install --legacy-peer-deps` again
- Check for errors in terminal

---

## ✅ All Tests Pass?

If all tests work, your platform is ready for Vercel deployment!

**Next:** Deploy to Vercel (see QUICK_DEPLOY.md)

---

## 🎯 What You've Tested

- ✅ Authentication (admin, restaurant, driver)
- ✅ Onboarding flows
- ✅ Admin verification
- ✅ Driver dispatch request
- ✅ Real geocoding & distance calculation
- ✅ Maps visualization
- ✅ Driver acceptance flow
- ✅ Real-time status updates
- ✅ Database with RLS security

**Your FoodRun platform is working! 🚀**
