import React, { useState } from 'react';
import { User, PenTool, Scale, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/Spinner';
import {
  useMyLegalInfo,
  useCreateLegalInfo,
  useUpdateLegalInfo,
  useUploadSignature,
  useUploadCachet,
} from '@/hooks/useAvocatLegalInfo';
import type { CreateAvocatLegalInfoInput, UpdateAvocatLegalInfoInput } from '@/lib/api/avocatLegalInfo';

import LegalInfoForm from './components/LegalInfoForm';
import SignatureUpload from './components/SignatureUpload';
import CachetUpload from './components/CachetUpload';
import MentionsPreview from './components/MentionsPreview';

type TabId = 'informations' | 'signature' | 'mentions';

export const AvocatLegalInfoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('informations');

  // Hooks
  const { data: legalInfo, isLoading, error } = useMyLegalInfo();
  const createLegalInfoMutation = useCreateLegalInfo();
  const updateLegalInfoMutation = useUpdateLegalInfo();
  const uploadSignatureMutation = useUploadSignature();
  const uploadCachetMutation = useUploadCachet();

  // Handlers
  const handleInfoSubmit = async (data: CreateAvocatLegalInfoInput | UpdateAvocatLegalInfoInput) => {
    if (legalInfo?.id) {
      await updateLegalInfoMutation.mutateAsync({
        id: legalInfo.id,
        input: data as UpdateAvocatLegalInfoInput,
      });
    } else {
      await createLegalInfoMutation.mutateAsync(data as CreateAvocatLegalInfoInput);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    if (!legalInfo?.id) {
      alert('Veuillez d\'abord enregistrer vos informations legales.');
      return;
    }
    await uploadSignatureMutation.mutateAsync({ id: legalInfo.id, file });
  };

  const handleCachetUpload = async (file: File) => {
    if (!legalInfo?.id) {
      alert('Veuillez d\'abord enregistrer vos informations legales.');
      return;
    }
    await uploadCachetMutation.mutateAsync({ id: legalInfo.id, file });
  };

  const handleMentionsSave = async (config: unknown) => {
    if (!legalInfo?.id) {
      alert('Veuillez d\'abord enregistrer vos informations legales.');
      return;
    }
    await updateLegalInfoMutation.mutateAsync({
      id: legalInfo.id,
      input: { mentionsLegalesDefaut: config as Record<string, unknown> },
    });
  };

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'informations', label: 'Informations', icon: <User className="h-4 w-4" /> },
    { id: 'signature', label: 'Signature', icon: <PenTool className="h-4 w-4" /> },
    { id: 'mentions', label: 'Mentions', icon: <Scale className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement du profil legal..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600">
            Une erreur est survenue lors du chargement de votre profil legal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil legal</h1>
        <p className="text-gray-600 mt-1">
          Configurez vos informations professionnelles pour la generation de documents
        </p>
      </div>

      {/* Tabs */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Informations Tab */}
          {activeTab === 'informations' && (
            <LegalInfoForm
              legalInfo={legalInfo}
              onSubmit={handleInfoSubmit}
              isLoading={createLegalInfoMutation.isPending || updateLegalInfoMutation.isPending}
            />
          )}

          {/* Signature Tab */}
          {activeTab === 'signature' && (
            <div className="space-y-6">
              {!legalInfo?.id && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Veuillez d'abord enregistrer vos informations legales dans l'onglet
                    "Informations" avant de pouvoir telecharger votre signature et cachet.
                  </p>
                </div>
              )}

              <SignatureUpload
                label="Signature manuscrite scannee"
                description="Cette signature sera utilisee pour les documents generes. Nous recommandons un fond transparent (PNG)."
                currentImageUrl={legalInfo?.signatureUrl}
                onUpload={handleSignatureUpload}
                isUploading={uploadSignatureMutation.isPending}
              />

              <CachetUpload
                currentImageUrl={legalInfo?.cachetUrl}
                onUpload={handleCachetUpload}
                isUploading={uploadCachetMutation.isPending}
              />
            </div>
          )}

          {/* Mentions Tab */}
          {activeTab === 'mentions' && (
            <div>
              {!legalInfo?.id && (
                <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Veuillez d'abord enregistrer vos informations legales dans l'onglet
                    "Informations" pour voir l'apercu des mentions.
                  </p>
                </div>
              )}

              <MentionsPreview
                legalInfo={legalInfo}
                onSave={handleMentionsSave}
                isLoading={updateLegalInfoMutation.isPending}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AvocatLegalInfoPage;
