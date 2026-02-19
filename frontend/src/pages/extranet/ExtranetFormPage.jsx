import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import * as extranetApi from '../../services/extranetApi';
import ExtranetProfileWizard from './ExtranetProfileWizard';
import './ExtranetProfileWizard.css';

function getTenantLogoUrl(tenantId) {
  if (!tenantId) return null;
  return `${api.defaults.baseURL}/extranet/tenant/${tenantId}/logo`;
}

export default function ExtranetFormPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ok | error | submitted
  const [errorMsg, setErrorMsg] = useState('');
  const [tenant, setTenant] = useState(null);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await extranetApi.verifyFormToken(token);
      const data = res.data?.data || res.data;
      setTenant(data.tenant);
      setClientName(data.clientName || '');
      setStatus('ok');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Lien invalide ou expiré';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const apiOverrides = {
    getProfile: () => extranetApi.getFormProfile(token),
    getCompleteness: () => extranetApi.getFormCompleteness(token),
    saveStep: (step, data) => extranetApi.saveFormStep(token, step, data),
    submitProfile: () => extranetApi.submitFormProfile(token),
  };

  const handleComplete = useCallback(() => {
    setStatus('submitted');
  }, []);

  if (status === 'loading') {
    return (
      <div className="efp-container">
        <div className="epw-loading">
          <div className="epw-spinner" />
          <p>Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="efp-container">
        <div className="efp-error-card">
          <div className="efp-error-icon">&#x26A0;&#xFE0F;</div>
          <h2>Lien invalide</h2>
          <p>{errorMsg}</p>
          <p className="efp-hint">
            Ce lien a peut-être expiré ou a déjà été utilisé.<br />
            Veuillez contacter votre cabinet pour recevoir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="efp-container">
        {tenant && (
          <div className="efp-header">
            {tenant.logo && <img src={getTenantLogoUrl(tenant.id)} alt={tenant.name} className="efp-logo" />}
            <span className="efp-tenant-name">{tenant.name}</span>
          </div>
        )}
        <div className="epw-success">
          <div className="epw-success-icon">&#x2705;</div>
          <h2>Merci !</h2>
          <p>Vos informations ont été transmises à votre cabinet.</p>
          <p>Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  // status === 'ok'
  return (
    <div className="efp-container">
      {tenant && (
        <div className="efp-header">
          {tenant.logo && <img src={getTenantLogoUrl(tenant.id)} alt={tenant.name} className="efp-logo" />}
          <span className="efp-tenant-name">{tenant.name}</span>
        </div>
      )}
      <ExtranetProfileWizard
        apiOverrides={apiOverrides}
        clientNameOverride={clientName}
        onComplete={handleComplete}
      />
    </div>
  );
}
