import { useState, useEffect } from 'react';
import { sendDocumentForSignature } from '../../services/integrationsApi';
import './SignatureModal.css';

export default function SignatureModal({ document, folderPersons, onClose, onSuccess, onError }) {
  const [signers, setSigners] = useState([]);
  const [subject, setSubject] = useState(`Signature requise : ${document?.name || 'Document'}`);
  const [message, setMessage] = useState('Veuillez signer ce document.');
  const [ordreSignature, setOrdreSignature] = useState('parallele');
  const [expiresAfterDays, setExpiresAfterDays] = useState(7);
  const [sending, setSending] = useState(false);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');

  // Pre-fill signers from folder persons
  useEffect(() => {
    if (folderPersons && folderPersons.length > 0) {
      const initial = folderPersons
        .filter(p => p.email)
        .map((p, i) => ({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.companyName || p.email,
          email: p.email,
          checked: true,
          order: i + 1,
        }));
      setSigners(initial);
    }
  }, [folderPersons]);

  const toggleSigner = (idx) => {
    setSigners(signers.map((s, i) => i === idx ? { ...s, checked: !s.checked } : s));
  };

  const addSigner = () => {
    if (!newSignerName.trim() || !newSignerEmail.trim()) return;
    setSigners([...signers, {
      id: `new-${Date.now()}`,
      name: newSignerName.trim(),
      email: newSignerEmail.trim(),
      checked: true,
      order: signers.length + 1,
    }]);
    setNewSignerName('');
    setNewSignerEmail('');
  };

  const removeSigner = (idx) => {
    setSigners(signers.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const selected = signers.filter(s => s.checked);
    if (selected.length === 0) {
      if (onError) onError('Sélectionnez au moins un signataire');
      return;
    }

    setSending(true);
    try {
      const result = await sendDocumentForSignature(document.id, {
        signers: selected.map((s, i) => ({
          name: s.name,
          email: s.email,
          order: ordreSignature === 'sequentiel' ? i + 1 : 1,
        })),
        subject,
        message,
        expiresAfterDays,
        ordreSignature,
      });
      if (onSuccess) onSuccess(result);
    } catch (e) {
      if (onError) onError(e.response?.data?.error?.message || 'Erreur lors de l\'envoi');
    }
    setSending(false);
  };

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        <div className="sm-header">
          <h2>Envoyer à la signature</h2>
          <button onClick={onClose} className="sm-close">&times;</button>
        </div>

        <div className="sm-body">
          {/* Document info */}
          <div className="sm-doc-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{document?.name}</span>
          </div>

          {/* Signers */}
          <div className="sm-section">
            <h3 className="sm-section-title">Signataires</h3>
            <div className="sm-signers">
              {signers.map((s, i) => (
                <label key={s.id} className="sm-signer-row">
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => toggleSigner(i)}
                    className="sm-checkbox"
                  />
                  <div className="sm-signer-info">
                    <span className="sm-signer-name">{s.name}</span>
                    <span className="sm-signer-email">{s.email}</span>
                  </div>
                  {ordreSignature === 'sequentiel' && (
                    <span className="sm-signer-order">Ordre: {i + 1}</span>
                  )}
                  <button onClick={(e) => { e.preventDefault(); removeSigner(i); }} className="sm-signer-remove" title="Retirer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </label>
              ))}
            </div>

            {/* Add signer */}
            <div className="sm-add-signer">
              <input
                type="text"
                value={newSignerName}
                onChange={e => setNewSignerName(e.target.value)}
                placeholder="Nom"
                className="sm-input sm-input-sm"
              />
              <input
                type="email"
                value={newSignerEmail}
                onChange={e => setNewSignerEmail(e.target.value)}
                placeholder="Email"
                className="sm-input sm-input-sm"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSigner(); } }}
              />
              <button onClick={addSigner} className="sm-btn sm-btn-ghost sm-btn-sm" type="button">
                + Ajouter
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="sm-section">
            <h3 className="sm-section-title">Options</h3>

            <div className="sm-option-row">
              <span className="sm-option-label">Ordre de signature</span>
              <div className="sm-radio-group">
                <label className="sm-radio">
                  <input type="radio" name="ordre" value="parallele" checked={ordreSignature === 'parallele'} onChange={() => setOrdreSignature('parallele')} />
                  Parallele
                </label>
                <label className="sm-radio">
                  <input type="radio" name="ordre" value="sequentiel" checked={ordreSignature === 'sequentiel'} onChange={() => setOrdreSignature('sequentiel')} />
                  Sequentiel
                </label>
              </div>
            </div>

            <div className="sm-option-row">
              <span className="sm-option-label">Expiration</span>
              <select value={expiresAfterDays} onChange={e => setExpiresAfterDays(Number(e.target.value))} className="sm-input sm-select">
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
                <option value={60}>60 jours</option>
              </select>
            </div>

            <div className="sm-field">
              <label className="sm-option-label">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="sm-input sm-textarea"
                rows={3}
                placeholder="Message pour les signataires..."
              />
            </div>
          </div>
        </div>

        <div className="sm-footer">
          <button onClick={onClose} className="sm-btn sm-btn-secondary" disabled={sending}>Annuler</button>
          <button onClick={handleSubmit} className="sm-btn sm-btn-primary" disabled={sending}>
            {sending ? 'Envoi...' : 'Envoyer à la signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
