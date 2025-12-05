'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function RestaurantOnboarding() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        businessName: '',
        nip: '',
        address: '',
        contactPerson: '',
        iban: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validateNIP = (nip: string): boolean => {
        // Remove spaces and dashes
        const cleaned = nip.replace(/[\s-]/g, '');

        // Check if it's exactly 10 digits
        if (!/^\d{10}$/.test(cleaned)) return false;

        // NIP checksum validation
        const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        const digits = cleaned.split('').map(Number);
        const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0);
        const checksum = sum % 11;

        return checksum === digits[9];
    };

    const validateIBAN = (iban: string): boolean => {
        // Simple Polish IBAN validation (PL + 2 check digits + 24 characters)
        const cleaned = iban.replace(/\s/g, '');
        return /^PL\d{26}$/.test(cleaned);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate NIP
            if (!validateNIP(formData.nip)) {
                throw new Error('Nieprawidłowy numer NIP');
            }

            // Validate IBAN
            if (!validateIBAN(formData.iban)) {
                throw new Error('Nieprawidłowy numer IBAN (format: PL + 26 cyfr)');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Nie jesteś zalogowany');

            // Create restaurant record
            const { error: insertError } = await supabase
                .from('restaurants')
                .insert({
                    user_id: user.id,
                    business_name: formData.businessName,
                    nip: formData.nip.replace(/[\s-]/g, ''),
                    address: formData.address,
                    contact_person: formData.contactPerson,
                    iban: formData.iban.replace(/\s/g, ''),
                    status: 'pending_verification',
                });

            if (insertError) throw insertError;

            // Redirect to pending verification page
            router.push('/restaurant/pending-verification');
        } catch (err: any) {
            setError(err.message || 'Błąd podczas rejestracji restauracji');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Rejestracja Restauracji
                    </h1>
                    <p className="text-gray-600">
                        Wypełnij formularz, aby dołączyć do platformy FoodRun
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nazwa Firmy *
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="input"
                            placeholder="Pizza Master"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            NIP (Numer Identyfikacji Podatkowej) *
                        </label>
                        <input
                            type="text"
                            name="nip"
                            value={formData.nip}
                            onChange={handleChange}
                            className="input"
                            placeholder="1234567890"
                            maxLength={10}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">10 cyfr, bez kresek</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adres Restauracji *
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input"
                            placeholder="ul. Krakowska 15, 00-001 Warszawa"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Osoba Kontaktowa
                        </label>
                        <input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            className="input"
                            placeholder="Anna Kowalska"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            IBAN (dla wypłat) *
                        </label>
                        <input
                            type="text"
                            name="iban"
                            value={formData.iban}
                            onChange={handleChange}
                            className="input"
                            placeholder="PL61109010140000071219812874"
                            maxLength={28}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Polski numer IBAN (PL + 26 cyfr)
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">📋 Co dalej?</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>✓ Twoje zgłoszenie zostanie zweryfikowane przez nasz zespół</li>
                            <li>✓ Proces weryfikacji trwa 1-2 dni robocze</li>
                            <li>✓ Otrzymasz email z potwierdzeniem lub prośbą o dodatkowe informacje</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Przesyłanie...' : 'Wyślij zgłoszenie'}
                    </button>
                </form>
            </div>
        </div>
    );
}
