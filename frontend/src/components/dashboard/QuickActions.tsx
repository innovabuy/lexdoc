import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, FolderPlus, UserPlus, FileText } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const QuickActions: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const actions = [
    {
      label: 'Nouveau document',
      icon: Upload,
      href: '/documents/upload',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      label: 'Nouveau dossier',
      icon: FolderPlus,
      href: '/folders/new',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
    },
    ...(isAdmin
      ? [
          {
            label: 'Ajouter utilisateur',
            icon: UserPlus,
            href: '/users?action=create',
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
          },
        ]
      : []),
    {
      label: 'Modèles',
      icon: FileText,
      href: '/templates',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    },
  ];

  return (
    <Card>
      <CardHeader title="Actions rapides" />

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${action.color}`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;
