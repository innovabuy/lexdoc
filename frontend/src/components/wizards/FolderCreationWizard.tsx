import { useState, useEffect, ChangeEvent } from 'react';
import {
  UserGroupIcon,
  TagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { WizardContainer, WizardCard, WizardFormSection } from './WizardContainer';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ClientSelector } from '@/components/folders/ClientSelector';
import { useWizard } from '@/hooks/useWizard';
import { useCreateFolder } from '@/hooks/useFolders';
import type { Client } from '@/lib/api/clients';
import type { FolderType } from '@/lib/types';

interface FolderCreationWizardProps {
  onComplete?: (folderId: string) => void;
  onClose?: () => void;
  initialClient?: Client;
}

const STEPS = [
  { id: 0, title: 'Type' },
  { id: 1, title: 'Client' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Metadonnees' },
  { id: 4, title: 'Resume' },
];

const FOLDER_TYPES: { value: FolderType; label: string; description: string }[] = [
  { value: 'AFFAIRE_GENERALE', label: 'Affaire generale', description: 'Dossier sans categorie specifique' },
  { value: 'CONTENTIEUX_CIVIL', label: 'Contentieux civil', description: 'Litiges civils' },
  { value: 'CONTENTIEUX_COMMERCIAL', label: 'Contentieux commercial', description: 'Litiges commerciaux' },
  { value: 'CONTENTIEUX_PRUDHOMMES', label: 'Prud\'hommes', description: 'Contentieux du travail' },
  { value: 'DROIT_FAMILLE', label: 'Droit de la famille', description: 'Divorce, garde, succession' },
  { value: 'DROIT_SOCIETES', label: 'Droit des societes', description: 'Creation, cession, fusion' },
  { value: 'IMMOBILIER_VENTE', label: 'Immobilier vente', description: 'Transactions immobilieres' },
  { value: 'AUTRE', label: 'Autre', description: 'Autre type de dossier' },
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Normale' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Urgente' },
];

export function FolderCreationWizard({
  onComplete,
  onClose,
  initialClient,
}: FolderCreationWizardProps) {
  const createFolder = useCreateFolder();
  const {
    currentStep,
    data,
    isFirst,
    isLast,
    isUpdating,
    nextStep,
    prevStep,
    complete,
  } = useWizard('FOLDER_CREATION');

  const [formData, setFormData] = useState({
    name: '',
    folderType: 'AFFAIRE_GENERALE' as FolderType,
    reference: '',
    description: '',
    urgency: 'LOW',
    tags: '',
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient || null);
  const [isCreating, setIsCreating] = useState(false);

  // Load saved data
  useEffect(() => {
    if (data && typeof data === 'object') {
      const savedData = data as Record<string, unknown>;
      setFormData((prev) => ({
        ...prev,
        name: (savedData.name as string) || prev.name,
        folderType: (savedData.folderType as FolderType) || prev.folderType,
        reference: (savedData.reference as string) || prev.reference,
        description: (savedData.description as string) || prev.description,
        urgency: (savedData.urgency as string) || prev.urgency,
        tags: (savedData.tags as string) || prev.tags,
      }));
    }
  }, [data]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    await nextStep({ ...formData, clientId: selectedClient?.id });
  };

  const handlePrev = async () => {
    await prevStep();
  };

  const handleComplete = async () => {
    setIsCreating(true);
    try {
      const folder = await createFolder.mutateAsync({
        name: formData.name,
        folderType: formData.folderType,
        clientId: selectedClient?.id || null,
        description: formData.description || undefined,
        metadata: {
          reference: formData.reference || undefined,
          urgency: formData.urgency,
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        },
      });
      await complete();
      onComplete?.(folder.id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.folderType;
      case 1:
        return true; // Client is optional
      case 2:
        return !!formData.name;
      case 3:
        return true;
      case 4:
        return !!formData.name && !!formData.folderType;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WizardFormSection
            title="Type de dossier"
            description="Selectionnez le type de dossier que vous souhaitez creer."
          >
            <div className="grid grid-cols-2 gap-3">
              {FOLDER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateFormData('folderType', type.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    formData.folderType === type.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </WizardFormSection>
        );

      case 1:
        return (
          <WizardFormSection
            title="Client associe"
            description="Associez ce dossier a un client existant ou creez-en un nouveau."
          >
            <ClientSelector
              selectedClientId={selectedClient?.id || null}
              selectedClient={selectedClient}
              onSelect={handleClientSelect}
            />
            {selectedClient && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedClient.prenom} {selectedClient.nom}
                    </p>
                    {selectedClient.email && (
                      <p className="text-sm text-gray-500">{selectedClient.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Vous pouvez egalement laisser ce champ vide et associer un client plus tard.
            </p>
          </WizardFormSection>
        );

      case 2:
        return (
          <WizardFormSection
            title="Details du dossier"
            description="Renseignez les informations principales du dossier."
          >
            <Input
              label="Nom du dossier"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('name', e.target.value)}
              placeholder="Affaire Martin c/ Durand"
              required
            />
            <Input
              label="Reference interne"
              value={formData.reference}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('reference', e.target.value)}
              placeholder="2024/001"
              hint="Optionnel - Votre reference interne pour ce dossier"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Description de l'affaire..."
              />
            </div>
          </WizardFormSection>
        );

      case 3:
        return (
          <WizardFormSection
            title="Metadonnees"
            description="Ajoutez des informations supplementaires pour mieux organiser vos dossiers."
          >
            <Select
              label="Niveau d'urgence"
              value={formData.urgency}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateFormData('urgency', e.target.value)}
              options={URGENCY_OPTIONS}
            />
            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateFormData('tags', e.target.value)}
              placeholder="divorce, garde, pension"
              hint="Separez les tags par des virgules"
              leftIcon={<TagIcon className="h-5 w-5" />}
            />
          </WizardFormSection>
        );

      case 4:
        return (
          <WizardCard
            icon={<CheckCircleIcon className="h-8 w-8" />}
            title="Recapitulatif"
            description="Verifiez les informations avant de creer le dossier."
          >
            <div className="mt-6 space-y-4 text-left">
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Nom du dossier</p>
                  <p className="mt-1 text-gray-900">{formData.name || '-'}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Type</p>
                  <p className="mt-1 text-gray-900">
                    {FOLDER_TYPES.find((t) => t.value === formData.folderType)?.label}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Client</p>
                  <p className="mt-1 text-gray-900">
                    {selectedClient
                      ? `${selectedClient.prenom || ''} ${selectedClient.nom}`
                      : 'Aucun client associe'}
                  </p>
                </div>
                {formData.reference && (
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase text-gray-500">Reference</p>
                    <p className="mt-1 text-gray-900">{formData.reference}</p>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">Urgence</p>
                  <p className="mt-1 text-gray-900">
                    {URGENCY_OPTIONS.find((o) => o.value === formData.urgency)?.label}
                  </p>
                </div>
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
      title="Nouveau dossier"
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
      completeLabel="Creer le dossier"
    >
      {renderStep()}
    </WizardContainer>
  );
}
