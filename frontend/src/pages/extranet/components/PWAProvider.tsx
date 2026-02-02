import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/pwa/registerServiceWorker';
import { UpdateNotification, OfflineIndicator } from './UpdateNotification';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  registration: ServiceWorkerRegistration | null;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isInstalled: false,
  isInstallable: false,
  registration: null,
  promptInstall: async () => {},
});

export const usePWA = () => useContext(PWAContext);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Register service worker
    registerServiceWorker({
      onSuccess: (reg) => {
        console.log('[PWA] Service worker ready');
        setRegistration(reg);
      },
      onUpdate: (reg) => {
        console.log('[PWA] Update available');
        setRegistration(reg);
      },
      onOnline: () => setIsOnline(true),
      onOffline: () => setIsOnline(false),
    });

    // Handle install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isInstalled,
        isInstallable,
        registration,
        promptInstall,
      }}
    >
      <OfflineIndicator />
      {children}
      <UpdateNotification registration={registration || undefined} />
    </PWAContext.Provider>
  );
}
