import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui';
import { useUpdateTemplate, useTemplateCategories } from '@/hooks/useTemplates';
import type { TemplateListItem, TemplateCategory } from '@/lib/types';

interface TemplateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateListItem | null;
}

interface FormData {
  name: string;
  description: string;
  category: TemplateCategory;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({ isOpen, onClose, template }) => {
  const { data: categories } = useTemplateCategories();
  const updateTemplate = useUpdateTemplate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        description: template.description || '',
        category: template.category,
      });
    }
  }, [template, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!template) return;

    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        data: {
          name: data.name,
          description: data.description || null,
          category: data.category,
        },
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  const categoryOptions =
    categories?.map((cat) => ({ value: cat.value, label: cat.label })) || [];

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier le modele" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('name', { required: 'Le nom est requis' })}
          label="Nom du modele"
          error={errors.name?.message}
        />

        <Input
          {...register('description')}
          label="Description (optionnel)"
          error={errors.description?.message}
        />

        <Select
          {...register('category')}
          label="Categorie"
          options={categoryOptions}
          error={errors.category?.message}
        />

        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateTemplate.isPending}>
            Annuler
          </Button>
          <Button type="submit" isLoading={updateTemplate.isPending}>
            Enregistrer
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default TemplateEditModal;
