import { useState, useEffect } from 'react';

interface UpdateNotificationProps {
  registration?: ServiceWorkerRegistration;
}

export function UpdateNotification({ registration }: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!registration) return;

    const handleUpdateFound = () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      }
    };

    registration.addEventListener('updatefound', handleUpdateFound);

    return () => {
      registration.removeEventListener('updatefound', handleUpdateFound);
    };
  }, [registration]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Mise a jour disponible</h4>
          <p className="text-sm text-gray-600 mt-1">
            Une nouvelle version de l'application est disponible.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowUpdate(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Plus tard
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium z-50">
      <span className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        Mode hors ligne - Fonctionnalites limitees
      </span>
    </div>
  );
}
