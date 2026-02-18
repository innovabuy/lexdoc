import { useState, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function DocumentUploader({ folderId, onUploadComplete, onClose }) {
  const { token } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      // Max 100MB per file
      if (file.size > 100 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [file.name]: 'Fichier trop volumineux (max 100 Mo)',
        }));
        return false;
      }
      return true;
    });

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
        type: guessDocumentType(file.name),
        description: '',
      })),
    ]);
  };

  const guessDocumentType = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('contrat') || lower.includes('contract')) return 'CONTRACT';
    if (lower.includes('facture') || lower.includes('invoice')) return 'INVOICE';
    if (lower.includes('lettre') || lower.includes('letter')) return 'LETTER';
    if (lower.includes('pv') || lower.includes('proces')) return 'MINUTES';
    if (lower.includes('acte')) return 'DEED';
    return 'OTHER';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[files[index].file.name];
      return newErrors;
    });
  };

  const updateFileData = (index, field, value) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const uploadFile = async (fileData, index) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('name', fileData.name || fileData.file.name);
    formData.append('type', fileData.type);
    if (fileData.description) {
      formData.append('description', fileData.description);
    }
    if (folderId) {
      formData.append('folderId', folderId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [index]: progress }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Erreur upload'));
          } catch {
            reject(new Error('Erreur upload'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erreur réseau'));
      });

      xhr.open('POST', `${API_URL}/documents`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors({});

    const results = await Promise.allSettled(
      files.map((fileData, index) => uploadFile(fileData, index))
    );

    const newErrors = {};
    let successCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        newErrors[files[index].file.name] = result.reason.message;
      } else {
        successCount++;
      }
    });

    setErrors(newErrors);
    setUploading(false);

    if (successCount > 0) {
      // Remove successfully uploaded files
      const failedIndices = Object.keys(newErrors).map((name) =>
        files.findIndex((f) => f.file.name === name)
      );
      setFiles((prev) => prev.filter((_, i) => failedIndices.includes(i)));

      if (failedIndices.length === 0) {
        onUploadComplete?.();
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, name) => {
    if (mimeType?.includes('pdf') || name?.endsWith('.pdf')) return '📕';
    if (mimeType?.includes('word') || name?.endsWith('.docx') || name?.endsWith('.doc')) return '📘';
    if (mimeType?.includes('excel') || name?.endsWith('.xlsx') || name?.endsWith('.xls')) return '📗';
    if (mimeType?.includes('image')) return '🖼️';
    return '📄';
  };

  const documentTypes = [
    { value: 'CONTRACT', label: 'Contrat' },
    { value: 'DEED', label: 'Acte' },
    { value: 'LETTER', label: 'Courrier' },
    { value: 'INVOICE', label: 'Facture' },
    { value: 'RECEIPT', label: 'Reçu' },
    { value: 'CERTIFICATE', label: 'Certificat' },
    { value: 'REPORT', label: 'Rapport' },
    { value: 'MINUTES', label: 'PV' },
    { value: 'AMENDMENT', label: 'Avenant' },
    { value: 'MEMORANDUM', label: 'Note' },
    { value: 'POWER_OF_ATTORNEY', label: 'Procuration' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Importer des documents</h2>
            <p className="text-sm text-blue-100">
              Glissez-déposez vos fichiers ou cliquez pour sélectionner
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => addFiles(Array.from(e.target.files))}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.rtf,.odt,.ods"
            />
            <div className={`transition-transform ${isDragActive ? 'scale-110' : ''}`}>
              <div className="text-5xl mb-4">
                {isDragActive ? '📥' : '📁'}
              </div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Déposez les fichiers ici' : 'Glissez vos fichiers ici'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ou <span className="text-blue-600 underline">parcourez votre ordinateur</span>
              </p>
              <p className="text-xs text-gray-400 mt-3">
                PDF, Word, Excel, Images - Max 100 Mo par fichier
              </p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-gray-900">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
              </h3>

              {files.map((fileData, index) => (
                <div
                  key={`${fileData.file.name}-${index}`}
                  className="bg-gray-50 rounded-lg border p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">
                      {getFileIcon(fileData.file.type, fileData.file.name)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {fileData.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileData.file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nom</label>
                          <input
                            type="text"
                            value={fileData.name}
                            onChange={(e) => updateFileData(index, 'name', e.target.value)}
                            disabled={uploading}
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select
                            value={fileData.type}
                            onChange={(e) => updateFileData(index, 'type', e.target.value)}
                            disabled={uploading}
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            {documentTypes.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {uploading && uploadProgress[index] !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Envoi en cours...</span>
                            <span>{uploadProgress[index]}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${uploadProgress[index]}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      {errors[fileData.file.name] && (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors[fileData.file.name]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Annuler
          </button>
          <div className="flex items-center gap-3">
            {files.length > 0 && (
              <span className="text-sm text-gray-500">
                {files.length} fichier{files.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handleUploadAll}
              disabled={files.length === 0 || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Upload en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
