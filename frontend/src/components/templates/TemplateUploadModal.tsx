import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui';
import { useCreateTemplate, useTemplateCategories } from '@/hooks/useTemplates';
import type { TemplateCategory } from '@/lib/types';
import { cn } from '@/lib/utils/helpers';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  category: TemplateCategory;
}

const TemplateUploadModal: React.FC<TemplateUploadModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const { data: categories } = useTemplateCategories();
  const createTemplate = useCreateTemplate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      category: 'OTHER',
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        // Auto-fill name from filename if empty
        const nameWithoutExt = uploadedFile.name.replace(/\.docx$/i, '');
        setValue('name', nameWithoutExt);
      }
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleClose = () => {
    reset();
    setFile(null);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!file) return;

    try {
      await createTemplate.mutateAsync({
        file,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  const categoryOptions = [
    { value: '', label: 'Selectionner une categorie' },
    ...(categories?.map((cat) => ({ value: cat.value, label: cat.label })) || []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau modele" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400',
            file && 'border-green-500 bg-green-50'
          )}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                {isDragActive
                  ? 'Deposez le fichier ici...'
                  : 'Glissez-deposez un fichier DOCX ou cliquez pour selectionner'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Maximum 10 Mo</p>
            </>
          )}
        </div>

        {/* Form fields */}
        <Input
          {...register('name', { required: 'Le nom est requis' })}
          label="Nom du modele"
          placeholder="Contrat de travail CDI"
          error={errors.name?.message}
        />

        <Input
          {...register('description')}
          label="Description (optionnel)"
          placeholder="Description du modele..."
          error={errors.description?.message}
        />

        <Select
          {...register('category')}
          label="Categorie"
          options={categoryOptions}
          error={errors.category?.message}
        />

        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={createTemplate.isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={createTemplate.isPending}
            disabled={!file || createTemplate.isPending}
          >
            Creer le modele
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TemplateUploadModal;
