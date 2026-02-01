import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Edit3,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { usePreviewBuilderTemplate } from '@/hooks/useDocumentBuilder';

interface Step3PreviewProps {
  templateId: string;
  templateName: string;
  variables: Record<string, any>;
  onNext: () => void;
  onBack: () => void;
  onEditVariables: () => void;
}

export const Step3Preview: React.FC<Step3PreviewProps> = ({
  templateId,
  templateName,
  variables,
  onNext,
  onBack,
  onEditVariables,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const previewMutation = usePreviewBuilderTemplate();

  // Generate preview on mount and when variables change
  useEffect(() => {
    previewMutation.mutate({ id: templateId, variables });
  }, [templateId]); // Only run on mount, not on every variable change

  const handleRefresh = () => {
    previewMutation.mutate({ id: templateId, variables });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const { data: previewResult, isPending, error } = previewMutation;
  const missingVariables = previewResult?.missingVariables || [];
  const hasMissingRequired = missingVariables.length > 0;

  const renderPreviewContent = () => {
    if (isPending) {
      return (
        <div className="flex items-center justify-center h-96">
          <LoadingState message="Generation de l'apercu..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur lors de la generation
          </h3>
          <p className="text-gray-500 mb-4">
            Impossible de generer l'apercu du document.
          </p>
          <Button variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </div>
      );
    }

    if (!previewResult?.preview) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun apercu disponible</p>
        </div>
      );
    }

    return (
      <div
        className="prose prose-sm max-w-none p-8 bg-white"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        dangerouslySetInnerHTML={{ __html: previewResult.preview }}
      />
    );
  };

  const previewPanel = (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Preview Toolbar */}
      <div className={`flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 ${isFullscreen ? '' : 'rounded-t-lg'}`}>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{templateName}</h4>
          {hasMissingRequired ? (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {missingVariables.length} variable{missingVariables.length > 1 ? 's' : ''} manquante{missingVariables.length > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Complet
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 150}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div
        className={`overflow-auto bg-gray-100 ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[500px] rounded-b-lg'}`}
      >
        <div className="min-w-[800px]">
          {renderPreviewContent()}
        </div>
      </div>

      {/* Fullscreen close hint */}
      {isFullscreen && (
        <div className="fixed bottom-4 right-4">
          <Button onClick={toggleFullscreen}>
            <Minimize2 className="h-4 w-4 mr-2" />
            Fermer le plein ecran
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Missing Variables Warning */}
      {hasMissingRequired && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 mb-1">
                Variables manquantes
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                Certaines variables requises n'ont pas ete remplies. Le document
                pourrait etre incomplet.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {missingVariables.map((varName) => (
                  <Badge key={varName} variant="warning" className="text-xs">
                    {varName}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditVariables}
                className="text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Completer les variables
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Panel */}
      <Card className="overflow-hidden">
        {previewPanel}
      </Card>

      {/* Instructions */}
      <div className="text-sm text-gray-500 text-center">
        Verifiez l'apercu du document avant de passer a l'etape suivante.
        Vous pourrez telecharger ou envoyer le document finalement.
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Modifier les variables
        </Button>
        <Button onClick={onNext}>
          Finaliser
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Step3Preview;
