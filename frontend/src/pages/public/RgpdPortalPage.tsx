import React, { useState } from 'react';
import {
  Shield,
  Eye,
  Edit,
  Trash2,
  Download,
  Lock,
  Ban,
  ArrowLeft,
  Send,
  CheckCircle,
  Info,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';

type RgpdRequestType =
  | 'ACCESS'
  | 'RECTIFICATION'
  | 'ERASURE'
  | 'PORTABILITY'
  | 'RESTRICTION'
  | 'OPPOSITION';

interface RgpdRight {
  type: RgpdRequestType;
  icon: React.ElementType;
  title: string;
  description: string;
  article: string;
}

const RGPD_RIGHTS: RgpdRight[] = [
  {
    type: 'ACCESS',
    icon: Eye,
    title: "Droit d'acces",
    description: 'Obtenir une copie de toutes vos donnees personnelles',
    article: 'Art. 15 RGPD',
  },
  {
    type: 'RECTIFICATION',
    icon: Edit,
    title: 'Droit de rectification',
    description: 'Corriger vos donnees inexactes ou incompletes',
    article: 'Art. 16 RGPD',
  },
  {
    type: 'ERASURE',
    icon: Trash2,
    title: "Droit a l'effacement",
    description: 'Supprimer vos donnees (sous certaines conditions)',
    article: 'Art. 17 RGPD',
  },
  {
    type: 'PORTABILITY',
    icon: Download,
    title: 'Droit a la portabilite',
    description: 'Recuperer vos donnees dans un format lisible par machine',
    article: 'Art. 20 RGPD',
  },
  {
    type: 'RESTRICTION',
    icon: Lock,
    title: 'Droit a la limitation',
    description: 'Limiter le traitement de vos donnees',
    article: 'Art. 18 RGPD',
  },
  {
    type: 'OPPOSITION',
    icon: Ban,
    title: "Droit d'opposition",
    description: "Vous opposer au traitement de vos donnees",
    article: 'Art. 21 RGPD',
  },
];

export const RgpdPortalPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<RgpdRequestType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    details: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/rgpd/requests', {
        type: selectedType,
        email: formData.email,
        name: formData.name || undefined,
        details: formData.details || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Une erreur est survenue. Veuillez reessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setFormData({ email: '', name: '', details: '' });
    setError(null);
  };

  const handleReset = () => {
    setSelectedType(null);
    setFormData({ email: '', name: '', details: '' });
    setIsSubmitted(false);
    setError(null);
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="p-8 text-center">
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Demande envoyee
            </h1>
            <p className="text-gray-600 mb-6">
              Un email de verification a ete envoye a <strong>{formData.email}</strong>.
              Veuillez cliquer sur le lien pour confirmer votre demande.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Conformement au RGPD, votre demande sera traitee dans un delai
                  maximum de <strong>1 mois</strong>.
                </p>
              </div>
            </div>
            <Button onClick={handleReset} variant="outline">
              Faire une autre demande
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Request form
  if (selectedType) {
    const selectedRight = RGPD_RIGHTS.find((r) => r.type === selectedType);

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              {selectedRight && (
                <div className="bg-primary-100 rounded-full p-2">
                  <selectedRight.icon className="h-6 w-6 text-primary-600" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedRight?.title}
                </h1>
                <p className="text-sm text-gray-500">{selectedRight?.article}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Votre email *"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="exemple@email.com"
                required
              />

              <Input
                label="Votre nom"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nom et prenom"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details de votre demande
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Precisez votre demande si necessaire..."
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Par mesure de securite, nous vous enverrons un email de
                    verification avant de traiter votre demande.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!formData.email}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer ma demande
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Rights selection
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary-100 rounded-full p-4 w-fit mb-4">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion de mes donnees personnelles
          </h1>
          <p className="text-gray-600 mt-2">
            Exercez vos droits RGPD en toute simplicite
          </p>
        </div>

        <Card className="p-6 mb-6">
          <p className="text-gray-600 mb-6">
            Conformement au Reglement General sur la Protection des Donnees (RGPD),
            vous disposez de plusieurs droits sur vos donnees personnelles.
            Selectionnez le droit que vous souhaitez exercer.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {RGPD_RIGHTS.map((right) => (
              <button
                key={right.type}
                onClick={() => setSelectedType(right.type)}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <div className="bg-gray-100 rounded-lg p-2">
                  <right.icon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{right.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {right.description}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 inline-block">
                    {right.article}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Nous traiterons votre demande dans un delai maximum de{' '}
              <strong>1 mois</strong> conformement a la reglementation RGPD.
              Ce delai peut etre prolonge de 2 mois supplementaires pour les
              demandes complexes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RgpdPortalPage;
