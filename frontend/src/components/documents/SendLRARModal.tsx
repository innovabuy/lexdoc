import React, { useState } from 'react';
import { Building, MapPin, Mail, Globe } from 'lucide-react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useSendLrar } from '@/hooks/useDocumentTracking';
import type { Document } from '@/lib/types';

interface RecipientAddress {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
}

interface SendLRARModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export function SendLRARModal({
  isOpen,
  onClose,
  document,
}: SendLRARModalProps) {
  const [recipient, setRecipient] = useState<RecipientAddress>({
    name: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: 'France',
  });
  const [acknowledgementOfReceipt, setAcknowledgementOfReceipt] = useState(true);
  const [color, setColor] = useState(false);

  const sendLrar = useSendLrar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await sendLrar.mutateAsync({
      documentId: document.id,
      input: {
        recipient: {
          name: recipient.name,
          company: recipient.company || undefined,
          addressLine1: recipient.addressLine1,
          addressLine2: recipient.addressLine2 || undefined,
          postalCode: recipient.postalCode,
          city: recipient.city,
          country: recipient.country || 'France',
        },
        options: {
          acknowledgementOfReceipt,
          color,
        },
      },
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setRecipient({
      name: '',
      company: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      city: '',
      country: 'France',
    });
    setAcknowledgementOfReceipt(true);
    setColor(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const updateRecipient = (field: keyof RecipientAddress, value: string) => {
    setRecipient((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    recipient.name &&
    recipient.addressLine1 &&
    recipient.postalCode &&
    recipient.city;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Envoyer en LRAR"
      description={`Document: ${document.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Recipient info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Destinataire</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => updateRecipient('name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Societe (optionnel)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={recipient.company || ''}
                  onChange={(e) => updateRecipient('company', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Entreprise SARL"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse ligne 1 *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={recipient.addressLine1}
                  onChange={(e) => updateRecipient('addressLine1', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123 Rue de Paris"
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse ligne 2 (optionnel)
              </label>
              <input
                type="text"
                value={recipient.addressLine2 || ''}
                onChange={(e) => updateRecipient('addressLine2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Batiment A, Etage 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                value={recipient.postalCode}
                onChange={(e) => updateRecipient('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="75001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                value={recipient.city}
                onChange={(e) => updateRecipient('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Paris"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={recipient.country}
                  onChange={(e) => updateRecipient('country', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="France"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Options d'envoi</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={acknowledgementOfReceipt}
                onChange={(e) => setAcknowledgementOfReceipt(e.target.checked)}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Accuse de reception
                </p>
                <p className="text-xs text-gray-500">
                  Recevoir une confirmation de reception (recommande)
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={color}
                onChange={(e) => setColor(e.target.checked)}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Impression couleur
                </p>
                <p className="text-xs text-gray-500">
                  Imprimer le document en couleur (supplement)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Cost estimate */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-800">Estimation du cout</p>
          <p className="text-xs text-blue-600 mt-1">
            LRAR avec AR: ~6.50EUR | Impression couleur: +2.00EUR
          </p>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={sendLrar.isPending}
            disabled={!isValid}
          >
            Envoyer en LRAR
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default SendLRARModal;
