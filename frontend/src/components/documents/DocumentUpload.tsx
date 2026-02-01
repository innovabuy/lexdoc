import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadProgress } from '@/lib/types';

interface DocumentUploadProps {
  folderId: string;
  onUpload: (
    files: File[],
    onProgress: (fileName: string, progress: number) => void
  ) => Promise<void>;
  onClose?: () => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
];

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MAX_FILES = 10;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentUpload({
  onUpload,
  onClose,
  accept = ALLOWED_TYPES.join(','),
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const newErrors: string[] = [];
      const fileArray = Array.from(fileList);

      if (fileArray.length + files.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} fichiers autorises`);
        setErrors(newErrors);
        return validFiles;
      }

      for (const file of fileArray) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          newErrors.push(`Type non autorise: ${file.name}`);
          continue;
        }
        if (file.size > maxSize) {
          newErrors.push(`Fichier trop volumineux: ${file.name} (max ${formatFileSize(maxSize)})`);
          continue;
        }
        if (files.some((f) => f.name === file.name)) {
          newErrors.push(`Fichier deja ajoute: ${file.name}`);
          continue;
        }
        validFiles.push(file);
      }

      setErrors(newErrors);
      return validFiles;
    },
    [files, maxFiles, maxSize]
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
      const validFiles = validateFiles(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...validFiles]);
    },
    [validateFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const validFiles = validateFiles(e.target.files);
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [validateFiles]
  );

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    // Initialize progress for all files
    const initialProgress: Record<string, UploadProgress> = {};
    files.forEach((file) => {
      initialProgress[file.name] = {
        fileName: file.name,
        progress: 0,
        status: 'pending',
      };
    });
    setUploadProgress(initialProgress);

    try {
      await onUpload(files, (fileName, progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [fileName]: {
            ...prev[fileName],
            progress,
            status: progress < 100 ? 'uploading' : 'done',
          },
        }));
      });

      // Mark all as done
      setUploadProgress((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = { ...updated[key], status: 'done', progress: 100 };
        });
        return updated;
      });

      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress({});
        onClose?.();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du telechargement';
      setErrors([errorMessage]);

      // Mark failed uploads
      setUploadProgress((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key].status !== 'done') {
            updated[key] = { ...updated[key], status: 'error', error: errorMessage };
          }
        });
        return updated;
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Telecharger des documents</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload
          className={cn('h-10 w-10 mx-auto mb-3', isDragging ? 'text-blue-500' : 'text-gray-400')}
        />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-blue-600">Cliquez pour selectionner</span> ou
          glissez-deposez vos fichiers
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, Word, Excel, Images - Max {formatFileSize(maxSize)} par fichier
        </p>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => {
            const progress = uploadProgress[file.name];
            return (
              <div
                key={file.name}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {progress && progress.status !== 'pending' && (
                    <div className="mt-1">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {progress?.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {progress?.status === 'done' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {progress?.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {(!progress || progress.status === 'pending') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.name);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => {
              setFiles([]);
              setUploadProgress({});
              setErrors([]);
            }}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Telechargement...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Telecharger ({files.length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
