import React, { useState, useCallback, useRef } from 'react';
import { Upload, Trash2, Image, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface SignatureUploadProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => void;
  isUploading?: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export const SignatureUpload: React.FC<SignatureUploadProps> = ({
  label,
  description,
  currentImageUrl,
  onUpload,
  onDelete,
  isUploading = false,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  maxSizeMB = 2,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Format non accepte. Utilisez: ${acceptedFormats
        .map((f) => f.split('/')[1].toUpperCase())
        .join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Le fichier est trop volumineux (max ${maxSizeMB} MB)`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      try {
        await onUpload(file);
        setPreviewUrl(null);
      } catch {
        setError('Erreur lors du telechargement');
      }
    },
    [onUpload, acceptedFormats, maxSizeMB]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>

        {/* Current/Preview Image */}
        {displayUrl && (
          <div className="relative">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {displayUrl.endsWith('.pdf') ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Document PDF</p>
                  </div>
                </div>
              ) : (
                <img
                  src={displayUrl}
                  alt={label}
                  className="max-h-48 mx-auto object-contain"
                />
              )}
            </div>
            {currentImageUrl && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="absolute top-2 right-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mb-2"></div>
              <p className="text-sm text-gray-600">Telechargement en cours...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-primary-600">Cliquez pour importer</span>
                {' '}ou glissez-deposez
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedFormats.map((f) => f.split('/')[1].toUpperCase()).join(', ')} (max{' '}
                {maxSizeMB} MB)
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SignatureUpload;
