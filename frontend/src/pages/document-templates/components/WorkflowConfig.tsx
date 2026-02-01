import React, { ChangeEvent } from 'react';
import { Settings, PenTool, Mail, FolderOpen, Info } from 'lucide-react';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { WorkflowConfig as WorkflowConfigType } from '@/lib/types/documentBuilder';

// Signature profile options
const SIGNATURE_PROFILE_OPTIONS = [
  { value: 'DEFAULT', label: 'Signature simple' },
  { value: 'CERTIFIED', label: 'Signature certifiee' },
  { value: 'ADVANCED', label: 'Signature avancee (eIDAS)' },
];

interface WorkflowConfigProps {
  config: WorkflowConfigType;
  onChange: (config: WorkflowConfigType) => void;
}

export const WorkflowConfig: React.FC<WorkflowConfigProps> = ({
  config,
  onChange,
}) => {
  const updateSignature = (updates: Partial<NonNullable<WorkflowConfigType['signature']>>) => {
    onChange({
      ...config,
      signature: {
        enabled: config.signature?.enabled || false,
        ...config.signature,
        ...updates,
      },
    });
  };

  const updateLrar = (updates: Partial<NonNullable<WorkflowConfigType['lrar']>>) => {
    onChange({
      ...config,
      lrar: {
        enabled: config.lrar?.enabled || false,
        ...config.lrar,
        ...updates,
      },
    });
  };

  const updateAutoStore = (updates: Partial<NonNullable<WorkflowConfigType['autoStore']>>) => {
    onChange({
      ...config,
      autoStore: {
        enabled: config.autoStore?.enabled || false,
        ...config.autoStore,
        ...updates,
      },
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5" />
        Configuration du workflow
      </h3>

      <div className="space-y-6">
        {/* Signature Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PenTool className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Signature electronique</h4>
                <p className="text-sm text-gray-500">Envoyer pour signature via Universign</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.signature?.enabled || false}
                onChange={(e) => updateSignature({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.signature?.enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <Select
                label="Profil de signature"
                value={config.signature.profile || 'DEFAULT'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateSignature({ profile: e.target.value as 'DEFAULT' | 'CERTIFIED' | 'ADVANCED' })
                }
                options={SIGNATURE_PROFILE_OPTIONS}
              />

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Signataires</p>
                  <p className="mt-1">
                    Les signataires seront configures lors de la generation du document.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LRAR Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Envoi postal (LRAR)</h4>
                <p className="text-sm text-gray-500">Envoyer par courrier via SendingBox</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.lrar?.enabled || false}
                onChange={(e) => updateLrar({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.lrar?.enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Mode d'envoi</p>
                  <p className="mt-1">
                    Le mode d'envoi et les destinataires seront configures lors de la generation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auto Store Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Stockage automatique</h4>
                <p className="text-sm text-gray-500">Archiver dans la GED apres generation</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoStore?.enabled || false}
                onChange={(e) => updateAutoStore({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.autoStore?.enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <Input
                label="Chemin de stockage"
                value={config.autoStore.folderPath || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateAutoStore({ folderPath: e.target.value })
                }
                placeholder="Ex: /Documents generes/{{annee}}/{{mois}}"
              />
              <p className="text-xs text-gray-500">
                Variables disponibles: {`{{annee}}, {{mois}}, {{type_document}}, {{client_nom}}`}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Workflow actif:</span>
          {config.signature?.enabled && (
            <Badge variant="success" className="text-xs">Signature</Badge>
          )}
          {config.lrar?.enabled && (
            <Badge variant="warning" className="text-xs">LRAR</Badge>
          )}
          {config.autoStore?.enabled && (
            <Badge className="text-xs bg-blue-100 text-blue-700">Stockage</Badge>
          )}
          {!config.signature?.enabled && !config.lrar?.enabled && !config.autoStore?.enabled && (
            <span className="text-sm text-gray-400">Aucun</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowConfig;
