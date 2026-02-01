import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, ModalFooter, Button, Input, Spinner } from '@/components/ui';
import { useTemplateVariables, useGenerateDocument } from '@/hooks/useTemplates';
import TemplateFormBuilder from './TemplateFormBuilder';
import type { TemplateListItem } from '@/lib/types';

interface TemplateGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateListItem | null;
}

const TemplateGenerateModal: React.FC<TemplateGenerateModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const { data: variables, isLoading: variablesLoading } = useTemplateVariables(
    template?.id || ''
  );
  const generateDocument = useGenerateDocument();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    defaultValues: {
      documentTitle: '',
    },
  });

  useEffect(() => {
    if (template) {
      reset({ documentTitle: template.name });
    }
  }, [template, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (formData: Record<string, unknown>) => {
    if (!template) return;

    const { documentTitle, ...data } = formData;

    try {
      await generateDocument.mutateAsync({
        templateId: template.id,
        input: {
          documentTitle: documentTitle as string,
          data,
        },
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Generer: ${template.name}`}
      size="lg"
    >
      {variablesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Document title */}
          <div className="pb-4 border-b border-gray-200">
            <Input
              {...register('documentTitle', { required: 'Le titre est requis' })}
              label="Titre du document"
              placeholder="Mon document"
              error={errors.documentTitle?.message as string}
            />
          </div>

          {/* Template variables */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Variables du modele
              {variables && variables.length > 0 && (
                <span className="text-gray-400 font-normal ml-1">
                  ({variables.length} champs)
                </span>
              )}
            </h4>

            <TemplateFormBuilder
              variables={variables || []}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              register={register as any}
              errors={errors}
            />
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={generateDocument.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={generateDocument.isPending}>
              Generer le document
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};

export default TemplateGenerateModal;
