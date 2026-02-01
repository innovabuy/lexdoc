import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '@/components/ui';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>

        <Link to="/dashboard" className="inline-block mt-8">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
