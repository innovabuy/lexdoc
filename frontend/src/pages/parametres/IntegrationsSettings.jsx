import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useSearchParams } from 'react-router-dom';
import {
  getDocuSignAuthUrl,
  getDocuSignStatus,
  disconnectDocuSign,
} from '../../services/integrationsApi';
import api from '../../services/api';
import './IntegrationsSettings.css';

export default function IntegrationsSettings() {
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  // DocuSign state
  const [dsStatus, setDsStatus] = useState({ connected: false });
  const [dsLoading, setDsLoading] = useState(true);

  // SendingBox state
  const [sbKey, setSbKey] = useState('');
  const [sbConnected, setSbConnected] = useState(false);
  const [sbSaving, setSbSaving] = useState(false);

  const fetchDocuSignStatus = useCallback(async () => {
    setDsLoading(true);
    try {
      const data = await getDocuSignStatus();
      setDsStatus(data);
    } catch { /* ignore */ }
    setDsLoading(false);
  }, []);

  const fetchSendingBoxStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/integrations/sendingbox/status');
      if (data.data) {
        setSbConnected(data.data.connected);
        if (data.data.maskedKey) setSbKey(data.data.maskedKey);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDocuSignStatus();
    fetchSendingBoxStatus();

    // Check URL params for DocuSign callback
    const dsParam = searchParams.get('docusign');
    if (dsParam === 'connected') {
      success('DocuSign connecte avec succes');
    } else if (dsParam === 'error') {
      showError('Erreur lors de la connexion DocuSign');
    }
  }, [fetchDocuSignStatus, fetchSendingBoxStatus, searchParams, success, showError]);

  // DocuSign connect
  const handleDocuSignConnect = async () => {
    try {
      const data = await getDocuSignAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      showError('Impossible d\'obtenir l\'URL de connexion DocuSign');
    }
  };

  // DocuSign disconnect
  const handleDocuSignDisconnect = async () => {
    try {
      await disconnectDocuSign();
      setDsStatus({ connected: false });
      success('DocuSign deconnecte');
    } catch (e) {
      showError('Erreur lors de la deconnexion');
    }
  };

  // SendingBox save
  const handleSaveSendingBoxKey = async () => {
    if (!sbKey.trim()) return;
    setSbSaving(true);
    try {
      await api.put('/integrations/sendingbox', { apiKey: sbKey.trim() });
      setSbConnected(true);
      success('Cle API SendingBox sauvegardee');
    } catch (e) {
      showError('Erreur lors de la sauvegarde');
    }
    setSbSaving(false);
  };

  return (
    <div className="is-container">
      <div className="is-header">
        <h1 className="is-title">Integrations</h1>
        <p className="is-subtitle">Connectez vos services externes pour la signature electronique et l'envoi recommande</p>
      </div>

      {/* DocuSign EU */}
      <div className="is-card">
        <div className="is-card-header">
          <div className="is-card-icon is-card-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div className="is-card-info">
            <h2 className="is-card-title">DocuSign EU</h2>
            <p className="is-card-desc">Signature electronique — Envoyez des documents a la signature via DocuSign</p>
          </div>
        </div>

        <div className="is-card-body">
          {dsLoading ? (
            <div className="is-card-loading"><div className="is-spinner" /></div>
          ) : dsStatus.connected ? (
            <div className="is-status-row">
              <div className="is-status-badge is-status-connected">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Connecte
              </div>
              {dsStatus.accountName && (
                <span className="is-status-detail">Compte : {dsStatus.accountName}</span>
              )}
              <button onClick={handleDocuSignDisconnect} className="is-btn is-btn-danger is-btn-sm">Deconnecter</button>
            </div>
          ) : (
            <div className="is-status-row">
              <div className="is-status-badge is-status-disconnected">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Non configure
              </div>
              <button onClick={handleDocuSignConnect} className="is-btn is-btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Connecter DocuSign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SendingBox */}
      <div className="is-card">
        <div className="is-card-header">
          <div className="is-card-icon is-card-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div className="is-card-info">
            <h2 className="is-card-title">SendingBox</h2>
            <p className="is-card-desc">Envoi recommande — Envoyez des LR et LRAR directement depuis LexDoc</p>
          </div>
        </div>

        <div className="is-card-body">
          <div className="is-status-row" style={{ marginBottom: '0.75rem' }}>
            {sbConnected ? (
              <div className="is-status-badge is-status-connected">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Connecte
              </div>
            ) : (
              <div className="is-status-badge is-status-disconnected">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Non configure
              </div>
            )}
          </div>

          <div className="is-api-key-row">
            <label className="is-label">Cle API</label>
            <div className="is-key-input-wrap">
              <input
                type="password"
                value={sbKey}
                onChange={e => setSbKey(e.target.value)}
                placeholder="Entrez votre cle API SendingBox"
                className="is-input"
              />
              <button
                onClick={handleSaveSendingBoxKey}
                className="is-btn is-btn-primary is-btn-sm"
                disabled={!sbKey.trim() || sbSaving}
              >
                {sbSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="is-info-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p>Les integrations sont stockees de maniere securisee et ne sont accessibles qu'aux administrateurs du cabinet. Les cles API ne sont jamais transmises au navigateur apres leur enregistrement.</p>
      </div>
    </div>
  );
}
