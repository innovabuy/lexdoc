import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import type { AvocatLegalInfo } from '@/lib/api/avocatLegalInfo';

// French phone regex
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
// French postal code regex
const postalCodeRegex = /^[0-9]{5}$/;

// Form validation schema
const legalInfoFormSchema = z.object({
  civilite: z.enum(['MAITRE', 'MONSIEUR', 'MADAME']),
  prenom: z.string().min(1, 'Le prenom est requis').max(100),
  nom: z.string().min(1, 'Le nom est requis').max(100),
  barreau: z.string().min(1, 'Le barreau est requis').max(200),
  numeroToque: z.string().max(50).optional().or(z.literal('')),
  adresseCabinet: z.string().min(1, 'L\'adresse du cabinet est requise').max(500),
  codePostal: z.string().regex(postalCodeRegex, 'Code postal invalide (5 chiffres)'),
  ville: z.string().min(1, 'La ville est requise').max(100),
  telephone: z.string().regex(phoneRegex, 'Numero de telephone invalide'),
  fax: z.string().regex(phoneRegex, 'Numero de fax invalide').optional().or(z.literal('')),
  email: z.string().email('Adresse email invalide'),
  siteWeb: z.string().url('URL invalide').optional().or(z.literal('')),
});

type LegalInfoFormData = z.infer<typeof legalInfoFormSchema>;

// List of French barreaux
const BARREAUX_OPTIONS = [
  { value: '', label: 'Selectionner un barreau' },
  { value: 'Barreau de Paris', label: 'Barreau de Paris' },
  { value: 'Barreau de Lyon', label: 'Barreau de Lyon' },
  { value: 'Barreau de Marseille', label: 'Barreau de Marseille' },
  { value: 'Barreau de Bordeaux', label: 'Barreau de Bordeaux' },
  { value: 'Barreau de Lille', label: 'Barreau de Lille' },
  { value: 'Barreau de Nantes', label: 'Barreau de Nantes' },
  { value: 'Barreau de Toulouse', label: 'Barreau de Toulouse' },
  { value: 'Barreau de Nice', label: 'Barreau de Nice' },
  { value: 'Barreau de Strasbourg', label: 'Barreau de Strasbourg' },
  { value: 'Barreau de Montpellier', label: 'Barreau de Montpellier' },
  { value: 'Barreau de Rennes', label: 'Barreau de Rennes' },
  { value: 'Barreau du Mans', label: 'Barreau du Mans' },
  { value: 'Barreau de Grenoble', label: 'Barreau de Grenoble' },
  { value: 'Barreau de Rouen', label: 'Barreau de Rouen' },
  { value: 'Barreau de Toulon', label: 'Barreau de Toulon' },
  { value: 'Autre', label: 'Autre (saisie libre)' },
];

interface LegalInfoFormProps {
  legalInfo?: AvocatLegalInfo | null;
  onSubmit: (data: LegalInfoFormData) => Promise<void>;
  isLoading?: boolean;
}

export const LegalInfoForm: React.FC<LegalInfoFormProps> = ({
  legalInfo,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LegalInfoFormData>({
    resolver: zodResolver(legalInfoFormSchema),
    defaultValues: {
      civilite: 'MAITRE',
      prenom: '',
      nom: '',
      barreau: '',
      numeroToque: '',
      adresseCabinet: '',
      codePostal: '',
      ville: '',
      telephone: '',
      fax: '',
      email: '',
      siteWeb: '',
    },
  });

  const selectedBarreau = watch('barreau');
  const showCustomBarreau = selectedBarreau === 'Autre';

  // Load existing data
  useEffect(() => {
    if (legalInfo) {
      setValue('civilite', legalInfo.civilite);
      setValue('prenom', legalInfo.prenom);
      setValue('nom', legalInfo.nom);
      setValue('barreau', BARREAUX_OPTIONS.some(b => b.value === legalInfo.barreau)
        ? legalInfo.barreau
        : 'Autre');
      setValue('numeroToque', legalInfo.numeroToque || '');
      setValue('adresseCabinet', legalInfo.adresseCabinet);
      setValue('codePostal', legalInfo.codePostal);
      setValue('ville', legalInfo.ville);
      setValue('telephone', legalInfo.telephone);
      setValue('fax', legalInfo.fax || '');
      setValue('email', legalInfo.email);
      setValue('siteWeb', legalInfo.siteWeb || '');
    }
  }, [legalInfo, setValue]);

  const handleFormSubmit = async (data: LegalInfoFormData) => {
    // Clean up empty strings to null
    const cleanedData = {
      ...data,
      numeroToque: data.numeroToque || null,
      fax: data.fax || null,
      siteWeb: data.siteWeb || null,
    };
    await onSubmit(cleanedData as LegalInfoFormData);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Civilite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Civilite <span className="text-red-500">*</span>
          </label>
          <Controller
            name="civilite"
            control={control}
            render={({ field }) => (
              <div className="flex gap-6">
                {[
                  { value: 'MAITRE', label: 'Maitre' },
                  { value: 'MONSIEUR', label: 'Monsieur' },
                  { value: 'MADAME', label: 'Madame' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      checked={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prenom"
            placeholder="Jean"
            error={errors.prenom?.message}
            required
            {...register('prenom')}
          />
          <Input
            label="Nom"
            placeholder="DUPONT"
            error={errors.nom?.message}
            required
            {...register('nom')}
          />
        </div>

        {/* Barreau */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="barreau"
            control={control}
            render={({ field }) => (
              <Select
                label="Barreau"
                options={BARREAUX_OPTIONS}
                error={errors.barreau?.message}
                required
                {...field}
              />
            )}
          />
          {showCustomBarreau && (
            <Input
              label="Nom du barreau"
              placeholder="Barreau de..."
              error={errors.barreau?.message}
              required
              {...register('barreau')}
            />
          )}
          <Input
            label="Numero de toque"
            placeholder="P0001"
            error={errors.numeroToque?.message}
            {...register('numeroToque')}
          />
        </div>

        {/* Address */}
        <Input
          label="Adresse du cabinet"
          placeholder="15 rue de la Republique"
          error={errors.adresseCabinet?.message}
          required
          {...register('adresseCabinet')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Code postal"
            placeholder="75001"
            maxLength={5}
            error={errors.codePostal?.message}
            required
            {...register('codePostal')}
          />
          <Input
            label="Ville"
            placeholder="Paris"
            error={errors.ville?.message}
            required
            {...register('ville')}
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Telephone"
            placeholder="01 23 45 67 89"
            error={errors.telephone?.message}
            required
            {...register('telephone')}
          />
          <Input
            label="Fax"
            placeholder="01 23 45 67 90"
            error={errors.fax?.message}
            {...register('fax')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="avocat@cabinet.fr"
            error={errors.email?.message}
            required
            {...register('email')}
          />
          <Input
            label="Site web"
            type="url"
            placeholder="https://www.cabinet-avocat.fr"
            error={errors.siteWeb?.message}
            {...register('siteWeb')}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            isLoading={isSubmitting || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LegalInfoForm;
