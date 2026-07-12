import { useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '../../services/clientsApi';

export default function ClientQuickCreate({ open, onClose, onCreated }) {
  const [type, setType] = useState('INDIVIDUAL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  // GO-LIVE-1.C.1 — identité PM saisissable dès la création (évite la friction "créer puis compléter")
  const emptyPm = { formeSociale: '', capital: '', siege: '', rcs: '', villeImmatriculation: '', numeroImmatriculation: '' };
  const [pm, setPm] = useState(emptyPm);
  const setPmField = (k, v) => setPm((p) => ({ ...p, [k]: v }));

  if (!open) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Requis';
    if (!email.trim()) errs.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email invalide';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    try {
      const body =
        type === 'INDIVIDUAL'
          ? { type, lastName: name, email }
          : { type: 'COMPANY', companyName: name, email, ...pm };
      const client = await createClient(body);
      onCreated(client);
      onClose();
      // Reset
      setType('INDIVIDUAL');
      setName('');
      setEmail('');
      setPm(emptyPm);
      setErrors({});
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nouveau client</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {apiError && <div className="modal-error">{apiError}</div>}

          <div className="modal-field">
            <label className="modal-label">Type</label>
            <div className="modal-toggle">
              <button
                type="button"
                className={`modal-toggle-btn ${type === 'INDIVIDUAL' ? 'modal-toggle-btn--active' : ''}`}
                onClick={() => setType('INDIVIDUAL')}
              >
                PP
              </button>
              <button
                type="button"
                className={`modal-toggle-btn ${type === 'COMPANY' ? 'modal-toggle-btn--active' : ''}`}
                onClick={() => setType('COMPANY')}
              >
                PM
              </button>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">
              {type === 'INDIVIDUAL' ? 'Nom' : 'Raison sociale'}
              <span className="required">*</span>
            </label>
            <input
              className={`modal-input ${errors.name ? 'modal-input--error' : ''}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
              placeholder={type === 'INDIVIDUAL' ? 'Dupont' : 'Tech Corp SAS'}
            />
            {errors.name && <span className="modal-field-error">{errors.name}</span>}
          </div>

          {/* GO-LIVE-1.C.1 — identité PM (optionnelle à la création, complétable ensuite) */}
          {type === 'COMPANY' && (
            <div className="modal-field">
              <label className="modal-label">Identité société (optionnel)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input className="modal-input" value={pm.formeSociale} onChange={(e) => setPmField('formeSociale', e.target.value)} placeholder="Forme (SARL, SAS...)" />
                <input className="modal-input" value={pm.capital} onChange={(e) => setPmField('capital', e.target.value)} placeholder="Capital (ex: 10 000 €)" />
                <input className="modal-input" value={pm.siege} onChange={(e) => setPmField('siege', e.target.value)} placeholder="Siège social" />
                <input className="modal-input" value={pm.rcs} onChange={(e) => setPmField('rcs', e.target.value)} placeholder="RCS" />
                <input className="modal-input" value={pm.villeImmatriculation} onChange={(e) => setPmField('villeImmatriculation', e.target.value)} placeholder="Ville immatriculation" />
                <input className="modal-input" value={pm.numeroImmatriculation} onChange={(e) => setPmField('numeroImmatriculation', e.target.value)} placeholder="N° RCS / SIREN" />
              </div>
            </div>
          )}

          <div className="modal-field">
            <label className="modal-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className={`modal-input ${errors.email ? 'modal-input--error' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })); }}
              placeholder="contact@example.fr"
            />
            {errors.email && <span className="modal-field-error">{errors.email}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
