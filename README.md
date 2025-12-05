# FoodRun - Complete Documentation

## 🚀 Setup Guide

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- Supabase account (free tier)
- OpenRouteService API key (free tier)
- Przelewy24 sandbox account (for testing)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FoodRun
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your credentials
   - Run the schema SQL:
     - Go to SQL Editor in Supabase Dashboard
     - Copy contents from `supabase/schema.sql`
     - Execute the SQL
   - Set up Storage bucket named "documents" for driver document uploads
   - Enable Storage public access for the bucket (or configure policies)

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   EditNIS\.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Przelewy24 Sandbox
   P24_MERCHANT_ID=your-test-merchant-id
   P24_POS_ID=your-test-pos-id
   P24_API_KEY=your-test-api-key
   P24_CRC_KEY=your-test-crc-key
   
   # OpenRouteService
   NEXT_PUBLIC_OPENROUTE_API_KEY=your-openroute-key
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Get free API keys**
   - **OpenRouteService**: Sign up at [openrouteservice.org](https://openrouteservice.org/dev/#/signup)
     - Free tier: 2,000 requests/day
   - **Przelewy24 Sandbox**: Contact P24 for test credentials

6. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

### Creating Test Users

1. **Create Admin User**
   - In Supabase Dashboard > Authentication > Users
   - Click "Add user" > "Create new user"
   - Email: `admin@foodrun.pl`, Password: `Admin@123`
   - Copy the UUID
   - Go to SQL Editor and run:
     ```sql
     INSERT INTO profiles (id, user_type, full_name, phone)
     VALUES ('PASTE-UUID-HERE', 'admin', 'Admin FoodRun', '+48123456789');
     ```

2. **Create Test Data**
   - Optionally run `supabase/seed.sql` for sample restaurants and menu items
   - Remember to replace UUIDs with actual user IDs

---

## 📊 Database Schema

### Tables Overview

- **profiles** - User profiles linked to auth.users
- **restaurants** - Restaurant partner information with commission settings
- **drivers** - Driver partner information
- **driver_documents** - Uploaded verification documents
- **restaurant_categories** - Menu categories
- **menu_items** - Restaurant menu items
- **orders** - Customer orders
- **order_items** - Items in each order
- **payouts** - Payment records for restaurants and drivers

### Commission Model

FoodRun uses a **fixed fee commission structure**:
- **Standard restaurants**: 4 PLN per delivery
- **High-volume restaurants**: 3 PLN per delivery (discounted)

Admins can toggle the `is_high_volume` flag to apply discounts.

### Key Functions

- `calculate_delivery_fee(distance_km)` - Returns delivery fee (16 PLN base + 1 PLN/km after 3km)
- `calculate_commission(restaurant_id)` - Returns commission amount (4 or 3 PLN)
- `generate_order_number()` - Generates unique order numbers (FR-YYYYMMDD-XXXX)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod (validation)
- Leaflet + OpenStreetMap (maps)

**Backend:**
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- OpenRouteService API (distance calculation)
- Przelewy24 (payments)

**Hosting:**
- Vercel (frontend)
- Supabase (database, storage)

### Directory Structure

```
foodrun/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (customer)/      # Customer dashboard
│   ├── (restaurant)/    # Restaurant dashboard
│   ├── (driver)/        # Driver dashboard
│   ├── (admin)/         # Admin panel
│   └── api/             # API routes
├── components/          # Reusable components
├── lib/                 # Utilities and configurations
│   ├── supabase/        # Supabase clients
│   └── przelewy24/      # Payment integration
├── types/               # TypeScript definitions
└── supabase/            # Database migrations
```

---

## 🔐 Authentication Flow

### User Types

1. **Customer** - Browse, order, track deliveries
2. **Restaurant Partner** - Manage menu, receive orders, view earnings
3. **Driver Partner** - Accept deliveries, update locations, view earnings
4. **Admin** - Verify partners, manage platform

### Signup & Onboarding

**Customer:**
1. Signup → Profile created → Dashboard access

**Restaurant:**
1. Signup → Profile created
2. Onboarding form (NIP, IBAN, address)
3. Status: `pending_verification`
4. Admin verification → Status: `verified`
5. Dashboard access

**Driver:**
1. Signup → Profile created
2. Onboarding Step 1: PESEL, vehicle, IBAN
3. Onboarding Step 2: Document uploads (ID, license)
4. Status: `pending_verification`
5. Admin verification → Status: `verified`
6. Dashboard access

---

## 💳 Payment Integration

### Przelewy24 Flow

1. **Order Creation**
   - Customer completes checkout
   - Order created with `status: 'pending_payment'`
   - P24 transaction registered
   - Customer redirected to P24 payment page

2. **Payment Verification**
   - P24 sends webhook to `/api/payment/verify`
   - Signature verified
   - Order updated: `payment_status: 'completed'`, `status: 'paid'`

3. **Automated Payouts**
   - After delivery completion
   - Restaurant payout: `subtotal - commission (4 or 3 PLN)`
   - Driver payout: `16 + (distance > 3 ? (distance - 3) : 0) PLN`
   - P24 mass payout API called
   - Records created in `payouts` table

---

## 🗺️ Maps & Distance Calculation

Using OpenRouteService (free tier):
- Geocoding addresses
- Calculating route distances
- Route optimization for drivers

Using Leaflet + OpenStreetMap:
- Interactive maps
- Real-time driver tracking
- Restaurant/delivery location display

---

## 🚀 Deployment Guide

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (copy from `.env.local`)
   - Deploy

3. **Update Environment Variables**
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
   - Update Przelewy24 webhook URL in P24 dashboard

### Supabase Production Setup

1. **Database**
   - Already configured during setup
   - Enable daily backups
   - Set up network restrictions (optional)

2. **Storage**
   - Configure CORS for your domain
   - Set up lifecycle policies for old files

3. **Auth**
   - Configure email templates
   - Set up magic links (optional)
   - Configure OAuth providers (optional)

---

## 📱 User Manuals

### For Restaurant Partners

**Getting Started:**
1. Sign up at foodrun.pl
2. Complete registration form (NIP, IBAN required)
3. Wait for verification (1-2 business days)
4. Login and set up your menu

**Managing Menu:**
- Go to Menu section
- Create categories (Pizza, Pasta, Drinks, etc.)
- Add items with name, description, price, image
- Toggle item availability

**Handling Orders:**
1. New orders appear in real-time
2. Click "Confirm" to accept
3. Mark as "Preparing" when cooking
4. Mark as "Ready for Pickup" when done
5. Driver will collect the order

**Viewing Earnings:**
- Dashboard shows total earnings
- Commission: 4 PLN per delivery (or 3 PLN for high-volume)
- Payouts: Automatic after delivery completion
- Payment arrives within 24-48 hours

### For Driver Partners

**Getting Started:**
1. Sign up and complete verification
2. Upload PESEL, driver's license, ID
3. Wait for verification (up to 48 hours)
4. Login and toggle "Available"

**Accepting Deliveries:**
1. Orders appear when available
2. View pickup and delivery locations
3. Accept order
4. Navigate to restaurant
5. Mark "Picked Up"
6. Navigate to customer
7. Mark "Delivered"

**Earnings:**
- Base: 16 PLN (up to 3km)
- Additional: 1 PLN per km after 3km
- Payouts: Automatic after delivery
- Payment arrives within 24-48 hours

### For Administrators

**Restaurant Verification:**
1. Go to Admin Panel > Verify Restaurants
2. Review business details, NIP
3. Approve or reject

**Driver Verification:**
1. Go to Admin Panel > Verify Drivers
2. Review uploaded documents
3. Check PESEL validity
4. Approve or reject

**Commission Management:**
1. Go to Commission Management
2. Toggle restaurants as "High Volume"
3. High-volume partners get 3 PLN commission instead of 4 PLN

**Analytics:**
- View total orders, revenue, commission earned
- Monitor platform performance
- Handle disputes

---

## 🧪 Testing

### Test Scenarios

1. **Customer Order Flow**
   - Browse restaurants
   - Add items to cart
   - Complete checkout
   - Test payment (use P24 sandbox)
   - Track delivery

2. **Restaurant Flow**
   - Register restaurant
   - Wait for admin verification
   - Create menu items
   - Receive and manage orders

3. **Driver Flow**
   - Register driver
   - Upload documents
   - Wait for verification
   - Accept delivery
   - Update status

4. **Commission Tests**
   - Regular restaurant: Verify 4 PLN commission
   - Toggle high-volume: Verify 3 PLN commission
   - Check payout calculations

---

## 🛡️ Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins have elevated permissions
- P24 webhook signatures verified
- HTTPS only in production
- Environment variables secured

---

## 📞 Support

For issues or questions:
- Email: support@foodrun.pl
- Documentation: [foodrun.pl/docs](https://foodrun.pl/docs)
- GitHub Issues: [github.com/yourrepo/issues](https://github.com/yourrepo/issues)

---

## 📄 License

Proprietary - All rights reserved

© 2024 FoodRun
