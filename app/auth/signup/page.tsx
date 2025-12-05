'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type UserType = 'customer' | 'restaurant' | 'driver';

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userType = (searchParams.get('type') as UserType) || 'customer';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getUserTypeLabel = (type: UserType) => {
        switch (type) {
            case 'customer':
                return 'Klient';
            case 'restaurant':
                return 'Partner Restauracyjny';
            case 'driver':
                return 'Partner Kierowca';
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create auth user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error('Failed to create user');

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    user_type: userType,
                    full_name: fullName,
                    phone,
                });

            if (profileError) throw profileError;

            // Redirect to onboarding if restaurant or driver, otherwise to dashboard
            if (userType === 'restaurant') {
                router.push('/auth/onboarding/restaurant');
            } else if (userType === 'driver') {
                router.push('/auth/onboarding/driver');
            } else {
                router.push('/customer/restaurants');
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
                        {getUserTypeLabel(userType)}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imię i nazwisko
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="input"
                            placeholder="Jan Kowalski"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="input"
                            placeholder="+48 123 456 789"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="twoj@email.pl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hasło
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 znaków</p>
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
