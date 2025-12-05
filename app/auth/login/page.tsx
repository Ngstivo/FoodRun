'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type UserType = 'customer' | 'restaurant' | 'driver' | 'admin';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userType = (searchParams.get('type') as UserType) || 'restaurant';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getUserTypeLabel = (type: UserType) => {
        switch (type) {
            case 'customer':
                return 'Klient';
            case 'restaurant':
                return 'Restauracja';
            case 'driver':
                return 'Kierowca';
            case 'admin':
                return 'Administrator';
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Verify user type matches
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', data.user.id)
                .single();

            if (profile?.user_type !== userType) {
                await supabase.auth.signOut();
                throw new Error('Nieprawidłowy typ użytkownika dla tego konta');
            }

            // Redirect based on user type
            switch (userType) {
                case 'customer':
                    router.push('/customer/restaurants');
                    break;
                case 'restaurant':
                    router.push('/restaurant/dashboard');
                    break;
                case 'driver':
                    router.push('/driver/dashboard');
                    break;
                case 'admin':
                    router.push('/admin/dashboard');
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'Błąd logowania');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Logowanie
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

                <form onSubmit={handleLogin} className="space-y-4">
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
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Nie masz konta?{' '}
                        <Link
                            href={`/auth/signup?type=${userType}`}
                            className="text-green-500 hover:text-green-600 font-medium"
                        >
                            Zarejestruj się
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                <div className="text-xl">Ładowanie...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
