-- Add delivery_requests table for the dispatch system
-- This replaces the customer ordering model with restaurant-driver dispatch

CREATE TABLE public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  
  -- Locations
  pickup_address TEXT NOT NULL, -- Restaurant location
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  delivery_address TEXT NOT NULL, -- Customer delivery location
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  distance_km DECIMAL(5,2),
  
  -- Order info (optional, for driver reference)
  order_reference VARCHAR(100), -- e.g., "Order #12345" or "Uber Eats #789"
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  special_instructions TEXT,
  
  -- Pricing
  delivery_fee DECIMAL(10,2) NOT NULL, -- What driver gets paid
  platform_commission DECIMAL(10,2) NOT NULL, -- What platform charges restaurant
  total_cost DECIMAL(10,2) NOT NULL, -- Total restaurant pays (fee + commission)
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Waiting for driver to accept
    'accepted',       -- Driver accepted, heading to pickup
    'picked_up',      -- Driver collected from restaurant
    'delivering',     -- Driver heading to customer
    'delivered',      -- Completed
    'cancelled'       -- Cancelled by restaurant or driver
  )),
  
  -- Payment tracking
  restaurant_payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
    restaurant_payment_status IN ('pending', 'paid', 'invoiced', 'failed')
  ),
  driver_payout_status VARCHAR(20) DEFAULT 'pending' CHECK (
    driver_payout_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  driver_payout_id VARCHAR(100), -- P24 payout transaction ID
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_delivery_requests_restaurant ON delivery_requests(restaurant_id);
CREATE INDEX idx_delivery_requests_driver ON delivery_requests(driver_id);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_delivery_requests_created ON delivery_requests(created_at DESC);

-- RLS Policies
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;

-- Restaurants can view their own delivery requests
CREATE POLICY "Restaurants view own requests" ON delivery_requests
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Restaurants can create delivery requests
CREATE POLICY "Restaurants create requests" ON delivery_requests
  FOR INSERT WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Restaurants can update their own requests (e.g., cancel)
CREATE POLICY "Restaurants update own requests" ON delivery_requests
  FOR UPDATE USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Drivers can view pending requests (within their area)
CREATE POLICY "Drivers view available requests" ON delivery_requests
  FOR SELECT USING (
    status = 'pending' OR 
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Drivers can update assigned requests
CREATE POLICY "Drivers update assigned requests" ON delivery_requests
  FOR UPDATE USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Admins can view all requests
CREATE POLICY "Admins view all requests" ON delivery_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admins can update all requests
CREATE POLICY "Admins update all requests" ON delivery_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Trigger to update updated_at
CREATE TRIGGER update_delivery_requests_updated_at 
  BEFORE UPDATE ON delivery_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total delivery cost for restaurant
CREATE OR REPLACE FUNCTION calculate_delivery_cost(rest_id UUID, distance DECIMAL)
RETURNS TABLE(delivery_fee DECIMAL, commission DECIMAL, total_cost DECIMAL) AS $$
DECLARE
  fee DECIMAL;
  comm DECIMAL;
BEGIN
  -- Calculate delivery fee (what driver gets)
  fee := calculate_delivery_fee(distance);
  
  -- Calculate commission (what platform charges)
  comm := calculate_commission(rest_id);
  
  -- Return all values
  RETURN QUERY SELECT fee, comm, fee + comm;
END;
$$ LANGUAGE plpgsql STABLE;
