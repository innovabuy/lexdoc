import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect to dashboard if back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = '/extranet/dashboard';
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">&#x1F4F6;</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Connexion retablie !</h1>
          <p className="text-gray-600 mb-4">Redirection vers votre espace...</p>
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">&#x1F4E1;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mode hors ligne</h1>
        <p className="text-gray-600 mb-6">
          Vous n'etes pas connecte a Internet. Les fonctionnalites sont limitees.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Disponible hors ligne
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>Documents precedemment consultes</li>
            <li>Informations de profil en cache</li>
            <li>Navigation dans l'interface</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Necessite connexion
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>Signature electronique</li>
            <li>Telechargement de nouveaux documents</li>
            <li>Mise a jour des informations</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reessayer la connexion
        </button>

        <p className="text-xs text-gray-500 mt-6">
          L'application se reconnectera automatiquement des que le reseau sera disponible.
        </p>
      </div>
    </div>
  );
}
