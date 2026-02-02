import { Outlet } from 'react-router-dom';
import { PWAProvider } from './components/PWAProvider';
import { InstallBanner } from './components/InstallButton';

export function ExtranetLayout() {
  return (
    <PWAProvider>
      <div className="min-h-screen bg-gray-50">
        <InstallBanner />
        <Outlet />
      </div>
    </PWAProvider>
  );
}

export default ExtranetLayout;
