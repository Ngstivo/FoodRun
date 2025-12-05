# FoodRun - Platform Architecture

## 🎯 Platform Model

### What FoodRun IS:
**A driver dispatch and logistics platform for restaurants**

- Restaurants receive orders through **external channels** (Uber Eats, Glovo, their own website, phone orders, etc.)
- Restaurants use FoodRun to **request available drivers** for deliveries
- Drivers accept requests and complete deliveries
- Platform handles automated driver payments and restaurant billing

### What FoodRun is NOT:
- ❌ NOT a customer-facing ordering platform
- ❌ NOT competing with Uber Eats/Glovo for customer orders
- ❌ NO customer signup, browsing, or ordering features

---

## 👥 User Types

### 1. Restaurant Partner
**Purpose:** Dispatch drivers for deliveries from external orders

**Workflow:**
1. Customer orders from restaurant (via Uber Eats, website, phone, etc.)
2. Restaurant logs into FoodRun
3. Creates delivery request:
   - Order details (optional, for driver reference)
   - Pickup address (restaurant location)
   - Delivery address
   - Special instructions
4. Views available drivers
5. System calculates delivery fee (16 PLN + distance)
6. Requests driver
7. Tracks driver in real-time
8. Confirms delivery completion
9. Gets billed: Driver fee + Platform commission

**Dashboard Features:**
- Create delivery requests
- View active deliveries
- Track drivers on map
- Delivery history
- Billing and invoices
- Performance metrics

### 2. Driver Partner
**Purpose:** Accept and complete delivery requests from restaurants

**Workflow:**
1. Sets availability status (Available/Unavailable)
2. Receives delivery requests from nearby restaurants
3. Views request details (pickup, delivery, estimated earnings)
4. Accepts or rejects request
5. Navigates to restaurant (pickup)
6. Confirms pickup
7. Navigates to customer (delivery)
8. Confirms delivery
9. Receives automatic payout

**Dashboard Features:**
- Availability toggle
- Delivery request queue
- Active delivery details
- Navigation/maps
- Earnings summary
- Payout history

### 3. Admin
**Purpose:** Manage platform operations

**Features:**
- Verify restaurants (NIP, business details)
- Verify drivers (PESEL, documents)
- Set commission rates (high-volume discounts)
- View platform analytics
- Handle disputes
- Manage payouts

---

## 💰 Financial Model

### Restaurant Costs Per Delivery

```
Total Cost = Driver Fee + Platform Commission

Driver Fee = 16 PLN (base, ≤3km) + (distance - 3km) × 1 PLN
Platform Commission = 4 PLN (standard) or 3 PLN (high-volume)

Example (4.5km delivery, standard restaurant):
- Driver Fee: 16 + (4.5 - 3) × 1 = 17.50 PLN
- Platform Commission: 4.00 PLN
- Total Restaurant Cost: 21.50 PLN
```

### Payment Flow

**Customer → Restaurant** (External - not through FoodRun)
- Customer pays restaurant via their existing payment method
- Could be cash, card, Uber Eats payment, etc.
- FoodRun has NO involvement in this transaction

**Restaurant → FoodRun** (Billing)
- Restaurant is billed for each completed delivery
- Billing options:
  - Pay per delivery (immediate via P24)
  - Monthly invoice (for established partners)
  - Prepaid credit balance

**FoodRun → Driver** (Automatic Payout)
- Driver receives payout immediately after delivery completion
- Payout = Driver Fee (calculated based on distance)
- Via Przelewy24 mass payout API to driver's IBAN
- Payout typically arrives within 24-48 hours

**Platform Revenue**
- Platform keeps the commission (4 or 3 PLN per delivery)
- Revenue = Number of deliveries × Average commission

---

## 🔄 Delivery Request Flow

### 1. Restaurant Creates Request

```
POST /api/delivery/request
{
  "pickup_address": "ul. Krakowska 15, Warszawa",
  "pickup_lat": 52.229676,
  "pickup_lng": 21.012229,
  "delivery_address": "ul. Marszałkowska 100, Warszawa",
  "delivery_lat": 52.231958,
  "delivery_lng": 21.006725,
  "order_reference": "Order #12345" (optional),
  "special_instructions": "Call on arrival",
  "customer_phone": "+48123456789" (optional, for driver contact)
}
```

### 2. System Calculates Distance & Fee

```javascript
// Using OpenRouteService API
const distance = await calculateDistance(pickupCoords, deliveryCoords);
const deliveryFee = distance <= 3 ? 16 : 16 + (distance - 3);
const commission = await getRestaurantCommission(restaurantId); // 4 or 3
const totalCost = deliveryFee + commission;
```

### 3. Find Available Drivers

```sql
SELECT * FROM drivers 
WHERE status = 'verified' 
  AND is_available = TRUE
  AND ST_Distance(
    ST_Point(current_lng, current_lat),
    ST_Point(pickup_lng, pickup_lat)
  ) < 5000 -- Within 5km of pickup
ORDER BY ST_Distance(...) ASC
LIMIT 10;
```

### 4. Notify Drivers (Supabase Realtime)

```javascript
// Drivers subscribed to delivery_requests channel
supabase
  .channel('delivery_requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_requests'
  }, payload => {
    // Show notification to eligible drivers
    showDeliveryRequest(payload.new);
  });
```

### 5. Driver Accepts

```
POST /api/delivery/accept
{
  "request_id": "uuid",
  "driver_id": "uuid"
}
```

### 6. Real-time Tracking

```javascript
// Driver updates location
setInterval(async () => {
  await supabase
    .from('drivers')
    .update({
      current_lat: position.latitude,
      current_lng: position.longitude
    })
    .eq('id', driverId);
}, 10000); // Every 10 seconds

// Restaurant subscribes to driver location
supabase
  .channel(`driver_${driverId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'drivers',
    filter: `id=eq.${driverId}`
  }, payload => {
    updateDriverMarker(payload.new.current_lat, payload.new.current_lng);
  });
```

### 7. Status Updates

```
Statuses:
- pending (request created, waiting for driver)
- accepted (driver accepted, heading to pickup)
- picked_up (driver collected order from restaurant)
- delivering (driver heading to customer)
- delivered (completed)
- cancelled (restaurant or driver cancelled)
```

### 8. Completion & Payment

```javascript
// When driver marks as delivered
async function completeDelivery(deliveryId) {
  // Update delivery status
  await supabase
    .from('deliveries')
    .update({ status: 'delivered' })
    .eq('id', deliveryId);
  
  // Trigger automatic payout to driver
  await triggerDriverPayout(deliveryId);
  
  // Bill restaurant (or deduct from prepaid balance)
  await billRestaurant(deliveryId);
}
```

---

## 🗄️ Updated Database Schema

### New Table: delivery_requests

```sql
CREATE TABLE delivery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants NOT NULL,
  driver_id UUID REFERENCES drivers,
  
  -- Locations
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  distance_km DECIMAL(5,2),
  
  -- Order info (optional, for driver reference)
  order_reference VARCHAR(100),
  special_instructions TEXT,
  customer_phone VARCHAR(20),
  
  -- Pricing
  delivery_fee DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  
  -- Payment
  restaurant_payment_status VARCHAR(20) DEFAULT 'pending',
  driver_payout_status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Remove/Simplify: orders table

The existing `orders` table was designed for customer orders. We can either:
1. **Repurpose it** as delivery_requests (rename and adjust)
2. **Keep it** for future expansion if restaurants want to offer ordering
3. **Remove it** entirely if not needed

**Recommendation:** Repurpose as delivery_requests for now.

---

## 🎨 UI Flow

### Restaurant Dashboard

```
┌─────────────────────────────────────┐
│ FoodRun - Pizza Master Dashboard   │
├─────────────────────────────────────┤
│ [Request Driver] [Active Deliveries]│
│                                     │
│ Active Deliveries (3)               │
│ ┌─────────────────────────────────┐ │
│ │ Order #12345 - Delivering       │ │
│ │ Driver: Jan Kowalski            │ │
│ │ [View on Map] [Contact Driver]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Statistics                          │
│ Today: 15 deliveries | 315 PLN cost│
│ This Month: 450 deliveries          │
└─────────────────────────────────────┘
```

### Driver Dashboard

```
┌─────────────────────────────────────┐
│ FoodRun - Driver Dashboard          │
├─────────────────────────────────────┤
│ Status: [●] Available ┃ Earnings: 340│
│                                     │
│ New Delivery Requests               │
│ ┌─────────────────────────────────┐ │
│ │ Pizza Master → ul. Marszałkowska│ │
│ │ Distance: 4.5 km | Pay: 17.50zł │ │
│ │ [Accept] [Reject]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Active Delivery                     │
│ Pickup: Pizza Master                │
│ Deliver to: ul. Marszałkowska 100   │
│ [Navigate] [Picked Up] [Delivered]  │
└─────────────────────────────────────┘
```

---

## 🔐 Security Considerations

1. **Driver Location Privacy**
   - Only share location with restaurant for active deliveries
   - Clear location data after delivery completion (optional)

2. **Customer Data**
   - Delivery address visible to driver only after acceptance
   - Customer phone (if provided) only shown to assigned driver

3. **Restaurant Billing**
   - Validate all delivery completions to prevent fraud
   - Track driver GPS to verify delivery routes
   - Flag suspicious patterns (e.g., instant completions)

---

## 📱 Mobile Considerations

### Driver App (Future)
- Native mobile app (React Native) for better GPS tracking
- Push notifications for delivery requests
- Offline map support
- Battery optimization

### Restaurant Mobile Web
- Responsive web app works on mobile
- Push notifications via PWA
- Mobile-optimized dispatch interface

---

This architecture focuses solely on connecting restaurants with drivers, removing all customer-facing ordering features.
