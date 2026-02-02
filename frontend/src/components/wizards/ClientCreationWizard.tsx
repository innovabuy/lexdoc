import { useState, useEffect, ChangeEvent } from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { WizardContainer, WizardCard, WizardFormSection } from './WizardContainer';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useWizard } from '@/hooks/useWizard';
import { useCreateClient } from '@/hooks/useClients';
import type { ClientType, Civilite } from '@/lib/api/clients';

interface ClientCreationWizardProps {
  onComplete?: (clientId: string) => void;
  onClose?: () => void;
}

const STEPS = [
  { id: 0, title: 'Type' },
  { id: 1, title: 'Identite' },
  { id: 2, title: 'Resume' },
];

const CLIENT_TYPES: { value: ClientType; label: string; description: string }[] = [
  { value: 'PARTICULIER', label: 'Particulier', description: 'Personne physique' },
  { value: 'ENTREPRISE', label: 'Entreprise', description: 'Societe commerciale' },
  { value: 'ASSOCIATION', label: 'Association', description: 'Association loi 1901' },
  { value: 'COLLECTIVITE', label: 'Collectivite', description: 'Collectivite territoriale' },
];

const CIVILITES: { value: Civilite; label: string }[] = [
  { value: 'MONSIEUR', label: 'Monsieur' },
  { value: 'MADAME', label: 'Madame' },
  { value: 'MAITRE', label: 'Maitre' },
];

export function ClientCreationWizard({ onComplete, onClose }: ClientCreationWizardProps) {
  const createClient = useCreateClient();
  const {
    currentStep,
    data,
    isFirst,
    isLast,
    isUpdating,
    nextStep,
    prevStep,
    complete,
  } = useWizard('CLIENT_CREATION');

  const [formData, setFormData] = useState({
    type: 'PARTICULIER' as ClientType,
    civilite: 'MONSIEUR' as Civilite,
    nom: '',
    prenom: '',
    denomination: '',
    email: '',
    telephone: '',
    mobile: '',
    adresse: '',
    codePostal: '',
    ville: '',
    siret: '',
    formeJuridique: '',
    representant: '',
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Load saved data
  useEffect(() => {
    if (data && typeof data === 'object') {
      const savedData = data as Record<string, unknown>;
      setFormData((prev) => ({
        ...prev,
        type: (savedData.type as ClientType) || prev.type,
        civilite: (savedData.civilite as Civilite) || prev.civilite,
        nom: (savedData.nom as string) || prev.nom,
        prenom: (savedData.prenom as string) || prev.prenom,
        denomination: (savedData.denomination as string) || prev.denomination,
        email: (savedData.email as string) || prev.email,
        telephone: (savedData.telephone as string) || prev.telephone,
        mobile: (savedData.mobile as string) || prev.mobile,
        adresse: (savedData.adresse as string) || prev.adresse,
        codePostal: (savedData.codePostal as string) || prev.codePostal,
        ville: (savedData.ville as string) || prev.ville,
        siret: (savedData.siret as string) || prev.siret,
        formeJuridique: (savedData.formeJuridique as string) || prev.formeJuridique,
        representant: (savedData.representant as string) || prev.representant,
      }));
    }
  }, [data]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEntreprise = formData.type === 'ENTREPRISE' || formData.type === 'ASSOCIATION';

  const handleNext = async () => {
    await nextStep(formData);
  };

  const handlePrev = async () => {
    await prevStep();
  };

  const handleComplete = async () => {
    setIsCreating(true);
    try {
      const client = await createClient.mutateAsync({
        type: formData.type,
        civilite: !isEntreprise ? formData.civilite : undefined,
        nom: formData.nom,
        prenom: !isEntreprise ? formData.prenom : undefined,
        denomination: isEntreprise ? formData.denomination : undefined,
        email: formData.email || undefined,
        telephone: formData.telephone || undefined,
        mobile: formData.mobile || undefined,
        adresse: formData.adresse || undefined,
        codePostal: formData.codePostal || undefined,
        ville: formData.ville || undefined,
        siret: formData.siret || undefined,
        formeJuridique: isEntreprise ? formData.formeJuridique : undefined,
        representant: isEntreprise ? formData.representant : undefined,
        notes: formData.notes || undefined,
      });
      await complete();
      onComplete?.(client.id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.type;
      case 1:
        if (isEntreprise) {
          return !!formData.denomination;
        }
        return !!formData.nom;
      case 2:
        return isEntreprise ? !!formData.denomination : !!formData.nom;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WizardFormSection
            title="Type de client"
            description="Selectionnez le type de client que vous souhaitez creer."
          >
            <div className="grid grid-cols-2 gap-3">
              {CLIENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateFormData('type', type.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    formData.type === type.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {type.value === 'PARTICULIER' ? (
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    ) : (
                      <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </WizardFormSection>
        );

      case 1:
        return (
          <WizardFormSection
            title={isEntreprise ? 'Informations de l\'entreprise' : 'Identite du client'}
            description={isEntreprise
              ? 'Renseignez les informations de la personne morale.'
              : 'Renseignez les coordonnees du client.'
            }
          >
            {isEntreprise ? (
              <>
                <Input
                  label="Denomination sociale"
                  value={formData.denomination}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('denomination', e.target.value)}
                  placeholder="SARL Dupont & Associes"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Forme juridique"
                    value={formData.formeJuridique}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('formeJuridique', e.target.value)}
                    placeholder="SARL, SAS, SA..."
                  />
                  <Input
                    label="SIRET"
                    value={formData.siret}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('siret', e.target.value)}
                    placeholder="123 456 789 00012"
                  />
                </div>
                <Input
                  label="Representant legal"
                  value={formData.representant}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('representant', e.target.value)}
                  placeholder="Jean Dupont, Gerant"
                />
              </>
            ) : (
              <>
                <Select
                  label="Civilite"
                  value={formData.civilite}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => updateFormData('civilite', e.target.value)}
                  options={CIVILITES}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    value={formData.nom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('nom', e.target.value)}
                    placeholder="Dupont"
                    required
                  />
                  <Input
                    label="Prenom"
                    value={formData.prenom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('prenom', e.target.value)}
                    placeholder="Jean"
                  />
                </div>
              </>
            )}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Coordonnees</h4>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('email', e.target.value)}
                placeholder="contact@example.com"
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('telephone', e.target.value)}
                  placeholder="01 23 45 67 89"
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                />
                <Input
                  label="Mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('mobile', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Adresse</h4>
              <Input
                label="Adresse"
                value={formData.adresse}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('adresse', e.target.value)}
                placeholder="123 rue de la Paix"
                leftIcon={<MapPinIcon className="h-5 w-5" />}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Code postal"
                  value={formData.codePostal}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('codePostal', e.target.value)}
                  placeholder="75001"
                />
                <Input
                  label="Ville"
                  value={formData.ville}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('ville', e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </WizardFormSection>
        );

      case 2:
        return (
          <WizardCard
            icon={<CheckCircleIcon className="h-8 w-8" />}
            title="Recapitulatif"
            description="Verifiez les informations avant de creer le client."
          >
            <div className="mt-6 space-y-4 text-left">
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Type</p>
                  <p className="mt-1 text-gray-900">
                    {CLIENT_TYPES.find((t) => t.value === formData.type)?.label}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {isEntreprise ? 'Denomination' : 'Nom'}
                  </p>
                  <p className="mt-1 text-gray-900">
                    {isEntreprise
                      ? formData.denomination
                      : `${formData.civilite === 'MONSIEUR' ? 'M.' : formData.civilite === 'MADAME' ? 'Mme' : 'Me'} ${formData.prenom} ${formData.nom}`}
                  </p>
                </div>
                {formData.email && (
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase text-gray-500">Email</p>
                    <p className="mt-1 text-gray-900">{formData.email}</p>
                  </div>
                )}
                {(formData.telephone || formData.mobile) && (
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase text-gray-500">Telephone</p>
                    <p className="mt-1 text-gray-900">
                      {formData.telephone || formData.mobile}
                    </p>
                  </div>
                )}
                {formData.ville && (
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase text-gray-500">Adresse</p>
                    <p className="mt-1 text-gray-900">
                      {formData.adresse && `${formData.adresse}, `}
                      {formData.codePostal} {formData.ville}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </WizardCard>
        );

      default:
        return null;
    }
  };

  return (
    <WizardContainer
      title="Nouveau client"
      subtitle={`Etape ${currentStep + 1} sur ${STEPS.length}`}
      steps={STEPS}
      currentStep={currentStep}
      onClose={handleClose}
      onPrev={handlePrev}
      onNext={handleNext}
      onComplete={handleComplete}
      isFirst={isFirst}
      isLast={isLast}
      isLoading={isUpdating || isCreating}
      canProceed={canProceed()}
      showSkip={false}
      completeLabel="Creer le client"
    >
      {renderStep()}
    </WizardContainer>
  );
}
