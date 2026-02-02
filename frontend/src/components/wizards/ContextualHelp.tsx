import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  LightBulbIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 8;
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 8;
        break;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className={`fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs ${positionClasses[position]}`}
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
}

interface HelpIconProps {
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function HelpIcon({ content, position = 'top', className = '' }: HelpIconProps) {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 ${className}`}
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

interface InfoBannerProps {
  title?: string;
  children: ReactNode;
  variant?: 'info' | 'tip' | 'warning';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function InfoBanner({
  title,
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
}: InfoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    tip: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <LightBulbIcon className="h-5 w-5 text-amber-500" />,
      title: 'text-amber-800',
      text: 'text-amber-700',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: <InformationCircleIcon className="h-5 w-5 text-orange-500" />,
      title: 'text-orange-800',
      text: 'text-orange-700',
    },
  };

  const styles = variants[variant];

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`rounded-lg border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          )}
          <div className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 hover:bg-white/50 focus:outline-none ${styles.text}`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FeatureHighlightProps {
  title: string;
  description: string;
  children: ReactNode;
  isActive?: boolean;
  onDismiss?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function FeatureHighlight({
  title,
  description,
  children,
  isActive = false,
  onDismiss,
  position = 'bottom',
}: FeatureHighlightProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top + scrollTop - 16;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollTop + 16;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 16;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 16;
          break;
      }

      setCoords({ top, left });
    }
  }, [isActive, position]);

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <div ref={triggerRef} className="relative inline-block">
      <div className={isActive ? 'ring-2 ring-primary-500 ring-offset-2 rounded' : ''}>
        {children}
      </div>
      {isActive &&
        createPortal(
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={onDismiss}
            />
            {/* Highlight card */}
            <div
              className={`fixed z-50 w-72 rounded-lg bg-white p-4 shadow-xl ${positionClasses[position]}`}
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900">{title}</h4>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-2 text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Compris !
                </button>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

interface GuidedTourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: GuidedTourStep[];
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({
  steps,
  isActive,
  currentStep,
  onNext,
  onPrev,
  onComplete,
  onSkip,
}: GuidedTourProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  useEffect(() => {
    if (isActive && step) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);

      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;

        const position = step.position || 'bottom';
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top + scrollTop - 16;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollTop + 16;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case 'left':
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.left + scrollLeft - 16;
            break;
          case 'right':
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.right + scrollLeft + 16;
            break;
        }

        setCoords({ top, left });
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const position = step.position || 'bottom';
  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" />

      {/* Highlight target */}
      {targetElement && (
        <div
          className="fixed z-50 ring-4 ring-primary-500 rounded"
          style={{
            top: targetElement.getBoundingClientRect().top + window.scrollY,
            left: targetElement.getBoundingClientRect().left + window.scrollX,
            width: targetElement.getBoundingClientRect().width,
            height: targetElement.getBoundingClientRect().height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}

      {/* Tour card */}
      <div
        className={`fixed z-50 w-80 rounded-lg bg-white p-4 shadow-xl ${positionClasses[position]}`}
        style={{ top: coords.top, left: coords.left }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            Etape {currentStep + 1} sur {steps.length}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Passer
          </button>
        </div>
        <h4 className="mt-2 font-medium text-gray-900">{step.title}</h4>
        <p className="mt-1 text-sm text-gray-500">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className={`text-sm font-medium ${
              isFirst ? 'text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Precedent
          </button>
          <button
            type="button"
            onClick={isLast ? onComplete : onNext}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            {isLast ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
