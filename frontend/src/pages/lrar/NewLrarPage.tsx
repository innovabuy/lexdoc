import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LrarWorkflow } from '@/components/lrar';

const NewLrarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/lrar"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nouvel envoi LRAR
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Envoyez un courrier recommande avec accuse de reception
          </p>
        </div>
      </div>

      {/* Workflow */}
      <LrarWorkflow />
    </div>
  );
};

export default NewLrarPage;
