import React from 'react';
import { MapPin } from 'lucide-react';
import Input from '@/components/ui/Input';

interface RecipientInput {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface Props {
  recipient: RecipientInput;
  onChange: (recipient: RecipientInput) => void;
}

const countries = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
];

const LrarRecipientForm: React.FC<Props> = ({ recipient, onChange }) => {
  const updateField = (field: keyof RecipientInput, value: string) => {
    onChange({ ...recipient, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Destinataire du courrier
        </h3>
        <p className="text-sm text-gray-500">
          Entrez les coordonnees completes du destinataire.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-medium text-gray-700">Adresse du destinataire</span>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prenom *
            </label>
            <Input
              type="text"
              value={recipient.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="Prenom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <Input
              type="text"
              value={recipient.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Nom"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse *
          </label>
          <Input
            type="text"
            value={recipient.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Numero et nom de rue"
          />
        </div>

        {/* Postal code and city */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal *
            </label>
            <Input
              type="text"
              value={recipient.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              placeholder="75001"
              maxLength={5}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville *
            </label>
            <Input
              type="text"
              value={recipient.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Paris"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            value={recipient.country}
            onChange={(e) => updateField('country', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        L'adresse sera imprimee sur l'enveloppe du courrier recommande.
        Assurez-vous qu'elle soit complete et correcte.
      </p>
    </div>
  );
};

export default LrarRecipientForm;
