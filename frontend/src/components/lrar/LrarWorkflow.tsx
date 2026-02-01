import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, User, Settings } from 'lucide-react';
import { useCreateLrar } from '@/hooks/useLrar';
import Button from '@/components/ui/Button';
import LrarDocumentSelect from './LrarDocumentSelect';
import LrarRecipientForm from './LrarRecipientForm';
import LrarOptionsForm from './LrarOptionsForm';
import type { CreateLrarInput } from '@/lib/types';

interface RecipientInput {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

const steps = [
  { id: 1, name: 'Document', icon: FileText },
  { id: 2, name: 'Destinataire', icon: User },
  { id: 3, name: 'Options', icon: Settings },
];

const LrarWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [recipient, setRecipient] = useState<RecipientInput>({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'FR',
  });
  const [color, setColor] = useState(false);
  const [duplexPrinting, setDuplexPrinting] = useState(true);
  const [registeredMail, setRegisteredMail] = useState(true);

  const createMutation = useCreateLrar();

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDocument !== null && subject.trim().length > 0;
      case 2:
        return (
          recipient.firstName.trim() &&
          recipient.lastName.trim() &&
          recipient.address.trim() &&
          recipient.postalCode.trim() &&
          recipient.city.trim()
        );
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
    const input: CreateLrarInput = {
      documentId: selectedDocument.id,
      subject,
      reference: reference || undefined,
      recipient,
      color,
      duplexPrinting,
      registeredMail,
    };

    createMutation.mutate(input, {
      onSuccess: (data) => {
        navigate(`/lrar/${data.id}`);
      },
    });
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
          <LrarDocumentSelect
            selectedDocument={selectedDocument}
            onSelect={setSelectedDocument}
            subject={subject}
            onSubjectChange={setSubject}
            reference={reference}
            onReferenceChange={setReference}
          />
        )}

        {currentStep === 2 && (
          <LrarRecipientForm
            recipient={recipient}
            onChange={setRecipient}
          />
        )}

        {currentStep === 3 && (
          <LrarOptionsForm
            document={selectedDocument}
            subject={subject}
            recipient={recipient}
            color={color}
            onColorChange={setColor}
            duplexPrinting={duplexPrinting}
            onDuplexPrintingChange={setDuplexPrinting}
            registeredMail={registeredMail}
            onRegisteredMailChange={setRegisteredMail}
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
          {currentStep === 3 ? 'Envoyer le courrier' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
};

export default LrarWorkflow;
