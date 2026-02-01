import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/utils/validation';
import { getApiErrorMessage } from '@/lib/utils/error';
import { resetPassword } from '@/lib/api/auth';

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error('Token de réinitialisation invalide');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Erreur lors de la réinitialisation'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="animate-fade-in text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mot de passe réinitialisé !
        </h1>
        <p className="text-gray-500 mb-6">
          Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous
          connecter.
        </p>

        <Link to="/login">
          <Button className="w-full">Se connecter</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
        <p className="text-gray-500 mt-2">Choisissez un nouveau mot de passe sécurisé</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Nouveau mot de passe"
          placeholder="Minimum 8 caractères"
          error={errors.password?.message}
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          autoComplete="new-password"
        />

        <Input
          {...register('confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          label="Confirmer le mot de passe"
          placeholder="Confirmez votre mot de passe"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="h-5 w-5" />}
          autoComplete="new-password"
        />

        <div className="text-xs text-gray-500 space-y-1">
          <p>Le mot de passe doit contenir :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Au moins 8 caractères</li>
            <li>Une majuscule et une minuscule</li>
            <li>Un chiffre</li>
            <li>Un caractère spécial (!@#$%^&*...)</li>
          </ul>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Réinitialiser le mot de passe
        </Button>
      </form>
    </Card>
  );
};

export default ResetPasswordForm;
