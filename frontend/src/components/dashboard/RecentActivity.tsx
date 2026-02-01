import React from 'react';
import { FileText, Folder, User, Settings } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/helpers';

interface Activity {
  id: string;
  type: 'document' | 'folder' | 'user' | 'settings';
  action: string;
  target: string;
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

const activityIcons = {
  document: FileText,
  folder: Folder,
  user: User,
  settings: Settings,
};

const activityColors = {
  document: 'bg-blue-50 text-blue-600',
  folder: 'bg-green-50 text-green-600',
  user: 'bg-purple-50 text-purple-600',
  settings: 'bg-gray-50 text-gray-600',
};

// Placeholder activities
const placeholderActivities: Activity[] = [
  {
    id: '1',
    type: 'document',
    action: 'a ajouté',
    target: 'Contrat_Client_Martin.pdf',
    user: { firstName: 'Jean', lastName: 'Dupont' },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'folder',
    action: 'a créé le dossier',
    target: 'Affaire 2024-001',
    user: { firstName: 'Marie', lastName: 'Martin' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'user',
    action: 's\'est connecté',
    target: '',
    user: { firstName: 'Pierre', lastName: 'Durand' },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = placeholderActivities,
}) => {
  return (
    <Card padding="none">
      <div className="p-6 pb-0">
        <CardHeader title="Activité récente" />
      </div>

      <div className="divide-y divide-gray-100">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className={cn('p-2 rounded-lg', activityColors[activity.type])}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">
                    {activity.user.firstName} {activity.user.lastName}
                  </span>{' '}
                  {activity.action}{' '}
                  {activity.target && (
                    <span className="font-medium">{activity.target}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>Aucune activité récente</p>
        </div>
      )}
    </Card>
  );
};

export default RecentActivity;
