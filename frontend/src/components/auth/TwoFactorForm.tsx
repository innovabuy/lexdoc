import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface TwoFactorFormProps {
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSubmit, onBack, isLoading }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.every((digit) => digit !== '') && value) {
      onSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newCode = [...code];
      pastedData.split('').forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);

      if (newCode.every((digit) => digit !== '')) {
        onSubmit(newCode.join(''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Vérification 2FA</h1>
        <p className="text-gray-500 mt-2">
          Entrez le code généré par votre application d'authentification
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Code inputs */}
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={isLoading}
            />
          ))}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={code.some((digit) => !digit)}
          className="w-full"
        >
          Vérifier
        </Button>
      </form>

      <button
        onClick={onBack}
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </button>
    </Card>
  );
};

export default TwoFactorForm;
