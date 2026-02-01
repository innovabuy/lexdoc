import React from 'react';
import { FileText, Folder, Users, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/helpers';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn('p-3 rounded-lg', colorClasses[color])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p
            className={cn(
              'text-sm mt-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : '-'}
            {trend.value}% ce mois
          </p>
        )}
      </div>
    </Card>
  );
};

interface DashboardStatsProps {
  stats: {
    totalDocuments: number;
    totalFolders: number;
    totalUsers: number;
    storageUsed: number;
    storageLimit: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const storagePercentage = Math.round((stats.storageUsed / stats.storageLimit) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard
        title="Documents"
        value={formatNumber(stats.totalDocuments)}
        icon={FileText}
        color="blue"
      />
      <StatCard
        title="Dossiers"
        value={formatNumber(stats.totalFolders)}
        icon={Folder}
        color="green"
      />
      <StatCard
        title="Utilisateurs"
        value={formatNumber(stats.totalUsers)}
        icon={Users}
        color="purple"
      />
      <StatCard
        title="Stockage"
        value={`${storagePercentage}%`}
        icon={HardDrive}
        color="orange"
      />
    </div>
  );
};

export default DashboardStats;
