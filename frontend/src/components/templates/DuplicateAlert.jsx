export default function DuplicateAlert({ existingDocument, onContinue, onCancel }) {
  const createdAt = existingDocument?.createdAt
    ? new Date(existingDocument.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="fdp-modal-overlay" onClick={onCancel}>
      <div className="fdp-modal dup-modal" onClick={e => e.stopPropagation()}>
        <div className="fdp-modal-header">
          <h2>Document similaire existant</h2>
          <button onClick={onCancel} className="fdp-modal-close">&times;</button>
        </div>
        <div className="fdp-modal-body">
          <div className="dup-alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="dup-alert-text">
              <p className="dup-alert-title">Un document du meme template existe deja dans ce dossier :</p>
              <p className="dup-alert-doc">
                <strong>{existingDocument?.name}</strong>
                <br />
                <span className="dup-alert-meta">
                  Créé le {createdAt} · Statut : {existingDocument?.status || '-'}
                </span>
              </p>
            </div>
          </div>
          <p className="dup-question">Voulez-vous quand meme generer un nouveau document ?</p>
        </div>
        <div className="fdp-modal-footer">
          <button onClick={onCancel} className="fdp-btn fdp-btn-secondary">Annuler</button>
          <button onClick={onContinue} className="fdp-btn fdp-btn-primary">Generer quand meme</button>
        </div>
      </div>
    </div>
  );
}
