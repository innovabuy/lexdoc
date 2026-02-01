import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/utils/validation';
import { forgotPassword } from '@/lib/api/auth';

const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);

    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="animate-fade-in text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
        <p className="text-gray-500 mb-6">
          Si un compte existe pour <strong>{submittedEmail}</strong>, vous recevrez un email
          avec les instructions de réinitialisation.
        </p>

        <Link to="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
        <p className="text-gray-500 mt-2">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="vous@cabinet.fr"
          error={errors.email?.message}
          leftIcon={<Mail className="h-5 w-5" />}
          autoComplete="email"
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Envoyer le lien
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Link>
    </Card>
  );
};

export default ForgotPasswordForm;
