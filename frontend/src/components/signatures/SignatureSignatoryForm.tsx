import React from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { SignatureProfile } from '@/lib/types';

interface SignatoryInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Props {
  signatories: SignatoryInput[];
  onChange: (signatories: SignatoryInput[]) => void;
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  profile: SignatureProfile;
  onProfileChange: (profile: SignatureProfile) => void;
}

const profileOptions = [
  { value: 'DEFAULT', label: 'Signature simple' },
  { value: 'CERTIFIED', label: 'Signature certifiee' },
  { value: 'ADVANCED', label: 'Signature avancee' },
];

const SignatureSignatoryForm: React.FC<Props> = ({
  signatories,
  onChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  profile,
  onProfileChange,
}) => {
  const addSignatory = () => {
    onChange([
      ...signatories,
      { firstName: '', lastName: '', email: '', phone: '' },
    ]);
  };

  const removeSignatory = (index: number) => {
    onChange(signatories.filter((_, i) => i !== index));
  };

  const updateSignatory = (index: number, field: keyof SignatoryInput, value: string) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-8">
      {/* Title and description */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informations de la signature
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la signature *
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ex: Contrat de prestation de services"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optionnelle)
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="Description ou instructions pour les signataires..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de signature
          </label>
          <select
            value={profile}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onProfileChange(e.target.value as SignatureProfile)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {profileOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Signatories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Signataires
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addSignatory}
            disabled={signatories.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {signatories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">Aucun signataire ajoute</p>
            <Button variant="outline" onClick={addSignatory}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un signataire
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {signatories.map((signatory, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Signataire {index + 1}
                  </span>
                  <button
                    onClick={() => removeSignatory(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Prenom *
                    </label>
                    <Input
                      type="text"
                      value={signatory.firstName}
                      onChange={(e) => updateSignatory(index, 'firstName', e.target.value)}
                      placeholder="Prenom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nom *
                    </label>
                    <Input
                      type="text"
                      value={signatory.lastName}
                      onChange={(e) => updateSignatory(index, 'lastName', e.target.value)}
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={signatory.email}
                      onChange={(e) => updateSignatory(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Telephone (optionnel)
                    </label>
                    <Input
                      type="tel"
                      value={signatory.phone || ''}
                      onChange={(e) => updateSignatory(index, 'phone', e.target.value)}
                      placeholder="+33 6 XX XX XX XX"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Les signataires recevront un email avec un lien pour signer le document dans l'ordre indique.
        </p>
      </div>
    </div>
  );
};

export default SignatureSignatoryForm;
