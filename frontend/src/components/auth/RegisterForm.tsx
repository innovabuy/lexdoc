import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Building2, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';
import { registerSchema, type RegisterInput } from '@/lib/utils/validation';
import { getApiErrorMessage } from '@/lib/utils/error';
import { register as registerApi } from '@/lib/api/auth';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'cabinet' | 'admin'>('cabinet');

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const handleNextStep = async () => {
    const isValid = await trigger(['cabinetName', 'cabinetEmail', 'siret']);
    if (isValid) {
      setStep('admin');
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);

    try {
      await registerApi({
        cabinetName: data.cabinetName,
        cabinetEmail: data.cabinetEmail,
        siret: data.siret || undefined,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });

      toast.success('Cabinet créé avec succès ! Connectez-vous pour continuer.');
      navigate('/login');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Erreur lors de l'inscription"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="text-gray-500 mt-2">
          {step === 'cabinet'
            ? 'Informations du cabinet'
            : 'Créez votre compte administrateur'}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div
          className={`w-3 h-3 rounded-full ${
            step === 'cabinet' ? 'bg-primary-500' : 'bg-primary-200'
          }`}
        />
        <div className="w-12 h-0.5 bg-gray-200" />
        <div
          className={`w-3 h-3 rounded-full ${
            step === 'admin' ? 'bg-primary-500' : 'bg-gray-200'
          }`}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {step === 'cabinet' ? (
          <>
            <Input
              {...register('cabinetName')}
              label="Nom du cabinet"
              placeholder="Cabinet Martin & Associés"
              error={errors.cabinetName?.message}
              leftIcon={<Building2 className="h-5 w-5" />}
            />

            <Input
              {...register('cabinetEmail')}
              type="email"
              label="Email du cabinet"
              placeholder="contact@cabinet.fr"
              error={errors.cabinetEmail?.message}
              leftIcon={<Mail className="h-5 w-5" />}
            />

            <Input
              {...register('siret')}
              label="SIRET (optionnel)"
              placeholder="12345678901234"
              error={errors.siret?.message}
              maxLength={14}
            />

            <Button type="button" onClick={handleNextStep} className="w-full">
              Continuer
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('firstName')}
                label="Prénom"
                placeholder="Jean"
                error={errors.firstName?.message}
                leftIcon={<User className="h-5 w-5" />}
              />

              <Input
                {...register('lastName')}
                label="Nom"
                placeholder="Martin"
                error={errors.lastName?.message}
              />
            </div>

            <Input
              {...register('email')}
              type="email"
              label="Email personnel"
              placeholder="jean.martin@cabinet.fr"
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              autoComplete="email"
            />

            <Input
              {...register('phone')}
              type="tel"
              label="Téléphone (optionnel)"
              placeholder="06 12 34 56 78"
              error={errors.phone?.message}
              leftIcon={<Phone className="h-5 w-5" />}
            />

            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              error={errors.password?.message}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('cabinet')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                Créer le compte
              </Button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default RegisterForm;
