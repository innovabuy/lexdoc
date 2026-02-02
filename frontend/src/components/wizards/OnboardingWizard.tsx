import { useState, useEffect, ChangeEvent } from 'react';
import {
  RocketLaunchIcon,
  UserCircleIcon,
  ScaleIcon,
  FolderPlusIcon,
  MapIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { WizardContainer, WizardCard, WizardFormSection } from './WizardContainer';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useWizard } from '@/hooks/useWizard';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingWizardProps {
  onComplete?: () => void;
  onClose?: () => void;
}

const STEPS = [
  { id: 0, title: 'Bienvenue' },
  { id: 1, title: 'Profil' },
  { id: 2, title: 'Informations' },
  { id: 3, title: 'Client' },
  { id: 4, title: 'Dossier' },
  { id: 5, title: 'Visite' },
  { id: 6, title: 'Termine' },
];

const SPECIALITES = [
  { value: 'DROIT_AFFAIRES', label: 'Droit des affaires' },
  { value: 'DROIT_FAMILLE', label: 'Droit de la famille' },
  { value: 'DROIT_PENAL', label: 'Droit penal' },
  { value: 'DROIT_TRAVAIL', label: 'Droit du travail' },
  { value: 'DROIT_IMMOBILIER', label: 'Droit immobilier' },
  { value: 'DROIT_FISCAL', label: 'Droit fiscal' },
  { value: 'DROIT_SOCIAL', label: 'Droit social' },
  { value: 'AUTRE', label: 'Autre' },
];

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const { user } = useAuth();
  const {
    currentStep,
    data,
    isFirst,
    isLast,
    isUpdating,
    isCompleting,
    nextStep,
    prevStep,
    complete,
    skip,
  } = useWizard('ONBOARDING');

  const [formData, setFormData] = useState({
    // Profile
    firstName: '',
    lastName: '',
    phone: '',
    // Legal info
    barreau: '',
    specialite: '',
    siret: '',
    toque: '',
    // First client
    clientNom: '',
    clientPrenom: '',
    clientEmail: '',
    // First folder
    folderName: '',
    folderType: 'AFFAIRE_GENERALE',
  });

  // Load saved data
  useEffect(() => {
    if (data && typeof data === 'object') {
      setFormData((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  // Pre-fill from user
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
      }));
    }
  }, [user]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    await nextStep(formData);
  };

  const handlePrev = async () => {
    await prevStep();
  };

  const handleComplete = async () => {
    await complete();
    onComplete?.();
  };

  const handleSkip = async () => {
    await skip();
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WizardCard
            icon={<RocketLaunchIcon className="h-8 w-8" />}
            title="Bienvenue sur LexDoc !"
            description="Nous allons vous guider pour configurer votre espace de travail en quelques etapes simples."
          >
            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <UserCircleIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completez votre profil</p>
                  <p className="text-sm text-gray-500">Personnalisez votre experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <ScaleIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Informations juridiques</p>
                  <p className="text-sm text-gray-500">Pour vos documents officiels</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <FolderPlusIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Creez votre premier dossier</p>
                  <p className="text-sm text-gray-500">Commencez a organiser vos affaires</p>
                </div>
              </div>
            </div>
          </WizardCard>
        );

      case 1:
        return (
          <WizardFormSection
            title="Completez votre profil"
            description="Ces informations nous permettent de personnaliser votre experience."
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prenom"
                value={formData.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('firstName', e.target.value)}
                placeholder="Jean"
              />
              <Input
                label="Nom"
                value={formData.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('lastName', e.target.value)}
                placeholder="Dupont"
              />
            </div>
            <Input
              label="Telephone"
              type="tel"
              value={formData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('phone', e.target.value)}
              placeholder="01 23 45 67 89"
              leftIcon={<PhoneIcon className="h-5 w-5" />}
            />
          </WizardFormSection>
        );

      case 2:
        return (
          <WizardFormSection
            title="Informations juridiques"
            description="Ces informations apparaitront sur vos documents officiels."
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Barreau"
                value={formData.barreau}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('barreau', e.target.value)}
                placeholder="Paris"
                leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
              />
              <Input
                label="Toque"
                value={formData.toque}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('toque', e.target.value)}
                placeholder="A0123"
              />
            </div>
            <Select
              label="Specialite principale"
              value={formData.specialite}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateFormData('specialite', e.target.value)}
              options={SPECIALITES}
            />
            <Input
              label="SIRET du cabinet"
              value={formData.siret}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('siret', e.target.value)}
              placeholder="123 456 789 00012"
            />
          </WizardFormSection>
        );

      case 3:
        return (
          <WizardFormSection
            title="Creez votre premier client"
            description="Ajoutez les informations de votre premier client. Vous pourrez les modifier plus tard."
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.clientNom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('clientNom', e.target.value)}
                placeholder="Martin"
              />
              <Input
                label="Prenom"
                value={formData.clientPrenom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('clientPrenom', e.target.value)}
                placeholder="Sophie"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.clientEmail}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('clientEmail', e.target.value)}
              placeholder="sophie.martin@email.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            />
            <p className="text-xs text-gray-500">
              Vous pouvez egalement passer cette etape et ajouter des clients plus tard.
            </p>
          </WizardFormSection>
        );

      case 4:
        return (
          <WizardFormSection
            title="Creez votre premier dossier"
            description="Organisez vos affaires en creant des dossiers pour chaque cas."
          >
            <Input
              label="Nom du dossier"
              value={formData.folderName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('folderName', e.target.value)}
              placeholder="Affaire Martin c/ Durand"
            />
            <Select
              label="Type de dossier"
              value={formData.folderType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateFormData('folderType', e.target.value)}
              options={[
                { value: 'AFFAIRE_GENERALE', label: 'Affaire generale' },
                { value: 'CONTENTIEUX_CIVIL', label: 'Contentieux civil' },
                { value: 'CONTENTIEUX_COMMERCIAL', label: 'Contentieux commercial' },
                { value: 'CONTENTIEUX_PRUDHOMMES', label: 'Contentieux prud\'hommes' },
                { value: 'DROIT_FAMILLE', label: 'Droit de la famille' },
                { value: 'DROIT_SOCIETES', label: 'Droit des societes' },
                { value: 'AUTRE', label: 'Autre' },
              ]}
            />
            <p className="text-xs text-gray-500">
              Vous pouvez egalement passer cette etape et creer des dossiers plus tard.
            </p>
          </WizardFormSection>
        );

      case 5:
        return (
          <WizardCard
            icon={<MapIcon className="h-8 w-8" />}
            title="Decouvrez LexDoc"
            description="Voici un apercu des principales fonctionnalites disponibles."
          >
            <div className="mt-8 grid grid-cols-2 gap-4 text-left">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Gestion des dossiers</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Organisez vos affaires avec une arborescence intuitive
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Generation de documents</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Creez des documents a partir de modeles personnalisables
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Signature electronique</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Faites signer vos documents en quelques clics
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Envoi LRAR</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Envoyez des courriers recommandes directement
                </p>
              </div>
            </div>
          </WizardCard>
        );

      case 6:
        return (
          <WizardCard
            icon={<CheckCircleIcon className="h-8 w-8" />}
            title="Configuration terminee !"
            description="Votre espace de travail est pret. Vous pouvez maintenant commencer a utiliser LexDoc."
          >
            <div className="mt-8 space-y-4">
              <div className="rounded-lg bg-primary-50 p-4 text-left">
                <h4 className="font-medium text-primary-900">Prochaines etapes suggerees</h4>
                <ul className="mt-2 space-y-2 text-sm text-primary-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                    Explorez la bibliotheque de modeles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                    Importez vos documents existants
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                    Configurez vos preferences de cabinet
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                Vous pouvez toujours acceder aux assistants depuis le menu Aide.
              </p>
            </div>
          </WizardCard>
        );

      default:
        return null;
    }
  };

  return (
    <WizardContainer
      title="Configuration initiale"
      subtitle={`Etape ${currentStep + 1} sur ${STEPS.length}`}
      steps={STEPS}
      currentStep={currentStep}
      onClose={handleClose}
      onSkip={handleSkip}
      onPrev={handlePrev}
      onNext={handleNext}
      onComplete={handleComplete}
      isFirst={isFirst}
      isLast={isLast}
      isLoading={isUpdating || isCompleting}
      showSkip={currentStep < 3}
      completeLabel="Commencer"
    >
      {renderStep()}
    </WizardContainer>
  );
}
