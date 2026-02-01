import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { verifyEmail } from '@/lib/api/auth';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="text-center animate-fade-in">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Vérification en cours...</h1>
          <p className="text-gray-500 mt-2">Veuillez patienter</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Email vérifié !</h1>
          <p className="text-gray-500 mt-2 mb-6">
            Votre adresse email a été vérifiée avec succès.
          </p>
          <Link to="/login">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Lien invalide</h1>
          <p className="text-gray-500 mt-2 mb-6">
            Ce lien de vérification est invalide ou a expiré.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </>
      )}
    </Card>
  );
};

export default VerifyEmailPage;
