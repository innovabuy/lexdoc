import { useState } from 'react';

interface ReminderInfo {
  reminderCount: number;
  lastReminderAt: string | null;
  nextReminderAt: string | null;
  autoRemindersEnabled: boolean;
}

interface ReminderIndicatorProps {
  reminder: ReminderInfo;
}

export function ReminderIndicator({ reminder }: ReminderIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (reminder.reminderCount === 0) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non defini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-1 text-orange-600 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-sm font-medium">{reminder.reminderCount}</span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="font-semibold mb-1">
              {reminder.reminderCount} relance{reminder.reminderCount > 1 ? 's' : ''} envoyee{reminder.reminderCount > 1 ? 's' : ''}
            </div>
            {reminder.lastReminderAt && (
              <div className="text-gray-300">
                Derniere : {formatDate(reminder.lastReminderAt)}
              </div>
            )}
            {reminder.autoRemindersEnabled && reminder.nextReminderAt && (
              <div className="text-gray-300">
                Prochaine : {formatDate(reminder.nextReminderAt)}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReminderIndicator;
