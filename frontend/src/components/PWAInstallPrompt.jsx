import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, install, dismissInstall } = usePWA();

  if (!isInstallable) return null;

  return (
    <div className="pwa-install-prompt lg:hidden">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📱</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Installer LexDoc</h3>
          <p className="text-sm text-white/80 mt-1">
            Ajoutez l'application sur votre ecran d'accueil pour un acces rapide.
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={dismissInstall}
          className="flex-1 px-4 py-2 text-white/80 hover:text-white transition-colors"
        >
          Plus tard
        </button>
        <button
          onClick={install}
          className="flex-1 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
