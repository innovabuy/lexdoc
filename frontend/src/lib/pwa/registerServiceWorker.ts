export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/extranet/'
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available
                  console.log('[PWA] New content available');
                  config?.onUpdate?.(registration);
                } else {
                  // Content cached for offline use
                  console.log('[PWA] Content cached for offline use');
                  config?.onSuccess?.(registration);
                }
              }
            });
          }
        });

        // Handle successful registration
        if (registration.active) {
          config?.onSuccess?.(registration);
        }

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      config?.onOffline?.();
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[PWA] Unregister failed:', error);
      });
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function isPWAInstallable(): boolean {
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}
