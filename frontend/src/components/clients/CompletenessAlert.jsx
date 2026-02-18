import { AlertTriangle, Send, Edit3, X } from 'lucide-react';
import { useState } from 'react';

export default function CompletenessAlert({ percent, level, criticalMissing, clientName, onSendForm, onComplete }) {
  const [dismissed, setDismissed] = useState(false);

  if (level === 'complet' || dismissed) return null;

  const isCritical = level === 'critique';

  return (
    <div className={`completeness-alert ${isCritical ? 'completeness-alert--critical' : 'completeness-alert--warning'}`}>
      <div className="completeness-alert-content">
        <AlertTriangle size={18} className="completeness-alert-icon" />
        <div className="completeness-alert-text">
          <strong>
            {isCritical
              ? `La fiche client de ${clientName} est très incomplète (${percent}%).`
              : `La fiche client de ${clientName} est incomplète (${percent}%).`}
          </strong>
          {isCritical && criticalMissing?.length > 0 && (
            <span className="completeness-alert-detail">
              {' '}Certains documents ne pourront pas être générés correctement.
            </span>
          )}
        </div>
      </div>
      <div className="completeness-alert-actions">
        {onSendForm && (
          <button className="completeness-alert-btn completeness-alert-btn--primary" onClick={onSendForm}>
            <Send size={14} />
            Envoyer le formulaire
          </button>
        )}
        {onComplete && (
          <button className="completeness-alert-btn completeness-alert-btn--secondary" onClick={onComplete}>
            <Edit3 size={14} />
            Compléter
          </button>
        )}
        <button className="completeness-alert-btn completeness-alert-btn--ghost" onClick={() => setDismissed(true)}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
