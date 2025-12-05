export default function PendingVerification() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full text-center">
                <div className="text-6xl mb-6">⏳</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Weryfikacja w toku
                </h1>
                <p className="text-gray-600 mb-8 text-lg">
                    Twoje zgłoszenie zostało przesłane i jest obecnie weryfikowane przez nasz zespół.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
                    <h2 className="font-bold text-blue-900 mb-4">Co dalej?</h2>
                    <div className="text-left text-blue-700 space-y-3">
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">1️⃣</span>
                            <div>
                                <strong>Weryfikacja dokumentów</strong>
                                <p className="text-sm">Nasz zespół sprawdza przesłane informacje</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">2️⃣</span>
                            <div>
                                <strong>Zatwierdzenie</strong>
                                <p className="text-sm">Proces zajmuje od 1 do 2 dni roboczych</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">3️⃣</span>
                            <div>
                                <strong>Powiadomienie</strong>
                                <p className="text-sm">Otrzymasz email z informacją o statusie</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">4️⃣</span>
                            <div>
                                <strong>Rozpocznij pracę</strong>
                                <p className="text-sm">Po zatwierdzeniu uzyskasz pełny dostęp do platformy</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <p className="text-yellow-800">
                        <strong>⚠️ Ważne:</strong> Sprawdź swoją skrzynkę email (w tym folder spam) w poszukiwaniu wiadomości od FoodRun.
                    </p>
                </div>

                <div className="text-gray-600">
                    <p>Masz pytania?</p>
                    <p className="mt-2">
                        Skontaktuj się z nami: <a href="mailto:support@foodrun.pl" className="text-green-500 hover:text-green-600">support@foodrun.pl</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
