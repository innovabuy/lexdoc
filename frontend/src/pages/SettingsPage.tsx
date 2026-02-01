import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Palette } from 'lucide-react';
import { Card, CardHeader, Button, Input } from '@/components/ui';
import { updateCabinetSchema, type UpdateCabinetInput } from '@/lib/utils/validation';
import { useCabinet, useUpdateCabinet } from '@/hooks/useCabinet';
import { useAuthStore } from '@/store/authStore';
import { LoadingState } from '@/components/ui';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: cabinet, isLoading } = useCabinet();
  const updateCabinet = useUpdateCabinet();

  const isAdmin = user?.role === 'ADMIN';

  const form = useForm<UpdateCabinetInput>({
    resolver: zodResolver(updateCabinetSchema),
    defaultValues: {
      name: cabinet?.name || '',
      address: cabinet?.address || '',
      postalCode: cabinet?.postalCode || '',
      city: cabinet?.city || '',
      phone: cabinet?.phone || '',
    },
  });

  React.useEffect(() => {
    if (cabinet) {
      form.reset({
        name: cabinet.name,
        address: cabinet.address || '',
        postalCode: cabinet.postalCode || '',
        city: cabinet.city || '',
        phone: cabinet.phone || '',
      });
    }
  }, [cabinet, form]);

  const handleSubmit = async (data: UpdateCabinetInput) => {
    await updateCabinet.mutateAsync(data);
  };

  if (isLoading) {
    return <LoadingState message="Chargement des paramètres..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configurez votre espace LexDoc</p>
      </div>

      {/* Cabinet settings - Admin only */}
      {isAdmin && (
        <Card>
          <CardHeader
            title="Informations du cabinet"
            description="Ces informations apparaissent sur vos documents"
          />

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input
              {...form.register('name')}
              label="Nom du cabinet"
              error={form.formState.errors.name?.message}
            />

            <Input
              {...form.register('address')}
              label="Adresse"
              error={form.formState.errors.address?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                {...form.register('postalCode')}
                label="Code postal"
                maxLength={5}
                error={form.formState.errors.postalCode?.message}
              />
              <Input
                {...form.register('city')}
                label="Ville"
                error={form.formState.errors.city?.message}
              />
            </div>

            <Input
              {...form.register('phone')}
              label="Téléphone"
              error={form.formState.errors.phone?.message}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={updateCabinet.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notifications settings */}
      <Card>
        <CardHeader
          title="Notifications"
          description="Gérez vos préférences de notification"
        />

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Notifications email</p>
                <p className="text-sm text-gray-500">
                  Recevoir des emails pour les activités importantes
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Rappels d'échéance</p>
                <p className="text-sm text-gray-500">
                  Recevoir des rappels pour les documents qui expirent
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>
      </Card>

      {/* Appearance settings */}
      <Card>
        <CardHeader
          title="Apparence"
          description="Personnalisez l'interface"
        />

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Mode sombre</p>
                <p className="text-sm text-gray-500">
                  Activer le thème sombre (bientôt disponible)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled
              className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
            />
          </label>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
