import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { LrarList } from '@/components/lrar';

const LrarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lettres recommandees (LRAR)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerez vos envois de courriers recommandes avec accuse de reception
          </p>
        </div>

        <Link to="/lrar/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel envoi
          </Button>
        </Link>
      </div>

      {/* LRAR list */}
      <LrarList />
    </div>
  );
};

export default LrarPage;
