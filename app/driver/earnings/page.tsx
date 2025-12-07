'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type DeliveryRecord = {
    id: string;
    created_at: string;
    delivery_address: string;
    distance_km: number;
    delivery_fee: number;
    driver_commission: number;
    total_cost: number;
    status: string;
};

export default function DriverEarningsPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalCommission: 0,
        netEarnings: 0,
        deliveryCount: 0
    });

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login?type=driver');
                return;
            }

            // Get driver ID
            const { data: driver } = await supabase
                .from('drivers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!driver) {
                router.push('/');
                return;
            }

            // Fetch completed deliveries
            const { data } = await supabase
                .from('delivery_requests')
                .select('*')
                .eq('driver_id', driver.id)
                .eq('status', 'delivered')
                .order('created_at', { ascending: false });

            if (data) {
                setDeliveries(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: DeliveryRecord[]) => {
        const totalEarnings = data.reduce((sum, d) => sum + d.delivery_fee, 0);
        const totalCommission = data.reduce((sum, d) => sum + d.driver_commission, 0);

        setStats({
            totalEarnings,
            totalCommission,
            netEarnings: totalEarnings - totalCommission,
            deliveryCount: data.length
        });
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
                    <Link href="/driver/dashboard" className="text-2xl font-bold text-green-500">
                        ← Panel Kierowcy
                    </Link>
                    <h1 className="text-xl font-bold">Moje Zarobki</h1>
                    <div></div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-green-50 border border-green-200">
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Zarobek Netto (na rękę)</h3>
                        <p className="text-3xl font-bold text-green-700">{stats.netEarnings.toFixed(2)} PLN</p>
                    </div>
                    <div className="card">
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Liczba dostaw</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.deliveryCount}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Zapłacona prowizja</h3>
                        <p className="text-3xl font-bold text-red-500">-{stats.totalCommission.toFixed(2)} PLN</p>
                    </div>
                </div>

                {/* History Table */}
                <div className="card overflow-hidden">
                    <h2 className="text-xl font-bold mb-4">Historia Dostaw</h2>

                    {deliveries.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Brak ukończonych dostaw</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adres</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kwota Brutto</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prowizja</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {deliveries.map((delivery) => (
                                        <tr key={delivery.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(delivery.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {delivery.delivery_address}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {delivery.delivery_fee.toFixed(2)} PLN
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 text-right">
                                                -{delivery.driver_commission.toFixed(2)} PLN
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                                {(delivery.delivery_fee - delivery.driver_commission).toFixed(2)} PLN
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
