'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DriverOnboarding() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        pesel: '',
        vehicleType: '',
        vehiclePlate: '',
        iban: '',
    });

    const [documents, setDocuments] = useState<{
        idCard: File | null;
        driversLicense: File | null;
    }>({
        idCard: null,
        driversLicense: null,
    });

    const validatePESEL = (pesel: string): boolean => {
        if (!/^\d{11}$/.test(pesel)) return false;

        const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
        const digits = pesel.split('').map(Number);
        const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0);
        const checksum = (10 - (sum % 10)) % 10;

        return checksum === digits[10];
    };

    const validateIBAN = (iban: string): boolean => {
        const cleaned = iban.replace(/\s/g, '');
        return /^PL\d{26}$/.test(cleaned);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'driversLicense') => {
        if (e.target.files && e.target.files[0]) {
            setDocuments({
                ...documents,
                [type]: e.target.files[0],
            });
        }
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (!validatePESEL(formData.pesel)) {
                setError('Nieprawidłowy numer PESEL');
                return;
            }
            if (!validateIBAN(formData.iban)) {
                setError('Nieprawidłowy numer IBAN');
                return;
            }
            setError('');
            setStep(2);
        } else if (step === 2) {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            // Validate documents
            if (!documents.idCard || !documents.driversLicense) {
                throw new Error('Proszę przesłać wszystkie wymagane dokumenty');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Nie jesteś zalogowany');

            // Create driver record first
            const { data: driverData, error: driverError } = await supabase
                .from('drivers')
                .insert({
                    user_id: user.id,
                    pesel: formData.pesel,
                    vehicle_type: formData.vehicleType,
                    vehicle_plate: formData.vehiclePlate,
                    iban: formData.iban.replace(/\s/g, ''),
                    status: 'pending_verification',
                })
                .select()
                .single();

            if (driverError) throw driverError;

            // Upload ID card
            const idCardExt = documents.idCard.name.split('.').pop();
            const idCardPath = `driver-documents/${user.id}/id_card.${idCardExt}`;
            const { error: idUploadError } = await supabase.storage
                .from('documents')
                .upload(idCardPath, documents.idCard, { upsert: true });

            if (idUploadError) throw idUploadError;

            // Get public URL for ID card
            const { data: idUrlData } = supabase.storage
                .from('documents')
                .getPublicUrl(idCardPath);

            // Upload driver's license
            const licenseExt = documents.driversLicense.name.split('.').pop();
            const licensePath = `driver-documents/${user.id}/drivers_license.${licenseExt}`;
            const { error: licenseUploadError } = await supabase.storage
                .from('documents')
                .upload(licensePath, documents.driversLicense, { upsert: true });

            if (licenseUploadError) throw licenseUploadError;

            // Get public URL for driver's license
            const { data: licenseUrlData } = supabase.storage
                .from('documents')
                .getPublicUrl(licensePath);

            // Create document records
            await supabase.from('driver_documents').insert([
                {
                    driver_id: driverData.id,
                    document_type: 'id_card',
                    file_url: idUrlData.publicUrl,
                },
                {
                    driver_id: driverData.id,
                    document_type: 'drivers_license',
                    file_url: licenseUrlData.publicUrl,
                },
            ]);

            // Redirect to pending verification page
            router.push('/driver/pending-verification');
        } catch (err: any) {
            setError(err.message || 'Błąd podczas rejestracji kierowcy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Rejestracja Kierowcy
                    </h1>
                    <p className="text-gray-600">
                        Krok {step} z 2: {step === 1 ? 'Dane podstawowe' : 'Weryfikacja dokumentów'}
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="flex mb-8">
                    <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className="w-4" />
                    <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleNext} className="space-y-6">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    PESEL *
                                </label>
                                <input
                                    type="text"
                                    name="pesel"
                                    value={formData.pesel}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="85010112345"
                                    maxLength={11}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">11 cyfr</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Typ pojazdu *
                                </label>
                                <select
                                    name="vehicleType"
                                    value={formData.vehicleType}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="">Wybierz typ pojazdu</option>
                                    <option value="Rower">Rower</option>
                                    <option value="Skuter">Skuter</option>
                                    <option value="Motocykl">Motocykl</option>
                                    <option value="Samochód">Samochód</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numer rejestracyjny pojazdu
                                </label>
                                <input
                                    type="text"
                                    name="vehiclePlate"
                                    value={formData.vehiclePlate}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="WA 12345"
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
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dowód osobisty lub paszport *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, 'idCard')}
                                    className="input"
                                    required
                                />
                                {documents.idCard && (
                                    <p className="text-sm text-green-600 mt-2">
                                        ✓ {documents.idCard.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prawo jazdy *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, 'driversLicense')}
                                    className="input"
                                    required
                                />
                                {documents.driversLicense && (
                                    <p className="text-sm text-green-600 mt-2">
                                        ✓ {documents.driversLicense.name}
                                    </p>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <h3 className="font-medium text-yellow-900 mb-2">⚠️ Ważne informacje</h3>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• Dokumenty muszą być czytelne i aktualne</li>
                                    <li>• Zaakceptowane formaty: JPG, PNG, PDF</li>
                                    <li>• Maksymalny rozmiar pliku: 5MB</li>
                                </ul>
                            </div>
                        </>
                    )}

                    <div className="flex space-x-4">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn btn-outline flex-1"
                                disabled={loading}
                            >
                                Wstecz
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary flex-1"
                        >
                            {loading ? 'Przesyłanie...' : step === 1 ? 'Dalej' : 'Wyślij zgłoszenie'}
                        </button>
                    </div>
                </form>

                {step === 2 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">📋 Co dalej?</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>✓ Twoje dokumenty zostaną sprawdzone przez nasz zespół</li>
                            <li>✓ Weryfikacja trwa do 48 godzin</li>
                            <li>✓ Otrzymasz email z informacją o statusie weryfikacji</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
