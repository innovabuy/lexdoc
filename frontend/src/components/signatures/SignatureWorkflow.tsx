import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, Users, Eye } from 'lucide-react';
import { useCreateSignature } from '@/hooks/useSignatures';
import Button from '@/components/ui/Button';
import SignatureDocumentSelect from './SignatureDocumentSelect';
import SignatureSignatoryForm from './SignatureSignatoryForm';
import SignatureReview from './SignatureReview';
import type { SignatureProfile } from '@/lib/types';

interface SignatoryInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

const steps = [
  { id: 1, name: 'Document', icon: FileText },
  { id: 2, name: 'Signataires', icon: Users },
  { id: 3, name: 'Verification', icon: Eye },
];

const SignatureWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [signatories, setSignatories] = useState<SignatoryInput[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<SignatureProfile>('DEFAULT');

  const createMutation = useCreateSignature();

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDocument !== null;
      case 2:
        return signatories.length > 0 && title.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        documentId: selectedDocument.id,
        signatories,
        title,
        description: description || undefined,
        profile,
      },
      {
        onSuccess: (data) => {
          navigate(`/signatures/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {currentStep > step.id ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>

                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {step.name}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-4 rounded transition-colors
                    ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[400px]">
        {currentStep === 1 && (
          <SignatureDocumentSelect
            selectedDocument={selectedDocument}
            onSelect={setSelectedDocument}
          />
        )}

        {currentStep === 2 && (
          <SignatureSignatoryForm
            signatories={signatories}
            onChange={setSignatories}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            profile={profile}
            onProfileChange={setProfile}
          />
        )}

        {currentStep === 3 && (
          <SignatureReview
            document={selectedDocument}
            signatories={signatories}
            title={title}
            description={description}
            profile={profile}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Retour
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          isLoading={createMutation.isPending}
        >
          {currentStep === 3 ? 'Envoyer pour signature' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
};

export default SignatureWorkflow;
