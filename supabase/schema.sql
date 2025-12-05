-- FoodRun Database Schema
-- PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'restaurant', 'driver', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  nip VARCHAR(10) NOT NULL UNIQUE, -- Polish Tax ID
  address TEXT NOT NULL,
  contact_person VARCHAR(255),
  iban VARCHAR(34) NOT NULL, -- For payouts
  base_commission DECIMAL(10,2) DEFAULT 4.00, -- Standard 4 PLN flat fee
  is_high_volume BOOLEAN DEFAULT FALSE,
  high_volume_commission DECIMAL(10,2) DEFAULT 3.00, -- Discounted 3 PLN flat fee
  status VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected', 'suspended')),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  pesel VARCHAR(11) NOT NULL, -- Polish national ID
  vehicle_type VARCHAR(50),
  vehicle_plate VARCHAR(20),
  iban VARCHAR(34) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected', 'suspended')),
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Documents table
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'passport', 'drivers_license')),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Categories table
CREATE TABLE public.restaurant_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES restaurant_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee DECIMAL(10,2) NOT NULL CHECK (delivery_fee >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  platform_commission DECIMAL(10,2) NOT NULL CHECK (platform_commission >= 0), -- Fixed 4 PLN or 3 PLN
  
  -- Delivery info
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  distance_km DECIMAL(5,2),
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'paid', 'confirmed', 'preparing', 
    'ready_for_pickup', 'picked_up', 'delivering', 'delivered', 'cancelled'
  )),
  
  -- Payment
  p24_transaction_id VARCHAR(100),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_order DECIMAL(10,2) NOT NULL CHECK (price_at_order >= 0),
  item_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('restaurant', 'driver')),
  recipient_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  iban VARCHAR(34) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  p24_payout_id VARCHAR(100),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate delivery fee based on distance
CREATE OR REPLACE FUNCTION calculate_delivery_fee(distance_km DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF distance_km <= 3 THEN
    RETURN 16.00;
  ELSE
    RETURN 16.00 + ((distance_km - 3) * 1.00);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate platform commission (fixed fee based on restaurant type)
CREATE OR REPLACE FUNCTION calculate_commission(rest_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  commission_amount DECIMAL;
  is_high_vol BOOLEAN;
BEGIN
  SELECT is_high_volume INTO is_high_vol
  FROM restaurants
  WHERE id = rest_id;
  
  IF is_high_vol THEN
    SELECT high_volume_commission INTO commission_amount
    FROM restaurants
    WHERE id = rest_id;
  ELSE
    SELECT base_commission INTO commission_amount
    FROM restaurants
    WHERE id = rest_id;
  END IF;
  
  RETURN commission_amount;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'FR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Anyone can view verified restaurants" ON restaurants FOR SELECT USING (status = 'verified');
CREATE POLICY "Restaurant owners can view their restaurant" ON restaurants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Restaurant owners can update their restaurant" ON restaurants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert restaurant" ON restaurants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all restaurants" ON restaurants FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can update restaurants" ON restaurants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Drivers policies
CREATE POLICY "Drivers can view own profile" ON drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert driver profile" ON drivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all drivers" ON drivers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can update drivers" ON drivers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Driver documents policies
CREATE POLICY "Drivers can view own documents" ON driver_documents FOR SELECT USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Drivers can insert own documents" ON driver_documents FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all documents" ON driver_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Menu items policies
CREATE POLICY "Anyone can view available menu items" ON menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Restaurant owners can manage their menu" ON menu_items FOR ALL USING (
  restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
);

-- Restaurant categories policies
CREATE POLICY "Anyone can view categories" ON restaurant_categories FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their categories" ON restaurant_categories FOR ALL USING (
  restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
);

-- Orders policies
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Restaurants can view their orders" ON orders FOR SELECT USING (
  restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
);
CREATE POLICY "Restaurants can update their orders" ON orders FOR UPDATE USING (
  restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
);
CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Drivers can update assigned orders" ON orders FOR UPDATE USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE 
      customer_id = auth.uid() OR 
      restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()) OR
      driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Customers can insert order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- Payouts policies
CREATE POLICY "Recipients can view their payouts" ON payouts FOR SELECT USING (
  (recipient_type = 'restaurant' AND recipient_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())) OR
  (recipient_type = 'driver' AND recipient_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins can view all payouts" ON payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can manage payouts" ON payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_available ON drivers(is_available);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payouts_recipient ON payouts(recipient_type, recipient_id);
CREATE INDEX idx_payouts_order ON payouts(order_id);
