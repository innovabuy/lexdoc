import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { SignatureList } from '@/components/signatures';

const SignaturesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Signatures electroniques
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerez vos demandes de signature electronique
          </p>
        </div>

        <Link to="/signatures/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle signature
          </Button>
        </Link>
      </div>

      {/* Signature list */}
      <SignatureList />
    </div>
  );
};

export default SignaturesPage;
