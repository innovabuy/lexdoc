import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Edit3, ChevronDown, ChevronRight,
  Save, FolderOpen, Clock, User, Phone, Heart, Users as UsersIcon,
} from 'lucide-react';
import { getClient, updateClient, sendClientForm } from '../../services/clientsApi';
import CompletenessAlert from '../../components/clients/CompletenessAlert';
import { useToast } from '../../contexts/ToastContext';
import './ClientDetailPage.css';

const STATUS_LABELS = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', PENDING: 'En attente', CLOSED: 'Fermé', ARCHIVED: 'Archivé' };
const STATUS_COLORS = { OPEN: 'badge--green', IN_PROGRESS: 'badge--blue', PENDING: 'badge--yellow', CLOSED: 'badge--gray', ARCHIVED: 'badge--purple' };
const TYPE_LABELS = { JURIDIQUE: 'Juridique', JUDICIAIRE: 'Judiciaire' };

// ============================================================
// Accordion section
// ============================================================
function Section({ title, icon, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const Icon = icon;
  return (
    <div className="detail-section">
      <button className="detail-section-header" onClick={() => setOpen(!open)}>
        <div className="detail-section-title">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && <div className="detail-section-body">{children}</div>}
    </div>
  );
}

// ============================================================
// Inline field
// ============================================================
function FieldRow({ label, value, fieldKey, editMode, onChange }) {
  const displayVal = value || '';
  return (
    <div className="detail-field">
      <span className="detail-field-label">{label}</span>
      {editMode ? (
        <input
          className="detail-field-input"
          value={displayVal}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <span className={`detail-field-value ${!value ? 'detail-field-value--empty' : ''}`}>
          {value || 'Non renseigné'}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Tab: Informations
// ============================================================
function TabInformations({ client, onSave, saving }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({ ...client });
    setDirty(false);
    setEditMode(false);
  }, [client]);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(form);
    setDirty(false);
    setEditMode(false);
  };

  const isMarried = form.situationFamiliale &&
    ['marie', 'marié', 'pacse', 'pacsé'].includes(form.situationFamiliale.toLowerCase());

  return (
    <div className="detail-tab-content">
      <div className="detail-tab-toolbar">
        <button
          className={`detail-edit-toggle ${editMode ? 'detail-edit-toggle--active' : ''}`}
          onClick={() => setEditMode(!editMode)}
        >
          <Edit3 size={16} />
          {editMode ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      <Section title="Identité" icon={User} defaultOpen>
        <div className="detail-fields-grid">
          <FieldRow label="Civilité" value={form.civilite} fieldKey="civilite" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nom" value={form.lastName} fieldKey="lastName" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Prénom" value={form.firstName} fieldKey="firstName" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nom d'usage" value={form.nomUsage} fieldKey="nomUsage" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Date de naissance" value={form.birthDate ? form.birthDate.split('T')[0] : ''} fieldKey="birthDate" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Lieu de naissance" value={form.lieuNaissance} fieldKey="lieuNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Département" value={form.departementNaissance} fieldKey="departementNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Pays de naissance" value={form.paysNaissance} fieldKey="paysNaissance" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Nationalité" value={form.nationalite} fieldKey="nationalite" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Profession" value={form.profession} fieldKey="profession" editMode={editMode} onChange={handleChange} />
          <FieldRow label="N° Sécu" value={form.secu} fieldKey="secu" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Coordonnées" icon={Phone}>
        <div className="detail-fields-grid">
          <FieldRow label="Adresse" value={form.address} fieldKey="address" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Complément" value={form.complementAdressePerso} fieldKey="complementAdressePerso" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Code postal" value={form.postalCode} fieldKey="postalCode" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Ville" value={form.city} fieldKey="city" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Téléphone" value={form.phone} fieldKey="phone" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mobile" value={form.mobile} fieldKey="mobile" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Email" value={form.email} fieldKey="email" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Email secondaire" value={form.emailSecondaire} fieldKey="emailSecondaire" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Adresse pro" value={form.adressePro} fieldKey="adressePro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="CP pro" value={form.cpPro} fieldKey="cpPro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Ville pro" value={form.villePro} fieldKey="villePro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Tél pro" value={form.telPro} fieldKey="telPro" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Fax" value={form.fax} fieldKey="fax" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Situation familiale" icon={Heart}>
        <div className="detail-fields-grid">
          <FieldRow label="Situation" value={form.situationFamiliale} fieldKey="situationFamiliale" editMode={editMode} onChange={handleChange} />
          {isMarried && (
            <>
              <FieldRow label="Conjoint — Nom" value={form.conjointNom} fieldKey="conjointNom" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Prénom" value={form.conjointPrenom} fieldKey="conjointPrenom" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Date naiss." value={form.conjointDateNaissance ? form.conjointDateNaissance.split('T')[0] : ''} fieldKey="conjointDateNaissance" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Nationalité" value={form.conjointNationalite} fieldKey="conjointNationalite" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Conjoint — Profession" value={form.conjointProfession} fieldKey="conjointProfession" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Régime matrimonial" value={form.regimeMatrimonial} fieldKey="regimeMatrimonial" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Date contrat mariage" value={form.dateContratMariage ? form.dateContratMariage.split('T')[0] : ''} fieldKey="dateContratMariage" editMode={editMode} onChange={handleChange} />
              <FieldRow label="Notaire mariage" value={form.notaireMariage} fieldKey="notaireMariage" editMode={editMode} onChange={handleChange} />
            </>
          )}
          <FieldRow label="Enfants mineurs" value={form.nbEnfantsMineurs != null ? String(form.nbEnfantsMineurs) : ''} fieldKey="nbEnfantsMineurs" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Enfants majeurs" value={form.nbEnfantsMajeurs != null ? String(form.nbEnfantsMajeurs) : ''} fieldKey="nbEnfantsMajeurs" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      <Section title="Filiation" icon={UsersIcon}>
        <div className="detail-fields-grid">
          <FieldRow label="Père — Nom" value={form.pereNom} fieldKey="pereNom" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Père — Prénom" value={form.perePrenom} fieldKey="perePrenom" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mère — Nom de jeune fille" value={form.mereNomJeuneFille} fieldKey="mereNomJeuneFille" editMode={editMode} onChange={handleChange} />
          <FieldRow label="Mère — Prénom" value={form.merePrenom} fieldKey="merePrenom" editMode={editMode} onChange={handleChange} />
        </div>
      </Section>

      {editMode && dirty && (
        <div className="detail-save-bar">
          <button className="detail-save-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab: Dossiers
// ============================================================
function TabDossiers({ folders }) {
  const navigate = useNavigate();

  if (!folders || folders.length === 0) {
    return (
      <div className="detail-tab-content detail-tab-empty">
        <FolderOpen size={32} style={{ color: '#cbd5e1' }} />
        <p>Aucun dossier lié à ce client</p>
      </div>
    );
  }

  return (
    <div className="detail-tab-content">
      <table className="clients-table">
        <thead>
          <tr>
            <th className="clients-th">Référence</th>
            <th className="clients-th">Titre</th>
            <th className="clients-th">Type</th>
            <th className="clients-th">Statut</th>
            <th className="clients-th">Date ouverture</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((f) => (
            <tr key={f.id} className="clients-row" onClick={() => navigate(`/dossiers/${f.id}`)}>
              <td className="clients-td" style={{ fontWeight: 600 }}>{f.reference}</td>
              <td className="clients-td">{f.title}</td>
              <td className="clients-td">
                <span className="badge badge--blue">{TYPE_LABELS[f.type] || f.type}</span>
              </td>
              <td className="clients-td">
                <span className={`badge ${STATUS_COLORS[f.status] || ''}`}>
                  {STATUS_LABELS[f.status] || f.status}
                </span>
              </td>
              <td className="clients-td">
                {f.openedAt ? new Date(f.openedAt).toLocaleDateString('fr-FR') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Tab: Timeline
// ============================================================
function TabTimeline({ clientId }) {
  // Timeline events will be loaded from folder-based events in the future
  return (
    <div className="detail-tab-content detail-tab-empty">
      <Clock size={32} style={{ color: '#cbd5e1' }} />
      <p>Timeline en construction — Phase 2</p>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClient(id);
      setClient(data);
    } catch {
      toast.error('Impossible de charger le client');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await updateClient(id, formData);
      await fetchClient();
      toast.success('Client mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForm = async () => {
    try {
      const result = await sendClientForm(id);
      toast.success(result.message || 'Formulaire envoyé');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'envoi");
    }
  };

  if (loading) {
    return <div className="detail-loading">Chargement...</div>;
  }

  if (!client) {
    return <div className="detail-loading">Client introuvable</div>;
  }

  const clientName =
    client.type === 'INDIVIDUAL'
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : client.companyName || '—';

  const completeness = client.completeness || { percent: 0, level: 'critique', criticalMissing: [] };
  const complColor =
    completeness.level === 'complet' ? '#10b981' : completeness.level === 'incomplet' ? '#f59e0b' : '#ef4444';

  return (
    <div className="client-detail">
      {/* Header */}
      <div className="detail-header">
        <Link to="/clients" className="detail-back">
          <ArrowLeft size={18} />
          Clients
        </Link>

        <div className="detail-header-main">
          <div className="detail-header-info">
            <h1 className="detail-header-name">{clientName}</h1>
            <span className="detail-header-meta">
              {client.type === 'INDIVIDUAL' ? 'PP' : 'PM'}
              {client.email && <> &middot; {client.email}</>}
            </span>
          </div>

          <div className="detail-header-completeness">
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Complétude</span>
            <div className="detail-completeness-bar">
              <div className="detail-completeness-bar-fill" style={{ width: `${completeness.percent}%`, background: complColor }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: complColor }}>
              {completeness.percent}%
            </span>
            {completeness.missing && completeness.missing.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {completeness.missing.length} champ{completeness.missing.length > 1 ? 's' : ''} manquant{completeness.missing.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="detail-header-actions">
            <button className="detail-action-btn detail-action-btn--outline" onClick={handleSendForm}>
              <Send size={16} />
              Envoyer le formulaire
            </button>
          </div>
        </div>
      </div>

      {/* Completeness alert */}
      <CompletenessAlert
        percent={completeness.percent}
        level={completeness.level}
        criticalMissing={completeness.criticalMissing}
        clientName={clientName}
        onSendForm={handleSendForm}
        onComplete={() => setActiveTab('informations')}
      />

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'informations' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('informations')}
        >
          Informations
        </button>
        <button
          className={`detail-tab ${activeTab === 'dossiers' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('dossiers')}
        >
          Dossiers
          {client.folders && <span className="detail-tab-count">{client.folders.length}</span>}
        </button>
        <button
          className={`detail-tab ${activeTab === 'timeline' ? 'detail-tab--active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'informations' && (
        <TabInformations client={client} onSave={handleSave} saving={saving} />
      )}
      {activeTab === 'dossiers' && <TabDossiers folders={client.folders} />}
      {activeTab === 'timeline' && <TabTimeline clientId={id} />}
    </div>
  );
}
