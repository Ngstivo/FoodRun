export default function DriverPendingVerification() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full text-center">
                <div className="text-6xl mb-6">⏳</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Weryfikacja dokumentów
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                    Twoje dokumenty zostały przesłane i są obecnie weryfikowane przez nasz zespół.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
                    <h2 className="font-bold text-blue-900 mb-4">Proces weryfikacji</h2>
                    <div className="text-left text-blue-700 space-y-3">
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">✓</span>
                            <div>
                                <strong>Przesłano dokumenty</strong>
                                <p className="text-sm">Dowód osobisty i prawo jazdy otrzymane</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">⏳</span>
                            <div>
                                <strong>W trakcie weryfikacji</strong>
                                <p className="text-sm">Sprawdzamy autentyczność dokumentów (do 48h)</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">📧</span>
                            <div>
                                <strong>Powiadomienie</strong>
                                <p className="text-sm">Otrzymasz email z wynikiem weryfikacji</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">🚗</span>
                            <div>
                                <strong>Rozpocznij dostawy</strong>
                                <p className="text-sm">Po zatwierdzeniu możesz przyjmować zlecenia</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-green-900 mb-2">💰 Zarobki kierowcy</h3>
                    <p className="text-green-700 text-sm">
                        • Podstawa: <strong>16 PLN</strong> za dostawy do 3 km<br />
                        • Dodatek: <strong>+1 PLN za każdy dodatkowy kilometr</strong><br />
                        • Wypłaty automatyczne po każdej dostawie
                    </p>
                </div>

                <div className="text-gray-600">
                    <p>Pytania? Napisz do nas:</p>
                    <p className="mt-2">
                        <a href="mailto:drivers@foodrun.pl" className="text-green-500 hover:text-green-600">drivers@foodrun.pl</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
