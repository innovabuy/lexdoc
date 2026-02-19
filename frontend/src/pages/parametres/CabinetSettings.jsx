import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  Building2, Mail, Shield, Bell, Upload, Trash2, ChevronDown, Save, Image, Scale,
} from 'lucide-react';
import './CabinetSettings.css';

export default function CabinetSettings() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Sections open/closed
  const [sections, setSections] = useState({
    info: true, email: false, reminders: false, security: false, legal: false,
  });

  // Legal info preview
  const [legalInfo, setLegalInfo] = useState(null);

  // Tenant data
  const [tenant, setTenant] = useState({});
  // Settings data
  const [settings, setSettings] = useState({});
  // Logo URL
  const [logoUrl, setLogoUrl] = useState(null);

  const toggleSection = (key) => {
    setSections((s) => ({ ...s, [key]: !s[key] }));
  };

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      const d = data.data;
      setTenant(d.tenant || {});
      setSettings(d.settings || {});

      // Fetch legal info
      try {
        const legalResp = await api.get('/legal-info');
        setLegalInfo(legalResp.data?.data || null);
      } catch {
        setLegalInfo(null);
      }

      // Try to get logo URL
      if (d.tenant?.logo) {
        try {
          const logoResp = await api.get('/settings/logo', { maxRedirects: 0, validateStatus: s => s < 400 });
          // The response will be a redirect, but axios follows it
          setLogoUrl(`${api.defaults.baseURL}/settings/logo?t=${Date.now()}`);
        } catch {
          setLogoUrl(null);
        }
      }
    } catch (e) {
      showError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save all
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save tenant info
      await api.put('/settings/tenant', {
        name: tenant.name,
        legalName: tenant.legalName,
        siret: tenant.siret,
        address: tenant.address,
        postalCode: tenant.postalCode,
        city: tenant.city,
        phone: tenant.phone,
        email: tenant.email,
        website: tenant.website,
        toque: tenant.toque,
        barreau: tenant.barreau,
        primaryColor: tenant.primaryColor,
      });

      // Save settings
      await api.put('/settings/preferences', {
        emailFromName: settings.emailFromName,
        emailReplyTo: settings.emailReplyTo,
        emailSignature: settings.emailSignature,
        enableReminders: settings.enableReminders,
        reminderDelay1: settings.reminderDelay1,
        reminderDelay2: settings.reminderDelay2,
        reminderDelay3: settings.reminderDelay3,
        reminderNotify: settings.reminderNotify,
        enforceStrongPasswords: settings.enforceStrongPasswords,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        require2FA: settings.require2FA,
        allowClientUpload: settings.allowClientUpload,
        clientUploadMaxSizeMB: settings.clientUploadMaxSizeMB,
      });

      success('Paramètres enregistrés');
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success('Logo mis à jour');
      setLogoUrl(`${api.defaults.baseURL}/settings/logo?t=${Date.now()}`);
    } catch (e) {
      showError('Erreur lors de l\'upload du logo');
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await api.delete('/settings/logo');
      setLogoUrl(null);
      success('Logo supprimé');
    } catch (e) {
      showError('Erreur');
    }
  };

  const updateTenant = (key, value) => setTenant((t) => ({ ...t, [key]: value }));
  const updateSettings = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return <div className="cab-loading"><div className="cab-spinner" /></div>;
  }

  return (
    <div className="cab-container">
      {/* Header */}
      <div className="cab-header">
        <h1 className="cab-title">Paramètres du Cabinet</h1>
        <p className="cab-subtitle">
          Informations, configuration email, relances extranet et sécurité.
        </p>
      </div>

      {/* Section 1: Informations du cabinet */}
      <div className="cab-section">
        <div className="cab-section-header" onClick={() => toggleSection('info')}>
          <span className="cab-section-icon"><Building2 size={18} /></span>
          <span className="cab-section-title">Informations du cabinet</span>
          <ChevronDown size={16} className={`cab-section-chevron ${sections.info ? 'open' : ''}`} />
        </div>
        {sections.info && (
          <div className="cab-section-body">
            {/* Logo */}
            <div className="cab-field">
              <label>Logo du cabinet</label>
              <div className="cab-logo-area">
                <div className="cab-logo-preview">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" />
                  ) : (
                    <span className="cab-logo-placeholder"><Image size={24} /></span>
                  )}
                </div>
                <div className="cab-logo-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                  />
                  <button className="cab-btn cab-btn-secondary cab-btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> {logoUrl ? 'Changer' : 'Uploader'}
                  </button>
                  {logoUrl && (
                    <button className="cab-btn cab-btn-danger cab-btn-sm" onClick={handleDeleteLogo}>
                      <Trash2 size={14} /> Supprimer
                    </button>
                  )}
                  <span className="cab-hint">PNG, JPEG ou SVG. Max 5 Mo.</span>
                </div>
              </div>
            </div>

            <div className="cab-row">
              <div className="cab-field">
                <label>Nom du cabinet *</label>
                <input className="cab-input" value={tenant.name || ''} onChange={(e) => updateTenant('name', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Raison sociale</label>
                <input className="cab-input" value={tenant.legalName || ''} onChange={(e) => updateTenant('legalName', e.target.value)} />
              </div>
            </div>

            <div className="cab-row-3">
              <div className="cab-field">
                <label>SIRET</label>
                <input className="cab-input" value={tenant.siret || ''} onChange={(e) => updateTenant('siret', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Toque</label>
                <input className="cab-input" value={tenant.toque || ''} onChange={(e) => updateTenant('toque', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Barreau</label>
                <input className="cab-input" value={tenant.barreau || ''} onChange={(e) => updateTenant('barreau', e.target.value)} />
              </div>
            </div>

            <div className="cab-field">
              <label>Adresse</label>
              <input className="cab-input" value={tenant.address || ''} onChange={(e) => updateTenant('address', e.target.value)} />
            </div>

            <div className="cab-row-3">
              <div className="cab-field">
                <label>Code postal</label>
                <input className="cab-input" value={tenant.postalCode || ''} onChange={(e) => updateTenant('postalCode', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Ville</label>
                <input className="cab-input" value={tenant.city || ''} onChange={(e) => updateTenant('city', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Téléphone</label>
                <input className="cab-input" value={tenant.phone || ''} onChange={(e) => updateTenant('phone', e.target.value)} />
              </div>
            </div>

            <div className="cab-row">
              <div className="cab-field">
                <label>Email de contact</label>
                <input className="cab-input" type="email" value={tenant.email || ''} onChange={(e) => updateTenant('email', e.target.value)} />
              </div>
              <div className="cab-field">
                <label>Site web</label>
                <input className="cab-input" value={tenant.website || ''} onChange={(e) => updateTenant('website', e.target.value)} />
              </div>
            </div>

            <div className="cab-field">
              <label>Couleur principale</label>
              <div className="cab-color-row">
                <input
                  type="color"
                  className="cab-color-input"
                  value={tenant.primaryColor || '#0066ff'}
                  onChange={(e) => updateTenant('primaryColor', e.target.value)}
                />
                <input
                  className="cab-input"
                  value={tenant.primaryColor || '#0066ff'}
                  onChange={(e) => updateTenant('primaryColor', e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Configuration email */}
      <div className="cab-section">
        <div className="cab-section-header" onClick={() => toggleSection('email')}>
          <span className="cab-section-icon"><Mail size={18} /></span>
          <span className="cab-section-title">Configuration email</span>
          <ChevronDown size={16} className={`cab-section-chevron ${sections.email ? 'open' : ''}`} />
        </div>
        {sections.email && (
          <div className="cab-section-body">
            <div className="cab-row">
              <div className="cab-field">
                <label>Nom de l'expéditeur</label>
                <input className="cab-input" value={settings.emailFromName || ''} onChange={(e) => updateSettings('emailFromName', e.target.value)} placeholder="Cabinet Pragmavox" />
              </div>
              <div className="cab-field">
                <label>Email de réponse (reply-to)</label>
                <input className="cab-input" type="email" value={settings.emailReplyTo || ''} onChange={(e) => updateSettings('emailReplyTo', e.target.value)} placeholder="contact@cabinet.fr" />
              </div>
            </div>
            <div className="cab-field">
              <label>Signature email (HTML)</label>
              <textarea
                className="cab-textarea"
                value={settings.emailSignature || ''}
                onChange={(e) => updateSettings('emailSignature', e.target.value)}
                placeholder="<p>Cordialement,<br/>Cabinet Pragmavox</p>"
                rows={4}
              />
              <span className="cab-hint">HTML autorisé. Cette signature sera ajoutée à tous les emails envoyés.</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Relances extranet */}
      <div className="cab-section">
        <div className="cab-section-header" onClick={() => toggleSection('reminders')}>
          <span className="cab-section-icon"><Bell size={18} /></span>
          <span className="cab-section-title">Relances extranet</span>
          <ChevronDown size={16} className={`cab-section-chevron ${sections.reminders ? 'open' : ''}`} />
        </div>
        {sections.reminders && (
          <div className="cab-section-body">
            <div className="cab-toggle-row">
              <div>
                <div className="cab-toggle-label">Activer les relances automatiques</div>
                <div className="cab-toggle-desc">Envoyer des rappels aux clients qui n'ont pas complété leur fiche</div>
              </div>
              <label className="cab-toggle">
                <input type="checkbox" checked={settings.enableReminders || false} onChange={(e) => updateSettings('enableReminders', e.target.checked)} />
                <div className="cab-toggle-track" />
                <div className="cab-toggle-thumb" />
              </label>
            </div>

            {settings.enableReminders && (
              <>
                <div className="cab-row-3" style={{ marginTop: '1rem' }}>
                  <div className="cab-field">
                    <label>1re relance (jours)</label>
                    <input className="cab-input" type="number" min="1" max="30" value={settings.reminderDelay1 || 3} onChange={(e) => updateSettings('reminderDelay1', parseInt(e.target.value) || 3)} />
                    <span className="cab-hint">Jours après l'invitation</span>
                  </div>
                  <div className="cab-field">
                    <label>2e relance (jours)</label>
                    <input className="cab-input" type="number" min="1" max="60" value={settings.reminderDelay2 || 7} onChange={(e) => updateSettings('reminderDelay2', parseInt(e.target.value) || 7)} />
                    <span className="cab-hint">Jours après l'invitation</span>
                  </div>
                  <div className="cab-field">
                    <label>3e relance (jours)</label>
                    <input className="cab-input" type="number" min="1" max="90" value={settings.reminderDelay3 || 14} onChange={(e) => updateSettings('reminderDelay3', parseInt(e.target.value) || 14)} />
                    <span className="cab-hint">Jours après l'invitation</span>
                  </div>
                </div>

                <div className="cab-toggle-row">
                  <div>
                    <div className="cab-toggle-label">Notifier le cabinet</div>
                    <div className="cab-toggle-desc">Recevoir une notification quand un client complète une étape</div>
                  </div>
                  <label className="cab-toggle">
                    <input type="checkbox" checked={settings.reminderNotify !== false} onChange={(e) => updateSettings('reminderNotify', e.target.checked)} />
                    <div className="cab-toggle-track" />
                    <div className="cab-toggle-thumb" />
                  </label>
                </div>
              </>
            )}

            <div className="cab-toggle-row">
              <div>
                <div className="cab-toggle-label">Autoriser l'upload client</div>
                <div className="cab-toggle-desc">Permettre aux clients de déposer des documents via l'extranet</div>
              </div>
              <label className="cab-toggle">
                <input type="checkbox" checked={settings.allowClientUpload || false} onChange={(e) => updateSettings('allowClientUpload', e.target.checked)} />
                <div className="cab-toggle-track" />
                <div className="cab-toggle-thumb" />
              </label>
            </div>

            {settings.allowClientUpload && (
              <div className="cab-field" style={{ marginTop: '0.5rem' }}>
                <label>Taille max par fichier (Mo)</label>
                <input className="cab-input" type="number" min="1" max="50" value={settings.clientUploadMaxSizeMB || 10} onChange={(e) => updateSettings('clientUploadMaxSizeMB', parseInt(e.target.value) || 10)} style={{ width: 120 }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Sécurité */}
      <div className="cab-section">
        <div className="cab-section-header" onClick={() => toggleSection('security')}>
          <span className="cab-section-icon"><Shield size={18} /></span>
          <span className="cab-section-title">Sécurité</span>
          <ChevronDown size={16} className={`cab-section-chevron ${sections.security ? 'open' : ''}`} />
        </div>
        {sections.security && (
          <div className="cab-section-body">
            <div className="cab-toggle-row">
              <div>
                <div className="cab-toggle-label">Mots de passe forts obligatoires</div>
                <div className="cab-toggle-desc">Minimum 12 caractères, majuscule, minuscule, chiffre</div>
              </div>
              <label className="cab-toggle">
                <input type="checkbox" checked={settings.enforceStrongPasswords !== false} onChange={(e) => updateSettings('enforceStrongPasswords', e.target.checked)} />
                <div className="cab-toggle-track" />
                <div className="cab-toggle-thumb" />
              </label>
            </div>

            <div className="cab-field" style={{ marginTop: '1rem' }}>
              <label>Délai d'expiration de session (minutes)</label>
              <input className="cab-input" type="number" min="15" max="1440" value={settings.sessionTimeoutMinutes || 480} onChange={(e) => updateSettings('sessionTimeoutMinutes', parseInt(e.target.value) || 480)} style={{ width: 120 }} />
              <span className="cab-hint">Les utilisateurs seront déconnectés après cette durée d'inactivité.</span>
            </div>

            <div className="cab-toggle-row">
              <div>
                <div className="cab-toggle-label">Authentification à deux facteurs (2FA)</div>
                <div className="cab-toggle-desc">Exiger la 2FA pour tous les utilisateurs du cabinet</div>
              </div>
              <label className="cab-toggle">
                <input type="checkbox" checked={settings.require2FA || false} onChange={(e) => updateSettings('require2FA', e.target.checked)} />
                <div className="cab-toggle-track" />
                <div className="cab-toggle-thumb" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Section 5: Informations légales & mentions */}
      <div className="cab-section">
        <div className="cab-section-header" onClick={() => toggleSection('legal')}>
          <span className="cab-section-icon"><Scale size={18} /></span>
          <span className="cab-section-title">Informations legales & mentions</span>
          <ChevronDown size={16} className={`cab-section-chevron ${sections.legal ? 'open' : ''}`} />
        </div>
        {sections.legal && (
          <div className="cab-section-body">
            {legalInfo ? (
              <div className="cab-legal-preview">
                <div className="cab-legal-grid">
                  {legalInfo.barreau && (
                    <div className="cab-legal-item">
                      <span className="cab-legal-label">Barreau</span>
                      <span className="cab-legal-value">{legalInfo.barreau}</span>
                    </div>
                  )}
                  {legalInfo.numeroToque && (
                    <div className="cab-legal-item">
                      <span className="cab-legal-label">Toque</span>
                      <span className="cab-legal-value">{legalInfo.numeroToque}</span>
                    </div>
                  )}
                  {legalInfo.assuranceRC && (
                    <div className="cab-legal-item">
                      <span className="cab-legal-label">Assurance RC</span>
                      <span className="cab-legal-value">{legalInfo.assuranceRC}</span>
                    </div>
                  )}
                  {legalInfo.rcs && (
                    <div className="cab-legal-item">
                      <span className="cab-legal-label">RCS</span>
                      <span className="cab-legal-value">{legalInfo.rcs}</span>
                    </div>
                  )}
                  {legalInfo.tvaIntra && (
                    <div className="cab-legal-item">
                      <span className="cab-legal-label">TVA Intracommunautaire</span>
                      <span className="cab-legal-value">{legalInfo.tvaIntra}</span>
                    </div>
                  )}
                </div>
                {!legalInfo.barreau && !legalInfo.numeroToque && !legalInfo.assuranceRC && (
                  <p className="cab-hint">Aucune information legale configuree.</p>
                )}
                <button
                  className="cab-btn cab-btn-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/settings/legal-info')}
                >
                  Gerer les mentions legales completes &rarr;
                </button>
              </div>
            ) : (
              <div>
                <p className="cab-hint">Les mentions legales n'ont pas encore ete configurees.</p>
                <button
                  className="cab-btn cab-btn-secondary"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => navigate('/settings/legal-info')}
                >
                  Configurer les mentions legales &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="cab-save-bar">
        <button className="cab-btn cab-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
}
