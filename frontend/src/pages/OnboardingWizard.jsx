import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileSignature,
  Users,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
  Info,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import useOnboarding from '../hooks/useOnboarding';
import './OnboardingWizard.css';

const TOTAL_STEPS = 5;

// ============================================================
// Progress bar
// ============================================================
function ProgressBar({ step }) {
  return (
    <div className="onboarding-progress">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < step;
        const isActive = stepNum === step;
        return (
          <div key={stepNum} className="onboarding-progress-step">
            {i > 0 && (
              <div
                className={`onboarding-progress-line ${
                  stepNum <= step
                    ? 'onboarding-progress-line--completed'
                    : 'onboarding-progress-line--pending'
                }`}
              />
            )}
            <div
              className={`onboarding-progress-dot ${
                isCompleted
                  ? 'onboarding-progress-dot--completed'
                  : isActive
                  ? 'onboarding-progress-dot--active'
                  : 'onboarding-progress-dot--future'
              }`}
            >
              {isCompleted ? <Check size={16} /> : stepNum}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Step 1 — Bienvenue
// ============================================================
function StepWelcome({ onNext }) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-welcome-icon">&#x1F537;</div>
      <h1 className="onboarding-title">Bienvenue sur LexDoc</h1>
      <p className="onboarding-subtitle">
        Configurez votre espace de travail en quelques minutes.
      </p>
      <ul className="onboarding-features">
        <li>
          <FolderOpen size={20} className="onboarding-feature-icon" />
          <span>Gérer vos dossiers et documents juridiques</span>
        </li>
        <li>
          <FileSignature size={20} className="onboarding-feature-icon" />
          <span>Envoyer des signatures électroniques</span>
        </li>
        <li>
          <Users size={20} className="onboarding-feature-icon" />
          <span>Communiquer avec vos clients via l'extranet</span>
        </li>
      </ul>
      <div className="onboarding-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="onboarding-btn onboarding-btn--primary" onClick={onNext}>
          Commencer la configuration &rarr;
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Step 2 — Profil cabinet
// ============================================================
function StepCabinet({ onNext, onPrev, saving, apiError, saveStep }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    email: '',
    siret: '',
    toque: '',
    barreau: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Requis';
    if (!form.address.trim()) errs.address = 'Requis';
    if (!form.city.trim()) errs.city = 'Requis';
    if (!form.zipCode.trim()) errs.zipCode = 'Requis';
    if (!form.phone.trim()) errs.phone = 'Requis';
    if (!form.email.trim()) errs.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Format email invalide';
    if (!form.barreau.trim()) errs.barreau = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const ok = await saveStep(2, form);
    if (ok) onNext();
  };

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">Profil du cabinet</h1>
      <p className="onboarding-subtitle">
        Ces informations seront utilisées pour vos documents et correspondances.
      </p>

      {apiError && <div className="onboarding-api-error">{apiError}</div>}

      <div className="onboarding-form">
        <Field
          label="Nom du cabinet"
          required
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Cabinet Pragmavox Avocat"
          error={errors.name}
          full
        />
        <Field
          label="Adresse"
          required
          value={form.address}
          onChange={handleChange('address')}
          placeholder="10 rue de la Gare"
          error={errors.address}
          full
        />
        <Field
          label="Code postal"
          required
          value={form.zipCode}
          onChange={handleChange('zipCode')}
          placeholder="49000"
          error={errors.zipCode}
        />
        <Field
          label="Ville"
          required
          value={form.city}
          onChange={handleChange('city')}
          placeholder="Angers"
          error={errors.city}
        />
        <Field
          label="Téléphone"
          required
          type="tel"
          value={form.phone}
          onChange={handleChange('phone')}
          placeholder="02 41 00 00 00"
          error={errors.phone}
        />
        <Field
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          placeholder="contact@cabinet.fr"
          error={errors.email}
        />
        <Field
          label="SIRET"
          value={form.siret}
          onChange={handleChange('siret')}
          placeholder="123 456 789 00001"
        />
        <Field
          label="N° Toque"
          value={form.toque}
          onChange={handleChange('toque')}
          placeholder="T-123"
        />
        <Field
          label="Barreau"
          required
          value={form.barreau}
          onChange={handleChange('barreau')}
          placeholder="Angers"
          error={errors.barreau}
          full
        />

        <div className="onboarding-field onboarding-field--full">
          <label className="onboarding-label">Logo</label>
          <div className="onboarding-upload">
            <div className="onboarding-upload-icon"><Upload size={24} /></div>
            <div>Glissez votre logo ici ou cliquez pour parcourir</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
              PNG, JPG — max 2 Mo (optionnel)
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-btn onboarding-btn--secondary" onClick={onPrev}>
          &larr; Précédent
        </button>
        <button
          className="onboarding-btn onboarding-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, value, onChange, placeholder, error, type = 'text', full }) {
  return (
    <div className={`onboarding-field ${full ? 'onboarding-field--full' : ''}`}>
      <label className="onboarding-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        className={`onboarding-input ${error ? 'onboarding-input--error' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && <span className="onboarding-error">{error}</span>}
    </div>
  );
}

// ============================================================
// Step 3 — Arborescences
// ============================================================
const DEFAULT_JURIDIQUE = [
  { name: 'Actes et contrats', ordre: 1 },
  { name: 'Correspondances', ordre: 2 },
  { name: 'Pièces justificatives', ordre: 3 },
  { name: 'Formalités', ordre: 4 },
];

const DEFAULT_JUDICIAIRE = [
  { name: 'Actes de procédure', ordre: 1 },
  { name: 'Conclusions', ordre: 2 },
  { name: 'Correspondances', ordre: 3 },
  { name: 'Pièces', ordre: 4 },
  { name: 'Décisions', ordre: 5 },
];

function StepTrees({ onNext, onPrev, saving, apiError, saveStep }) {
  const [juridique, setJuridique] = useState(DEFAULT_JURIDIQUE);
  const [judiciaire, setJudiciaire] = useState(DEFAULT_JUDICIAIRE);

  const handleSubmit = async () => {
    const ok = await saveStep(3, {
      juridique: juridique.map((item, i) => ({ name: item.name, ordre: i + 1 })),
      judiciaire: judiciaire.map((item, i) => ({ name: item.name, ordre: i + 1 })),
    });
    if (ok) onNext();
  };

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">Arborescences types</h1>
      <p className="onboarding-subtitle">
        Définissez les sous-dossiers créés par défaut dans vos dossiers. Vous pourrez les
        modifier à tout moment dans les paramètres.
      </p>

      {apiError && <div className="onboarding-api-error">{apiError}</div>}

      <div className="onboarding-trees">
        <TreeColumn
          title="Dossiers juridiques"
          icon={<FolderOpen size={18} />}
          items={juridique}
          setItems={setJuridique}
        />
        <TreeColumn
          title="Dossiers judiciaires"
          icon={<FolderOpen size={18} />}
          items={judiciaire}
          setItems={setJudiciaire}
        />
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-btn onboarding-btn--secondary" onClick={onPrev}>
          &larr; Précédent
        </button>
        <button
          className="onboarding-btn onboarding-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

function TreeColumn({ title, icon, items, setItems }) {
  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...items];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setItems(arr);
  };

  const moveDown = (idx) => {
    if (idx === items.length - 1) return;
    const arr = [...items];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setItems(arr);
  };

  const remove = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const rename = (idx, name) => {
    const arr = [...items];
    arr[idx] = { ...arr[idx], name };
    setItems(arr);
  };

  const add = () => {
    setItems([...items, { name: '', ordre: items.length + 1 }]);
  };

  return (
    <div className="onboarding-tree-col">
      <div className="onboarding-tree-title">
        {icon}
        {title}
      </div>
      <div className="onboarding-tree-list">
        {items.map((item, idx) => (
          <div key={idx} className="onboarding-tree-item">
            <GripVertical size={16} className="onboarding-tree-item-handle" />
            <input
              className="onboarding-tree-item-input"
              value={item.name}
              onChange={(e) => rename(idx, e.target.value)}
              placeholder="Nom de la catégorie..."
            />
            <div className="onboarding-tree-item-order">
              <button onClick={() => moveUp(idx)} title="Monter">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveDown(idx)} title="Descendre">
                <ChevronDown size={14} />
              </button>
            </div>
            <button className="onboarding-tree-item-remove" onClick={() => remove(idx)} title="Supprimer">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="onboarding-tree-add" onClick={add}>
        + Ajouter une catégorie
      </button>
    </div>
  );
}

// ============================================================
// Step 4 — Intégrations
// ============================================================
function StepIntegrations({ onNext, onPrev, saving, apiError, saveStep }) {
  const handleSubmit = async () => {
    const ok = await saveStep(4);
    if (ok) onNext();
  };

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">Intégrations disponibles</h1>
      <p className="onboarding-subtitle">
        Vérifiez les services connectés à votre espace.
      </p>

      {apiError && <div className="onboarding-api-error">{apiError}</div>}

      <div className="onboarding-integrations">
        <div className="onboarding-integration-card">
          <div className="onboarding-integration-icon">&#128221;</div>
          <div className="onboarding-integration-info">
            <div className="onboarding-integration-name">DocuSign EU</div>
            <div className="onboarding-integration-desc">Signature électronique</div>
            <div className="onboarding-integration-status">
              <AlertTriangle size={14} />
              Non configuré
            </div>
            <div className="onboarding-integration-hint">
              Vous pourrez le configurer dans Paramètres &gt; Intégrations
            </div>
          </div>
        </div>

        <div className="onboarding-integration-card">
          <div className="onboarding-integration-icon">&#128238;</div>
          <div className="onboarding-integration-info">
            <div className="onboarding-integration-name">SendingBox</div>
            <div className="onboarding-integration-desc">Envoi recommandé (LRAR)</div>
            <div className="onboarding-integration-status">
              <AlertTriangle size={14} />
              Non configuré
            </div>
            <div className="onboarding-integration-hint">
              Vous pourrez le configurer dans Paramètres &gt; Intégrations
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-info-box">
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Ces intégrations sont optionnelles. Vous pouvez utiliser LexDoc sans les
          configurer immédiatement.
        </span>
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-btn onboarding-btn--secondary" onClick={onPrev}>
          &larr; Précédent
        </button>
        <button
          className="onboarding-btn onboarding-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Step 5 — Terminé
// ============================================================
function StepDone({ saving, completeOnboarding }) {
  const navigate = useNavigate();

  const handleCreateFolder = async () => {
    const ok = await completeOnboarding();
    if (ok) navigate('/dossiers/nouveau');
  };

  const handleDashboard = async () => {
    const ok = await completeOnboarding();
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="onboarding-step" style={{ textAlign: 'center' }}>
      <div className="onboarding-done-icon">&#9989;</div>
      <h1 className="onboarding-title">Votre espace est prêt !</h1>
      <p className="onboarding-subtitle">
        Votre cabinet est configuré et vos arborescences sont en place.
        <br />
        Prochaine étape : créez votre premier dossier.
      </p>

      <div className="onboarding-done-actions" style={{ justifyContent: 'center' }}>
        <button
          className="onboarding-btn onboarding-btn--primary"
          onClick={handleCreateFolder}
          disabled={saving}
        >
          Créer mon premier dossier &rarr;
        </button>
        <button
          className="onboarding-btn onboarding-btn--outline"
          onClick={handleDashboard}
          disabled={saving}
        >
          Aller au dashboard
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Wizard
// ============================================================
export default function OnboardingWizard() {
  const { loading, saving, error, saveStep, completeOnboarding, currentStep } = useOnboarding();
  const [step, setStep] = useState(null);

  // Initialize step from API once loaded
  if (step === null && !loading) {
    // Resume from where the user left off (or start at 1)
    const initial = currentStep > 0 && currentStep < 5 ? currentStep + 1 : 1;
    setStep(initial);
  }

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  if (loading || step === null) {
    return (
      <div className="onboarding">
        <div className="onboarding-card" style={{ textAlign: 'center', paddingTop: 120 }}>
          <p style={{ color: '#64748b' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <ProgressBar step={step} />

        {step === 1 && <StepWelcome onNext={next} />}
        {step === 2 && (
          <StepCabinet
            onNext={next}
            onPrev={prev}
            saving={saving}
            apiError={error}
            saveStep={saveStep}
          />
        )}
        {step === 3 && (
          <StepTrees
            onNext={next}
            onPrev={prev}
            saving={saving}
            apiError={error}
            saveStep={saveStep}
          />
        )}
        {step === 4 && (
          <StepIntegrations
            onNext={next}
            onPrev={prev}
            saving={saving}
            apiError={error}
            saveStep={saveStep}
          />
        )}
        {step === 5 && (
          <StepDone saving={saving} completeOnboarding={completeOnboarding} />
        )}
      </div>
    </div>
  );
}
