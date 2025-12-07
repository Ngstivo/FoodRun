'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type UserType = 'customer' | 'restaurant' | 'driver';

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userType = (searchParams.get('type') as UserType) || 'restaurant';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getUserTypeLabel = (type: UserType) => {
        switch (type) {
            case 'customer':
                return 'Klienta';
            case 'restaurant':
                return 'Restauracji';
            case 'driver':
                return 'Kierowcy';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Hasła nie są identyczne');
            setLoading(false);
            return;
        }

        try {
            // Create user account
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        user_type: userType,
                    },
                },
            });

            if (signUpError) throw signUpError;
            if (!data.user) throw new Error('Błąd podczas tworzenia konta');

            // Profile is created automatically by database trigger

            // Redirect to onboarding based on user type
            switch (userType) {
                case 'customer':
                    router.push('/customer/restaurants');
                    break;
                case 'restaurant':
                    router.push('/auth/onboarding/restaurant');
                    break;
                case 'driver':
                    router.push('/auth/onboarding/driver');
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'Błąd rejestracji');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Rejestracja
                    </h1>
                    <p className="text-gray-600">
                        Rejestracja {getUserTypeLabel(userType)}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imię i nazwisko *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="input"
                            placeholder="Jan Kowalski"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            placeholder="twoj@email.pl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefon *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input"
                            placeholder="+48 123 456 789"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hasło *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 znaków</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Potwierdź hasło *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="input"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Rejestracja...' : 'Zarejestruj się'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Masz już konto?{' '}
                        <Link
                            href={`/auth/login?type=${userType}`}
                            className="text-green-500 hover:text-green-600 font-medium"
                        >
                            Zaloguj się
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
                        ← Powrót do strony głównej
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
