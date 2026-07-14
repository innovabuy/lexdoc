import { useState, useEffect } from 'react';
import { estimateRegisteredMail, confirmRegisteredMail } from '../../services/integrationsApi';
import './RegisteredMailModal.css';

export default function RegisteredMailModal({ document, folderPersons, type: initialType, onClose, onSuccess, onError }) {
  const [type, setType] = useState(initialType || 'LRAR');
  const [recipientId, setRecipientId] = useState('');
  const [estimateData, setEstimateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Auto-select first person with address
  useEffect(() => {
    if (folderPersons?.length > 0) {
      const withAddr = folderPersons.find(p => p.address && p.address.trim());
      if (withAddr) setRecipientId(withAddr.id);
    }
  }, [folderPersons]);

  // Fetch estimate when recipient or type changes
  useEffect(() => {
    if (!recipientId || !type) {
      setEstimateData(null);
      return;
    }

    let cancelled = false;
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const data = await estimateRegisteredMail(document.id, {
          recipientPersonId: recipientId,
          type,
        });
        if (!cancelled) setEstimateData(data);
      } catch (e) {
        if (!cancelled) {
          setEstimateData(null);
          if (onError) onError(e.response?.data?.error?.message || 'Erreur de validation');
        }
      }
      if (!cancelled) setLoading(false);
    };

    fetchEstimate();
    return () => { cancelled = true; };
  }, [recipientId, type, document.id]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const result = await confirmRegisteredMail(document.id, {
        recipientPersonId: recipientId,
        type,
      });
      if (onSuccess) onSuccess(result);
    } catch (e) {
      if (onError) onError(e.response?.data?.error?.message || 'Erreur lors de l\'envoi');
    }
    setConfirming(false);
    setShowConfirmation(false);
  };

  const selectedPerson = folderPersons?.find(p => p.id === recipientId);

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        <div className="rm-header">
          <h2>Envoyer en recommande</h2>
          <button onClick={onClose} className="rm-close">&times;</button>
        </div>

        <div className="rm-body">
          {/* Document info */}
          <div className="rm-doc-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{document?.name}</span>
          </div>

          {/* Type */}
          <div className="rm-section">
            <h3 className="rm-section-title">Type d'envoi</h3>
            <div className="rm-type-options">
              <label className={`rm-type-option ${type === 'LR' ? 'active' : ''}`}>
                <input type="radio" name="type" value="LR" checked={type === 'LR'} onChange={() => setType('LR')} />
                <div>
                  <span className="rm-type-label">Lettre recommandee (LR)</span>
                  <span className="rm-type-desc">Sans accuse de reception</span>
                </div>
              </label>
              <label className={`rm-type-option ${type === 'LRAR' ? 'active' : ''}`}>
                <input type="radio" name="type" value="LRAR" checked={type === 'LRAR'} onChange={() => setType('LRAR')} />
                <div>
                  <span className="rm-type-label">Lettre recommandee avec AR (LRAR)</span>
                  <span className="rm-type-desc">Avec accuse de reception</span>
                </div>
              </label>
            </div>
          </div>

          {/* Recipient */}
          <div className="rm-section">
            <h3 className="rm-section-title">Destinataire</h3>
            <select
              value={recipientId}
              onChange={e => setRecipientId(e.target.value)}
              className="rm-input rm-select"
            >
              <option value="">Sélectionner un destinataire</option>
              {(folderPersons || []).map(p => {
                const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.company || 'Sans nom';
                // GO-LIVE-6 M1 (post-contre-recette) — l'adresse est un champ LIBRE : on exige
                // seulement qu'elle soit renseignée (pas une adresse structurée ville+CP).
                const hasAddr = !!(p.address && p.address.trim());
                return (
                  <option key={p.id} value={p.id} disabled={!hasAddr}>
                    {name}{!hasAddr ? ' (adresse incomplète)' : ''}
                  </option>
                );
              })}
            </select>

            {selectedPerson && (
              <div className="rm-address-card">
                <div className="rm-address-text">
                  {selectedPerson.address}<br />
                  {selectedPerson.postalCode} {selectedPerson.city}
                  {selectedPerson.country && selectedPerson.country !== 'FR' ? ` (${selectedPerson.country})` : ''}
                </div>
                {estimateData?.addressValid && (
                  <div className="rm-address-valid">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Adresse verifiee
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cost estimate */}
          {estimateData && (
            <div className="rm-section">
              <h3 className="rm-section-title">Cout estime</h3>
              <div className="rm-cost">
                <span className="rm-cost-type">{type}</span>
                <span className="rm-cost-amount">{estimateData.estimatedCost?.toFixed(2)} EUR TTC</span>
              </div>
              <div className="rm-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>L'envoi est irreversible et payant.</span>
              </div>
            </div>
          )}
        </div>

        <div className="rm-footer">
          <button onClick={onClose} className="rm-btn rm-btn-secondary" disabled={confirming}>Annuler</button>
          <button
            onClick={() => setShowConfirmation(true)}
            className="rm-btn rm-btn-primary"
            disabled={!estimateData || loading || confirming}
          >
            {loading ? 'Verification...' : 'Confirmer l\'envoi'}
          </button>
        </div>

        {/* Confirmation dialog */}
        {showConfirmation && (
          <div className="rm-confirm-overlay" onClick={() => setShowConfirmation(false)}>
            <div className="rm-confirm-dialog" onClick={e => e.stopPropagation()}>
              <h3>Confirmer l'envoi</h3>
              <p>Etes-vous sur de vouloir envoyer ce {type} ?</p>
              <p className="rm-confirm-cost">Cout : {estimateData?.estimatedCost?.toFixed(2)} EUR TTC</p>
              <p className="rm-confirm-warn">Cette action est irreversible.</p>
              <div className="rm-confirm-actions">
                <button onClick={() => setShowConfirmation(false)} className="rm-btn rm-btn-secondary" disabled={confirming}>Annuler</button>
                <button onClick={handleConfirm} className="rm-btn rm-btn-danger" disabled={confirming}>
                  {confirming ? 'Envoi...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
