import React from 'react';
import { FileText, User, Printer, AlertCircle } from 'lucide-react';

interface RecipientInput {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface Props {
  document: any;
  subject: string;
  recipient: RecipientInput;
  color: boolean;
  onColorChange: (color: boolean) => void;
  duplexPrinting: boolean;
  onDuplexPrintingChange: (duplex: boolean) => void;
  registeredMail: boolean;
  onRegisteredMailChange: (registered: boolean) => void;
}

const LrarOptionsForm: React.FC<Props> = ({
  document,
  subject,
  recipient,
  color,
  onColorChange,
  duplexPrinting,
  onDuplexPrintingChange,
  registeredMail,
  onRegisteredMailChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Options d'impression et recapitulatif
        </h3>
        <p className="text-sm text-gray-500">
          Configurez les options d'impression et verifiez les informations avant l'envoi.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        {/* Document */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Document
          </h4>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">{document?.title || document?.name}</p>
            <p className="text-sm text-gray-500 mt-1">Objet: {subject}</p>
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Destinataire
          </h4>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">
              {recipient.firstName} {recipient.lastName}
            </p>
            <p className="text-sm text-gray-500 mt-1">{recipient.address}</p>
            <p className="text-sm text-gray-500">
              {recipient.postalCode} {recipient.city}
            </p>
          </div>
        </div>
      </div>

      {/* Print options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
          <Printer className="h-4 w-4 mr-2" />
          Options d'impression
        </h4>

        <div className="space-y-4">
          {/* Color */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-gray-900">Impression couleur</span>
              <p className="text-sm text-gray-500">
                Imprime le document en couleur au lieu de noir et blanc
              </p>
            </div>
            <input
              type="checkbox"
              checked={color}
              onChange={(e) => onColorChange(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          {/* Duplex */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-gray-900">Recto-verso</span>
              <p className="text-sm text-gray-500">
                Imprime sur les deux faces de la feuille
              </p>
            </div>
            <input
              type="checkbox"
              checked={duplexPrinting}
              onChange={(e) => onDuplexPrintingChange(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          {/* Registered mail */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-gray-900">
                Lettre recommandee avec AR
              </span>
              <p className="text-sm text-gray-500">
                Envoi en recommande avec accuse de reception
              </p>
            </div>
            <input
              type="checkbox"
              checked={registeredMail}
              onChange={(e) => onRegisteredMailChange(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Avant de continuer</p>
            <p>
              En cliquant sur "Envoyer le courrier", le document sera imprime et
              envoye par La Poste. Cette action est irreversible une fois le
              courrier imprime. Verifiez attentivement l'adresse du destinataire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LrarOptionsForm;
