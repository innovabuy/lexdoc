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

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter only fields with actual values
    const filled = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v && v.trim()) filled[k] = v.trim();
    });
    onSubmit(filled);
  };

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  // Group by section
  const grouped = {};
  fields.forEach(f => {
    const section = f.key.split('.')[0] || 'autre';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(f);
  });

  const allRequiredFilled = requiredFields.every(f => values[f.key]?.trim());

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
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="fdp-modal-footer mfm-footer">
            <button type="button" onClick={onClose} className="fdp-btn fdp-btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              className="fdp-btn fdp-btn-primary"
              disabled={loading || !allRequiredFilled}
            >
              {loading ? 'Generation...' : 'Completer et generer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
