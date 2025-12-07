'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Restaurant = {
    id: string;
    business_name: string;
    is_high_volume: boolean;
    monthly_delivery_count: number;
    status: string;
    created_at: string;
};

type Driver = {
    id: string;
    full_name: string;
    is_high_volume: boolean;
    monthly_delivery_count: number;
    status: string;
    created_at: string;
};

export default function CommissionManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'restaurants' | 'drivers'>('restaurants');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=admin');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single<{ user_type: string }>();

            if (profileError || !profile || profile.user_type !== 'admin') {
                router.push('/');
                return;
            }

            await Promise.all([fetchRestaurants(), fetchDrivers()]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('*')
            .eq('status', 'verified')
            .order('business_name');

        if (data) setRestaurants(data);
    };

    const fetchDrivers = async () => {
        const { data } = await supabase
            .from('drivers')
            .select('*')
            .eq('status', 'verified')
            .order('full_name');

        if (data) setDrivers(data);
    };

    const toggleHighVolume = async (id: string, type: 'restaurants' | 'drivers', currentStatus: boolean, name: string) => {
        setUpdating(id);
        try {
            const newStatus = !currentStatus;
            // @ts-ignore
            const { error } = await supabase
                .from(type)
                .update({ is_high_volume: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            if (type === 'restaurants') {
                setRestaurants(prev =>
                    prev.map(r => r.id === id ? { ...r, is_high_volume: newStatus } : r)
                );
            } else {
                setDrivers(prev =>
                    prev.map(d => d.id === id ? { ...d, is_high_volume: newStatus } : d)
                );
            }

            alert(
                newStatus
                    ? `${name} oznaczono jako partner wysokoobrotowy (1.50 PLN prowizji)`
                    : `${name} oznaczono jako partner standardowy (2.00 PLN prowizji)`
            );
        } catch (err: any) {
            alert('Błąd: ' + err.message);
        } finally {
            setUpdating(null);
        }
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
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/admin/dashboard" className="text-2xl font-bold text-blue-600">
                        ← Panel Admin
                    </Link>
                    <h1 className="text-xl font-bold">Zarządzanie Prowizją</h1>
                    <div></div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Zarządzanie Prowizją</h2>
                    <p className="text-gray-600 mt-2">
                        Przyznaj rabaty dla partnerów wysokoobrotowych
                    </p>
                </div>

                {/* Info Box */}
                <div className="card mb-6 bg-blue-50 border-2 border-blue-300">
                    <h3 className="font-bold text-blue-900 mb-3">ℹ️ Nowy model prowizyjny</h3>
                    <div className="space-y-2 text-blue-800">
                        <p>
                            <strong>Restauracje:</strong> 2.00 PLN/dostawa (standardowy) | 1.50 PLN/dostawa (wysokoobrotowy ≥100/m-c)
                        </p>
                        <p>
                            <strong>Kierowcy:</strong> 2.00 PLN/dostawa (standardowy) | 1.50 PLN/dostawa (wysokoobrotowy ≥100/m-c)
                        </p>
                        <p className="pt-2 border-t border-blue-200">
                            <strong>Całkowita prowizja platformy:</strong> 4.00 PLN (standardowy) | 3.00 PLN (obaj wysokoobrotowi)
                        </p>
                        <p className="text-sm pt-2">
                            Status wysokoobrotowy jest automatycznie nadawany po osiągnięciu 100 ukończonych dostaw w miesiącu.
                            Możesz też ręcznie zmienić status poniżej.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'restaurants'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('restaurants')}
                    >
                        Restauracje ({restaurants.length})
                    </button>
                    <button
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'drivers'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('drivers')}
                    >
                        Kierowcy ({drivers.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'restaurants' ? (
                    restaurants.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-xl text-gray-600">Brak zweryfikowanych restauracji</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {restaurants.map((restaurant) => (
                                <div key={restaurant.id} className="card hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {restaurant.business_name}
                                                </h3>
                                                {restaurant.is_high_volume && (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        ⭐ Wysokoobrotowy
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Dostawy (m-c):</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {restaurant.monthly_delivery_count || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Aktualna prowizja:</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {restaurant.is_high_volume ? '1.50' : '2.00'} PLN
                                                    </p>
                                                </div>
                                                {restaurant.is_high_volume && (
                                                    <div>
                                                        <p className="text-sm text-gray-600">Oszczędność:</p>
                                                        <p className="text-lg font-bold text-blue-600">
                                                            0.50 PLN / dostawa
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-6">
                                            <button
                                                onClick={() => toggleHighVolume(restaurant.id, 'restaurants', restaurant.is_high_volume, restaurant.business_name)}
                                                disabled={updating === restaurant.id}
                                                className={`btn ${restaurant.is_high_volume
                                                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                                    : 'btn-primary'
                                                    }`}
                                            >
                                                {updating === restaurant.id ? 'Aktualizacja...' : restaurant.is_high_volume ? 'Usuń rabat' : 'Przyznaj rabat'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    drivers.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-xl text-gray-600">Brak zweryfikowanych kierowców</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {drivers.map((driver) => (
                                <div key={driver.id} className="card hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {driver.full_name}
                                                </h3>
                                                {driver.is_high_volume && (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        ⭐ Wysokoobrotowy
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Dostawy (m-c):</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {driver.monthly_delivery_count || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Aktualna prowizja:</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {driver.is_high_volume ? '1.50' : '2.00'} PLN
                                                    </p>
                                                </div>
                                                {driver.is_high_volume && (
                                                    <div>
                                                        <p className="text-sm text-gray-600">Oszczędność:</p>
                                                        <p className="text-lg font-bold text-blue-600">
                                                            0.50 PLN / dostawa
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-6">
                                            <button
                                                onClick={() => toggleHighVolume(driver.id, 'drivers', driver.is_high_volume, driver.full_name)}
                                                disabled={updating === driver.id}
                                                className={`btn ${driver.is_high_volume
                                                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                                    : 'btn-primary'
                                                    }`}
                                            >
                                                {updating === driver.id ? 'Aktualizacja...' : driver.is_high_volume ? 'Usuń rabat' : 'Przyznaj rabat'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
