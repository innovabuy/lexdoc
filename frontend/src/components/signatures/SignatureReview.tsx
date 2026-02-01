import React from 'react';
import { FileText, User, Mail, Phone, AlertCircle } from 'lucide-react';
import type { SignatureProfile } from '@/lib/types';

interface SignatoryInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Props {
  document: any;
  signatories: SignatoryInput[];
  title: string;
  description?: string;
  profile: SignatureProfile;
}

const profileLabels: Record<SignatureProfile, string> = {
  DEFAULT: 'Signature simple',
  CERTIFIED: 'Signature certifiee',
  ADVANCED: 'Signature avancee',
};

const SignatureReview: React.FC<Props> = ({
  document,
  signatories,
  title,
  description,
  profile,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verification avant envoi
        </h3>
        <p className="text-sm text-gray-500">
          Verifiez les informations ci-dessous avant d'envoyer la demande de signature.
        </p>
      </div>

      {/* Document info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Document a signer
        </h4>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {document?.title || document?.name}
              </p>
              <p className="text-xs text-gray-500">PDF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signature info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Informations de la signature
        </h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Titre</dt>
            <dd className="text-sm font-medium text-gray-900">{title}</dd>
          </div>
          {description && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Description</dt>
              <dd className="text-sm text-gray-900 text-right max-w-xs truncate">
                {description}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Type de signature</dt>
            <dd className="text-sm font-medium text-gray-900">
              {profileLabels[profile]}
            </dd>
          </div>
        </dl>
      </div>

      {/* Signatories */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Signataires ({signatories.length})
        </h4>
        <div className="space-y-3">
          {signatories.map((signatory, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {index + 1}. {signatory.firstName} {signatory.lastName}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {signatory.email}
                    {signatory.phone && (
                      <>
                        <span className="mx-2">-</span>
                        <Phone className="h-3 w-3 mr-1" />
                        {signatory.phone}
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  Ordre: {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Avant de continuer</p>
            <p>
              En cliquant sur "Envoyer pour signature", les signataires recevront
              un email les invitant a signer le document. Assurez-vous que toutes
              les informations sont correctes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureReview;
