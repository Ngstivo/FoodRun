'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Restaurant = {
    id: string;
    business_name: string;
    is_high_volume: boolean;
    base_commission: number;
    high_volume_commission: number;
    status: string;
    created_at: string;
};

export default function CommissionManagementPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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
                .single();

            if (profileError || !profile || profile.user_type !== 'admin') {
                router.push('/');
                return;
            }

            await fetchRestaurants();
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

    const toggleHighVolume = async (restaurant: Restaurant) => {
        setUpdating(restaurant.id);
        try {
            const newStatus = !restaurant.is_high_volume;
            const { error } = await supabase
                .from('restaurants')
                .update({ is_high_volume: newStatus })
                .eq('id', restaurant.id);

            if (error) throw error;

            // Update local state
            setRestaurants(prev =>
                prev.map(r =>
                    r.id === restaurant.id ? { ...r, is_high_volume: newStatus } : r
                )
            );

            alert(
                newStatus
                    ? `${restaurant.business_name} oznaczono jako partner wysokoobrotowy (${restaurant.high_volume_commission} PLN prowizji)`
                    : `${restaurant.business_name} oznaczono jako partner standardowy (${restaurant.base_commission} PLN prowizji)`
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
                    <h3 className="font-bold text-blue-900 mb-3">💡 Model Prowizji</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p>
                            <strong>Partner standardowy:</strong> 4.00 PLN za dostawę (stała opłata)
                        </p>
                        <p>
                            <strong>Partner wysokoobrotowy:</strong> 3.00 PLN za dostawę (rabat 25%)
                        </p>
                        <p className="pt-2 border-t border-blue-200">
                            Partnerzy wysokoobrotowi to restauracje z dużą liczbą dostaw miesięcznie.
                            Status możesz zmieniać w dowolnym momencie.
                        </p>
                    </div>
                </div>

                {restaurants.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-xl text-gray-600">
                            Brak zweryfikowanych restauracji
                        </p>
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
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Aktualna prowizja:</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {restaurant.is_high_volume
                                                        ? restaurant.high_volume_commission
                                                        : restaurant.base_commission}{' '}
                                                    PLN za dostawę
                                                </p>
                                            </div>
                                            {restaurant.is_high_volume && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Oszczędność:</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {(restaurant.base_commission - restaurant.high_volume_commission).toFixed(2)} PLN na dostawie
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <button
                                            onClick={() => toggleHighVolume(restaurant)}
                                            disabled={updating === restaurant.id}
                                            className={`btn ${restaurant.is_high_volume
                                                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                                : 'btn-primary'
                                                }`}
                                        >
                                            {updating === restaurant.id
                                                ? 'Aktualizacja...'
                                                : restaurant.is_high_volume
                                                    ? 'Usuń rabat'
                                                    : 'Przyznaj rabat'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
