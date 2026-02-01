import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Input, Avatar, Badge } from '@/components/ui';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from '@/lib/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { setup2FA, enable2FA } from '@/lib/api/auth';
import { ROLE_LABELS } from '@/lib/utils/constants';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { updateProfile, changePassword, isUpdateProfileLoading, isChangePasswordLoading } = useAuth();

  // 2FA state
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);

  // Profile form
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: '',
    },
  });

  // Password form
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleProfileSubmit = async (data: UpdateProfileInput) => {
    await updateProfile(data);
  };

  const handlePasswordSubmit = async (data: ChangePasswordInput) => {
    await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    passwordForm.reset();
  };

  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try {
      const result = await setup2FA();
      setQrCode(result.qrCode);
      setIs2FASetup(true);
    } catch {
      toast.error("Erreur lors de la configuration 2FA");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setIs2FALoading(true);
    try {
      await enable2FA(verificationCode);
      toast.success("2FA activé avec succès");
      setIs2FASetup(false);
      setQrCode(null);
      setVerificationCode('');
      // Refresh user data
      window.location.reload();
    } catch {
      toast.error("Code invalide");
    } finally {
      setIs2FALoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile info card */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="xl"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500">{user?.email}</p>
            <Badge variant="primary" className="mt-2">
              {user ? ROLE_LABELS[user.role] : ''}
            </Badge>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              {...profileForm.register('firstName')}
              label="Prénom"
              error={profileForm.formState.errors.firstName?.message}
            />
            <Input
              {...profileForm.register('lastName')}
              label="Nom"
              error={profileForm.formState.errors.lastName?.message}
            />
          </div>

          <Input
            {...profileForm.register('phone')}
            label="Téléphone"
            placeholder="06 12 34 56 78"
            error={profileForm.formState.errors.phone?.message}
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isUpdateProfileLoading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader
          title="Changer le mot de passe"
          description="Assurez-vous d'utiliser un mot de passe fort"
        />

        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <Input
            {...passwordForm.register('currentPassword')}
            type="password"
            label="Mot de passe actuel"
            error={passwordForm.formState.errors.currentPassword?.message}
          />

          <Input
            {...passwordForm.register('newPassword')}
            type="password"
            label="Nouveau mot de passe"
            error={passwordForm.formState.errors.newPassword?.message}
          />

          <Input
            {...passwordForm.register('confirmPassword')}
            type="password"
            label="Confirmer le nouveau mot de passe"
            error={passwordForm.formState.errors.confirmPassword?.message}
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isChangePasswordLoading}>
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </Card>

      {/* 2FA card */}
      <Card>
        <CardHeader
          title="Authentification à deux facteurs"
          description="Renforcez la sécurité de votre compte"
        />

        {user?.twoFactorEnabled ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">2FA activé</p>
              <p className="text-sm text-green-600">
                Votre compte est protégé par l'authentification à deux facteurs
              </p>
            </div>
          </div>
        ) : is2FASetup && qrCode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
            </p>

            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>

            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              label="Code de vérification"
              maxLength={6}
              className="text-center font-mono text-lg"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIs2FASetup(false);
                  setQrCode(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleEnable2FA}
                isLoading={is2FALoading}
                className="flex-1"
              >
                Activer 2FA
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleSetup2FA}
            isLoading={is2FALoading}
            leftIcon={<Smartphone className="h-4 w-4" />}
          >
            Configurer 2FA
          </Button>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
