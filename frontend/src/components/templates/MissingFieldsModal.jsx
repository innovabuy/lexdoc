import { useState } from 'react';

const sectionLabels = {
  cabinet: 'Cabinet',
  avocat: 'Avocat',
  client: 'Client',
  dossier: 'Dossier',
  societe: 'Societe',
  postulant: 'Postulant',
};

export default function MissingFieldsModal({
  fields,
  templateName,
  onSubmit,
  onClose,
  loading,
}) {
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.key] = f.currentValue || ''; });
    return init;
  });
  // GO-LIVE-6 M2 — une fois qu'on a tenté de générer, on surligne les champs manquants.
  const [attempted, setAttempted] = useState(false);

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);
  const isEmpty = (f) => !values[f.key]?.trim();
  const missingRequired = requiredFields.filter(isEmpty);
  const allRequiredFilled = missingRequired.length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    // GO-LIVE-6 M2 — plus de bouton grisé muet : si des champs obligatoires manquent,
    // on les LISTE (message) et on les SURLIGNE, au lieu de ne rien faire.
    setAttempted(true);
    if (!allRequiredFilled) return;
    const filled = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v && v.trim()) filled[k] = v.trim();
    });
    onSubmit(filled);
  };

  // Group by section
  const grouped = {};
  fields.forEach(f => {
    const section = f.key.split('.')[0] || 'autre';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(f);
  });

  return (
    <div className="fdp-modal-overlay" onClick={onClose}>
      <div className="fdp-modal mfm-modal" onClick={e => e.stopPropagation()}>
        <div className="fdp-modal-header">
          <div>
            <h2>Champs manquants</h2>
            <p className="mfm-subtitle">Template : {templateName}</p>
          </div>
          <button onClick={onClose} className="fdp-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fdp-modal-body mfm-body">
            <div className="mfm-alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>
                {requiredFields.length > 0
                  ? `${requiredFields.length} champ(s) obligatoire(s) et ${optionalFields.length} optionnel(s) a completer`
                  : `${optionalFields.length} champ(s) optionnel(s) a completer`}
              </span>
            </div>

            {Object.entries(grouped).map(([section, sectionFields]) => (
              <div key={section} className="mfm-section">
                <h4 className="mfm-section-title">{sectionLabels[section] || section}</h4>
                <div className="mfm-fields">
                  {sectionFields.map(f => (
                    <div key={f.key} className="mfm-field">
                      <label className="mfm-label">
                        {f.label}
                        {f.required && <span className="mfm-required">*</span>}
                      </label>
                      <input
                        type={f.key.includes('date') ? 'date' : f.key.includes('email') ? 'email' : 'text'}
                        value={values[f.key] || ''}
                        onChange={e => handleChange(f.key, e.target.value)}
                        placeholder={f.label}
                        className="fdp-input mfm-input"
                        style={attempted && f.required && isEmpty(f) ? { borderColor: '#dc2626', background: '#fef2f2' } : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {attempted && !allRequiredFilled && (
            <div style={{ margin: '0 20px 8px', padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
              Impossible de générer : champ(s) obligatoire(s) manquant(s) — {missingRequired.map(f => f.label).join(', ')}.
            </div>
          )}

          <div className="fdp-modal-footer mfm-footer">
            <button type="button" onClick={onClose} className="fdp-btn fdp-btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              className="fdp-btn fdp-btn-primary"
              disabled={loading}
            >
              {loading ? 'Generation...' : 'Completer et generer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
