-- Migration: Add dual commission tracking (restaurant + driver)
-- Run this AFTER the initial schema setup

-- Step 1: Add new commission columns to delivery_requests
ALTER TABLE public.delivery_requests 
ADD COLUMN IF NOT EXISTS restaurant_commission DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS driver_commission DECIMAL(10,2);

-- Step 2: Update existing records (if any) to split the commission
UPDATE public.delivery_requests 
SET 
  restaurant_commission = platform_commission / 2,
  driver_commission = platform_commission / 2
WHERE restaurant_commission IS NULL;

-- Step 3: Make new columns NOT NULL after populating
ALTER TABLE public.delivery_requests 
ALTER COLUMN restaurant_commission SET NOT NULL,
ALTER COLUMN driver_commission SET NOT NULL;

-- Step 4: Update column comments
COMMENT ON COLUMN delivery_requests.restaurant_commission IS 'Commission charged to restaurant (2 PLN standard, 1.5 PLN high-volume)';
COMMENT ON COLUMN delivery_requests.driver_commission IS 'Commission charged to driver (2 PLN standard, 1.5 PLN high-volume)';
COMMENT ON COLUMN delivery_requests.platform_commission IS 'Total platform commission (restaurant + driver commission)';

-- Step 5: Add monthly delivery count tracking for restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS monthly_delivery_count INT DEFAULT 0;

COMMENT ON COLUMN restaurants.monthly_delivery_count IS 'Count of completed deliveries this month';
COMMENT ON COLUMN restaurants.is_high_volume IS 'High-volume status (≥100 deliveries/month = 1.5 PLN commission, <100 = 2 PLN)';

-- Step 6: Add monthly delivery count and high-volume tracking for drivers
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS monthly_delivery_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_high_volume BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN drivers.monthly_delivery_count IS 'Count of completed deliveries this month';
COMMENT ON COLUMN drivers.is_high_volume IS 'High-volume status (≥100 deliveries/month = 1.5 PLN commission, <100 = 2 PLN)';

-- Step 7: Create function to update monthly delivery counts
-- This should be run daily or via cron
CREATE OR REPLACE FUNCTION update_monthly_delivery_counts()
RETURNS void AS $$
BEGIN
    -- Update restaurant counts and high-volume status
    UPDATE restaurants r
    SET 
      monthly_delivery_count = (
        SELECT COUNT(*)
        FROM delivery_requests dr
        WHERE dr.restaurant_id = r.id
        AND DATE_TRUNC('month', dr.created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND dr.status = 'delivered'
      ),
      is_high_volume = (
        SELECT COUNT(*) >= 100
        FROM delivery_requests dr
        WHERE dr.restaurant_id = r.id
        AND DATE_TRUNC('month', dr.created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND dr.status = 'delivered'
      );
    
    -- Update driver counts and high-volume status
    UPDATE drivers d
    SET 
      monthly_delivery_count = (
        SELECT COUNT(*)
        FROM delivery_requests dr
        WHERE dr.driver_id = d.id
        AND DATE_TRUNC('month', dr.created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND dr.status = 'delivered'
      ),
      is_high_volume = (
        SELECT COUNT(*) >= 100
        FROM delivery_requests dr
        WHERE dr.driver_id = d.id
        AND DATE_TRUNC('month', dr.created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND dr.status = 'delivered'
      );
    
    RAISE NOTICE 'Monthly delivery counts updated successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_monthly_delivery_counts() IS 'Updates monthly delivery counts and high-volume status for all restaurants and drivers. Should be run daily via cron.';

-- Step 8: Replace cost calculation function with dual commission logic
DROP FUNCTION IF EXISTS calculate_delivery_cost(UUID, DECIMAL);

CREATE OR REPLACE FUNCTION calculate_delivery_cost(
    rest_id UUID,
    driver_id_param UUID,
    distance DECIMAL
)
RETURNS JSON AS $$
DECLARE
    base_fee DECIMAL := 16.00;
    per_km_rate DECIMAL := 1.00;
    restaurant_comm DECIMAL;
    driver_comm DECIMAL;
    restaurant_delivery_count INT;
    driver_delivery_count INT;
    driver_fee DECIMAL;
BEGIN
    -- Calculate delivery fee (what driver earns before commission)
    driver_fee := base_fee + (distance * per_km_rate);
    
    -- Count restaurant deliveries this month
    SELECT COUNT(*) INTO restaurant_delivery_count
    FROM delivery_requests
    WHERE restaurant_id = rest_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
    AND status = 'delivered';
    
    -- Calculate restaurant commission
    IF restaurant_delivery_count >= 100 THEN
        restaurant_comm := 1.50;
    ELSE
        restaurant_comm := 2.00;
    END IF;
    
    -- Calculate driver commission (if driver specified)
    IF driver_id_param IS NOT NULL THEN
        SELECT COUNT(*) INTO driver_delivery_count
        FROM delivery_requests
        WHERE driver_id = driver_id_param
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND status = 'delivered';
        
        IF driver_delivery_count >= 100 THEN
            driver_comm := 1.50;
        ELSE
            driver_comm := 2.00;
        END IF;
    ELSE
        -- Default driver commission (for estimates before driver accepts)
        driver_comm := 2.00;
    END IF;
    
    -- Return all cost components as JSON
    RETURN json_build_object(
        'delivery_fee', driver_fee,
        'restaurant_commission', restaurant_comm,
        'driver_commission', driver_comm,
        'platform_commission', restaurant_comm + driver_comm,
        'total_cost', driver_fee + restaurant_comm,
        'driver_net_earnings', driver_fee - driver_comm
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_delivery_cost(UUID, UUID, DECIMAL) IS 'Calculates delivery costs with separate restaurant and driver commissions. Returns JSON with all cost components.';

-- Step 9: Create trigger to update delivery counts on status change
CREATE OR REPLACE FUNCTION update_partner_delivery_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when delivery is completed
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        -- Update restaurant monthly count
        UPDATE restaurants 
        SET monthly_delivery_count = monthly_delivery_count + 1,
            is_high_volume = (monthly_delivery_count + 1) >= 100
        WHERE id = NEW.restaurant_id;
        
        -- Update driver monthly count (if assigned)
        IF NEW.driver_id IS NOT NULL THEN
            UPDATE drivers 
            SET monthly_delivery_count = monthly_delivery_count + 1,
                is_high_volume = (monthly_delivery_count + 1) >= 100
            WHERE id = NEW.driver_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_counts ON delivery_requests;

CREATE TRIGGER trigger_update_partner_counts
    AFTER INSERT OR UPDATE OF status ON delivery_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_delivery_counts();

COMMENT ON TRIGGER trigger_update_partner_counts ON delivery_requests IS 'Automatically updates partner delivery counts when deliveries are completed';

-- Step 10: Initialize counts for existing partners
SELECT update_monthly_delivery_counts();

-- Verification queries (optional - run to verify migration)
-- SELECT 'Restaurants with counts' AS check, id, business_name, monthly_delivery_count, is_high_volume FROM restaurants LIMIT 5;
-- SELECT 'Drivers with counts' AS check, id, monthly_delivery_count, is_high_volume FROM drivers LIMIT 5;
-- SELECT 'Sample cost calculation' AS check, calculate_delivery_cost(
--     (SELECT id FROM restaurants LIMIT 1),
--     (SELECT id FROM drivers LIMIT 1),
--     5.0
-- );
