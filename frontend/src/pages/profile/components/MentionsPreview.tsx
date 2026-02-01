import React, { useState, useEffect, ChangeEvent } from 'react';
import { Eye, RotateCcw, Save, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import type { AvocatLegalInfo } from '@/lib/api/avocatLegalInfo';

// Display options interface
interface DisplayOptions {
  showBarreau: boolean;
  showOrdre: boolean;
  showNumeroToque: boolean;
  showSiret: boolean;
  showTva: boolean;
  showAssurance: boolean;
}

// Mentions config interface
interface MentionsConfig {
  displayOptions: DisplayOptions;
  position: 'header' | 'footer' | 'both';
  fontFamily: string;
  fontSize: string;
  color: string;
  customTemplate: string;
}

// Default config
const DEFAULT_CONFIG: MentionsConfig = {
  displayOptions: {
    showBarreau: true,
    showOrdre: true,
    showNumeroToque: false,
    showSiret: false,
    showTva: false,
    showAssurance: true,
  },
  position: 'footer',
  fontFamily: 'Times New Roman',
  fontSize: '9',
  color: '#000000',
  customTemplate: `Maitre {{avocat.prenom}} {{avocat.nom}}
Avocat au Barreau de {{avocat.barreau}}
{{avocat.adresse}}, {{avocat.code_postal}} {{avocat.ville}}
Tel: {{avocat.telephone}}{{#if avocat.email}} - Email: {{avocat.email}}{{/if}}`,
};

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

interface MentionsPreviewProps {
  legalInfo?: AvocatLegalInfo | null;
  initialConfig?: MentionsConfig;
  onSave: (config: unknown) => Promise<void>;
  isLoading?: boolean;
}

export const MentionsPreview: React.FC<MentionsPreviewProps> = ({
  legalInfo,
  initialConfig,
  onSave,
  isLoading = false,
}) => {
  const [config, setConfig] = useState<MentionsConfig>(initialConfig || DEFAULT_CONFIG);
  const [showPreview, setShowPreview] = useState(true);

  // Load initial config from legalInfo if available
  useEffect(() => {
    if (legalInfo?.mentionsLegalesDefaut && Object.keys(legalInfo.mentionsLegalesDefaut).length > 0) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...(legalInfo.mentionsLegalesDefaut as Partial<MentionsConfig>),
      });
    }
  }, [legalInfo]);

  const updateConfig = (updates: Partial<MentionsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateDisplayOptions = (updates: Partial<DisplayOptions>) => {
    setConfig((prev) => ({
      ...prev,
      displayOptions: { ...prev.displayOptions, ...updates },
    }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSave = async () => {
    await onSave(config);
  };

  // Generate preview text with variable replacement
  const generatePreview = (): string => {
    if (!legalInfo) {
      return 'Veuillez d\'abord remplir vos informations legales.';
    }

    let text = config.customTemplate;

    // Replace variables
    const replacements: Record<string, string> = {
      '{{avocat.civilite}}': legalInfo.civilite === 'MAITRE' ? 'Maitre' : legalInfo.civilite === 'MONSIEUR' ? 'Monsieur' : 'Madame',
      '{{avocat.prenom}}': legalInfo.prenom,
      '{{avocat.nom}}': legalInfo.nom,
      '{{avocat.barreau}}': legalInfo.barreau,
      '{{avocat.numero_toque}}': legalInfo.numeroToque || '',
      '{{avocat.adresse}}': legalInfo.adresseCabinet,
      '{{avocat.code_postal}}': legalInfo.codePostal,
      '{{avocat.ville}}': legalInfo.ville,
      '{{avocat.telephone}}': legalInfo.telephone,
      '{{avocat.fax}}': legalInfo.fax || '',
      '{{avocat.email}}': legalInfo.email,
      '{{avocat.site_web}}': legalInfo.siteWeb || '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Handle simple conditionals
    text = text.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, condition, content) => {
      const conditionKey = condition.trim();
      const value = replacements[`{{${conditionKey}}}`];
      return value ? content : '';
    });

    return text;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configuration des mentions legales</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Masquer apercu' : 'Apercu'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reinitialiser
            </Button>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Afficher dans les documents</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'showBarreau', label: 'Barreau' },
              { key: 'showOrdre', label: 'Ordre' },
              { key: 'showNumeroToque', label: 'N de toque' },
              { key: 'showSiret', label: 'SIRET' },
              { key: 'showTva', label: 'N TVA' },
              { key: 'showAssurance', label: 'Assurance' },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.displayOptions[option.key as keyof DisplayOptions]}
                  onChange={(e) =>
                    updateDisplayOptions({ [option.key]: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Style Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label="Position"
            value={config.position}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateConfig({ position: e.target.value as 'header' | 'footer' | 'both' })
            }
            options={POSITION_OPTIONS}
          />
          <Select
            label="Police"
            value={config.fontFamily}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateConfig({ fontFamily: e.target.value })
            }
            options={FONT_OPTIONS}
          />
          <Select
            label="Taille"
            value={config.fontSize}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateConfig({ fontSize: e.target.value })
            }
            options={FONT_SIZE_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* Custom Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texte des mentions
          </label>
          <textarea
            value={config.customTemplate}
            onChange={(e) => updateConfig({ customTemplate: e.target.value })}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Maitre {{avocat.prenom}} {{avocat.nom}}..."
          />
          <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Variables disponibles:</p>
              <p className="mt-1">
                {`{{avocat.civilite}}, {{avocat.prenom}}, {{avocat.nom}}, {{avocat.barreau}}, {{avocat.numero_toque}}, {{avocat.adresse}}, {{avocat.code_postal}}, {{avocat.ville}}, {{avocat.telephone}}, {{avocat.fax}}, {{avocat.email}}, {{avocat.site_web}}`}
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Apercu</h4>
            <div
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              style={{
                fontFamily: config.fontFamily,
                fontSize: `${config.fontSize}pt`,
                color: config.color,
              }}
            >
              <pre className="whitespace-pre-wrap">{generatePreview()}</pre>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={isLoading} isLoading={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les mentions
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MentionsPreview;
