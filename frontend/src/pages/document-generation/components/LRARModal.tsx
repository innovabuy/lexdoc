import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  MapPin,
  AlertCircle,
  Loader2,
  Send,
  Euro,
} from 'lucide-react';
import { Modal, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

// Validation schema
const lrarFormSchema = z.object({
  name: z.string().min(1, 'Le nom du destinataire est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().default('FR'),
  registered: z.boolean().default(true),
  color: z.boolean().default(false),
  duplex: z.boolean().default(false),
});

type LrarFormData = z.infer<typeof lrarFormSchema>;

// Country options
const COUNTRY_OPTIONS = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
];

// Cost estimation (approximate)
const COST_BASE = 4.50; // Base LRAR cost
const COST_COLOR = 0.50; // Extra for color
const COST_DUPLEX = 0.20; // Extra for duplex

interface LRARModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recipient: {
      name: string;
      address: string;
      postalCode: string;
      city: string;
      country: string;
    };
    options: {
      color: boolean;
      duplex: boolean;
      registered: boolean;
    };
  }) => Promise<void>;
  documentTitle: string;
  // Pre-filled recipient from client data
  initialRecipient?: {
    name?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  isLoading?: boolean;
}

export const LRARModal: React.FC<LRARModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  documentTitle,
  initialRecipient = {},
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LrarFormData>({
    resolver: zodResolver(lrarFormSchema),
    defaultValues: {
      name: initialRecipient.name || '',
      address: initialRecipient.address || '',
      postalCode: initialRecipient.postalCode || '',
      city: initialRecipient.city || '',
      country: initialRecipient.country || 'FR',
      registered: true,
      color: false,
      duplex: false,
    },
  });

  const watchColor = watch('color');
  const watchDuplex = watch('duplex');

  // Calculate estimated cost
  const estimatedCost = COST_BASE + (watchColor ? COST_COLOR : 0) + (watchDuplex ? COST_DUPLEX : 0);

  const handleFormSubmit = async (data: LrarFormData) => {
    await onSubmit({
      recipient: {
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
      },
      options: {
        color: data.color,
        duplex: data.duplex,
        registered: data.registered,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Mail className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Envoyer par LRAR
            </h2>
            <p className="text-sm text-gray-500">{documentTitle}</p>
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="p-6 space-y-6">
          {/* Recipient Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Destinataire
            </h3>
            <div className="space-y-4">
              <Input
                label="Nom complet"
                placeholder="Jean MARTIN"
                error={errors.name?.message}
                required
                {...register('name')}
              />
              <Input
                label="Adresse"
                placeholder="15 rue de la Republique"
                error={errors.address?.message}
                required
                {...register('address')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code postal"
                  placeholder="72000"
                  error={errors.postalCode?.message}
                  required
                  {...register('postalCode')}
                />
                <Input
                  label="Ville"
                  placeholder="Le Mans"
                  error={errors.city?.message}
                  required
                  {...register('city')}
                />
              </div>
              <Select
                label="Pays"
                options={COUNTRY_OPTIONS}
                error={errors.country?.message}
                {...register('country')}
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  {...register('registered')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Recommande avec AR</span>
                  <p className="text-xs text-gray-500">Accusé de réception inclus</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  {...register('color')}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Impression couleur</span>
                  <p className="text-xs text-gray-500">+{COST_COLOR.toFixed(2)} EUR</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  {...register('duplex')}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Recto-verso</span>
                  <p className="text-xs text-gray-500">+{COST_DUPLEX.toFixed(2)} EUR</p>
                </div>
              </label>
            </div>
          </div>

          {/* Cost Estimate */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Cout estime</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {estimatedCost.toFixed(2)} EUR
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Le cout final peut varier selon le nombre de pages
            </p>
          </Card>

          {/* Info */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Envoi via SendingBox</p>
                <p className="mt-1">
                  Le document sera imprime et envoye par La Poste en recommande.
                  Vous recevrez une notification a chaque etape du suivi.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer LRAR
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default LRARModal;
