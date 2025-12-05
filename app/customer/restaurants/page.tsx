'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        checkAuth();
        fetchRestaurants();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login?type=customer');
        }
    };

    const fetchRestaurants = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('status', 'verified')
                .order('business_name');

            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <Link href="/customer/restaurants" className="text-2xl font-bold text-green-500">
                            🍔 FoodRun
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/customer/orders" className="text-gray-700 hover:text-green-500">
                            Moje zamówienia
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
                <h1 className="text-3xl font-bold mb-6">Restauracje</h1>

                {/* Search */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Szukaj restauracji lub adresu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input max-w-md"
                    />
                </div>

                {/* Restaurants Grid */}
                {filteredRestaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {searchTerm ? 'Nie znaleziono restauracji' : 'Brak dostępnych restauracji'}
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRestaurants.map((restaurant) => (
                            <Link
                                key={restaurant.id}
                                href={`/customer/restaurant/${restaurant.id}`}
                                className="card hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {restaurant.business_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            📍 {restaurant.address}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <span className="text-sm text-gray-600">
                                        Kliknij aby zobaczyć menu
                                    </span>
                                    <span className="text-green-500">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
