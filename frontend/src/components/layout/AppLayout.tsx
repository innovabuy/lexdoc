import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/helpers';
import { useOnboardingStatus } from '@/hooks/useWizard';
import { OnboardingWizard } from '@/components/wizards';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore();
  const { data: onboardingStatus, isLoading } = useOnboardingStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (
      !isLoading &&
      onboardingStatus &&
      !onboardingStatus.onboardingCompleted &&
      onboardingStatus.showWizards
    ) {
      setShowOnboarding(true);
    }
  }, [onboardingStatus, isLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
        />
      )}
    </div>
  );
};

export default AppLayout;
