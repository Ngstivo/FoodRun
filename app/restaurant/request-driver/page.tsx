'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';

// Dynamic import for map to avoid SSR issues
const MapView = dynamic(() => import('@/components/maps/MapView'), { ssr: false });

interface Restaurant {
    id: string;
    business_name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
}

export default function RequestDriverPage() {
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        deliveryAddress: '',
        orderReference: '',
        customerName: '',
        customerPhone: '',
        specialInstructions: '',
    });

    const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [costEstimate, setCostEstimate] = useState<{
        distance: number;
        deliveryFee: number;
        restaurantCommission: number;
        driverCommission: number;
        platformCommission: number;
        totalCost: number;
    } | null>(null);

    useEffect(() => {
        fetchRestaurant();
    }, []);

    const fetchRestaurant = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=restaurant');
                return;
            }

            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data.status !== 'verified') {
                router.push('/restaurant/pending-verification');
                return;
            }

            setRestaurant(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateCost = async () => {
        if (!formData.deliveryAddress || !restaurant) return;

        setLoading(true);
        setError('');

        try {
            // Geocode delivery address
            const geocodeRes = await fetch('/api/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: formData.deliveryAddress }),
            });

            if (!geocodeRes.ok) {
                throw new Error('Nie można znaleźć adresu dostawy');
            }

            const geocoded = await geocodeRes.json();
            setDeliveryCoords({ lat: geocoded.lat, lng: geocoded.lng });

            // Calculate distance
            const distanceRes = await fetch('/api/calculate-distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: { lat: restaurant.latitude, lng: restaurant.longitude },
                    end: { lat: geocoded.lat, lng: geocoded.lng },
                }),
            });

            if (!distanceRes.ok) {
                throw new Error('Nie można obliczyć dystansu');
            }

            const distanceData = await distanceRes.json();

            const { data, error } = await supabase
                .rpc('calculate_delivery_cost', {
                    rest_id: restaurant.id,
                    driver_id_param: null, // No driver assigned yet
                    distance: distanceData.distanceKm,
                });

            if (error) throw error;

            if (data) {
                setCostEstimate({
                    distance: distanceData.distanceKm,
                    deliveryFee: data.delivery_fee,
                    restaurantCommission: data.restaurant_commission,
                    driverCommission: data.driver_commission,
                    platformCommission: data.platform_commission,
                    totalCost: data.total_cost,
                });
            }
        } catch (err: any) {
            setError(err.message || 'Nie można obliczyć kosztu dostawy');
            setDeliveryCoords(null);
            setCostEstimate(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!restaurant || !costEstimate || !deliveryCoords) {
            setError('Proszę najpierw obliczyć koszt dostawy');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data, error: insertError } = await supabase
                .from('delivery_requests')
                .insert({
                    restaurant_id: restaurant.id,
                    pickup_address: restaurant.address,
                    pickup_lat: restaurant.latitude,
                    pickup_lng: restaurant.longitude,
                    delivery_address: formData.deliveryAddress,
                    delivery_lat: deliveryCoords.lat,
                    delivery_lng: deliveryCoords.lng,
                    distance_km: costEstimate.distance,
                    order_reference: formData.orderReference || null,
                    customer_name: formData.customerName || null,
                    customer_phone: formData.customerPhone || null,
                    special_instructions: formData.specialInstructions || null,
                    delivery_fee: costEstimate.deliveryFee,
                    restaurant_commission: costEstimate.restaurantCommission,
                    driver_commission: costEstimate.driverCommission,
                    platform_commission: costEstimate.platformCommission,
                    total_cost: costEstimate.totalCost,
                    status: 'pending',
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Redirect to delivery tracking page
            router.push(`/restaurant/delivery/${data.id}`);
        } catch (err: any) {
            setError(err.message || 'Błąd podczas tworzenia zlecenia');
        } finally {
            setLoading(false);
        }
    };

    const mapMarkers = restaurant && deliveryCoords ? [
        {
            position: [restaurant.latitude!, restaurant.longitude!] as [number, number],
            label: `Odbiór: ${restaurant.business_name}`,
            type: 'pickup' as const,
        },
        {
            position: [deliveryCoords.lat, deliveryCoords.lng] as [number, number],
            label: `Dostawa: ${formData.deliveryAddress}`,
            type: 'delivery' as const,
        },
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/restaurant/dashboard" className="text-2xl font-bold text-green-500">
                        ← Powrót
                    </Link>
                    <h1 className="text-xl font-bold">Zamów kierowcę</h1>
                    <div></div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Nowe zlecenie dostawy</h2>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Pickup Address (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adres odbioru (Twoja restauracja)
                                </label>
                                <input
                                    type="text"
                                    value={restaurant?.address || 'Ładowanie...'}
                                    className="input bg-gray-100"
                                    disabled
                                />
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adres dostawy *
                                </label>
                                <input
                                    type="text"
                                    name="deliveryAddress"
                                    value={formData.deliveryAddress}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="ul. Marszałkowska 100, Warszawa"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={calculateCost}
                                    disabled={!formData.deliveryAddress || loading}
                                    className="mt-2 btn btn-secondary text-sm"
                                >
                                    {loading ? 'Obliczanie...' : '📍 Oblicz koszt dostawy'}
                                </button>
                            </div>

                            {/* Cost Estimate */}
                            {costEstimate && (
                                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                    <h3 className="font-bold text-green-900 mb-3">Szacunkowy koszt</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Dystans:</span>
                                            <span className="font-medium">{costEstimate.distance.toFixed(2)} km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Opłata dla kierowcy:</span>
                                            <span className="font-medium">{costEstimate.deliveryFee.toFixed(2)} PLN</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Twoja prowizja:</span>
                                            <span className="font-medium">{costEstimate.restaurantCommission.toFixed(2)} PLN</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Prowizja kierowcy:</span>
                                            <span>{costEstimate.driverCommission.toFixed(2)} PLN</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-green-300">
                                            <span className="font-bold text-green-900">Całkowity koszt:</span>
                                            <span className="font-bold text-green-900 text-lg">
                                                {costEstimate.totalCost.toFixed(2)} PLN
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Reference */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numer zamówienia (opcjonalnie)
                                </label>
                                <input
                                    type="text"
                                    name="orderReference"
                                    value={formData.orderReference}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="np. Uber Eats #12345, Zamówienie #789"
                                />
                            </div>

                            {/* Customer Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Imię klienta (opcjonalnie)
                                    </label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Jan Kowalski"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Telefon klienta (opcjonalnie)
                                    </label>
                                    <input
                                        type="tel"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="+48 123 456 789"
                                    />
                                </div>
                            </div>

                            {/* Special Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instrukcje specjalne (opcjonalnie)
                                </label>
                                <textarea
                                    name="specialInstructions"
                                    value={formData.specialInstructions}
                                    onChange={handleChange}
                                    className="input"
                                    rows={3}
                                    placeholder="np. Zadzwoń po przyjeździe, kod do bramy: 1234"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !costEstimate}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Tworzenie zlecenia...' : '🚗 Zamów kierowcę'}
                            </button>
                        </form>
                    </div>

                    {/* Map */}
                    <div className="card">
                        <h3 className="text-lg font-bold mb-4">Mapa trasy</h3>
                        {mapMarkers.length > 0 ? (
                            <MapView
                                center={[restaurant!.latitude!, restaurant!.longitude!]}
                                markers={mapMarkers}
                                className="border border-gray-200"
                            />
                        ) : (
                            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">🗺️</div>
                                    <p>Wprowadź adres dostawy</p>
                                    <p className="text-sm">aby zobaczyć trasę na mapie</p>
                                </div>
                            </div>
                        )}

                        {costEstimate && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Trasa:</strong> {costEstimate.distance.toFixed(2)} km
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Szacowany czas przejazdu: ~{Math.ceil(costEstimate.distance * 2)} min
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
