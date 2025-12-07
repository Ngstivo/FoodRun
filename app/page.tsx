import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-green-600">🚗 FoodRun</h1>
                        <div className="text-sm text-gray-600">
                            Platform dostawy dla restauracji i kierowców
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-gray-900 mb-4">
                        Platforma dyspozycji kierowców
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        FoodRun łączy restauracje z dostępnymi kierowcami. Zamów kierowcę do swoich dostaw z <strong>zewnętrznych kanałów</strong> (Uber Eats, Glovo, telefon, strona www).
                    </p>
                </div>

                {/* Info Box */}
                <div className="max-w-4xl mx-auto mb-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                    <h3 className="font-bold text-blue-900 text-lg mb-3">💡 Jak to działa?</h3>
                    <div className="space-y-2 text-blue-800">
                        <p>✅ <strong>Restauracja:</strong> Otrzymujesz zamówienie przez Uber Eats, Glovo, telefon lub swoją stronę</p>
                        <p>✅ <strong>FoodRun:</strong> Zamawiasz dostępnego kierowcę przez naszą platformę</p>
                        <p>✅ <strong>Kierowca:</strong> Odbiera zamówienie i dostarcza do klienta</p>
                        <p className="pt-2 border-t border-blue-300">
                            <strong>Cennik:</strong> 16 PLN + 1 PLN/km (opłata kierowcy) + prowizja 2 PLN dla restauracji + 2 PLN dla kierowcy
                            <br />
                            <small className="text-blue-700">Rabat wysokoobrotowy: 1.5 PLN prowizji od 100 dostaw/m-c (dla każdego partnera osobno)</small>
                        </p>
                    </div>
                </div>

                {/* Main CTAs - Only Restaurant and Driver */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Restaurant Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
                        <div className="text-6xl mb-4">🏪</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Dla Restauracji
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Zamawiaj kierowców do swoich dostaw. Śledź dostawy w czasie rzeczywistym.
                            <br />
                            <small className="text-gray-500">Koszt: opłata kierowcy + 2 PLN prowizji (1.5 PLN od 100 dostaw/m-c)</small>
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/auth/signup?type=restaurant"
                                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                            >
                                Zarejestruj restaurację
                            </Link>
                            <Link
                                href="/auth/login?type=restaurant"
                                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg text-center transition-colors"
                            >
                                Mam już konto
                            </Link>
                        </div>
                    </div>

                    {/* Driver Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
                        <div className="text-6xl mb-4">🚗</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Dla Kierowców
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Przyjmuj zlecenia dostaw od restauracji. Zarabiaj 16 PLN + dystans za każdą dostawę*.
                            <br />
                            <small className="text-gray-500">*Prowizja: 2 PLN (1.5 PLN od 100 dostaw/m-c)</small>
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/auth/signup?type=driver"
                                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                            >
                                Zostań kierowcą
                            </Link>
                            <Link
                                href="/auth/login?type=driver"
                                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg text-center transition-colors"
                            >
                                Mam już konto
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Admin Login - Subtle */}
                <div className="text-center mt-12">
                    <Link
                        href="/auth/login?type=admin"
                        className="text-sm text-gray-400 hover:text-gray-600"
                    >
                        Panel administratora
                    </Link>
                </div>

                {/* Features Section */}
                <div className="mt-20 max-w-6xl mx-auto">
                    <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
                        Dlaczego FoodRun?
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="text-5xl mb-4">💰</div>
                            <h4 className="text-xl font-bold mb-2">Przejrzyste ceny</h4>
                            <p className="text-gray-600">
                                Stała prowizja 4 PLN (nie procent!). Rabaty dla dużych restauracji (3 PLN).
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">⚡</div>
                            <h4 className="text-xl font-bold mb-2">Szybkie zlecenia</h4>
                            <p className="text-gray-600">
                                Dostępni kierowcy otrzymują powiadomienia w czasie rzeczywistym. Szybka akceptacja.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">📍</div>
                            <h4 className="text-xl font-bold mb-2">Śledzenie na żywo</h4>
                            <p className="text-gray-600">
                                Zobacz lokalizację kierowcy w czasie rzeczywistym. Mapa z trasą dostawy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        &copy; 2025 FoodRun. Platforma dyspozycji kierowców dla restauracji.
                    </p>
                    <div className="mt-4 space-x-6 text-sm">
                        <Link href="/terms" className="text-gray-400 hover:text-white">
                            Regulamin
                        </Link>
                        <Link href="/privacy" className="text-gray-400 hover:text-white">
                            Polityka prywatności
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
