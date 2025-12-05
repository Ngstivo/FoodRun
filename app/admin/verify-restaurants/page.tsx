'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Restaurant = {
    id: string;
    business_name: string;
    nip: string;
    address: string;
    contact_person: string | null;
    iban: string;
    status: string;
    created_at: string;
    user_id: string;
};

export default function VerifyRestaurantsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

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
            .eq('status', 'pending_verification')
            .order('created_at', { ascending: true });

        if (data) setRestaurants(data);
    };

    const handleApprove = async (restaurantId: string) => {
        setProcessing(restaurantId);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ status: 'verified' })
                .eq('id', restaurantId);

            if (error) throw error;

            // Remove from list
            setRestaurants(prev => prev.filter(r => r.id !== restaurantId));

            // TODO: Send email notification
            alert('Restauracja została zatwierdzona!');
        } catch (err: any) {
            alert('Błąd: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (restaurantId: string) => {
        const reason = prompt('Powód odrzucenia (opcjonalnie):');
        if (reason === null) return; // Cancelled

        setProcessing(restaurantId);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ status: 'rejected' })
                .eq('id', restaurantId);

            if (error) throw error;

            setRestaurants(prev => prev.filter(r => r.id !== restaurantId));

            // TODO: Send email with reason
            alert('Restauracja została odrzucona.');
        } catch (err: any) {
            alert('Błąd: ' + err.message);
        } finally {
            setProcessing(null);
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
                    <h1 className="text-xl font-bold">Weryfikacja Restauracji</h1>
                    <div></div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">
                        Oczekujące restauracje ({restaurants.length})
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Sprawdź dane firm i zatwierdź lub odrzuć zgłoszenia
                    </p>
                </div>

                {restaurants.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-xl text-gray-600">
                            Brak oczekujących restauracji
                        </p>
                        <p className="text-gray-500 mt-2">
                            Wszystkie zgłoszenia zostały przetworzone
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {restaurant.business_name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Zgłoszono: {new Date(restaurant.created_at).toLocaleDateString('pl-PL')}
                                        </p>
                                    </div>
                                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                        Oczekujące
                                    </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">NIP</label>
                                        <p className="text-gray-900">{restaurant.nip}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">IBAN</label>
                                        <p className="text-gray-900 font-mono text-sm">{restaurant.iban}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Adres</label>
                                        <p className="text-gray-900">{restaurant.address}</p>
                                    </div>
                                    {restaurant.contact_person && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Osoba kontaktowa</label>
                                            <p className="text-gray-900">{restaurant.contact_person}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                                    <p className="text-sm text-blue-900">
                                        💡 <strong>Sprawdź:</strong> Czy NIP jest prawidłowy? Czy IBAN jest w polskim formacie? Czy adres jest kompletny?
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleApprove(restaurant.id)}
                                        disabled={processing === restaurant.id}
                                        className="btn btn-primary flex-1"
                                    >
                                        {processing === restaurant.id ? 'Przetwarzanie...' : '✓ Zatwierdź'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(restaurant.id)}
                                        disabled={processing === restaurant.id}
                                        className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                                    >
                                        ✗ Odrzuć
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
