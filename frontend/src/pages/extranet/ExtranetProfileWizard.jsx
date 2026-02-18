import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import * as extranetApi from '../../services/extranetApi';
import './ExtranetProfileWizard.css';

const STEPS = [
  { num: 1, label: 'Identité' },
  { num: 2, label: 'Coordonnées' },
  { num: 3, label: 'Situation familiale' },
  { num: 4, label: 'Filiation' },
  { num: 5, label: 'Vérification' },
];

export default function ExtranetProfileWizard() {
  const { access } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0 = accueil
  const [profile, setProfile] = useState({});
  const [completeness, setCompleteness] = useState({ percent: 0, step: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const clientName = access?.client
    ? (access.client.firstName || '').trim()
    : '';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profRes, compRes] = await Promise.all([
        extranetApi.getProfile(),
        extranetApi.getCompleteness(),
      ]);
      const profData = profRes.data?.data || profRes.data;
      const compData = compRes.data?.data || compRes.data;
      setProfile(profData);
      setCompleteness(compData);
    } catch {
      setError('Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveStep = async (stepNum) => {
    setSaving(true);
    setError('');
    try {
      const stepFields = getStepFields(stepNum);
      const data = {};
      for (const f of stepFields) {
        if (profile[f.key] !== undefined) {
          data[f.key] = profile[f.key];
        }
      }
      const res = await extranetApi.saveStep(stepNum, data);
      const result = res.data?.data || res.data;
      setCompleteness((prev) => ({ ...prev, percent: result.percent }));
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep >= 1 && currentStep <= 4) {
      const ok = await handleSaveStep(currentStep);
      if (!ok) return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitProfile = async () => {
    setSaving(true);
    setError('');
    try {
      await extranetApi.submitProfile();
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la soumission');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/extranet/dashboard');
  };

  if (loading) {
    return (
      <div className="epw-loading">
        <div className="epw-spinner" />
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="epw-success">
        <div className="epw-success-icon">&#x2705;</div>
        <h2>Merci !</h2>
        <p>Vos informations ont été transmises à votre cabinet.</p>
        <p>Vous pouvez les modifier à tout moment depuis votre espace.</p>
        <button className="epw-btn epw-btn-primary" onClick={handleGoToDashboard}>
          Accéder à mes dossiers
        </button>
      </div>
    );
  }

  // Accueil (step 0)
  if (currentStep === 0) {
    return (
      <div className="epw-welcome">
        <h1 className="epw-welcome-title">Bonjour {clientName || ''},</h1>
        <p className="epw-welcome-text">
          Votre cabinet a besoin de quelques informations pour préparer vos dossiers.
        </p>
        <p className="epw-welcome-text">
          Cela prend environ <strong>5 minutes</strong>.<br />
          Vos données sont protégées et confidentielles.
        </p>

        <div className="epw-progress-overview">
          <div className="epw-progress-bar">
            <div className="epw-progress-fill" style={{ width: `${completeness.percent}%` }} />
          </div>
          <span className="epw-progress-text">{completeness.percent}% complété</span>
        </div>

        <div className="epw-steps-overview">
          {STEPS.map((s) => {
            const done = s.num < (completeness.step || 1);
            const current = s.num === (completeness.step || 1);
            return (
              <div
                key={s.num}
                className={`epw-step-item ${done ? 'epw-step-item--done' : ''} ${current ? 'epw-step-item--current' : ''}`}
              >
                <span className="epw-step-num">
                  {done ? '\u2713' : s.num}
                </span>
                <span className="epw-step-label">{s.label}</span>
                <span className="epw-step-status">
                  {done ? 'Complété' : current ? 'En cours' : 'Non commencé'}
                </span>
              </div>
            );
          })}
        </div>

        <button
          className="epw-btn epw-btn-primary epw-btn-lg"
          onClick={() => setCurrentStep(completeness.step || 1)}
        >
          {completeness.percent > 0
            ? `Continuer à l'étape ${completeness.step || 1}`
            : 'Commencer'}
        </button>

        <p className="epw-hint">
          Vous pouvez interrompre et reprendre à tout moment.
        </p>
      </div>
    );
  }

  // Steps 1-4: Form
  if (currentStep >= 1 && currentStep <= 4) {
    const fields = getStepFields(currentStep);
    return (
      <div className="epw-form-container">
        <StepHeader steps={STEPS} current={currentStep} percent={completeness.percent} />

        {error && <div className="epw-error">{error}</div>}

        <div className="epw-form">
          <h2 className="epw-form-title">{STEPS[currentStep - 1].label}</h2>

          <div className="epw-fields">
            {fields.map((field) => {
              // Conditional visibility for step 3
              if (field.conditionalOn) {
                const condValue = profile[field.conditionalOn];
                if (!field.showWhen.includes(condValue)) return null;
              }

              return (
                <div key={field.key} className={`epw-field ${field.wide ? 'epw-field--wide' : ''}`}>
                  <label className="epw-field-label">
                    {field.label}
                    {field.required && <span className="epw-required">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="epw-field-input"
                      value={profile[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="epw-field-input"
                      value={
                        field.type === 'date' && profile[field.key]
                          ? new Date(profile[field.key]).toISOString().split('T')[0]
                          : profile[field.key] || ''
                      }
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="epw-nav">
          <button className="epw-btn epw-btn-ghost" onClick={handlePrev}>
            Retour
          </button>
          <button className="epw-btn epw-btn-primary" onClick={handleNext} disabled={saving}>
            {saving ? 'Enregistrement...' : currentStep === 4 ? 'Vérifier' : 'Suivant'}
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Review
  return (
    <div className="epw-form-container">
      <StepHeader steps={STEPS} current={5} percent={completeness.percent} />

      {error && <div className="epw-error">{error}</div>}

      <div className="epw-review">
        <h2 className="epw-form-title">Vérification</h2>
        <p className="epw-review-text">
          Vérifiez vos informations avant de les envoyer à votre cabinet.
        </p>

        <ReviewSection
          title="Identité"
          onEdit={() => setCurrentStep(1)}
          fields={getReviewData(profile, 1)}
        />
        <ReviewSection
          title="Coordonnées"
          onEdit={() => setCurrentStep(2)}
          fields={getReviewData(profile, 2)}
        />
        <ReviewSection
          title="Situation familiale"
          onEdit={() => setCurrentStep(3)}
          fields={getReviewData(profile, 3)}
        />
        <ReviewSection
          title="Filiation"
          onEdit={() => setCurrentStep(4)}
          fields={getReviewData(profile, 4)}
        />
      </div>

      <div className="epw-nav">
        <button className="epw-btn epw-btn-ghost" onClick={handlePrev}>
          Retour
        </button>
        <button className="epw-btn epw-btn-primary" onClick={handleSubmitProfile} disabled={saving}>
          {saving ? 'Envoi...' : 'Envoyer mes informations'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepHeader({ steps, current, percent }) {
  return (
    <div className="epw-step-header">
      <div className="epw-step-dots">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`epw-dot ${s.num === current ? 'epw-dot--active' : ''} ${s.num < current ? 'epw-dot--done' : ''}`}
          >
            {s.num < current ? '\u2713' : s.num}
          </div>
        ))}
      </div>
      <div className="epw-progress-bar epw-progress-bar--small">
        <div className="epw-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ReviewSection({ title, onEdit, fields }) {
  return (
    <div className="epw-review-section">
      <div className="epw-review-section-header">
        <h3>{title}</h3>
        <button className="epw-btn-link" onClick={onEdit}>Modifier</button>
      </div>
      <div className="epw-review-fields">
        {fields.map((f) => (
          <div key={f.label} className="epw-review-row">
            <span className="epw-review-label">{f.label}</span>
            <span className="epw-review-value">{f.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

function getStepFields(step) {
  switch (step) {
    case 1:
      return [
        { key: 'civilite', label: 'Civilité', type: 'select', required: true, options: [
          { value: 'M.', label: 'M.' }, { value: 'Mme', label: 'Mme' },
        ]},
        { key: 'lastName', label: 'Nom', required: true, placeholder: 'Votre nom de famille' },
        { key: 'firstName', label: 'Prénom', required: true, placeholder: 'Votre prénom' },
        { key: 'birthDate', label: 'Date de naissance', type: 'date', required: true },
        { key: 'lieuNaissance', label: 'Lieu de naissance', placeholder: 'Ville de naissance' },
        { key: 'departementNaissance', label: 'Département de naissance', placeholder: 'Ex: 75' },
        { key: 'paysNaissance', label: 'Pays de naissance', placeholder: 'France' },
        { key: 'nationalite', label: 'Nationalité', placeholder: 'Française' },
        { key: 'profession', label: 'Profession', placeholder: 'Votre profession' },
        { key: 'secu', label: 'N° sécurité sociale', placeholder: '1 XX XX XX XXX XXX XX' },
      ];
    case 2:
      return [
        { key: 'address', label: 'Adresse personnelle', required: true, wide: true, placeholder: 'Numéro et rue' },
        { key: 'addressLine2', label: 'Complément d\'adresse', wide: true, placeholder: 'Bâtiment, étage...' },
        { key: 'postalCode', label: 'Code postal', required: true, placeholder: '75001' },
        { key: 'city', label: 'Ville', required: true, placeholder: 'Paris' },
        { key: 'phone', label: 'Téléphone personnel', type: 'tel', placeholder: '06 XX XX XX XX' },
        { key: 'adressePro', label: 'Adresse professionnelle', wide: true, placeholder: 'Numéro et rue (optionnel)' },
        { key: 'complementAdressePro', label: 'Complément adresse pro', wide: true },
        { key: 'cpPro', label: 'Code postal pro', placeholder: '75008' },
        { key: 'villePro', label: 'Ville pro' },
        { key: 'telPro', label: 'Téléphone professionnel', type: 'tel', placeholder: '01 XX XX XX XX' },
      ];
    case 3:
      return [
        { key: 'situationFamiliale', label: 'Situation familiale', type: 'select', required: true, wide: true, options: [
          { value: 'celibataire', label: 'Célibataire' },
          { value: 'marie', label: 'Marié(e)' },
          { value: 'pacse', label: 'Pacsé(e)' },
          { value: 'divorce', label: 'Divorcé(e)' },
          { value: 'veuf', label: 'Veuf/Veuve' },
          { value: 'concubinage', label: 'Concubinage' },
        ]},
        { key: 'conjointNom', label: 'Nom du conjoint', conditionalOn: 'situationFamiliale', showWhen: ['marie', 'pacse'] },
        { key: 'conjointPrenom', label: 'Prénom du conjoint', conditionalOn: 'situationFamiliale', showWhen: ['marie', 'pacse'] },
        { key: 'conjointDateNaissance', label: 'Date de naissance du conjoint', type: 'date', conditionalOn: 'situationFamiliale', showWhen: ['marie', 'pacse'] },
        { key: 'conjointNationalite', label: 'Nationalité du conjoint', conditionalOn: 'situationFamiliale', showWhen: ['marie', 'pacse'] },
        { key: 'conjointProfession', label: 'Profession du conjoint', conditionalOn: 'situationFamiliale', showWhen: ['marie', 'pacse'] },
        { key: 'regimeMatrimonial', label: 'Régime matrimonial', type: 'select', conditionalOn: 'situationFamiliale', showWhen: ['marie'], wide: true, options: [
          { value: 'communaute_legale', label: 'Communauté légale réduite aux acquêts' },
          { value: 'separation_biens', label: 'Séparation de biens' },
          { value: 'communaute_universelle', label: 'Communauté universelle' },
          { value: 'participation_acquets', label: 'Participation aux acquêts' },
        ]},
        { key: 'dateContratMariage', label: 'Date du contrat de mariage', type: 'date', conditionalOn: 'situationFamiliale', showWhen: ['marie'] },
        { key: 'notaireMariage', label: 'Notaire du mariage', conditionalOn: 'situationFamiliale', showWhen: ['marie'], wide: true },
        { key: 'nbEnfantsMineurs', label: 'Nombre d\'enfants mineurs', type: 'number', wide: false },
        { key: 'nbEnfantsMajeurs', label: 'Nombre d\'enfants majeurs', type: 'number', wide: false },
      ];
    case 4:
      return [
        { key: 'pereNom', label: 'Nom du père', required: true, placeholder: 'Nom de famille du père' },
        { key: 'perePrenom', label: 'Prénom du père', placeholder: 'Prénom du père' },
        { key: 'mereNomJeuneFille', label: 'Nom de naissance de la mère', required: true, placeholder: 'Nom de jeune fille' },
        { key: 'merePrenom', label: 'Prénom de la mère', placeholder: 'Prénom de la mère' },
      ];
    default:
      return [];
  }
}

function getReviewData(profile, step) {
  const fields = getStepFields(step);
  return fields
    .filter((f) => {
      if (f.conditionalOn) {
        return f.showWhen.includes(profile[f.conditionalOn]);
      }
      return true;
    })
    .map((f) => {
      let value = profile[f.key];
      if (f.type === 'date' && value) {
        value = new Date(value).toLocaleDateString('fr-FR');
      }
      if (f.type === 'select' && value && f.options) {
        const opt = f.options.find((o) => o.value === value);
        value = opt ? opt.label : value;
      }
      return { label: f.label, value: value || '' };
    });
}
