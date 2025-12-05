'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Driver = {
    id: string;
    pesel: string;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    iban: string;
    status: string;
    created_at: string;
    user_id: string;
};

type DriverDocument = {
    id: string;
    document_type: string;
    file_url: string;
};

type DriverWithProfile = Driver & {
    profile?: {
        full_name: string;
        phone: string;
    };
    documents?: DriverDocument[];
};

export default function VerifyDriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<DriverWithProfile | null>(null);

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


            await fetchDrivers();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        const { data: driversData } = await supabase
            .from('drivers')
            .select('*')
            .eq('status', 'pending_verification')
            .order('created_at', { ascending: true });

        if (driversData) {
            // Fetch profiles and documents for each driver
            const driversWithDetails = await Promise.all(
                driversData.map(async (driver) => {
                    const [profileData, documentsData] = await Promise.all([
                        supabase.from('profiles').select('full_name, phone').eq('id', driver.user_id).single(),
                        supabase.from('driver_documents').select('*').eq('driver_id', driver.id),
                    ]);

                    return {
                        ...driver,
                        profile: profileData.data || undefined,
                        documents: documentsData.data || [],
                    };
                })
            );

            setDrivers(driversWithDetails);
        }
    };

    const handleApprove = async (driver: DriverWithProfile) => {
        setProcessing(driver.id);
        try {
            const { error } = await supabase
                .from('drivers')
                .update({ status: 'verified' })
                .eq('id', driver.id);

            if (error) throw error;

            setDrivers(prev => prev.filter(d => d.id !== driver.id));
            setSelectedDriver(null);

            alert('Kierowca został zatwierdzony!');
        } catch (err: any) {
            alert('Błąd: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (driver: DriverWithProfile) => {
        const reason = prompt('Powód odrzucenia (opcjonalnie):');
        if (reason === null) return;

        setProcessing(driver.id);
        try {
            const { error } = await supabase
                .from('drivers')
                .update({ status: 'rejected' })
                .eq('id', driver.id);

            if (error) throw error;

            setDrivers(prev => prev.filter(d => d.id !== driver.id));
            setSelectedDriver(null);

            alert('Kierowca został odrzucony.');
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
                    <h1 className="text-xl font-bold">Weryfikacja Kierowców</h1>
                    <div></div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">
                        Oczekujący kierowcy ({drivers.length})
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Sprawdź dokumenty i dane osobowe kierowców
                    </p>
                </div>

                {drivers.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-xl text-gray-600">
                            Brak oczekujących kierowców
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {drivers.map((driver) => (
                            <div key={driver.id} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {driver.profile?.full_name || 'Brak danych'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Zgłoszono: {new Date(driver.created_at).toLocaleDateString('pl-PL')}
                                        </p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                        Oczekujące
                                    </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">PESEL</label>
                                        <p className="text-gray-900 font-mono">{driver.pesel}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Telefon</label>
                                        <p className="text-gray-900">{driver.profile?.phone || 'Brak'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Typ pojazdu</label>
                                        <p className="text-gray-900">{driver.vehicle_type || 'Brak'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Numer rejestracyjny</label>
                                        <p className="text-gray-900">{driver.vehicle_plate || 'Brak'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">IBAN</label>
                                        <p className="text-gray-900 font-mono text-sm">{driver.iban}</p>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-600 block mb-2">
                                        Przesłane dokumenty ({driver.documents?.length || 0})
                                    </label>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {driver.documents?.map((doc) => (
                                            <div key={doc.id} className="border rounded-lg p-3 bg-gray-50">
                                                <p className="text-sm font-medium mb-2">
                                                    {doc.document_type === 'id_card' && '📄 Dowód osobisty'}
                                                    {doc.document_type === 'passport' && '📘 Paszport'}
                                                    {doc.document_type === 'drivers_license' && '🪪 Prawo jazdy'}
                                                </p>
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Otwórz dokument →
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                                    <p className="text-sm text-blue-900">
                                        💡 <strong>Sprawdź:</strong> Czy dokumenty są czytelne? Czy PESEL się zgadza? Czy dokumenty są aktualne?
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleApprove(driver)}
                                        disabled={processing === driver.id}
                                        className="btn btn-primary flex-1"
                                    >
                                        {processing === driver.id ? 'Przetwarzanie...' : '✓ Zatwierdź'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(driver)}
                                        disabled={processing === driver.id}
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
