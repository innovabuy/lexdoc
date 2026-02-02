import { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { WizardSteps } from './WizardSteps';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface WizardContainerProps {
  title: string;
  subtitle?: string;
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  onClose?: () => void;
  onSkip?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  completeLabel?: string;
  skipLabel?: string;
  showSkip?: boolean;
  canProceed?: boolean;
}

export function WizardContainer({
  title,
  subtitle,
  steps,
  currentStep,
  children,
  onClose,
  onSkip,
  onPrev,
  onNext,
  onComplete,
  isFirst = false,
  isLast = false,
  isLoading = false,
  nextLabel = 'Suivant',
  prevLabel = 'Precedent',
  completeLabel = 'Terminer',
  skipLabel = 'Passer',
  showSkip = true,
  canProceed = true,
}: WizardContainerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <WizardSteps steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {showSkip && onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {skipLabel}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isFirst && onPrev && (
                <Button variant="secondary" onClick={onPrev} disabled={isLoading}>
                  {prevLabel}
                </Button>
              )}
              {isLast ? (
                <Button
                  onClick={onComplete}
                  disabled={isLoading || !canProceed}
                  isLoading={isLoading}
                >
                  {completeLabel}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  disabled={isLoading || !canProceed}
                  isLoading={isLoading}
                >
                  {nextLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WizardCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function WizardCard({ icon, title, description, children }: WizardCardProps) {
  return (
    <div className="text-center">
      {icon && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          {icon}
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

interface WizardFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function WizardFormSection({ title, description, children }: WizardFormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
