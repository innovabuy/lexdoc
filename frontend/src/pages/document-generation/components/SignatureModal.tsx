import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PenTool,
  Plus,
  Trash2,
  Mail,
  Phone,
  AlertCircle,
  Check,
  Loader2,
  Send,
} from 'lucide-react';
import { Modal, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

// Validation schema
const signatorySchema = z.object({
  firstName: z.string().min(1, 'Le prenom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  role: z.enum(['client', 'avocat', 'partie_adverse', 'temoin', 'autre']),
  isAutoFilled: z.boolean().optional(),
});

const signatureFormSchema = z.object({
  signatories: z.array(signatorySchema).min(1, 'Au moins un signataire est requis'),
  signingOrder: z.enum(['sequential', 'parallel']),
  customMessage: z.string().max(500).optional(),
});

type SignatureFormData = z.infer<typeof signatureFormSchema>;
type SignatoryData = z.infer<typeof signatorySchema>;

// Role options
const ROLE_OPTIONS = [
  { value: 'client', label: 'Client' },
  { value: 'avocat', label: 'Avocat' },
  { value: 'partie_adverse', label: 'Partie adverse' },
  { value: 'temoin', label: 'Temoin' },
  { value: 'autre', label: 'Autre' },
];

// Role labels in French
const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  avocat: 'Avocat',
  partie_adverse: 'Partie adverse',
  temoin: 'Temoin',
  autre: 'Autre',
};

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SignatureFormData) => Promise<void>;
  documentTitle: string;
  // Pre-filled signatories (from client data, avocat info, etc.)
  initialSignatories?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'client' | 'avocat' | 'partie_adverse' | 'temoin' | 'autre';
  }>;
  isLoading?: boolean;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  documentTitle,
  initialSignatories = [],
  isLoading = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    initialSignatories.length === 0 ? 0 : null
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignatureFormData>({
    resolver: zodResolver(signatureFormSchema),
    defaultValues: {
      signatories: initialSignatories.length > 0
        ? initialSignatories.map((s) => ({ ...s, isAutoFilled: true }))
        : [{ firstName: '', lastName: '', email: '', phone: '', role: 'client', isAutoFilled: false }],
      signingOrder: 'sequential',
      customMessage: 'Veuillez signer le document ci-joint.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'signatories',
  });

  const watchedSignatories = watch('signatories');

  const handleFormSubmit = async (data: SignatureFormData) => {
    await onSubmit(data);
  };

  const addSignatory = () => {
    append({ firstName: '', lastName: '', email: '', phone: '', role: 'autre', isAutoFilled: false });
    setExpandedIndex(fields.length);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getSignatoryDisplayName = (signatory: SignatoryData, index: number) => {
    if (signatory.firstName && signatory.lastName) {
      return `${signatory.firstName} ${signatory.lastName}`;
    }
    return `Signataire ${index + 1}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <PenTool className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Envoyer en signature electronique
            </h2>
            <p className="text-sm text-gray-500">{documentTitle}</p>
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Signatories List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Signataires</h3>
              <Badge variant="gray">{fields.length} signataire{fields.length > 1 ? 's' : ''}</Badge>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const signatory = watchedSignatories[index];
                const isExpanded = expandedIndex === index;
                const hasErrors = errors.signatories?.[index];

                return (
                  <Card
                    key={field.id}
                    className={`overflow-hidden transition-all ${
                      hasErrors ? 'border-red-300' : ''
                    }`}
                  >
                    {/* Collapsed Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {signatory?.isAutoFilled && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium text-gray-900">
                              {getSignatoryDisplayName(signatory, index)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="gray" className="text-xs">
                              {ROLE_LABELS[signatory?.role || 'autre']}
                            </Badge>
                            {signatory?.email && (
                              <span className="truncate max-w-48">{signatory.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasErrors && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </button>

                    {/* Expanded Form */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Prenom"
                            placeholder="Jean"
                            error={errors.signatories?.[index]?.firstName?.message}
                            required
                            {...register(`signatories.${index}.firstName`)}
                          />
                          <Input
                            label="Nom"
                            placeholder="MARTIN"
                            error={errors.signatories?.[index]?.lastName?.message}
                            required
                            {...register(`signatories.${index}.lastName`)}
                          />
                        </div>
                        <Input
                          label="Email"
                          type="email"
                          placeholder="jean.martin@example.com"
                          error={errors.signatories?.[index]?.email?.message}
                          required
                          leftIcon={<Mail className="h-4 w-4" />}
                          {...register(`signatories.${index}.email`)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Telephone (optionnel)"
                            placeholder="06 12 34 56 78"
                            error={errors.signatories?.[index]?.phone?.message}
                            leftIcon={<Phone className="h-4 w-4" />}
                            {...register(`signatories.${index}.phone`)}
                          />
                          <Select
                            label="Role"
                            options={ROLE_OPTIONS}
                            error={errors.signatories?.[index]?.role?.message}
                            required
                            {...register(`signatories.${index}.role`)}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Add Signatory Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={addSignatory}
              className="w-full mt-3 border-2 border-dashed border-gray-200 hover:border-gray-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un signataire
            </Button>

            {errors.signatories?.root && (
              <p className="text-sm text-red-600 mt-2">{errors.signatories.root.message}</p>
            )}
          </div>

          {/* Signing Order */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Ordre de signature</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="sequential"
                  {...register('signingOrder')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Sequentiel</span>
                  <p className="text-xs text-gray-500">Chaque signataire signe apres le precedent</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="parallel"
                  {...register('signingOrder')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Parallele</span>
                  <p className="text-xs text-gray-500">Tous les signataires peuvent signer en meme temps</p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Message personnalise (optionnel)
            </label>
            <textarea
              {...register('customMessage')}
              rows={3}
              placeholder="Veuillez signer le document ci-joint."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.customMessage && (
              <p className="text-sm text-red-600 mt-1">{errors.customMessage.message}</p>
            )}
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Signature via Universign</p>
                <p className="mt-1">
                  Chaque signataire recevra un email avec un lien pour signer le document.
                  Vous serez notifie lorsque toutes les signatures seront recueillies.
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
                Envoyer ({fields.length} signature{fields.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default SignatureModal;
