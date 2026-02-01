import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, Users, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import type { SignatureTransaction, SignatureStatus } from '@/lib/types';

interface Props {
  signature: SignatureTransaction;
}

const statusConfig: Record<SignatureStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  PENDING: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  IN_PROGRESS: { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  COMPLETED: { label: 'Completee', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  CANCELLED: { label: 'Annulee', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expiree', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle },
  ERROR: { label: 'Erreur', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
};

const SignatureCard: React.FC<Props> = ({ signature }) => {
  const status = statusConfig[signature.status];
  const StatusIcon = status.icon;

  const signedCount = signature.signatories.filter(s => s.status === 'SIGNED').length;
  const totalCount = signature.signatories.length;

  return (
    <Link
      to={`/signatures/${signature.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {signature.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {signature.document.title}
          </p>
        </div>

        <div className="flex items-center ml-4">
          <span
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${status.bgColor} ${status.color}
            `}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          <span>
            {signedCount}/{totalCount} signatures
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-400">
          <span>{formatDate(signature.createdAt)}</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </div>
      </div>

      {/* Progress bar */}
      {signature.status === 'IN_PROGRESS' && totalCount > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(signedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default SignatureCard;
