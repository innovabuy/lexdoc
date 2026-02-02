import React, { useState } from 'react';
import { Shield, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ConsentTypes {
  processing: boolean;
  storage: boolean;
  communication: boolean;
}

interface RgpdConsentScreenProps {
  cabinetName: string;
  cabinetEmail?: string;
  onAccept: (consents: ConsentTypes) => void;
  onViewPolicy?: () => void;
  policyUrl?: string;
}

export const RgpdConsentScreen: React.FC<RgpdConsentScreenProps> = ({
  cabinetName,
  cabinetEmail,
  onAccept,
  onViewPolicy,
  policyUrl,
}) => {
  const [consents, setConsents] = useState<ConsentTypes>({
    processing: false,
    storage: false,
    communication: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = consents.processing && consents.storage;

  const handleAccept = async () => {
    if (!canProceed) return;
    setIsSubmitting(true);
    try {
      await onAccept(consents);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPolicy = () => {
    if (policyUrl) {
      window.open(policyUrl, '_blank');
    } else if (onViewPolicy) {
      onViewPolicy();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto bg-blue-100 rounded-full p-4 w-fit mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Protection de vos donnees
            </h1>
            <p className="text-gray-600 mt-2">
              {cabinetName} respecte votre vie privee
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Avant de completer ce formulaire, nous devons vous informer sur
                l'utilisation de vos donnees personnelles conformement au RGPD.
              </p>
            </div>
          </div>

          {/* Data Processing Info */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Informations sur le traitement de vos donnees
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Responsable du traitement :</dt>
                <dd className="text-gray-600">{cabinetName}</dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Finalite :</dt>
                <dd className="text-gray-600">Gestion de votre dossier juridique</dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Base legale :</dt>
                <dd className="text-gray-600">Execution d'un contrat de prestation juridique</dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Destinataires :</dt>
                <dd className="text-gray-600">Votre avocat et collaborateurs habilites uniquement</dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Duree de conservation :</dt>
                <dd className="text-gray-600">10 ans (prescription legale des actes d'avocat)</dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-gray-700">Hebergement :</dt>
                <dd className="text-gray-600">France (serveurs securises)</dd>
              </div>
            </dl>

            {(policyUrl || onViewPolicy) && (
              <button
                onClick={handleViewPolicy}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Consulter la politique de confidentialite complete
              </button>
            )}
          </div>

          {/* Rights Section */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Vos droits</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Droit d'acces a vos donnees
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Droit de rectification
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Droit a l'effacement (sous conditions)
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Droit a la portabilite
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Droit d'opposition
              </p>
              {cabinetEmail && (
                <p className="mt-3">
                  Pour exercer vos droits : <strong>{cabinetEmail}</strong>
                </p>
              )}
            </div>
          </div>

          <hr className="my-6" />

          {/* Consent Checkboxes */}
          <div className="space-y-4 mb-6">
            <h2 className="font-semibold text-gray-900">Consentements requis</h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.processing}
                onChange={(e) =>
                  setConsents({ ...consents, processing: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                J'autorise {cabinetName} a traiter mes donnees personnelles pour
                la gestion de mon dossier juridique.{' '}
                <span className="text-red-600">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.storage}
                onChange={(e) =>
                  setConsents({ ...consents, storage: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                J'accepte que mes donnees soient conservees pendant 10 ans
                conformement aux obligations legales.{' '}
                <span className="text-red-600">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.communication}
                onChange={(e) =>
                  setConsents({ ...consents, communication: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                J'accepte de recevoir des communications relatives a mon dossier
                (emails, SMS).{' '}
                <span className="text-gray-500">(Optionnel)</span>
              </span>
            </label>
          </div>

          {/* Warning */}
          {!canProceed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Sans votre consentement aux traitements obligatoires (*),
                  nous ne pourrons pas traiter votre dossier.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleAccept}
            disabled={!canProceed}
            isLoading={isSubmitting}
            className="w-full"
            size="lg"
          >
            J'accepte et je continue
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            En cliquant, vous confirmez avoir pris connaissance de vos droits
            et acceptez le traitement de vos donnees.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RgpdConsentScreen;
