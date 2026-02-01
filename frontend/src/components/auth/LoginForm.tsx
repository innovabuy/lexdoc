import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';
import { loginSchema, type LoginInput } from '@/lib/utils/validation';
import { getApiErrorMessage } from '@/lib/utils/error';
import { login, loginWith2FA } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import TwoFactorForm from './TwoFactorForm';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);

      if ('requiresTwoFactor' in result) {
        setCredentials({ email: data.email, password: data.password });
        setNeeds2FA(true);
        toast.success('Code 2FA requis');
      } else {
        setAuth(result.user, result.accessToken, result.refreshToken);
        toast.success(`Bienvenue ${result.user.firstName} !`);
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Erreur de connexion'));
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (code: string) => {
    if (!credentials) return;

    setIsLoading(true);

    try {
      const result = await loginWith2FA(credentials.email, credentials.password, code);
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success(`Bienvenue ${result.user.firstName} !`);
      navigate('/dashboard');
    } catch {
      toast.error('Code 2FA invalide');
    } finally {
      setIsLoading(false);
    }
  };

  if (needs2FA) {
    return (
      <TwoFactorForm
        onSubmit={handle2FASubmit}
        onBack={() => setNeeds2FA(false)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
        <p className="text-gray-500 mt-2">Accédez à votre espace LexDoc</p>
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

        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Mot de passe"
          placeholder="Votre mot de passe"
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
          autoComplete="current-password"
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Se connecter
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;
