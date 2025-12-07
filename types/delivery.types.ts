// Update database types to include delivery_requests table

export type DeliveryRequestStatus =
    | 'pending'
    | 'accepted'
    | 'picked_up'
    | 'delivering'
    | 'delivered'
    | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'invoiced' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Add to Database interface
export interface Database {
    public: {
        Tables: {
            // ... existing tables ...
            delivery_requests: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    driver_id: string | null;
                    pickup_address: string;
                    pickup_lat: number | null;
                    pickup_lng: number | null;
                    delivery_address: string;
                    delivery_lat: number | null;
                    delivery_lng: number | null;
                    distance_km: number | null;
                    order_reference: string | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    special_instructions: string | null;
                    delivery_fee: number;
                    restaurant_commission: number;
                    driver_commission: number;
                    platform_commission: number;
                    total_cost: number;
                    status: DeliveryRequestStatus;
                    restaurant_payment_status: PaymentStatus;
                    driver_payout_status: PayoutStatus;
                    driver_payout_id: string | null;
                    created_at: string;
                    accepted_at: string | null;
                    picked_up_at: string | null;
                    delivered_at: string | null;
                    cancelled_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    driver_id?: string | null;
                    pickup_address: string;
                    pickup_lat?: number | null;
                    pickup_lng?: number | null;
                    delivery_address: string;
                    delivery_lat?: number | null;
                    delivery_lng?: number | null;
                    distance_km?: number | null;
                    order_reference?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    special_instructions?: string | null;
                    delivery_fee: number;
                    restaurant_commission: number;
                    driver_commission: number;
                    platform_commission: number;
                    total_cost: number;
                    status?: DeliveryRequestStatus;
                    restaurant_payment_status?: PaymentStatus;
                    driver_payout_status?: PayoutStatus;
                    driver_payout_id?: string | null;
                    created_at?: string;
                    accepted_at?: string | null;
                    picked_up_at?: string | null;
                    delivered_at?: string | null;
                    cancelled_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    driver_id?: string | null;
                    pickup_lat?: number | null;
                    pickup_lng?: number | null;
                    delivery_lat?: number | null;
                    delivery_lng?: number | null;
                    distance_km?: number | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    special_instructions?: string | null;
                    status?: DeliveryRequestStatus;
                    restaurant_payment_status?: PaymentStatus;
                    driver_payout_status?: PayoutStatus;
                    driver_payout_id?: string | null;
                    accepted_at?: string | null;
                    picked_up_at?: string | null;
                    delivered_at?: string | null;
                    cancelled_at?: string | null;
                    updated_at?: string;
                };
            };
        };
        Functions: {
            calculate_delivery_fee: {
                Args: { distance_km: number };
                Returns: number;
            };
            calculate_commission: {
                Args: { rest_id: string };
                Returns: number;
            };
            calculate_delivery_cost: {
                Args: { rest_id: string; driver_id_param: string | null; distance: number };
                Returns: {
                    delivery_fee: number;
                    restaurant_commission: number;
                    driver_commission: number;
                    platform_commission: number;
                    total_cost: number;
                    driver_net_earnings: number;
                };
            };
        };
    };
}
