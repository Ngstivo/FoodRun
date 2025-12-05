-- Seed data for testing FoodRun platform

-- Create admin user (manually create in Supabase Auth first, then insert profile)
-- Example admin user ID: replace with actual UUID after creating in Supabase Auth
-- INSERT INTO auth.users (email, encrypted_password) VALUES ('admin@foodrun.pl', crypt('Admin@123', gen_salt('bf')));

-- Insert admin profile (replace UUID with actual admin user ID from auth.users)
-- INSERT INTO profiles (id, user_type, full_name, phone) 
-- VALUES ('YOUR-ADMIN-UUID-HERE', 'admin', 'Admin FoodRun', '+48123456789');

-- Example customer (create in auth, then profile)
-- Customer profile example
-- INSERT INTO profiles (id, user_type, full_name, phone) 
-- VALUES ('CUSTOMER-UUID', 'customer', 'Jan Kowalski', '+48111222333');

-- Example restaurant
-- INSERT INTO profiles (id, user_type, full_name, phone) 
-- VALUES ('RESTAURANT-USER-UUID', 'restaurant', 'Pizza Master Owner', '+48222333444');

INSERT INTO restaurants (user_id, business_name, nip, address, contact_person, iban, status, latitude, longitude)
VALUES 
  ('RESTAURANT-USER-UUID', 'Pizza Master', '1234567890', 'ul. Krakowska 15, Warszawa', 'Anna Nowak', 'PL61109010140000071219812874', 'verified', 52.229676, 21.012229),
  ('RESTAURANT-USER-UUID-2', 'Sushi House', '0987654321', 'ul. Marszałkowska 100, Warszawa', 'Tomasz Wiśniewski', 'PL27114020040000300201355387', 'verified', 52.231958, 21.006725);

-- Menu categories for Pizza Master
INSERT INTO restaurant_categories (restaurant_id, name, display_order)
VALUES 
  ((SELECT id FROM restaurants WHERE business_name = 'Pizza Master'), 'Pizza', 1),
  ((SELECT id FROM restaurants WHERE business_name = 'Pizza Master'), 'Pasta', 2),
  ((SELECT id FROM restaurants WHERE business_name = 'Pizza Master'), 'Napoje', 3);

-- Menu items for Pizza Master
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
VALUES 
  (
    (SELECT id FROM restaurants WHERE business_name = 'Pizza Master'),
    (SELECT id FROM restaurant_categories WHERE name = 'Pizza' LIMIT 1),
    'Margherita',
    'Sos pomidorowy, mozzarella, bazylia',
    28.00,
    true
  ),
  (
    (SELECT id FROM restaurants WHERE business_name = 'Pizza Master'),
    (SELECT id FROM restaurant_categories WHERE name = 'Pizza' LIMIT 1),
    'Pepperoni',
    'Sos pomidorowy, mozzarella, pepperoni',
    32.00,
    true
  ),
  (
    (SELECT id FROM restaurants WHERE business_name = 'Pizza Master'),
    (SELECT id FROM restaurant_categories WHERE name = 'Pasta' LIMIT 1),
    'Carbonara',
    'Makaron, boczek, jajko, parmezan',
    26.00,
    true
  ),
  (
    (SELECT id FROM restaurants WHERE business_name = 'Pizza Master'),
    (SELECT id FROM restaurant_categories WHERE name = 'Napoje' LIMIT 1),
    'Coca-Cola 0.5L',
    'Napój gazowany',
    7.00,
    true
  );

-- Example driver
-- INSERT INTO profiles (id, user_type, full_name, phone) 
-- VALUES ('DRIVER-USER-UUID', 'driver', 'Piotr Nowicki', '+48333444555');

INSERT INTO drivers (user_id, pesel, vehicle_type, vehicle_plate, iban, status, is_available)
VALUES 
  ('DRIVER-USER-UUID', '85010112345', 'Motocykl', 'WA12345', 'PL10105000997603123456789123', 'verified', true);

-- Note: Before using this seed data:
-- 1. Create users in Supabase Auth Dashboard
-- 2. Copy their UUIDs
-- 3. Replace placeholder UUIDs in this file
-- 4. Run this SQL in Supabase SQL Editor
