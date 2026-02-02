import type { DocumentTracking } from '@/lib/api/extranet';

interface ReminderIndicatorProps {
  tracking?: DocumentTracking;
}

export function ReminderIndicator({ tracking }: ReminderIndicatorProps) {
  if (!tracking) {
    return <span className="text-sm text-gray-400 italic">-</span>;
  }

  const reminderCount = tracking.reminderLogs?.length || 0;

  if (reminderCount === 0) {
    if (tracking.status === 'PENDING_SIGNATURE') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="bg-yellow-200 px-2 py-0.5 rounded-full font-semibold">0</span>
          <span>aucune relance</span>
        </div>
      );
    }
    return <span className="text-sm text-gray-400 italic">-</span>;
  }

  return (
    <div className="relative group">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 font-medium cursor-help">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
          {reminderCount}
        </span>
        <span>{reminderCount === 1 ? 'relance envoyee' : 'relances envoyees'}</span>
      </div>

      {/* Tooltip with details */}
      <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
        <div className="text-xs font-semibold text-gray-700 mb-2">Historique des relances</div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tracking.reminderLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                {log.reminderNumber}
              </span>
              <div className="flex-1">
                <div className="text-gray-700">
                  {new Date(log.sentAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-gray-500 flex items-center gap-1">
                  {log.opened ? (
                    <>
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Lu</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Non lu</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {tracking.reminderLogs.length > 5 && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            + {tracking.reminderLogs.length - 5} autres relances
          </div>
        )}
      </div>
    </div>
  );
}
