import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface WizardStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;
}

export function WizardSteps({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
}: WizardStepsProps) {
  const handleClick = (stepIndex: number) => {
    if (allowNavigation && onStepClick && stepIndex < currentStep) {
      onStepClick(stepIndex);
    }
  };

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowNavigation && index < currentStep;

          return (
            <li
              key={step.id}
              className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}
            >
              {index !== steps.length - 1 && (
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div
                    className={`h-0.5 w-full ${
                      isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleClick(index)}
                disabled={!isClickable}
                className={`
                  relative flex h-8 w-8 items-center justify-center rounded-full
                  ${
                    isCompleted
                      ? 'bg-primary-600 hover:bg-primary-800'
                      : isCurrent
                      ? 'border-2 border-primary-600 bg-white'
                      : 'border-2 border-gray-300 bg-white'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                ) : (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isCurrent ? 'bg-primary-600' : 'bg-transparent'
                    }`}
                  />
                )}
                <span className="sr-only">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex justify-between">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          return (
            <div
              key={`label-${step.id}`}
              className={`text-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
            >
              <p
                className={`text-xs font-medium ${
                  isCurrent ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

interface WizardStepsVerticalProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;
}

export function WizardStepsVertical({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
}: WizardStepsVerticalProps) {
  const handleClick = (stepIndex: number) => {
    if (allowNavigation && onStepClick && stepIndex < currentStep) {
      onStepClick(stepIndex);
    }
  };

  return (
    <nav aria-label="Progress" className="w-64">
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowNavigation && index < currentStep;

          return (
            <li key={step.id} className="relative">
              {index !== steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 ${
                    isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => handleClick(index)}
                disabled={!isClickable}
                className={`group relative flex items-start ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="flex h-9 items-center">
                  <span
                    className={`
                      relative z-10 flex h-8 w-8 items-center justify-center rounded-full
                      ${
                        isCompleted
                          ? 'bg-primary-600 group-hover:bg-primary-800'
                          : isCurrent
                          ? 'border-2 border-primary-600 bg-white'
                          : 'border-2 border-gray-300 bg-white group-hover:border-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : isCurrent ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                    )}
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-sm text-gray-500">{step.description}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
