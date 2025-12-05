'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';

const MapView = dynamic(() => import('@/components/maps/MapView'), { ssr: false });

type DeliveryRequest = {
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
    platform_commission: number;
    total_cost: number;
    status: string;
    created_at: string;
};

type Driver = {
    id: string;
    current_lat: number | null;
    current_lng: number | null;
    user_id: string;
};

export default function DeliveryTrackingPage() {
    const params = useParams();
    const router = useRouter();
    const [delivery, setDelivery] = useState<DeliveryRequest | null>(null);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDelivery();
        subscribeToUpdates();
    }, []);

    const fetchDelivery = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=restaurant');
                return;
            }

            const { data: deliveryData, error } = await supabase
                .from('delivery_requests')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setDelivery(deliveryData);

            // If driver assigned, fetch driver info
            if (deliveryData.driver_id) {
                await fetchDriver(deliveryData.driver_id);
            }
        } catch (err) {
            console.error('Error fetching delivery:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDriver = async (driverId: string) => {
        const { data: driverData } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single();

        if (driverData) {
            setDriver(driverData);

            // Fetch driver profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', driverData.user_id)
                .single();

            setDriverProfile(profileData);
        }
    };

    const subscribeToUpdates = () => {
        const channel = supabase
            .channel(`delivery_${params.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'delivery_requests',
                    filter: `id=eq.${params.id}`,
                },
                (payload) => {
                    setDelivery(payload.new as DeliveryRequest);

                    // Fetch driver if just assigned
                    if (payload.new.driver_id && !driver) {
                        fetchDriver(payload.new.driver_id);
                    }
                }
            )
            .subscribe();

        // Subscribe to driver location updates if driver assigned
        if (delivery?.driver_id) {
            const driverChannel = supabase
                .channel(`driver_location_${delivery.driver_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'drivers',
                        filter: `id=eq.${delivery.driver_id}`,
                    },
                    (payload) => {
                        setDriver(payload.new as Driver);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(driverChannel);
            };
        }

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'accepted':
                return 'bg-blue-100 text-blue-800';
            case 'picked_up':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Oczekuje na kierowcę';
            case 'accepted':
                return 'Kierowca jedzie po zamówienie';
            case 'picked_up':
                return 'W trakcie dostawy';
            case 'delivered':
                return 'Dostarczone ✓';
            case 'cancelled':
                return 'Anulowane';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-red-600">Nie znaleziono zlecenia</div>
            </div>
        );
    }

    const mapMarkers: Array<{
        position: [number, number];
        label: string;
        type: 'pickup' | 'delivery' | 'driver';
    }> = [
            {
                position: [delivery.pickup_lat!, delivery.pickup_lng!] as [number, number],
                label: `Odbiór: ${delivery.pickup_address}`,
                type: 'pickup' as const,
            },
            {
                position: [delivery.delivery_lat!, delivery.delivery_lng!] as [number, number],
                label: `Dostawa: ${delivery.delivery_address}`,
                type: 'delivery' as const,
            },
        ];

    // Add driver marker if driver is assigned and has location
    if (driver && driver.current_lat && driver.current_lng) {
        mapMarkers.push({
            position: [driver.current_lat, driver.current_lng] as [number, number],
            label: `Kierowca: ${driverProfile?.full_name || 'W drodze'}`,
            type: 'driver' as const,
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/restaurant/dashboard" className="text-2xl font-bold text-green-500">
                        ← Panel
                    </Link>
                    <h1 className="text-xl font-bold">Śledzenie dostawy</h1>
                    <div></div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Delivery Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status */}
                        <div className="card">
                            <h3 className="font-bold mb-3">Status</h3>
                            <span className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                                {getStatusLabel(delivery.status)}
                            </span>
                        </div>

                        {/* Delivery Details */}
                        <div className="card">
                            <h3 className="font-bold mb-4">Szczegóły dostawy</h3>
                            <div className="space-y-3 text-sm">
                                {delivery.order_reference && (
                                    <div>
                                        <span className="text-gray-600">Zamówienie:</span>
                                        <p className="font-medium">{delivery.order_reference}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-600">Odbiór:</span>
                                    <p className="font-medium">{delivery.pickup_address}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dostawa:</span>
                                    <p className="font-medium">{delivery.delivery_address}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dystans:</span>
                                    <p className="font-medium">{delivery.distance_km?.toFixed(2)} km</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info */}
                        {driver && driverProfile ? (
                            <div className="card">
                                <h3 className="font-bold mb-4">Kierowca</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium text-lg">{driverProfile.full_name}</p>
                                    <p className="text-gray-600">{driverProfile.phone}</p>
                                    {driver.current_lat && driver.current_lng && (
                                        <p className="text-green-600 mt-3">
                                            📍 Pozycja aktualizowana na żywo
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card bg-yellow-50">
                                <h3 className="font-bold mb-2 text-yellow-900">Oczekiwanie na kierowcę</h3>
                                <p className="text-sm text-yellow-700">
                                    Dostępni kierowcy zostali powiadomieni o zleceniu
                                </p>
                            </div>
                        )}

                        {/* Cost */}
                        <div className="card">
                            <h3 className="font-bold mb-4">Koszt</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Opłata kierowcy:</span>
                                    <span className="font-medium">{delivery.delivery_fee.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Prowizja:</span>
                                    <span className="font-medium">{delivery.platform_commission.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-bold">
                                    <span>Razem:</span>
                                    <span className="text-green-600">{delivery.total_cost.toFixed(2)} PLN</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <h3 className="text-lg font-bold mb-4">Mapa trasy</h3>
                            <MapView
                                center={[delivery.pickup_lat!, delivery.pickup_lng!]}
                                markers={mapMarkers}
                                className="border border-gray-200"
                            />

                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <span>Odbiór</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                    <span>Dostawa</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <span>Kierowca</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
