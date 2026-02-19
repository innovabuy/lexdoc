import { useState, useEffect } from 'react';
import api from '../../services/api';

const TIER_LABELS = {
  TRIAL: 'Essai gratuit',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professionnel',
  ENTERPRISE: 'Entreprise',
};

const TIER_COLORS = {
  TRIAL: 'bg-amber-100 text-amber-800',
  STARTER: 'bg-blue-100 text-blue-800',
  PROFESSIONAL: 'bg-purple-100 text-purple-800',
  ENTERPRISE: 'bg-emerald-100 text-emerald-800',
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Mo';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

function ProgressBar({ label, current, max, unit }) {
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isWarning = percent >= 80;
  const isDanger = percent >= 95;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {unit === 'bytes' ? `${formatBytes(current)} / ${formatBytes(max)}` : `${current} / ${max}`}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{percent.toFixed(0)}% utilise</p>
    </div>
  );
}

export default function AbonnementSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: res } = await api.get('/settings/subscription');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Erreur lors du chargement des informations d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  const tier = data?.subscriptionTier || 'TRIAL';
  const trialEndsAt = data?.trialEndsAt ? new Date(data.trialEndsAt) : null;
  const subscribedAt = data?.subscribedAt ? new Date(data.subscribedAt) : null;
  const isTrialExpired = trialEndsAt && trialEndsAt < new Date();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-1">
          Gerez votre plan et suivez votre utilisation
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plan actuel</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${TIER_COLORS[tier] || 'bg-gray-100 text-gray-700'}`}>
                {TIER_LABELS[tier] || tier}
              </span>
              {tier === 'TRIAL' && trialEndsAt && (
                <span className={`text-sm ${isTrialExpired ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {isTrialExpired
                    ? `Expire depuis le ${trialEndsAt.toLocaleDateString('fr-FR')}`
                    : `Expire le ${trialEndsAt.toLocaleDateString('fr-FR')}`
                  }
                </span>
              )}
              {subscribedAt && tier !== 'TRIAL' && (
                <span className="text-sm text-gray-500">
                  Abonne depuis le {subscribedAt.toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        </div>

        {tier === 'TRIAL' && (
          <div className={`p-4 rounded-lg ${isTrialExpired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm ${isTrialExpired ? 'text-red-700' : 'text-amber-700'}`}>
              {isTrialExpired
                ? 'Votre periode d\'essai est terminee. Contactez-nous pour souscrire a un abonnement.'
                : 'Vous etes en periode d\'essai gratuit. Profitez de toutes les fonctionnalites pour decouvrir LexDoc.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Utilisation</h2>
        <div className="space-y-6">
          <ProgressBar
            label="Utilisateurs"
            current={data?.currentUsers || 0}
            max={data?.maxUsers || 5}
          />
          <ProgressBar
            label="Clients"
            current={data?.currentClients || 0}
            max={data?.maxClients || 50}
          />
          <ProgressBar
            label="Stockage"
            current={data?.storageUsed || 0}
            max={data?.maxStorage || 1073741824}
            unit="bytes"
          />
        </div>
      </div>

      {/* Plan Limits */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Limites par plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Fonctionnalite</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Essai</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Starter</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Pro</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Entreprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 text-gray-700">Utilisateurs</td>
                <td className="py-3 px-4 text-center">2</td>
                <td className="py-3 px-4 text-center">5</td>
                <td className="py-3 px-4 text-center">20</td>
                <td className="py-3 px-4 text-center">Illimite</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-gray-700">Clients</td>
                <td className="py-3 px-4 text-center">50</td>
                <td className="py-3 px-4 text-center">200</td>
                <td className="py-3 px-4 text-center">1 000</td>
                <td className="py-3 px-4 text-center">Illimite</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-gray-700">Stockage</td>
                <td className="py-3 px-4 text-center">1 Go</td>
                <td className="py-3 px-4 text-center">10 Go</td>
                <td className="py-3 px-4 text-center">50 Go</td>
                <td className="py-3 px-4 text-center">200 Go</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Templates Builder</td>
                <td className="py-3 px-4 text-center">10</td>
                <td className="py-3 px-4 text-center">50</td>
                <td className="py-3 px-4 text-center">Illimite</td>
                <td className="py-3 px-4 text-center">Illimite</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
