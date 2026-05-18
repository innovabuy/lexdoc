import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  Search, X, ChevronLeft, ChevronRight, Plus, Trash2, Check,
  AlertTriangle, FileText, Scale, Briefcase, Users, Send, FolderPlus
} from 'lucide-react';
import { createFolderWizard, getTemplateSuggestions } from '../../services/foldersApi';
import { createClient } from '../../services/clientsApi';
import api from '../../services/api';
import './FolderCreateWizard.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_LABELS = ['Client', 'Type', 'Informations', 'Récapitulatif'];

const NATURES_JURIDIQUE = [
  { value: 'creation_societe', label: 'Création société' },
  { value: 'transfert_siege', label: 'Transfert siège' },
  { value: 'modification_statuts', label: 'Modification statuts' },
  { value: 'agoa', label: 'AGOA' },
  { value: 'cession', label: 'Cession' },
  { value: 'dissolution', label: 'Dissolution' },
  { value: 'autre', label: 'Autre' },
];

const PROCEDURES_JUDICIAIRE = [
  { value: 'TJ', label: 'Tribunal judiciaire (TJ)' },
  { value: 'CA', label: "Cour d'appel (CA)" },
  { value: 'TC', label: 'Tribunal de commerce (TC)' },
  { value: 'refere', label: 'Référé' },
  { value: 'recouvrement', label: 'Recouvrement' },
  { value: 'autre', label: 'Autre' },
];

function getClientDisplayName(client) {
  if (!client) return '';
  if (client.companyName) return client.companyName;
  return `${client.firstName || ''} ${client.lastName || ''}`.trim();
}

function suggestTitle(client, folderType, nature, parties) {
  const year = new Date().getFullYear();
  const name = getClientDisplayName(client);
  if (!name) return '';

  if (folderType === 'juridique') {
    if (nature === 'cession') return `${name} — Cession ${year}`;
    if (nature === 'agoa') return `AGOA ${name} ${year}`;
    if (nature === 'creation_societe') return `Création société ${name} ${year}`;
    if (nature === 'dissolution') return `Dissolution ${name} ${year}`;
    if (nature === 'transfert_siege') return `Transfert siège ${name} ${year}`;
    if (nature === 'modification_statuts') return `Modification statuts ${name} ${year}`;
    return `${name} — ${year}`;
  }

  if (folderType === 'judiciaire') {
    const adverse = parties?.[0]?.lastName || '';
    if (adverse) return `${name} c/ ${adverse} ${year}`;
    return `${name} — Procédure ${year}`;
  }

  return `${name} — ${year}`;
}

function completenessColor(percent) {
  if (percent >= 80) return '#059669';
  if (percent >= 50) return '#d97706';
  return '#ef4444';
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({ step }) {
  return (
    <div className="wz-progress">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const status = num < step ? 'completed' : num === step ? 'active' : 'future';
        return (
          <div className="wz-progress-step" key={num}>
            {i > 0 && <div className={`wz-progress-line wz-progress-line--${num <= step ? 'done' : 'future'}`} />}
            <div className={`wz-progress-dot wz-progress-dot--${status}`}>
              {status === 'completed' ? <Check size={14} /> : num}
            </div>
            <span className={`wz-progress-label wz-progress-label--${status}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// STEP 1 — CLIENT
// ============================================================================

function StepClient({ selectedClient, onSelect }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/clients?search=${encodeURIComponent(search)}&pageSize=10`);
        setResults(data.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreated = (client) => {
    onSelect(client);
    setShowQuickCreate(false);
    setSearch('');
  };

  if (selectedClient) {
    const pct = selectedClient.completeness?.percent ?? selectedClient.profileCompletionPercent ?? null;
    return (
      <div className="wz-step">
        <h2 className="wz-step-title">Client sélectionné</h2>
        <div className="wz-client-selected">
          <div className="wz-client-selected-info">
            <span className="wz-client-selected-name">{getClientDisplayName(selectedClient)}</span>
            <span className="wz-client-selected-meta">
              {selectedClient.type === 'COMPANY' ? 'PM' : selectedClient.type === 'ASSOCIATION' ? 'Asso' : 'PP'}
              {selectedClient.email && ` — ${selectedClient.email}`}
            </span>
            {pct !== null && (
              <span className="wz-client-selected-pct" style={{ color: completenessColor(pct) }}>{pct}%</span>
            )}
          </div>
          <button className="wz-btn-ghost" onClick={() => { onSelect(null); setDismissed(false); }}>
            <X size={16} /> Changer
          </button>
        </div>

        {pct !== null && pct < 50 && !dismissed && (
          <div className="wz-client-warning">
            <AlertTriangle size={18} />
            <div className="wz-client-warning-text">
              <strong>Fiche très incomplète ({pct}%)</strong>
              <span>Certains documents pourraient ne pas être générables.</span>
            </div>
            <div className="wz-client-warning-actions">
              <a
                href={`/clients/${selectedClient.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wz-btn wz-btn--outline wz-btn--sm"
              >
                Compléter d'abord
              </a>
              <button className="wz-btn wz-btn--ghost wz-btn--sm" onClick={() => setDismissed(true)}>
                Continuer quand même
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wz-step">
      <h2 className="wz-step-title">Sélectionner le client</h2>

      <div className="wz-search-wrap">
        <Search size={18} className="wz-search-icon" />
        <input
          className="wz-search-input"
          placeholder="Rechercher un client existant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <div className="wz-search-loading">Recherche...</div>}

      {results.length > 0 && (
        <div className="wz-client-results">
          {results.map((c) => {
            const pct = c.completeness?.percent ?? 0;
            return (
              <div key={c.id} className="wz-client-row" onClick={() => onSelect(c)}>
                <div className="wz-client-row-info">
                  <span className="wz-client-row-name">{getClientDisplayName(c)}</span>
                  <span className="wz-client-row-email">{c.email || ''}</span>
                </div>
                <span className="wz-client-row-type">{c.type === 'COMPANY' ? 'PM' : c.type === 'ASSOCIATION' ? 'Asso' : 'PP'}</span>
                <span className="wz-client-row-pct" style={{ color: completenessColor(pct) }}>{pct}%</span>
                <button className="wz-btn wz-btn--primary wz-btn--sm">Sélectionner</button>
              </div>
            );
          })}
        </div>
      )}

      {search.trim() && !loading && results.length === 0 && (
        <div className="wz-search-empty">Aucun client trouvé pour "{search}"</div>
      )}

      <div className="wz-divider">
        <span>Ou</span>
      </div>

      <button className="wz-btn wz-btn--outline wz-btn--full" onClick={() => setShowQuickCreate(true)}>
        <Plus size={16} /> Créer un nouveau client
      </button>

      {showQuickCreate && (
        <QuickCreateInline onCreated={handleCreated} onCancel={() => setShowQuickCreate(false)} />
      )}
    </div>
  );
}

function QuickCreateInline({ onCreated, onCancel }) {
  const [type, setType] = useState('INDIVIDUAL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = type === 'INDIVIDUAL'
        ? { type, lastName: name, email: email || undefined }
        : { type: 'COMPANY', companyName: name, email: email || undefined };
      const client = await createClient(body);
      onCreated(client);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur');
    }
    setSaving(false);
  };

  return (
    <form className="wz-quick-create" onSubmit={handleSubmit}>
      {error && <div className="wz-error">{error}</div>}
      <div className="wz-quick-create-row">
        <div className="wz-toggle">
          <button type="button" className={`wz-toggle-btn ${type === 'INDIVIDUAL' ? 'wz-toggle-btn--active' : ''}`} onClick={() => setType('INDIVIDUAL')}>PP</button>
          <button type="button" className={`wz-toggle-btn ${type === 'COMPANY' ? 'wz-toggle-btn--active' : ''}`} onClick={() => setType('COMPANY')}>PM</button>
        </div>
        <input
          className="wz-input"
          placeholder={type === 'INDIVIDUAL' ? 'Nom' : 'Raison sociale'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="wz-input"
          type="email"
          placeholder="Email (optionnel)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="wz-btn wz-btn--primary wz-btn--sm" disabled={saving}>
          {saving ? '...' : 'Créer'}
        </button>
        <button type="button" className="wz-btn-ghost" onClick={onCancel}><X size={16} /></button>
      </div>
    </form>
  );
}

// ============================================================================
// STEP 2 — TYPE
// ============================================================================

function StepType({ folderType, procedure, onUpdate }) {
  return (
    <div className="wz-step">
      <h2 className="wz-step-title">Type de dossier</h2>

      <div className="wz-type-cards">
        <div
          className={`wz-type-card ${folderType === 'juridique' ? 'wz-type-card--active' : ''}`}
          onClick={() => onUpdate({ folderType: 'juridique', procedure: null })}
        >
          <Briefcase size={32} className="wz-type-card-icon" />
          <h3>Juridique</h3>
          <p>Conseil, sociétés, formalités</p>
          <span className="wz-type-card-sub">Pas de partie adverse</span>
        </div>
        <div
          className={`wz-type-card ${folderType === 'judiciaire' ? 'wz-type-card--active' : ''}`}
          onClick={() => onUpdate({ folderType: 'judiciaire', procedure: null })}
        >
          <Scale size={32} className="wz-type-card-icon" />
          <h3>Judiciaire</h3>
          <p>Contentieux, procédures</p>
          <span className="wz-type-card-sub">Parties adverses, avocats</span>
        </div>
      </div>

      {folderType === 'judiciaire' && (
        <div className="wz-procedure-select">
          <h3 className="wz-sub-title">Type de procédure</h3>
          <div className="wz-radio-group">
            {PROCEDURES_JUDICIAIRE.map((p) => (
              <label key={p.value} className={`wz-radio ${procedure === p.value ? 'wz-radio--active' : ''}`}>
                <input
                  type="radio"
                  name="procedure"
                  value={p.value}
                  checked={procedure === p.value}
                  onChange={() => onUpdate({ folderType: 'judiciaire', procedure: p.value })}
                />
                <span className="wz-radio-dot" />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STEP 3 — INFORMATIONS
// ============================================================================

function StepInfos({ folderType, procedure, nature, infos, parties, selectedClient, onUpdateNature, onUpdateInfos, onUpdateParties }) {
  // Auto-suggest title when entering step
  useEffect(() => {
    if (!infos.titre) {
      const suggested = suggestTitle(selectedClient, folderType, nature, parties);
      if (suggested) onUpdateInfos({ ...infos, titre: suggested });
    }
  }, []); // Run once on mount

  // Update title suggestion when nature changes and title matches old suggestion
  const handleNatureChange = (newNature) => {
    onUpdateNature(newNature);
    const oldSuggestion = suggestTitle(selectedClient, folderType, nature, parties);
    if (!infos.titre || infos.titre === oldSuggestion) {
      const newSuggestion = suggestTitle(selectedClient, folderType, newNature, parties);
      if (newSuggestion) onUpdateInfos({ ...infos, titre: newSuggestion });
    }
  };

  const updateInfo = (key, val) => onUpdateInfos({ ...infos, [key]: val });

  const addParty = () => {
    onUpdateParties([...parties, { role: 'PARTIE_ADVERSE', lastName: '', firstName: '', email: '', phone: '', address: '', avocat: null }]);
  };

  const updateParty = (idx, key, val) => {
    const updated = [...parties];
    updated[idx] = { ...updated[idx], [key]: val };
    onUpdateParties(updated);
  };

  const updatePartyAvocat = (idx, key, val) => {
    const updated = [...parties];
    const avocat = updated[idx].avocat || { lastName: '', cabinet: '', barreau: '', email: '' };
    updated[idx] = { ...updated[idx], avocat: { ...avocat, [key]: val } };
    onUpdateParties(updated);
  };

  const togglePartyAvocat = (idx) => {
    const updated = [...parties];
    updated[idx] = { ...updated[idx], avocat: updated[idx].avocat ? null : { lastName: '', cabinet: '', barreau: '', email: '' } };
    onUpdateParties(updated);
  };

  const removeParty = (idx) => {
    onUpdateParties(parties.filter((_, i) => i !== idx));
  };

  return (
    <div className="wz-step">
      <h2 className="wz-step-title">Informations du dossier</h2>

      <div className="wz-form">
        {/* Common fields */}
        <div className="wz-field">
          <label className="wz-label">Titre du dossier <span className="wz-required">*</span></label>
          <input
            className="wz-input"
            value={infos.titre}
            onChange={(e) => updateInfo('titre', e.target.value)}
            placeholder="Titre du dossier"
          />
        </div>

        <div className="wz-field">
          <label className="wz-label">Description</label>
          <textarea
            className="wz-input wz-textarea"
            rows={3}
            value={infos.description}
            onChange={(e) => updateInfo('description', e.target.value)}
            placeholder="Description (optionnel)"
          />
        </div>

        <div className="wz-field-row">
          <div className="wz-field">
            <label className="wz-label">Date d'ouverture <span className="wz-required">*</span></label>
            <input type="date" className="wz-input" value={infos.dateOuverture} onChange={(e) => updateInfo('dateOuverture', e.target.value)} />
          </div>
          <div className="wz-field">
            <label className="wz-label">Date d'échéance</label>
            <input type="date" className="wz-input" value={infos.dateEcheance} onChange={(e) => updateInfo('dateEcheance', e.target.value)} />
          </div>
        </div>

        {/* Juridique fields */}
        {folderType === 'juridique' && (
          <div className="wz-field">
            <label className="wz-label">Nature</label>
            <select className="wz-select" value={nature || ''} onChange={(e) => handleNatureChange(e.target.value || null)}>
              <option value="">-- Sélectionner --</option>
              {NATURES_JURIDIQUE.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Judiciaire fields */}
        {folderType === 'judiciaire' && (
          <>
            <div className="wz-field-row">
              <div className="wz-field">
                <label className="wz-label">Juridiction</label>
                <select className="wz-select" value={infos.juridiction || procedure || ''} onChange={(e) => updateInfo('juridiction', e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {PROCEDURES_JUDICIAIRE.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="wz-field">
                <label className="wz-label">N° RG</label>
                <input className="wz-input" value={infos.numeroRG} onChange={(e) => updateInfo('numeroRG', e.target.value)} placeholder="26/12345" />
              </div>
            </div>
            <div className="wz-field-row">
              <div className="wz-field">
                <label className="wz-label">Chambre</label>
                <input className="wz-input" value={infos.chambre} onChange={(e) => updateInfo('chambre', e.target.value)} placeholder="1ère chambre" />
              </div>
              <div className="wz-field">
                <label className="wz-label">Date d'audience</label>
                <input type="date" className="wz-input" value={infos.dateAudience} onChange={(e) => updateInfo('dateAudience', e.target.value)} />
              </div>
            </div>

            {/* Parties section */}
            <div className="wz-parties-section">
              <div className="wz-parties-header">
                <h3><Users size={18} /> Parties prenantes</h3>
                <button type="button" className="wz-btn wz-btn--outline wz-btn--sm" onClick={addParty}>
                  <Plus size={14} /> Ajouter une partie adverse
                </button>
              </div>

              {parties.map((partie, idx) => (
                <div key={idx} className="wz-party-block">
                  <div className="wz-party-block-header">
                    <select
                      className="wz-select wz-select--sm"
                      value={partie.role}
                      onChange={(e) => updateParty(idx, 'role', e.target.value)}
                    >
                      <option value="PARTIE_ADVERSE">Partie adverse</option>
                      <option value="POSTULANT">Postulant</option>
                      <option value="TEMOIN">Témoin</option>
                      <option value="EXPERT">Expert</option>
                      <option value="CO_DEBITEUR">Co-débiteur</option>
                    </select>
                    <button type="button" className="wz-btn-ghost wz-btn-ghost--danger" onClick={() => removeParty(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="wz-field-row">
                    <div className="wz-field">
                      <label className="wz-label-sm">Nom</label>
                      <input className="wz-input wz-input--sm" value={partie.lastName} onChange={(e) => updateParty(idx, 'lastName', e.target.value)} placeholder="Nom" />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label-sm">Prénom</label>
                      <input className="wz-input wz-input--sm" value={partie.firstName} onChange={(e) => updateParty(idx, 'firstName', e.target.value)} placeholder="Prénom" />
                    </div>
                  </div>

                  <div className="wz-field-row">
                    <div className="wz-field">
                      <label className="wz-label-sm">Email</label>
                      <input className="wz-input wz-input--sm" type="email" value={partie.email} onChange={(e) => updateParty(idx, 'email', e.target.value)} placeholder="Email" />
                    </div>
                    <div className="wz-field">
                      <label className="wz-label-sm">Adresse</label>
                      <input className="wz-input wz-input--sm" value={partie.address} onChange={(e) => updateParty(idx, 'address', e.target.value)} placeholder="Adresse" />
                    </div>
                  </div>

                  {partie.role === 'PARTIE_ADVERSE' && (
                    <div className="wz-avocat-section">
                      <button
                        type="button"
                        className="wz-btn wz-btn--ghost wz-btn--xs"
                        onClick={() => togglePartyAvocat(idx)}
                      >
                        {partie.avocat ? <><X size={12} /> Retirer l'avocat adverse</> : <><Plus size={12} /> Ajouter un avocat adverse</>}
                      </button>

                      {partie.avocat && (
                        <div className="wz-avocat-fields">
                          <div className="wz-field-row">
                            <div className="wz-field">
                              <label className="wz-label-sm">Nom avocat</label>
                              <input className="wz-input wz-input--sm" value={partie.avocat.lastName || ''} onChange={(e) => updatePartyAvocat(idx, 'lastName', e.target.value)} placeholder="Me Martin" />
                            </div>
                            <div className="wz-field">
                              <label className="wz-label-sm">Cabinet</label>
                              <input className="wz-input wz-input--sm" value={partie.avocat.cabinet || ''} onChange={(e) => updatePartyAvocat(idx, 'cabinet', e.target.value)} placeholder="Cabinet Martin" />
                            </div>
                          </div>
                          <div className="wz-field-row">
                            <div className="wz-field">
                              <label className="wz-label-sm">Barreau</label>
                              <input className="wz-input wz-input--sm" value={partie.avocat.barreau || ''} onChange={(e) => updatePartyAvocat(idx, 'barreau', e.target.value)} placeholder="Angers" />
                            </div>
                            <div className="wz-field">
                              <label className="wz-label-sm">Email avocat</label>
                              <input className="wz-input wz-input--sm" type="email" value={partie.avocat.email || ''} onChange={(e) => updatePartyAvocat(idx, 'email', e.target.value)} placeholder="avocat@cabinet.fr" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {parties.length === 0 && (
                <div className="wz-parties-empty">
                  Aucune partie adverse ajoutée. Cliquez sur le bouton ci-dessus pour en ajouter.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4 — DOCUMENTS + RECAP
// ============================================================================

function StepRecap({ selectedClient, folderType, procedure, nature, infos, parties, templates, selectedTemplates, onToggleTemplate, extranet, onToggleExtranet, onLoadMore }) {
  const typeLabel = folderType === 'juridique' ? 'Juridique' : 'Judiciaire';
  const natureLabel = folderType === 'juridique'
    ? NATURES_JURIDIQUE.find(n => n.value === nature)?.label || nature || '—'
    : PROCEDURES_JUDICIAIRE.find(p => p.value === (infos.juridiction || procedure))?.label || procedure || '—';

  return (
    <div className="wz-step">
      <h2 className="wz-step-title">Documents & Récapitulatif</h2>

      {/* Documents to generate */}
      <div className="wz-recap-section">
        <h3 className="wz-recap-section-title"><FileText size={18} /> Documents à générer</h3>
        {templates.length > 0 ? (
          <div className="wz-template-list">
            {templates.map((t) => {
              const isSelected = selectedTemplates.some(s => s.id === t.id);
              return (
                <label key={t.id} className={`wz-template-item ${isSelected ? 'wz-template-item--selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleTemplate(t)}
                  />
                  <div className="wz-template-item-info">
                    <span className="wz-template-item-name">{t.name}</span>
                    {t.description && <span className="wz-template-item-desc">{t.description}</span>}
                  </div>
                  {t.recommended && <span className="wz-template-badge">Recommandé</span>}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="wz-templates-empty">
            Aucun template disponible pour ce type de dossier.
            Les documents pourront être ajoutés ultérieurement.
          </div>
        )}
      </div>

      {/* Extranet */}
      <div className="wz-recap-section">
        <label className="wz-extranet-toggle">
          <input type="checkbox" checked={extranet} onChange={(e) => onToggleExtranet(e.target.checked)} />
          <div>
            <strong>Ouvrir l'accès extranet pour ce client</strong>
            <span>Le client pourra consulter les documents publiés</span>
          </div>
        </label>
      </div>

      {/* Summary */}
      <div className="wz-recap-section wz-recap-summary">
        <h3 className="wz-recap-section-title">Récapitulatif</h3>
        <div className="wz-recap-grid">
          <div className="wz-recap-row">
            <span className="wz-recap-label">Client</span>
            <span className="wz-recap-value">{getClientDisplayName(selectedClient)}</span>
          </div>
          <div className="wz-recap-row">
            <span className="wz-recap-label">Type</span>
            <span className="wz-recap-value">{typeLabel} — {natureLabel}</span>
          </div>
          <div className="wz-recap-row">
            <span className="wz-recap-label">Titre</span>
            <span className="wz-recap-value">{infos.titre || '—'}</span>
          </div>
          {infos.dateOuverture && (
            <div className="wz-recap-row">
              <span className="wz-recap-label">Ouverture</span>
              <span className="wz-recap-value">{new Date(infos.dateOuverture).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {folderType === 'judiciaire' && infos.juridiction && (
            <div className="wz-recap-row">
              <span className="wz-recap-label">Juridiction</span>
              <span className="wz-recap-value">{PROCEDURES_JUDICIAIRE.find(p => p.value === infos.juridiction)?.label || infos.juridiction}</span>
            </div>
          )}
          {folderType === 'judiciaire' && infos.numeroRG && (
            <div className="wz-recap-row">
              <span className="wz-recap-label">N° RG</span>
              <span className="wz-recap-value">{infos.numeroRG}</span>
            </div>
          )}
          {folderType === 'judiciaire' && parties.length > 0 && (
            <div className="wz-recap-row">
              <span className="wz-recap-label">Parties</span>
              <span className="wz-recap-value">{parties.length} partie{parties.length > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="wz-recap-row">
            <span className="wz-recap-label">Documents</span>
            <span className="wz-recap-value">{selectedTemplates.length} document{selectedTemplates.length !== 1 ? 's' : ''} à générer</span>
          </div>
          <div className="wz-recap-row">
            <span className="wz-recap-label">Extranet</span>
            <span className="wz-recap-value">{extranet ? 'Activé' : 'Non activé'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD
// ============================================================================

export default function FolderCreateWizard() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  // Wizard state
  const [selectedClient, setSelectedClient] = useState(null);
  const [folderType, setFolderType] = useState(null);
  const [procedure, setProcedure] = useState(null);
  const [nature, setNature] = useState(null);
  const [infos, setInfos] = useState({
    titre: '',
    description: '',
    dateOuverture: new Date().toISOString().slice(0, 10),
    dateEcheance: '',
    juridiction: '',
    numeroRG: '',
    chambre: '',
    dateAudience: '',
  });
  const [parties, setParties] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [extranet, setExtranet] = useState(false);

  // Pre-fill juridiction from procedure
  useEffect(() => {
    if (procedure && !infos.juridiction) {
      setInfos(prev => ({ ...prev, juridiction: procedure }));
    }
  }, [procedure]);

  // Load templates when entering step 4
  useEffect(() => {
    if (step === 4 && folderType) {
      getTemplateSuggestions({ type: folderType, nature: nature || undefined })
        .then((data) => {
          setTemplates(data);
          // Pre-select recommended templates
          setSelectedTemplates(prev => {
            if (prev.length > 0) return prev;
            return data.filter(t => t.recommended);
          });
        })
        .catch(() => setTemplates([]));
    }
  }, [step, folderType, nature]);

  const toggleTemplate = (template) => {
    setSelectedTemplates(prev => {
      const exists = prev.some(t => t.id === template.id);
      return exists ? prev.filter(t => t.id !== template.id) : [...prev, template];
    });
  };

  // Step validation
  const canNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 2) return !!folderType;
    if (step === 3) return !!infos.titre?.trim();
    return true;
  };

  const handleNext = () => {
    if (step < 4 && canNext()) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const body = {
        client: selectedClient.id ? { id: selectedClient.id } : {
          type: selectedClient.type || 'INDIVIDUAL',
          lastName: selectedClient.lastName,
          firstName: selectedClient.firstName,
          companyName: selectedClient.companyName,
          email: selectedClient.email,
        },
        type: folderType,
        nature: folderType === 'juridique' ? nature : null,
        infos: {
          titre: infos.titre,
          description: infos.description || undefined,
          dateOuverture: infos.dateOuverture || undefined,
          dateEcheance: infos.dateEcheance || undefined,
          juridiction: infos.juridiction || undefined,
          numeroRG: infos.numeroRG || undefined,
          chambre: infos.chambre || undefined,
          dateAudience: infos.dateAudience || undefined,
        },
        parties: folderType === 'judiciaire' ? parties.filter(p => p.lastName?.trim()) : undefined,
        documents: selectedTemplates.map(t => ({
          templateId: t.id,
          name: t.name,
          type: 'OTHER',
        })),
        extranet,
      };

      const folder = await createFolderWizard(body);
      success('Dossier créé avec succès');
      navigate(`/dossiers/${folder.id}`);
    } catch (err) {
      showError(err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors de la création du dossier');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="wz">
      <div className="wz-header">
        <button className="wz-back" onClick={() => navigate('/dossiers')}>
          <ChevronLeft size={16} /> Retour aux dossiers
        </button>
        <h1 className="wz-title"><FolderPlus size={24} /> Nouveau dossier</h1>
      </div>

      <ProgressBar step={step} />

      <div className="wz-body">
        {step === 1 && (
          <StepClient selectedClient={selectedClient} onSelect={setSelectedClient} />
        )}

        {step === 2 && (
          <StepType
            folderType={folderType}
            procedure={procedure}
            onUpdate={({ folderType: ft, procedure: pr }) => { setFolderType(ft); setProcedure(pr); }}
          />
        )}

        {step === 3 && (
          <StepInfos
            folderType={folderType}
            procedure={procedure}
            nature={nature}
            infos={infos}
            parties={parties}
            selectedClient={selectedClient}
            onUpdateNature={setNature}
            onUpdateInfos={setInfos}
            onUpdateParties={setParties}
          />
        )}

        {step === 4 && (
          <StepRecap
            selectedClient={selectedClient}
            folderType={folderType}
            procedure={procedure}
            nature={nature}
            infos={infos}
            parties={parties}
            templates={templates}
            selectedTemplates={selectedTemplates}
            onToggleTemplate={toggleTemplate}
            extranet={extranet}
            onToggleExtranet={setExtranet}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="wz-nav">
        <button
          className="wz-btn wz-btn--outline"
          onClick={handlePrev}
          disabled={step === 1}
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        {step < 4 ? (
          <button
            className="wz-btn wz-btn--primary"
            onClick={handleNext}
            disabled={!canNext()}
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="wz-btn wz-btn--primary wz-btn--create"
            onClick={handleCreate}
            disabled={creating || !infos.titre?.trim()}
          >
            {creating ? (
              <><span className="wz-spinner" /> Création en cours...</>
            ) : (
              <><FolderPlus size={16} /> Créer le dossier</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
