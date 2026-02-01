import React from 'react';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { useCabinet } from '@/hooks/useCabinet';
import { LoadingState } from '@/components/ui';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/formatters';

const CabinetInfo: React.FC = () => {
  const { data: cabinet, isLoading } = useCabinet();

  if (isLoading) {
    return <LoadingState message="Chargement..." />;
  }

  if (!cabinet) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="Informations du cabinet" />

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{cabinet.name}</p>
            {cabinet.siret && (
              <p className="text-sm text-gray-500">SIRET: {cabinet.siret}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
          <p className="text-gray-700">{cabinet.email}</p>
        </div>

        {cabinet.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
            <p className="text-gray-700">{cabinet.phone}</p>
          </div>
        )}

        {(cabinet.address || cabinet.city) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              {cabinet.address && <p className="text-gray-700">{cabinet.address}</p>}
              {cabinet.postalCode && cabinet.city && (
                <p className="text-gray-700">
                  {cabinet.postalCode} {cabinet.city}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Statut</span>
          <Badge className={STATUS_COLORS[cabinet.status]}>
            {STATUS_LABELS[cabinet.status]}
          </Badge>
        </div>

        {cabinet.trialEndsAt && cabinet.status === 'TRIAL' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Fin de la période d'essai</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(cabinet.trialEndsAt)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Créé le</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(cabinet.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default CabinetInfo;
