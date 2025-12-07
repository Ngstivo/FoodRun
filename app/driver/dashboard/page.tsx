'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type DeliveryRequest = {
    id: string;
    order_reference: string | null;
    delivery_address: string;
    distance_km: number | null;
    delivery_fee: number;
    driver_commission: number;
    total_cost: number;
    status: string;
    created_at: string;
};

export default function DriverDashboard() {
    const router = useRouter();
    const [driver, setDriver] = useState<any>(null);
    const [pendingRequests, setPendingRequests] = useState<DeliveryRequest[]>([]);
    const [activeDelivery, setActiveDelivery] = useState<DeliveryRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        checkAuthAndFetch();
        subscribeToRequests();
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=driver');
                return;
            }

            // Fetch driver data
            const { data: driverData, error: driverError } = await supabase
                .from('drivers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (driverError) {
                router.push('/auth/onboarding/driver');
                return;
            }

            if (driverData.status !== 'verified') {
                router.push('/driver/pending-verification');
                return;
            }

            setDriver(driverData);
            setIsAvailable(driverData.is_available);

            // Fetch pending requests
            await fetchPendingRequests();

            // Fetch active delivery
            await fetchActiveDelivery(driverData.id);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        const { data } = await supabase
            .from('delivery_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setPendingRequests(data);
    };

    const fetchActiveDelivery = async (driverId: string) => {
        const { data } = await supabase
            .from('delivery_requests')
            .select('*')
            .eq('driver_id', driverId)
            .in('status', ['accepted', 'picked_up', 'delivering'])
            .single();

        if (data) setActiveDelivery(data);
    };

    const subscribeToRequests = () => {
        const channel = supabase
            .channel('delivery_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'delivery_requests',
                    filter: 'status=eq.pending',
                },
                (payload) => {
                    setPendingRequests((prev) => [payload.new as DeliveryRequest, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const toggleAvailability = async () => {
        if (!driver) return;

        const newAvailability = !isAvailable;
        const { error } = await supabase
            .from('drivers')
            .update({ is_available: newAvailability })
            .eq('id', driver.id);

        if (!error) {
            setIsAvailable(newAvailability);
        }
    };

    const acceptRequest = async (requestId: string) => {
        if (!driver) return;

        const { error } = await supabase
            .from('delivery_requests')
            .update({
                driver_id: driver.id,
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', requestId);

        if (!error) {
            // Remove from pending and set as active
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            await fetchActiveDelivery(driver.id);
        }
    };

    const updateDeliveryStatus = async (newStatus: string) => {
        if (!activeDelivery) return;

        const updates: any = { status: newStatus };

        if (newStatus === 'picked_up') {
            updates.picked_up_at = new Date().toISOString();
        } else if (newStatus === 'delivered') {
            updates.delivered_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('delivery_requests')
            .update(updates)
            .eq('id', activeDelivery.id);

        if (!error) {
            if (newStatus === 'delivered') {
                setActiveDelivery(null);
                // TODO: Trigger payout
            } else {
                setActiveDelivery({ ...activeDelivery, ...updates });
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <Link href="/driver/dashboard" className="text-2xl font-bold text-green-500">
                            🚗 FoodRun Driver
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Status:</span>
                            <button
                                onClick={toggleAvailability}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${isAvailable
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-300 text-gray-700'
                                    }`}
                            >
                                {isAvailable ? '● Dostępny' : '○ Niedostępny'}
                            </button>
                        </div>
                        <Link href="/driver/earnings" className="text-gray-700 hover:text-green-500">
                            Zarobki
                        </Link>
                        <button onClick={handleLogout} className="text-gray-700 hover:text-red-500">
                            Wyloguj
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Active Delivery */}
                {activeDelivery && (
                    <div className="card mb-8 bg-blue-50 border-2 border-blue-300">
                        <h2 className="text-xl font-bold mb-4 text-blue-900">Aktywna dostawa</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className="ml-2 font-medium capitalize">{activeDelivery.status}</span>
                            </div>
                            {activeDelivery.order_reference && (
                                <div>
                                    <span className="text-sm text-gray-600">Zamówienie:</span>
                                    <span className="ml-2 font-medium">{activeDelivery.order_reference}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-sm text-gray-600">Adres dostawy:</span>
                                <p className="mt-1 font-medium">{activeDelivery.delivery_address}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Dystans:</span>
                                <span className="ml-2 font-medium">{activeDelivery.distance_km} km</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Twoje zarobki:</span>
                                <div className="mt-1 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Opłata bazowa + dystans:</span>
                                        <span className="font-medium">{activeDelivery.delivery_fee.toFixed(2)} PLN</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Prowizja platformy:</span>
                                        <span>-{activeDelivery.driver_commission.toFixed(2)} PLN</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-blue-200">
                                        <span className="font-bold">Zarobek netto:</span>
                                        <span className="font-bold text-green-600 text-lg">
                                            {(activeDelivery.delivery_fee - activeDelivery.driver_commission).toFixed(2)} PLN
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 mt-4">
                                {activeDelivery.status === 'accepted' && (
                                    <button
                                        onClick={() => updateDeliveryStatus('picked_up')}
                                        className="btn btn-primary flex-1"
                                    >
                                        ✓ Odebrano z restauracji
                                    </button>
                                )}
                                {activeDelivery.status === 'picked_up' && (
                                    <button
                                        onClick={() => updateDeliveryStatus('delivered')}
                                        className="btn btn-primary flex-1"
                                    >
                                        ✓ Dostarczone
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Requests */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6">
                        Dostępne zlecenia ({pendingRequests.length})
                    </h2>

                    {!isAvailable && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                            <p className="text-yellow-800">
                                ⚠️ Jesteś niedostępny. Zmień status na "Dostępny" aby otrzymywać zlecenia.
                            </p>
                        </div>
                    )}

                    {pendingRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            Brak dostępnych zleceń w tym momencie
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            {request.order_reference && (
                                                <p className="text-sm text-gray-600 mb-1">
                                                    {request.order_reference}
                                                </p>
                                            )}
                                            <p className="font-medium">{request.delivery_address}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-sm text-gray-600">Zarobek</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {(request.delivery_fee - request.driver_commission).toFixed(2)} PLN
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ({request.delivery_fee.toFixed(2)} - {request.driver_commission.toFixed(2)})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            📍 {request.distance_km} km
                                        </div>
                                        <button
                                            onClick={() => acceptRequest(request.id)}
                                            disabled={!isAvailable || !!activeDelivery}
                                            className="btn btn-primary"
                                        >
                                            Przyjmij zlecenie
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
