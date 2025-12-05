'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantDashboard() {
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        todayOrders: 0,
        totalEarnings: 0,
        pendingOrders: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=restaurant');
                return;
            }

            // Fetch restaurant data
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (restaurantError) {
                // No restaurant record, redirect to onboarding
                router.push('/auth/onboarding/restaurant');
                return;
            }

            setRestaurant(restaurantData);

            // Check if pending verification
            if (restaurantData.status === 'pending_verification') {
                router.push('/restaurant/pending-verification');
                return;
            }

            if (restaurantData.status !== 'verified') {
                router.push('/restaurant/not-approved');
                return;
            }

            // Fetch stats
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantData.id);

            const today = new Date().toISOString().split('T')[0];
            const todayOrders = orders?.filter(o => o.created_at.startsWith(today)) || [];
            const pendingOrders = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)) || [];

            const totalEarnings = orders?.reduce((sum, order) => {
                if (order.status === 'delivered') {
                    return sum + (order.subtotal - order.platform_commission);
                }
                return sum;
            }, 0) || 0;

            setStats({
                totalOrders: orders?.length || 0,
                todayOrders: todayOrders.length,
                totalEarnings,
                pendingOrders: pendingOrders.length,
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
                        <Link href="/restaurant/dashboard" className="text-2xl font-bold text-green-500">
                            🏪 {restaurant?.business_name}
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/restaurant/menu" className="text-gray-700 hover:text-green-500">
                            Menu
                        </Link>
                        <Link href="/restaurant/orders" className="text-gray-700 hover:text-green-500">
                            Zamówienia
                        </Link>
                        <Link href="/restaurant/earnings" className="text-gray-700 hover:text-green-500">
                            Zarobki
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-gray-700 hover:text-red-500"
                        >
                            Wyloguj
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Panel Restauracji</h1>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Zamówienia dzisiaj</div>
                        <div className="text-3xl font-bold text-green-500">{stats.todayOrders}</div>
                    </div>

                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Aktywne zamówienia</div>
                        <div className="text-3xl font-bold text-blue-500">{stats.pendingOrders}</div>
                    </div>

                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Wszystkie zamówienia</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                    </div>

                    <div className="card">
                        <div className="text-sm text-gray-600 mb-2">Łączne zarobki</div>
                        <div className="text-3xl font-bold text-green-600">{stats.totalEarnings.toFixed(2)} PLN</div>
                    </div>
                </div>

                {/* Commission Info */}
                <div className="card mb-8">
                    <h2 className="text-xl font-bold mb-4">Informacje o Prowizji</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-600 mb-2">
                                <strong>Status:</strong>{' '}
                                {restaurant?.is_high_volume ? (
                                    <span className="text-green-600">Partner wysokoobrotowy ⭐</span>
                                ) : (
                                    <span>Partner standardowy</span>
                                )}
                            </p>
                            <p className="text-gray-600">
                                <strong>Prowizja:</strong>{' '}
                                {restaurant?.is_high_volume
                                    ? `${restaurant.high_volume_commission} PLN za dostawę`
                                    : `${restaurant?.base_commission} PLN za dostawę`
                                }
                            </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                                💡 <strong>Wskazówka:</strong> Partnerzy wysokoobrotowi płacą obniżoną prowizję ({restaurant?.high_volume_commission} PLN zamiast {restaurant?.base_commission} PLN).
                                Skontaktuj się z administracją aby dowiedzieć się więcej.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Link href="/restaurant/menu" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">📋 Zarządzaj Menu</h3>
                        <p className="text-gray-600">Dodawaj, edytuj lub usuń pozycje menu</p>
                    </Link>

                    <Link href="/restaurant/orders" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">📦 Zamówienia</h3>
                        <p className="text-gray-600">Zobacz i zarządzaj aktywnymi zamówieniami</p>
                    </Link>

                    <Link href="/restaurant/earnings" className="card hover:shadow-xl transition-shadow">
                        <h3 className="text-lg font-bold mb-2">💰 Zarobki</h3>
                        <p className="text-gray-600">Historia zarobków i wypłat</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
