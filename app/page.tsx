import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">
                        🍔 FoodRun
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Wieloplatformowa aplikacja do dostawy jedzenia w Polsce
                    </p>
                    <p className="text-lg text-gray-500">
                        Multi-vendor food delivery platform connecting restaurants, drivers, and customers
                    </p>
                </div>

                {/* User Type Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {/* Customer Card */}
                    <div className="card hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">👤</div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Klient</h2>
                        <p className="text-gray-600 mb-6">
                            Przeglądaj restauracje, składaj zamówienia i śledź dostawy w czasie rzeczywistym
                        </p>
                        <Link href="/auth/login?type=customer" className="btn btn-primary w-full block text-center">
                            Zaloguj się
                        </Link>
                    </div>

                    {/* Restaurant Card */}
                    <div className="card hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">🏪</div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Restauracja</h2>
                        <p className="text-gray-600 mb-6">
                            Zarejestruj biznes, zarządzaj menu i otrzymuj zamówienia
                        </p>
                        <Link href="/auth/login?type=restaurant" className="btn btn-secondary w-full block text-center">
                            Zaloguj się
                        </Link>
                    </div>

                    {/* Driver Card */}
                    <div className="card hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">🚗</div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Kierowca</h2>
                        <p className="text-gray-600 mb-6">
                            Zarejestruj się, dostarcz zamówienia i zarabiaj
                        </p>
                        <Link href="/auth/login?type=driver" className="btn btn-primary w-full block text-center">
                            Zaloguj się
                        </Link>
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                        Dlaczego FoodRun?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-4">
                            <span className="text-3xl">⚡</span>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Szybkie dostawy</h3>
                                <p className="text-gray-600">Śledzenie kierowcy w czasie rzeczywistym</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <span className="text-3xl">💳</span>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Bezpieczne płatności</h3>
                                <p className="text-gray-600">Integracja z Przelewy24</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <span className="text-3xl">📊</span>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Analityka dla restauracji</h3>
                                <p className="text-gray-600">Pełne dane o zamówieniach i zarobkach</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <span className="text-3xl">🇵🇱</span>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Polski rynek</h3>
                                <p className="text-gray-600">Wsparcie NIP, PESEL, i IBAN</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-16 text-gray-500">
                    <p>© 2024 FoodRun. Wszystkie prawa zastrzeżone.</p>
                </div>
            </div>
        </div>
    );
}
