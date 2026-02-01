import React from 'react';
import { HardDrive } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { formatBytes } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/helpers';

interface StorageUsageProps {
  used: number;
  limit: number;
}

const StorageUsage: React.FC<StorageUsageProps> = ({ used, limit }) => {
  const percentage = Math.round((used / limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <Card>
      <CardHeader title="Stockage" />

      <div className="space-y-4">
        {/* Progress bar */}
        <div className="relative">
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isCritical
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-yellow-500'
                  : 'bg-primary-500'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {formatBytes(used)} utilisés sur {formatBytes(limit)}
            </span>
          </div>
          <span
            className={cn(
              'font-medium',
              isCritical
                ? 'text-red-600'
                : isWarning
                ? 'text-yellow-600'
                : 'text-gray-900'
            )}
          >
            {percentage}%
          </span>
        </div>

        {/* Warning message */}
        {isWarning && (
          <p
            className={cn(
              'text-sm',
              isCritical ? 'text-red-600' : 'text-yellow-600'
            )}
          >
            {isCritical
              ? 'Stockage presque plein ! Libérez de l\'espace ou augmentez votre quota.'
              : 'Espace de stockage bientôt plein. Pensez à faire du ménage.'}
          </p>
        )}
      </div>
    </Card>
  );
};

export default StorageUsage;
