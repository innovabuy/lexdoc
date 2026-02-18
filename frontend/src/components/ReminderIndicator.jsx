import React from 'react';

/**
 * ReminderIndicator - Visual indicator for document reminder status
 * Shows badge with count and timeline of sent reminders
 */
export default function ReminderIndicator({
  reminderCount = 0,
  lastReminderAt,
  nextReminderAt,
  autoRemindersEnabled = false,
  reminders = [],
  compact = false,
}) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge color based on reminder count
  const getBadgeColor = () => {
    if (reminderCount === 0) return 'bg-gray-100 text-gray-600';
    if (reminderCount === 1) return 'bg-blue-100 text-blue-700';
    if (reminderCount === 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Compact view (just badge)
  if (compact) {
    if (reminderCount === 0) {
      return null;
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}
        title={`${reminderCount} relance${reminderCount > 1 ? 's' : ''} envoyee${reminderCount > 1 ? 's' : ''}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {reminderCount}
      </span>
    );
  }

  // No reminders yet
  if (reminderCount === 0 && !autoRemindersEnabled) {
    return (
      <div className="text-sm text-gray-500 italic flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Aucune relance
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main indicator */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        reminderCount === 0 ? 'bg-gray-50 border border-gray-200' :
        reminderCount === 1 ? 'bg-blue-50 border border-blue-200' :
        reminderCount === 2 ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <span className="text-lg">
          {reminderCount === 0 ? '🔔' : reminderCount === 1 ? '🔔' : reminderCount === 2 ? '⏰' : '🚨'}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          reminderCount === 0 ? 'bg-gray-200 text-gray-700' :
          reminderCount === 1 ? 'bg-blue-500 text-white' :
          reminderCount === 2 ? 'bg-yellow-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {reminderCount}
        </span>
        <span className={`text-sm ${
          reminderCount === 0 ? 'text-gray-600' :
          reminderCount === 1 ? 'text-blue-800' :
          reminderCount === 2 ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          {reminderCount === 0 ? 'Relances activees' :
           reminderCount === 1 ? 'relance envoyee' :
           `relances envoyees`}
        </span>
      </div>

      {/* Status info */}
      <div className="text-xs text-gray-500 space-y-1">
        {lastReminderAt && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Derniere : {formatDate(lastReminderAt)}
          </div>
        )}
        {autoRemindersEnabled && nextReminderAt && reminderCount < 3 && (
          <div className="flex items-center gap-1 text-blue-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Prochaine : {formatDate(nextReminderAt)}
          </div>
        )}
        {reminderCount >= 3 && (
          <div className="flex items-center gap-1 text-red-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Maximum de relances atteint
          </div>
        )}
      </div>

      {/* Timeline of reminders (if we have details) */}
      {reminders && reminders.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Historique des relances</div>
          <div className="space-y-2">
            {reminders.map((reminder, index) => (
              <div key={reminder.id || index} className="flex items-start gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  reminder.status === 'SENT' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {reminder.type === 'FIRST_REMINDER' ? '1er rappel' :
                       reminder.type === 'SECOND_REMINDER' ? '2e rappel' :
                       reminder.type === 'THIRD_REMINDER' ? '3e rappel' :
                       reminder.type}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      reminder.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {reminder.status === 'SENT' ? 'Envoye' : 'Echec'}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {reminder.sentTo && <span>{reminder.sentTo} - </span>}
                    {formatDate(reminder.sentAt || reminder.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ReminderBadge - Compact badge for table rows
 */
export function ReminderBadge({ reminderCount = 0, className = '' }) {
  if (reminderCount === 0) return null;

  const colors = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[Math.min(reminderCount, 3)]} ${className}`}
      title={`${reminderCount} relance${reminderCount > 1 ? 's' : ''}`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {reminderCount}
    </span>
  );
}

/**
 * ReminderToggle - Toggle button for enabling/disabling auto reminders
 */
export function ReminderToggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
