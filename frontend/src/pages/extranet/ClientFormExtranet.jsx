import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtranetAuthContext } from '../../contexts/ExtranetAuthContext';
import * as extranetApi from '../../services/extranetApi';
import './ClientFormExtranet.css';

// ============================================================================
// Définition des champs par section
// ============================================================================

const SECTION_FIELDS = {
  IDENTITE: [
    { key: 'nom', label: 'Nom', required: true, placeholder: 'Votre nom de famille' },
    { key: 'prenom', label: 'Prénom', required: true, placeholder: 'Votre prénom' },
    { key: 'dateNaissance', label: 'Date de naissance', type: 'date' },
    { key: 'lieuNaissance', label: 'Lieu de naissance', placeholder: 'Ville de naissance' },
    { key: 'nationalite', label: 'Nationalité', placeholder: 'Française' },
    { key: 'profession', label: 'Profession', placeholder: 'Votre profession' },
    { key: 'numeroSecuriteSociale', label: 'N° sécurité sociale', placeholder: '1 XX XX XX XXX XXX XX' },
  ],
  COORDONNEES: [
    { key: 'domicilePersonnel', label: 'Domicile personnel', wide: true, placeholder: 'Adresse complète' },
    { key: 'telephonePersonnel', label: 'Téléphone personnel', type: 'tel', placeholder: '06 XX XX XX XX' },
    { key: 'domicileProfessionnel', label: 'Domicile professionnel', wide: true, placeholder: 'Adresse professionnelle' },
    { key: 'telephoneProfessionnel', label: 'Téléphone professionnel', type: 'tel', placeholder: '01 XX XX XX XX' },
    { key: 'telecopie', label: 'Télécopie / Fax', placeholder: 'Numéro de fax' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'votre@email.fr' },
  ],
  SITUATION_FAMILIALE: [
    { key: 'nombreEnfantsMineurs', label: "Nombre d'enfants mineurs", type: 'number' },
    { key: 'nombreEnfantsMajeurs', label: "Nombre d'enfants majeurs", type: 'number' },
    { key: 'estSalarieSociete', label: 'Salarié(e) de la société', type: 'select', options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
    { key: 'deviendraaSalarieSociete', label: 'Deviendra salarié(e) de la société', type: 'select', options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
  ],
  FILIATION: [
    { key: 'nomPrenomsPere', label: 'Nom et prénoms du père', wide: true, placeholder: 'Nom complet du père' },
    { key: 'nomJeuneFillePrenomsEre', label: 'Nom de jeune fille et prénoms de la mère', wide: true, placeholder: 'Nom de naissance de la mère' },
  ],
  CONJOINT_PACS: [
    { key: 'statutConjoint', label: 'Statut', type: 'select', required: true, wide: true, options: [
      { value: 'MARIE', label: 'Marié(e)' },
      { value: 'PACSE', label: 'Pacsé(e)' },
      { value: 'CELIBATAIRE', label: 'Célibataire' },
      { value: 'VEUF', label: 'Veuf/Veuve' },
      { value: 'DIVORCE', label: 'Divorcé(e)' },
    ]},
    { key: 'conjointNom', label: 'Nom du conjoint', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'conjointPrenom', label: 'Prénom du conjoint', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'conjointDateNaissance', label: 'Date de naissance', type: 'date', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'conjointLieuNaissance', label: 'Lieu de naissance', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'conjointNationalite', label: 'Nationalité', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'conjointProfession', label: 'Profession', conditionalOn: 'statutConjoint', showWhen: ['MARIE', 'PACSE'] },
    { key: 'pacsSign', label: 'PACS signé', type: 'select', conditionalOn: 'statutConjoint', showWhen: ['PACSE'], options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
    { key: 'pacsDate', label: 'Date du PACS', type: 'date', conditionalOn: 'statutConjoint', showWhen: ['PACSE'] },
  ],
  SITUATION_MATRIMONIALE: [
    { key: 'dateLieuMariage', label: 'Date et lieu du mariage', wide: true, placeholder: 'Ex: 15 juin 2010 à Paris' },
    { key: 'contratMariage', label: 'Contrat de mariage', type: 'select', options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
    { key: 'typeContratMariage', label: 'Type de contrat', conditionalOn: 'contratMariage', showWhen: ['true'], wide: true, placeholder: 'Ex: Séparation de biens' },
    { key: 'dateContratMariage', label: 'Date du contrat', type: 'date', conditionalOn: 'contratMariage', showWhen: ['true'] },
    { key: 'nomAdresseNotaire', label: 'Nom et adresse du notaire', conditionalOn: 'contratMariage', showWhen: ['true'], wide: true },
    { key: 'dateDecesConjoint', label: 'Date de décès du conjoint', type: 'date' },
    { key: 'dateDivorce', label: 'Date du divorce', type: 'date' },
  ],
  INFORMATIONS_PROJET: [
    { key: 'nomSociete', label: 'Nom de la société', placeholder: 'Dénomination sociale' },
    { key: 'objetSocial', label: 'Objet social', wide: true, placeholder: "Description de l'activité" },
    { key: 'montantCapital', label: 'Montant du capital', type: 'number', placeholder: 'En euros' },
    { key: 'repartitionCapital', label: 'Répartition du capital', wide: true, placeholder: 'Détail de la répartition' },
    { key: 'apports', label: 'Apports', wide: true, placeholder: 'Nature et montant des apports' },
    { key: 'projetImmobilier', label: 'Projet immobilier', wide: true, placeholder: 'Description du projet' },
    { key: 'dirigeants', label: 'Dirigeants', wide: true, placeholder: 'Nom et fonction des dirigeants' },
    { key: 'siegeSocial', label: 'Siège social', wide: true, placeholder: 'Adresse du siège' },
    { key: 'modeJouissance', label: 'Mode de jouissance', placeholder: 'Propriétaire, locataire...' },
    { key: 'optionIS', label: 'Option IS', type: 'select', options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
    { key: 'optionTVA', label: 'Option TVA', type: 'select', options: [
      { value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' },
    ]},
    { key: 'regimeTVA', label: 'Régime TVA', conditionalOn: 'optionTVA', showWhen: ['true'], placeholder: 'Réel normal, simplifié...' },
  ],
};

export default function ClientFormExtranet() {
  const { access } = useContext(ExtranetAuthContext);
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(0); // 0 = accueil
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState(null);

  const clientName = access?.client
    ? (access.client.firstName || '').trim()
    : '';

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    setLoading(true);
    try {
      const res = await extranetApi.getClientForm();
      const result = res.data?.data || res.data;
      if (!result.template) {
        setTemplate(null);
        return;
      }
      setTemplate(result.template);
      setSections(result.template.sections || []);
      if (result.response) {
        setFormData(result.response.data || {});
        setCurrentStep(0);
        setResponseId(result.response.id);
        if (result.response.status === 'SUBMITTED') {
          setSubmitted(true);
        }
      }
    } catch {
      setError('Impossible de charger le formulaire');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const getSectionFields = (sectionType) => {
    return SECTION_FIELDS[sectionType] || [];
  };

  const handleSaveStep = async (stepIndex) => {
    setSaving(true);
    setError('');
    try {
      const section = sections[stepIndex];
      const fields = getSectionFields(section.section);
      const data = {};
      for (const f of fields) {
        if (formData[f.key] !== undefined) {
          data[f.key] = formData[f.key];
        }
      }
      await extranetApi.saveClientForm({
        templateId: template.id,
        data,
        step: stepIndex + 1,
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep >= 1 && currentStep <= sections.length) {
      const ok = await handleSaveStep(currentStep - 1);
      if (!ok) return;
    }
    if (currentStep < sections.length + 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await extranetApi.saveClientForm({
        templateId: template.id,
        data: formData,
        step: sections.length,
        submit: true,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la soumission');
    } finally {
      setSaving(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="cfe-loading">
        <div className="cfe-spinner" />
        <p>Chargement du formulaire...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="cfe-empty">
        <p>Aucun formulaire n'est disponible pour votre dossier.</p>
        <button className="cfe-btn cfe-btn-ghost" onClick={() => navigate('/extranet/dashboard')}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="cfe-success">
        <div className="cfe-success-icon">&#x2705;</div>
        <h2>Merci !</h2>
        <p>Vos informations ont été transmises à votre cabinet.</p>
        <p>Vous pouvez les modifier à tout moment en revenant sur cette page.</p>
        <button className="cfe-btn cfe-btn-primary" onClick={() => navigate('/extranet/dashboard')}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // Accueil (step 0)
  if (currentStep === 0) {
    const completedSteps = sections.filter((_, i) => {
      const fields = getSectionFields(sections[i].section);
      return fields.some((f) => formData[f.key]);
    }).length;
    const percent = sections.length > 0 ? Math.round((completedSteps / sections.length) * 100) : 0;

    return (
      <div className="cfe-welcome">
        <h1 className="cfe-welcome-title">Bonjour {clientName || ''},</h1>
        <p className="cfe-welcome-text">
          Votre cabinet a besoin de quelques informations pour préparer votre dossier.
        </p>
        <p className="cfe-welcome-text">
          <strong>{template.name}</strong>
        </p>
        {template.description && (
          <p className="cfe-welcome-desc">{template.description}</p>
        )}

        <div className="cfe-progress-overview">
          <div className="cfe-progress-bar">
            <div className="cfe-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="cfe-progress-text">{percent}% complété</span>
        </div>

        <div className="cfe-steps-overview">
          {sections.map((s, i) => {
            const fields = getSectionFields(s.section);
            const hasData = fields.some((f) => formData[f.key]);
            return (
              <div
                key={s.id}
                className={`cfe-step-item ${hasData ? 'cfe-step-item--done' : ''}`}
              >
                <span className="cfe-step-num">{hasData ? '\u2713' : i + 1}</span>
                <span className="cfe-step-label">{s.label}</span>
                <span className="cfe-step-status">
                  {hasData ? 'Commencé' : 'Non commencé'}
                </span>
              </div>
            );
          })}
        </div>

        <button
          className="cfe-btn cfe-btn-primary cfe-btn-lg"
          onClick={() => setCurrentStep(1)}
        >
          {Object.keys(formData).length > 0 ? 'Continuer' : 'Commencer'}
        </button>

        <p className="cfe-hint">
          Vous pouvez interrompre et reprendre à tout moment. Vos données sont sauvegardées automatiquement.
        </p>
      </div>
    );
  }

  // Steps 1 to N: Form sections
  const reviewStep = sections.length + 1;
  if (currentStep >= 1 && currentStep <= sections.length) {
    const section = sections[currentStep - 1];
    const fields = getSectionFields(section.section);

    return (
      <div className="cfe-form-container">
        <StepHeader sections={sections} current={currentStep} total={sections.length} />

        {error && <div className="cfe-error">{error}</div>}

        <div className="cfe-form">
          <h2 className="cfe-form-title">{section.label}</h2>

          <div className="cfe-fields">
            {fields.map((field) => {
              if (field.conditionalOn) {
                const condValue = String(formData[field.conditionalOn] || '');
                if (!field.showWhen.includes(condValue)) return null;
              }

              return (
                <div key={field.key} className={`cfe-field ${field.wide ? 'cfe-field--wide' : ''}`}>
                  <label className="cfe-field-label">
                    {field.label}
                    {field.required && <span className="cfe-required">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="cfe-field-input"
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="cfe-field-input"
                      value={
                        field.type === 'date' && formData[field.key]
                          ? new Date(formData[field.key]).toISOString().split('T')[0]
                          : formData[field.key] || ''
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

        <div className="cfe-nav">
          <button className="cfe-btn cfe-btn-ghost" onClick={handlePrev}>
            Retour
          </button>
          <button className="cfe-btn cfe-btn-primary" onClick={handleNext} disabled={saving}>
            {saving
              ? 'Enregistrement...'
              : currentStep === sections.length
                ? 'Vérifier'
                : 'Suivant'}
          </button>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="cfe-form-container">
      <StepHeader sections={sections} current={reviewStep} total={sections.length} />

      {error && <div className="cfe-error">{error}</div>}

      <div className="cfe-review">
        <h2 className="cfe-form-title">Vérification</h2>
        <p className="cfe-review-text">
          Vérifiez vos informations avant de les envoyer à votre cabinet.
        </p>

        {sections.map((s, i) => (
          <ReviewSection
            key={s.id}
            title={s.label}
            onEdit={() => setCurrentStep(i + 1)}
            fields={getReviewData(formData, s.section)}
          />
        ))}
      </div>

      <div className="cfe-nav">
        <button className="cfe-btn cfe-btn-ghost" onClick={handlePrev}>
          Retour
        </button>
        <button className="cfe-btn cfe-btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Envoi...' : 'Envoyer mes informations'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepHeader({ sections, current, total }) {
  return (
    <div className="cfe-step-header">
      <div className="cfe-step-dots">
        {sections.map((s, i) => {
          const stepNum = i + 1;
          return (
            <div
              key={s.id}
              className={`cfe-dot ${stepNum === current ? 'cfe-dot--active' : ''} ${stepNum < current ? 'cfe-dot--done' : ''}`}
              title={s.label}
            >
              {stepNum < current ? '\u2713' : stepNum}
            </div>
          );
        })}
        <div className={`cfe-dot ${current > total ? 'cfe-dot--active' : ''}`}>
          &#x2714;
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, onEdit, fields }) {
  return (
    <div className="cfe-review-section">
      <div className="cfe-review-section-header">
        <h3>{title}</h3>
        <button className="cfe-btn-link" onClick={onEdit}>Modifier</button>
      </div>
      <div className="cfe-review-fields">
        {fields.map((f) => (
          <div key={f.label} className="cfe-review-row">
            <span className="cfe-review-label">{f.label}</span>
            <span className="cfe-review-value">{f.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getReviewData(formData, sectionType) {
  const fields = SECTION_FIELDS[sectionType] || [];
  return fields
    .filter((f) => {
      if (f.conditionalOn) {
        return f.showWhen.includes(String(formData[f.conditionalOn] || ''));
      }
      return true;
    })
    .map((f) => {
      let value = formData[f.key];
      if (f.type === 'date' && value) {
        value = new Date(value).toLocaleDateString('fr-FR');
      }
      if (f.type === 'select' && value && f.options) {
        const opt = f.options.find((o) => o.value === String(value));
        value = opt ? opt.label : value;
      }
      return { label: f.label, value: value != null ? String(value) : '' };
    });
}
