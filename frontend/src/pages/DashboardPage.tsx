import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCabinetStats } from '@/hooks/useCabinet';
import { LoadingState } from '@/components/ui';
import {
  DashboardStats,
  StorageUsage,
  QuickActions,
  RecentActivity,
} from '@/components/dashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useCabinetStats();

  if (isLoading) {
    return <LoadingState message="Chargement du tableau de bord..." />;
  }

  // Default stats if API fails
  const dashboardStats = stats || {
    totalDocuments: 0,
    totalFolders: 0,
    totalUsers: 1,
    storageUsed: 0,
    storageLimit: 10737418240, // 10 GB
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.firstName} !
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un aperçu de votre activité sur LexDoc
        </p>
      </div>

      {/* Stats cards */}
      <DashboardStats stats={dashboardStats} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <QuickActions />
          <StorageUsage
            used={dashboardStats.storageUsed}
            limit={dashboardStats.storageLimit}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
