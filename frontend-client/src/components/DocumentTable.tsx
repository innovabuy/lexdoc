import { ReminderIndicator } from './ReminderIndicator';

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  status?: string;
  createdAt: string;
  tracking?: {
    status: string;
    reminderCount: number;
    lastReminderAt: string | null;
    nextReminderAt: string | null;
    autoRemindersEnabled: boolean;
  };
}

interface DocumentTableProps {
  documents: Document[];
  isLoading?: boolean;
  onDownload?: (documentId: string) => void;
  onSign?: (documentId: string) => void;
}

export function DocumentTable({ documents, isLoading, onDownload, onSign }: DocumentTableProps) {
  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING_SIGNATURE: { label: 'A signer', className: 'bg-orange-100 text-orange-700' },
      SIGNED: { label: 'Signe', className: 'bg-green-100 text-green-700' },
      DELIVERED: { label: 'Livre', className: 'bg-blue-100 text-blue-700' },
      DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    };

    const config = statusConfig[status || 'DRAFT'] || statusConfig.DRAFT;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500">Aucun document disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Relances
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{doc.title}</p>
                  <p className="text-sm text-gray-500">{doc.filename}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(doc.tracking?.status || doc.status)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(doc.createdAt)}
              </td>
              <td className="px-6 py-4">
                {doc.tracking && (
                  <ReminderIndicator reminder={doc.tracking} />
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {doc.tracking?.status === 'PENDING_SIGNATURE' && onSign && (
                    <button
                      onClick={() => onSign(doc.id)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      Signer
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={() => onDownload(doc.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Telecharger
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;
