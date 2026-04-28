import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as formApi from '../../services/formTemplateApi';
import './ClientFormBuilder.css';

const FOLDER_TYPE_LABELS = {
  LITIGATION: 'Contentieux',
  CONTRACT: 'Contrat',
  BUSINESS: 'Droit des affaires',
  FAMILY: 'Droit de la famille',
  REAL_ESTATE: 'Immobilier',
  LABOR: 'Droit du travail',
  INTELLECTUAL: 'Propriété intellectuelle',
  ADMINISTRATIVE: 'Administratif',
  CRIMINAL: 'Pénal',
  OTHER: 'Autre',
};

const SECTION_LABELS = {
  IDENTITE: 'Identité principale',
  COORDONNEES: 'Coordonnées',
  SITUATION_FAMILIALE: 'Situation familiale',
  FILIATION: 'Filiation',
  CONJOINT_PACS: 'Conjoint / PACS',
  SITUATION_MATRIMONIALE: 'Situation matrimoniale',
  INFORMATIONS_PROJET: 'Informations projet',
};

const ALL_SECTIONS = Object.keys(SECTION_LABELS);

const STATUS_BADGE = {
  DRAFT: { label: 'Brouillon', cls: 'cfb-badge--draft' },
  SUBMITTED: { label: 'Soumis', cls: 'cfb-badge--submitted' },
};

export default function ClientFormBuilder() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | create | edit | responses
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', folderType: '', isDefault: false, sections: {} });
  const [responsesTemplateId, setResponsesTemplateId] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['form-templates'],
    queryFn: formApi.getFormTemplates,
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['form-template-responses', responsesTemplateId],
    queryFn: () => formApi.getTemplateResponses(responsesTemplateId),
    enabled: !!responsesTemplateId,
  });

  const createMutation = useMutation({
    mutationFn: (body) => formApi.createFormTemplate(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      setView('list');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => formApi.updateFormTemplate(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      setView('list');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => formApi.deleteFormTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-templates'] }),
  });

  const resetForm = () => {
    setForm({ name: '', description: '', folderType: '', isDefault: false, sections: {} });
    setEditId(null);
  };

  const handleEdit = (template) => {
    const sections = {};
    ALL_SECTIONS.forEach((s) => {
      const found = template.sections.find((ts) => ts.section === s);
      sections[s] = found ? found.isActive : true;
    });
    setForm({
      name: template.name,
      description: template.description || '',
      folderType: template.folderType || '',
      isDefault: template.isDefault,
      sections,
    });
    setEditId(template.id);
    setView('edit');
  };

  const handleCreate = () => {
    const sections = {};
    ALL_SECTIONS.forEach((s) => { sections[s] = true; });
    setForm({ name: '', description: '', folderType: '', isDefault: false, sections });
    setView('create');
  };

  const handleSubmit = () => {
    const sections = ALL_SECTIONS.map((s, i) => ({
      section: s,
      label: SECTION_LABELS[s],
      ordre: i + 1,
      isActive: form.sections[s] !== false,
    }));

    const body = {
      name: form.name,
      description: form.description || null,
      folderType: form.folderType || null,
      isDefault: form.isDefault,
      sections,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const handleViewResponses = (templateId) => {
    setResponsesTemplateId(templateId);
    setView('responses');
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return <div className="cfb-loading">Chargement...</div>;
  }

  // Liste des templates
  if (view === 'list') {
    return (
      <div className="cfb-container">
        <div className="cfb-header">
          <div>
            <h1 className="cfb-title">Formulaires clients</h1>
            <p className="cfb-subtitle">Configurez les fiches de renseignements envoyées aux clients via l'extranet.</p>
          </div>
          <button className="cfb-btn cfb-btn-primary" onClick={handleCreate}>
            + Nouveau template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="cfb-empty">
            <p>Aucun formulaire configuré.</p>
            <p className="cfb-empty-hint">Créez votre premier template pour commencer à collecter les informations clients.</p>
          </div>
        ) : (
          <div className="cfb-grid">
            {templates.map((t) => (
              <div key={t.id} className="cfb-card">
                <div className="cfb-card-header">
                  <h3 className="cfb-card-title">{t.name}</h3>
                  <div className="cfb-card-badges">
                    {t.isDefault && <span className="cfb-badge cfb-badge--default">Par défaut</span>}
                    {t.folderType && (
                      <span className="cfb-badge cfb-badge--type">
                        {FOLDER_TYPE_LABELS[t.folderType] || t.folderType}
                      </span>
                    )}
                  </div>
                </div>
                {t.description && <p className="cfb-card-desc">{t.description}</p>}
                <div className="cfb-card-sections">
                  {t.sections.map((s) => (
                    <span
                      key={s.section}
                      className={`cfb-section-tag ${s.isActive ? 'cfb-section-tag--active' : 'cfb-section-tag--inactive'}`}
                    >
                      {SECTION_LABELS[s.section] || s.section}
                    </span>
                  ))}
                </div>
                <div className="cfb-card-footer">
                  <span className="cfb-card-count">{t._count.responses} réponse(s)</span>
                  <div className="cfb-card-actions">
                    <button className="cfb-btn-link" onClick={() => handleViewResponses(t.id)}>
                      Réponses
                    </button>
                    <button className="cfb-btn-link" onClick={() => handleEdit(t)}>
                      Modifier
                    </button>
                    <button
                      className="cfb-btn-link cfb-btn-link--danger"
                      onClick={() => {
                        if (window.confirm('Supprimer ce template ?')) deleteMutation.mutate(t.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Réponses
  if (view === 'responses') {
    const tpl = templates.find((t) => t.id === responsesTemplateId);
    return (
      <div className="cfb-container">
        <div className="cfb-header">
          <div>
            <h1 className="cfb-title">Réponses — {tpl?.name || ''}</h1>
            <p className="cfb-subtitle">{responses.length} réponse(s) soumise(s)</p>
          </div>
          <button className="cfb-btn cfb-btn-ghost" onClick={() => setView('list')}>
            Retour
          </button>
        </div>

        {responsesLoading ? (
          <div className="cfb-loading">Chargement...</div>
        ) : responses.length === 0 ? (
          <div className="cfb-empty">
            <p>Aucune réponse pour ce formulaire.</p>
          </div>
        ) : (
          <div className="cfb-table-wrap">
            <table className="cfb-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Dossier</th>
                  <th>Statut</th>
                  <th>Dernière étape</th>
                  <th>Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.DRAFT;
                  return (
                    <tr key={r.id}>
                      <td>
                        {r.client?.firstName} {r.client?.lastName}
                        <br />
                        <small className="cfb-text-muted">{r.client?.email}</small>
                      </td>
                      <td>
                        {r.folder ? (
                          <>
                            {r.folder.reference}
                            <br />
                            <small className="cfb-text-muted">{r.folder.title}</small>
                          </>
                        ) : (
                          <span className="cfb-text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`cfb-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td>{r.lastStep}</td>
                      <td>{new Date(r.updatedAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Création / Édition
  return (
    <div className="cfb-container">
      <div className="cfb-header">
        <h1 className="cfb-title">{editId ? 'Modifier le template' : 'Nouveau template'}</h1>
        <button className="cfb-btn cfb-btn-ghost" onClick={() => { setView('list'); resetForm(); }}>
          Annuler
        </button>
      </div>

      <div className="cfb-form">
        <div className="cfb-form-group">
          <label className="cfb-label">Nom du template *</label>
          <input
            type="text"
            className="cfb-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Fiche de renseignements standard"
          />
        </div>

        <div className="cfb-form-group">
          <label className="cfb-label">Description</label>
          <textarea
            className="cfb-input cfb-textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description optionnelle..."
            rows={2}
          />
        </div>

        <div className="cfb-form-row">
          <div className="cfb-form-group">
            <label className="cfb-label">Type de dossier (optionnel)</label>
            <select
              className="cfb-input"
              value={form.folderType}
              onChange={(e) => setForm({ ...form, folderType: e.target.value })}
            >
              <option value="">Tous les types</option>
              {Object.entries(FOLDER_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="cfb-form-group cfb-form-check">
            <label className="cfb-check-label">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Template par défaut
            </label>
          </div>
        </div>

        <div className="cfb-form-group">
          <label className="cfb-label">Sections du formulaire</label>
          <p className="cfb-hint">Activez ou désactivez les sections selon vos besoins.</p>
          <div className="cfb-sections-list">
            {ALL_SECTIONS.map((s) => (
              <label key={s} className="cfb-section-toggle">
                <input
                  type="checkbox"
                  checked={form.sections[s] !== false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sections: { ...form.sections, [s]: e.target.checked },
                    })
                  }
                />
                <span className="cfb-section-toggle-label">{SECTION_LABELS[s]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="cfb-form-actions">
          <button
            className="cfb-btn cfb-btn-primary"
            onClick={handleSubmit}
            disabled={!form.name || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Enregistrement...'
              : editId
                ? 'Mettre à jour'
                : 'Créer le template'}
          </button>
        </div>
      </div>
    </div>
  );
}
