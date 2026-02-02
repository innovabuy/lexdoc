interface StatusBadgeProps {
  status?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  PENDING_SIGNATURE: {
    label: 'En attente signature',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  PARTIALLY_SIGNED: {
    label: 'Partiellement signe',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  SIGNED: {
    label: 'Signe',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  PENDING_DELIVERY: {
    label: 'Envoye en LRAR',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  DELIVERED: {
    label: 'Livre',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'M5 13l4 4L19 7',
  },
  CANCELLED: {
    label: 'Annule',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'M6 18L18 6M6 6l12 12',
  },
  EXPIRED: {
    label: 'Expire',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  FAILED: {
    label: 'Echec',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = status ? statusConfig[status] : null;

  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Brouillon</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
      </svg>
      <span>{config.label}</span>
    </span>
  );
}
