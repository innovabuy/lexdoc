import React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useSignature, useRemindSigner, useDownloadSignedDocument, useDownloadCertificates } from '@/hooks/useSignatures';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils/formatters';
import type { SignatureStatus, SignatoryStatus } from '@/lib/types';

interface Props {
  signatureId: string;
}

const statusConfig: Record<SignatureStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  PENDING: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  IN_PROGRESS: { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: RefreshCw },
  COMPLETED: { label: 'Completee', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  CANCELLED: { label: 'Annulee', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expiree', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle },
  ERROR: { label: 'Erreur', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
};

const signatoryStatusConfig: Record<SignatoryStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  PENDING: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  IN_PROGRESS: { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  SIGNED: { label: 'Signe', color: 'text-green-600', bgColor: 'bg-green-100' },
  REFUSED: { label: 'Refuse', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const SignatureTracking: React.FC<Props> = ({ signatureId }) => {
  const { data: signature, isLoading } = useSignature(signatureId);
  const remindMutation = useRemindSigner();
  const downloadDocMutation = useDownloadSignedDocument();
  const downloadCertMutation = useDownloadCertificates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!signature) {
    return (
      <div className="text-center py-12 text-gray-500">
        Signature introuvable
      </div>
    );
  }

  const status = statusConfig[signature.status];
  const StatusIcon = status.icon;

  const handleRemind = (email: string) => {
    remindMutation.mutate({ id: signatureId, signerEmail: email });
  };

  return (
    <div className="space-y-6">
      {/* Global status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statut de la signature
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${status.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${status.color}`} />
            </div>
            <div>
              <p className={`text-lg font-semibold ${status.color}`}>
                {status.label}
              </p>
              <p className="text-sm text-gray-500">
                {signature.title}
              </p>
            </div>
          </div>

          {signature.status === 'COMPLETED' && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadDocMutation.mutate(signatureId)}
                isLoading={downloadDocMutation.isPending}
              >
                <Download className="h-4 w-4 mr-1" />
                Document signe
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCertMutation.mutate(signatureId)}
                isLoading={downloadCertMutation.isPending}
              >
                <Download className="h-4 w-4 mr-1" />
                Certificats
              </Button>
            </div>
          )}
        </div>

        {signature.expiresAt && signature.status !== 'COMPLETED' && (
          <p className="text-sm text-gray-500 mt-4">
            Expire le {formatDate(signature.expiresAt)}
          </p>
        )}

        {signature.completedAt && (
          <p className="text-sm text-green-600 mt-4">
            Completee le {formatDate(signature.completedAt)}
          </p>
        )}
      </div>

      {/* Signatories timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Signataires
        </h3>

        <div className="space-y-4">
          {signature.signatories.map((signatory, index) => {
            const signatoryStatus = signatoryStatusConfig[signatory.status];

            return (
              <div
                key={signatory.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${signatoryStatus.bgColor}
                    `}
                  >
                    {signatory.status === 'SIGNED' ? (
                      <CheckCircle className={`h-5 w-5 ${signatoryStatus.color}`} />
                    ) : signatory.status === 'REFUSED' ? (
                      <XCircle className={`h-5 w-5 ${signatoryStatus.color}`} />
                    ) : (
                      <span className={`text-sm font-bold ${signatoryStatus.color}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Signatory info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {signatory.firstName} {signatory.lastName}
                    </p>
                    <span
                      className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${signatoryStatus.bgColor} ${signatoryStatus.color}
                      `}
                    >
                      {signatoryStatus.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {signatory.email}
                  </p>

                  {signatory.signedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Signe le {formatDate(signatory.signedAt)}
                    </p>
                  )}

                  {signatory.refusedAt && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600">
                        Refuse le {formatDate(signatory.refusedAt)}
                      </p>
                      {signatory.refusedReason && (
                        <p className="text-xs text-gray-500 mt-1">
                          Raison : {signatory.refusedReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Remind button */}
                  {signatory.status === 'PENDING' && signature.status === 'IN_PROGRESS' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleRemind(signatory.email)}
                      isLoading={remindMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Relancer
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Document
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {signature.document.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Initie par {signature.initiator.firstName} {signature.initiator.lastName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cree le {formatDate(signature.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureTracking;
