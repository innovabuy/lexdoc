import React, { useState, ChangeEvent } from 'react';
import { Scale, Eye, RotateCcw, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import type { LegalMentions } from '@/lib/types/documentBuilder';

// Font options
const FONT_OPTIONS = [
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Courier New', label: 'Courier New' },
];

// Font size options
const FONT_SIZE_OPTIONS = [
  { value: '8', label: '8pt' },
  { value: '9', label: '9pt' },
  { value: '10', label: '10pt' },
  { value: '11', label: '11pt' },
  { value: '12', label: '12pt' },
];

// Position options
const POSITION_OPTIONS = [
  { value: 'header', label: 'En-tete' },
  { value: 'footer', label: 'Pied de page' },
  { value: 'both', label: 'En-tete et pied de page' },
];

// Display options interface
interface DisplayOptions {
  showBarreau: boolean;
  showNumeroToque: boolean;
  showOrdre: boolean;
  showAdresse: boolean;
  showTelephone: boolean;
  showEmail: boolean;
}

// Config interface
export interface LegalMentionsConfigData {
  legalMentions: LegalMentions;
  displayOptions: DisplayOptions;
  position: string;
  fontFamily: string;
  fontSize: string;
  customTemplate?: string;
}

interface LegalMentionsConfigProps {
  config: LegalMentionsConfigData;
  onChange: (config: LegalMentionsConfigData) => void;
}

// Default config
export const DEFAULT_LEGAL_MENTIONS_CONFIG: LegalMentionsConfigData = {
  legalMentions: {
    header: '',
    footer: '',
    confidentiality: true,
    customMentions: [],
  },
  displayOptions: {
    showBarreau: true,
    showNumeroToque: false,
    showOrdre: true,
    showAdresse: true,
    showTelephone: true,
    showEmail: true,
  },
  position: 'footer',
  fontFamily: 'Times New Roman',
  fontSize: '9',
};

export const LegalMentionsConfig: React.FC<LegalMentionsConfigProps> = ({
  config,
  onChange,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const updateConfig = (updates: Partial<LegalMentionsConfigData>) => {
    onChange({ ...config, ...updates });
  };

  const updateLegalMentions = (updates: Partial<LegalMentions>) => {
    onChange({
      ...config,
      legalMentions: { ...config.legalMentions, ...updates },
    });
  };

  const updateDisplayOptions = (updates: Partial<DisplayOptions>) => {
    onChange({
      ...config,
      displayOptions: { ...config.displayOptions, ...updates },
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_LEGAL_MENTIONS_CONFIG);
  };

  // Generate preview text
  const generatePreview = () => {
    const parts: string[] = [];

    parts.push('Maitre {{avocat.prenom}} {{avocat.nom}}');

    if (config.displayOptions.showBarreau) {
      parts.push('Barreau de {{avocat.barreau}}');
    }
    if (config.displayOptions.showNumeroToque) {
      parts.push('Toque n{{avocat.numero_toque}}');
    }
    if (config.displayOptions.showAdresse) {
      parts.push('{{avocat.adresse}}, {{avocat.code_postal}} {{avocat.ville}}');
    }
    if (config.displayOptions.showTelephone) {
      parts.push('Tel: {{avocat.telephone}}');
    }
    if (config.displayOptions.showEmail) {
      parts.push('Email: {{avocat.email}}');
    }

    return parts.join('\n');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Mentions legales
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Masquer apercu' : 'Apercu'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reinitialiser
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Display Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Elements a afficher</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showBarreau}
                onChange={(e) => updateDisplayOptions({ showBarreau: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Barreau</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showNumeroToque}
                onChange={(e) => updateDisplayOptions({ showNumeroToque: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Numero de toque</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showOrdre}
                onChange={(e) => updateDisplayOptions({ showOrdre: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Ordre des avocats</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showAdresse}
                onChange={(e) => updateDisplayOptions({ showAdresse: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Adresse</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showTelephone}
                onChange={(e) => updateDisplayOptions({ showTelephone: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Telephone</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.displayOptions.showEmail}
                onChange={(e) => updateDisplayOptions({ showEmail: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Email</span>
            </label>
          </div>
        </div>

        {/* Position & Styling */}
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Position"
            value={config.position}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateConfig({ position: e.target.value })}
            options={POSITION_OPTIONS}
          />
          <Select
            label="Police"
            value={config.fontFamily}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateConfig({ fontFamily: e.target.value })}
            options={FONT_OPTIONS}
          />
          <Select
            label="Taille"
            value={config.fontSize}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateConfig({ fontSize: e.target.value })}
            options={FONT_SIZE_OPTIONS}
          />
        </div>

        {/* Confidentiality */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.legalMentions.confidentiality || false}
              onChange={(e) => updateLegalMentions({ confidentiality: e.target.checked })}
              className="rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">
              Ajouter mention de confidentialite
            </span>
          </label>
        </div>

        {/* Custom Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texte personnalise (optionnel)
          </label>
          <textarea
            value={config.customTemplate || ''}
            onChange={(e) => updateConfig({ customTemplate: e.target.value })}
            placeholder="Maitre {{avocat.nom}}, Avocat au Barreau de {{avocat.barreau}}..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Utilisez les variables entre double accolades: {`{{avocat.nom}}, {{avocat.barreau}}`}
          </p>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Apercu des mentions</span>
            </div>
            <div
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              style={{
                fontFamily: config.fontFamily,
                fontSize: `${config.fontSize}pt`,
              }}
            >
              {config.customTemplate ? (
                <pre className="whitespace-pre-wrap text-gray-700">
                  {config.customTemplate}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap text-gray-700">
                  {generatePreview()}
                </pre>
              )}
              {config.legalMentions.confidentiality && (
                <p className="mt-3 pt-3 border-t border-gray-300 text-gray-600 italic">
                  Ce document est confidentiel et destine exclusivement a son destinataire.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LegalMentionsConfig;
