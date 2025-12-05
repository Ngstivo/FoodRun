'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        pendingRestaurants: 0,
        pendingDrivers: 0,
        totalDeliveries: 0,
        platformRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

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

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single();

            if (profileError || !profile || profile.user_type !== 'admin') {
                router.push('/');
                return;
            }

            // Fetch stats
            const [restaurants, drivers, deliveries] = await Promise.all([
                supabase.from('restaurants').select('*').eq('status', 'pending_verification'),
                supabase.from('drivers').select('*').eq('status', 'pending_verification'),
                supabase.from('delivery_requests').select('*').eq('status', 'delivered'),
            ]);

            const revenue = deliveries.data?.reduce((sum: number, d: any) => sum + d.platform_commission, 0) || 0;

            setStats({
                pendingRestaurants: restaurants.data?.length || 0,
                pendingDrivers: drivers.data?.length || 0,
                totalDeliveries: deliveries.data?.length || 0,
                platformRevenue: revenue,
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
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
                        <Link href="/admin/dashboard" className="text-2xl font-bold text-blue-600">
                            ⚙️ FoodRun Admin
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/verify-restaurants" className="text-gray-700 hover:text-blue-600">
                            Restauracje
                        </Link>
                        <Link href="/admin/verify-drivers" className="text-gray-700 hover:text-blue-600">
                            Kierowcy
                        </Link>
                        <Link href="/admin/analytics" className="text-gray-700 hover:text-blue-600">
                            Analityka
                        </Link>
                        <button onClick={handleLogout} className="text-gray-700 hover:text-red-500">
                            Wyloguj
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Panel Administratora</h1>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card bg-yellow-50 border-2 border-yellow-300">
                        <div className="text-sm text-yellow-700 mb-2">Oczekujące restauracje</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.pendingRestaurants}</div>
                        {stats.pendingRestaurants > 0 && (
                            <Link href="/admin/verify-restaurants" className="text-sm text-yellow-700 hover:underline mt-2 block">
                                Zweryfikuj teraz →
                            </Link>
                        )}
                    </div>

                    <div className="card bg-orange-50 border-2 border-orange-300">
                        <div className="text-sm text-orange-700 mb-2">Oczekujący kierowcy</div>
                        <div className="text-3xl font-bold text-orange-600">{stats.pendingDrivers}</div>
                        {stats.pendingDrivers > 0 && (
                            <Link href="/admin/verify-drivers" className="text-sm text-orange-700 hover:underline mt-2 block">
                                Zweryfikuj teraz →
                            </Link>
                        )}
                    </div>

                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Całkowite dostawy</div>
                        <div className="text-3xl font-bold text-green-600">{stats.totalDeliveries}</div>
                    </div>

                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Przychody platformy</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.platformRevenue.toFixed(2)} PLN</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Link href="/admin/verify-restaurants" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">🏪 Weryfikuj Restauracje</h3>
                        <p className="text-gray-600 mb-4">Sprawdź i zatwierdź nowe zgłoszenia restauracji</p>
                        <div className="text-blue-600 font-medium">
                            {stats.pendingRestaurants} oczekujących
                        </div>
                    </Link>

                    <Link href="/admin/verify-drivers" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">🚗 Weryfikuj Kierowców</h3>
                        <p className="text-gray-600 mb-4">Sprawdź dokumenty i zatwierdź kierowców</p>
                        <div className="text-blue-600 font-medium">
                            {stats.pendingDrivers} oczekujących
                        </div>
                    </Link>

                    <Link href="/admin/commission-management" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">💰 Zarządzanie Prowizją</h3>
                        <p className="text-gray-600 mb-4">Ustaw rabaty dla partnerów wysokoobrotowych</p>
                        <div className="text-gray-500 text-sm">4 PLN → 3 PLN</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
