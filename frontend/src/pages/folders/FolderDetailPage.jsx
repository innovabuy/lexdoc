import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  getFolderDocuments,
  getFolderSignatures,
  getFolderTimeline,
  uploadFolderDocument,
  toggleDocExtranet,
  patchFolderStatus,
  updateFolder,
  addDocCategory,
  generateFromTemplate,
  forceGenerateFromTemplate,
  checkTemplateDuplicate,
} from '../../services/foldersApi';
import FolderPersons from '../../components/folders/FolderPersons';
import DocumentPreview from '../../components/documents/DocumentPreview';
import TemplateSelectModal from '../../components/templates/TemplateSelectModal';
import MissingFieldsModal from '../../components/templates/MissingFieldsModal';
import DuplicateAlert from '../../components/templates/DuplicateAlert';
import SignatureModal from '../../components/documents/SignatureModal';
import RegisteredMailModal from '../../components/documents/RegisteredMailModal';
import './FolderDetailPage.css';

/* ── Constants ── */
const statusLabels = {
  OPEN: 'Ouvert', IN_PROGRESS: 'En cours', PENDING: 'En attente',
  CLOSED: 'Ferme', ARCHIVED: 'Archive',
};
const statusColors = {
  OPEN: 'fdp-badge-green', IN_PROGRESS: 'fdp-badge-blue',
  PENDING: 'fdp-badge-yellow', CLOSED: 'fdp-badge-gray',
  ARCHIVED: 'fdp-badge-purple',
};
const typeLabels = {
  LITIGATION: 'Contentieux', CONTRACT: 'Contrat', BUSINESS: 'Droit des affaires',
  FAMILY: 'Droit de la famille', REAL_ESTATE: 'Immobilier', LABOR: 'Droit du travail',
  INTELLECTUAL: 'Propriete intellectuelle', ADMINISTRATIVE: 'Administratif',
  CRIMINAL: 'Penal', OTHER: 'Autre',
};
const docStatusLabels = {
  DRAFT: 'Brouillon', PENDING_SIGNATURE: 'En attente', SIGNED: 'Signe',
  SENT: 'Envoye', ARCHIVED: 'Archive', FINAL: 'Final',
};
const docStatusColors = {
  DRAFT: 'fdp-badge-gray', PENDING_SIGNATURE: 'fdp-badge-yellow',
  SIGNED: 'fdp-badge-green', SENT: 'fdp-badge-blue',
  ARCHIVED: 'fdp-badge-purple', FINAL: 'fdp-badge-green',
};
const sigStatutLabels = {
  brouillon: 'Brouillon', envoye: 'Envoye', partiellement_signe: 'Partiellement signe',
  signe: 'Signe', expire: 'Expire', annule: 'Annule',
};
const sigStatutColors = {
  brouillon: 'fdp-badge-gray', envoye: 'fdp-badge-blue',
  partiellement_signe: 'fdp-badge-yellow', signe: 'fdp-badge-green',
  expire: 'fdp-badge-red', annule: 'fdp-badge-red',
};

const TABS = [
  { id: 'info', label: 'Informations', icon: 'info' },
  { id: 'persons', label: 'Personnes', icon: 'users' },
  { id: 'documents', label: 'Documents', icon: 'docs' },
  { id: 'signatures', label: 'Signatures', icon: 'sign' },
  { id: 'timeline', label: 'Historique', icon: 'clock' },
];

/* ── Helpers ── */
function formatSize(bytes) {
  const n = Number(bytes);
  if (n === 0) return '-';
  if (n < 1024) return n + ' o';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' Ko';
  return (n / 1048576).toFixed(2) + ' Mo';
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR');
}
function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function relativeTime(d) {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const mins = Math.floor((now - date) / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(d);
}
function getDocIcon(mimeType) {
  if (!mimeType) return 'doc';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('image')) return 'image';
  return 'doc';
}
function getClientName(client) {
  if (!client) return '';
  if (client.companyName) return client.companyName;
  return `${client.firstName || ''} ${client.lastName || ''}`.trim();
}

/* ── Main Component ── */
export default function FolderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Documents
  const [docData, setDocData] = useState({ categories: [], uncategorized: [] });
  const [docsLoading, setDocsLoading] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Signatures
  const [signatures, setSignatures] = useState([]);
  const [sigsLoading, setSigsLoading] = useState(false);

  // Timeline
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Inline edit
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Status dropdown
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // New category
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Template generation flow
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [missingFields, setMissingFields] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [templateGenerating, setTemplateGenerating] = useState(false);

  // Signature / Registered mail modals
  const [signatureDoc, setSignatureDoc] = useState(null);
  const [registeredMailDoc, setRegisteredMailDoc] = useState(null);
  const [registeredMailType, setRegisteredMailType] = useState('LRAR');

  /* ── Fetch folder ── */
  const fetchFolder = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/folders/${id}`);
      if (data.success) {
        setFolder(data.data);
      } else {
        navigate('/dossiers');
      }
    } catch {
      navigate('/dossiers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchFolder(); }, [fetchFolder]);

  /* ── Tab data loading ── */
  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const d = await getFolderDocuments(id);
      setDocData(d || { categories: [], uncategorized: [] });
      // expand categories with documents by default, collapse empty ones
      const exp = {};
      (d?.categories || []).forEach(c => { exp[c.id] = (c.documents?.length || 0) > 0; });
      exp['__uncategorized'] = true;
      setExpandedCats(exp);
    } catch { /* ignore */ }
    setDocsLoading(false);
  }, [id]);

  const fetchSigs = useCallback(async () => {
    setSigsLoading(true);
    try { setSignatures(await getFolderSignatures(id)); } catch { /* ignore */ }
    setSigsLoading(false);
  }, [id]);

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try { setTimeline(await getFolderTimeline(id)); } catch { /* ignore */ }
    setTimelineLoading(false);
  }, [id]);

  useEffect(() => {
    if (activeTab === 'documents') fetchDocs();
    if (activeTab === 'signatures') fetchSigs();
    if (activeTab === 'timeline') fetchTimeline();
  }, [activeTab, fetchDocs, fetchSigs, fetchTimeline]);

  /* ── Actions ── */
  const handleStatusChange = async (newStatus) => {
    try {
      await patchFolderStatus(id, newStatus);
      setFolder(f => ({ ...f, status: newStatus }));
      success(`Statut mis a jour : ${statusLabels[newStatus]}`);
    } catch (e) {
      showError(e.response?.data?.message || 'Erreur');
    }
    setShowStatusMenu(false);
  };

  const handleInlineEdit = async (field) => {
    if (editValue === folder[field]) { setEditField(null); return; }
    try {
      await updateFolder(id, { [field]: editValue });
      setFolder(f => ({ ...f, [field]: editValue }));
      success('Modifie');
    } catch (e) {
      showError('Erreur de mise a jour');
    }
    setEditField(null);
  };

  const handleToggleExtranet = async (docId, current) => {
    try {
      await toggleDocExtranet(docId, !current);
      fetchDocs();
    } catch {
      showError('Erreur');
    }
  };

  const handleDownload = async (docId) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      const filename = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : 'document';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showError('Erreur de telechargement');
    }
    setContextMenu(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await addDocCategory(id, newCatName.trim());
      setNewCatName('');
      setShowNewCat(false);
      fetchDocs();
      success('Categorie ajoutee');
    } catch (e) {
      showError(e.response?.data?.message || 'Erreur');
    }
  };

  /* ── Template generation flow ── */
  const handleTemplateSelect = async (template) => {
    setShowTemplateSelect(false);
    setSelectedTemplate(template);

    // 1. Check duplicate
    try {
      const dup = await checkTemplateDuplicate(id, template.id);
      if (dup.exists) {
        setDuplicateInfo(dup.existingDocument);
        return;
      }
    } catch { /* ignore */ }

    // 2. Try generate → may return missing_fields
    await startGeneration(template);
  };

  const handleDuplicateContinue = async () => {
    setDuplicateInfo(null);
    if (selectedTemplate) {
      await startGeneration(selectedTemplate);
    }
  };

  const startGeneration = async (template, additionalData = null) => {
    setTemplateGenerating(true);
    try {
      const result = await generateFromTemplate(template.id, id, { additionalData });
      if (result.status === 'missing_fields') {
        setMissingFields({ fields: result.fields, templateName: result.templateName });
      } else if (result.status === 'created') {
        success(`Document "${result.document.name}" genere avec succes`);
        setMissingFields(null);
        setSelectedTemplate(null);
        fetchDocs();
      }
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur de generation');
    }
    setTemplateGenerating(false);
  };

  const handleMissingFieldsSubmit = async (additionalData) => {
    if (!selectedTemplate) return;
    setTemplateGenerating(true);
    try {
      const result = await generateFromTemplate(selectedTemplate.id, id, { additionalData });
      if (result.status === 'created') {
        success(`Document "${result.document.name}" genere avec succes`);
        setMissingFields(null);
        setSelectedTemplate(null);
        fetchDocs();
      } else if (result.status === 'missing_fields') {
        setMissingFields({ fields: result.fields, templateName: result.templateName });
      }
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur de generation');
    }
    setTemplateGenerating(false);
  };

  const handleForceGenerate = async (values) => {
    if (!selectedTemplate) return;
    setTemplateGenerating(true);
    try {
      // Filter non-empty values
      const additionalData = {};
      Object.entries(values || {}).forEach(([k, v]) => {
        if (v && v.trim()) additionalData[k] = v.trim();
      });
      const result = await forceGenerateFromTemplate(selectedTemplate.id, id, {
        additionalData: Object.keys(additionalData).length > 0 ? additionalData : null,
      });
      if (result.status === 'created') {
        success(`Document "${result.document.name}" genere avec succes`);
        setMissingFields(null);
        setSelectedTemplate(null);
        fetchDocs();
      }
    } catch (e) {
      showError(e.response?.data?.error?.message || 'Erreur de generation');
    }
    setTemplateGenerating(false);
  };

  // Count total docs
  const totalDocs = (docData.categories || []).reduce((s, c) => s + (c.documents?.length || 0), 0) + (docData.uncategorized?.length || 0);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="fdp-loading">
        <div className="fdp-spinner" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="fdp-not-found">
        <h2>Dossier non trouve</h2>
        <Link to="/dossiers" className="fdp-link">Retour aux dossiers</Link>
      </div>
    );
  }

  return (
    <div className="fdp-container">
      {/* Breadcrumb */}
      <nav className="fdp-breadcrumb">
        <Link to="/dossiers">Dossiers</Link>
        <span className="fdp-breadcrumb-sep">/</span>
        <span>{folder.reference}</span>
      </nav>

      {/* Header */}
      <div className="fdp-header">
        <div className="fdp-header-left">
          <div className="fdp-header-icon" style={{ backgroundColor: folder.color || '#3B82F6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="fdp-header-info">
            <h1 className="fdp-title">{folder.title}</h1>
            <div className="fdp-meta">
              <span className="fdp-ref">Ref: {folder.reference}</span>
              <div className="fdp-status-wrap" style={{ position: 'relative' }}>
                <button
                  className={`fdp-badge ${statusColors[folder.status]}`}
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  title="Changer le statut"
                >
                  {statusLabels[folder.status] || folder.status}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {showStatusMenu && (
                  <div className="fdp-dropdown">
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        className={`fdp-dropdown-item ${folder.status === key ? 'active' : ''}`}
                        onClick={() => handleStatusChange(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="fdp-type-badge">{typeLabels[folder.type] || folder.type}</span>
              {folder.client && (
                <Link to={`/clients/${folder.client.id}`} className="fdp-client-link">
                  {getClientName(folder.client)}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="fdp-header-actions">
          <button onClick={() => navigate('/dossiers')} className="fdp-btn fdp-btn-secondary">
            Retour
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="fdp-tabs-container">
        <nav className="fdp-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`fdp-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <TabIcon name={tab.icon} />
              <span>{tab.label}</span>
              {tab.id === 'documents' && totalDocs > 0 && (
                <span className="fdp-tab-count">{totalDocs}</span>
              )}
              {tab.id === 'persons' && folder.persons?.length > 0 && (
                <span className="fdp-tab-count">{folder.persons.length}</span>
              )}
              {tab.id === 'signatures' && signatures.length > 0 && (
                <span className="fdp-tab-count">{signatures.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="fdp-tab-content">
          {/* ─── INFO TAB ─── */}
          {activeTab === 'info' && (
            <InfoTab
              folder={folder}
              editField={editField}
              editValue={editValue}
              setEditField={setEditField}
              setEditValue={setEditValue}
              handleInlineEdit={handleInlineEdit}
            />
          )}

          {/* ─── PERSONS TAB ─── */}
          {activeTab === 'persons' && (
            <FolderPersons folderId={id} />
          )}

          {/* ─── DOCUMENTS TAB ─── */}
          {activeTab === 'documents' && (
            <DocumentsTab
              docData={docData}
              loading={docsLoading}
              expandedCats={expandedCats}
              setExpandedCats={setExpandedCats}
              onToggleExtranet={handleToggleExtranet}
              onDownload={handleDownload}
              onPreview={(doc) => setPreviewDoc(doc)}
              onUpload={() => setShowUpload(true)}
              onCreateFromTemplate={() => setShowTemplateSelect(true)}
              onSendForSignature={(doc) => setSignatureDoc(doc)}
              onSendRegistered={(doc, type) => { setRegisteredMailDoc(doc); setRegisteredMailType(type || 'LRAR'); }}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              showNewCat={showNewCat}
              setShowNewCat={setShowNewCat}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              onAddCategory={handleAddCategory}
            />
          )}

          {/* ─── SIGNATURES TAB ─── */}
          {activeTab === 'signatures' && (
            <SignaturesTab signatures={signatures} loading={sigsLoading} onRefreshSigs={fetchSigs} />
          )}

          {/* ─── TIMELINE TAB ─── */}
          {activeTab === 'timeline' && (
            <TimelineTab events={timeline} loading={timelineLoading} onRefresh={fetchTimeline} />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          folderId={id}
          categories={docData.categories || []}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDocs(); success('Document televerse'); }}
          onError={(msg) => showError(msg)}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Template Select Modal */}
      {showTemplateSelect && (
        <TemplateSelectModal
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelect(false)}
          folderType={folder.type}
        />
      )}

      {/* Missing Fields Modal */}
      {missingFields && (
        <MissingFieldsModal
          fields={missingFields.fields}
          templateName={missingFields.templateName}
          onSubmit={handleMissingFieldsSubmit}
          onForce={handleForceGenerate}
          onClose={() => { setMissingFields(null); setSelectedTemplate(null); }}
          loading={templateGenerating}
        />
      )}

      {/* Duplicate Alert */}
      {duplicateInfo && (
        <DuplicateAlert
          existingDocument={duplicateInfo}
          onContinue={handleDuplicateContinue}
          onCancel={() => { setDuplicateInfo(null); setSelectedTemplate(null); }}
        />
      )}

      {/* Signature Modal */}
      {signatureDoc && (
        <SignatureModal
          document={signatureDoc}
          folderPersons={folder.persons || []}
          onClose={() => setSignatureDoc(null)}
          onSuccess={() => {
            setSignatureDoc(null);
            success('Document envoye a la signature');
            fetchDocs();
            if (activeTab === 'signatures') fetchSigs();
          }}
          onError={(msg) => showError(msg)}
        />
      )}

      {/* Registered Mail Modal */}
      {registeredMailDoc && (
        <RegisteredMailModal
          document={registeredMailDoc}
          folderPersons={folder.persons || []}
          type={registeredMailType}
          onClose={() => setRegisteredMailDoc(null)}
          onSuccess={() => {
            setRegisteredMailDoc(null);
            success('Courrier recommande envoye');
            fetchDocs();
          }}
          onError={(msg) => showError(msg)}
        />
      )}

      {/* Click away for context menu / status menu */}
      {(contextMenu || showStatusMenu) && (
        <div className="fdp-overlay" onClick={() => { setContextMenu(null); setShowStatusMenu(false); }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Tab Icon
   ══════════════════════════════════════════════════════ */
function TabIcon({ name }) {
  const icons = {
    info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    docs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    sign: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return <span className="fdp-tab-icon">{icons[name] || null}</span>;
}

/* ══════════════════════════════════════════════════════
   INFO TAB
   ══════════════════════════════════════════════════════ */
function InfoTab({ folder, editField, editValue, setEditField, setEditValue, handleInlineEdit }) {
  const startEdit = (field, val) => {
    setEditField(field);
    setEditValue(val || '');
  };

  const renderField = (label, field, value) => (
    <div className="fdp-info-field">
      <span className="fdp-info-label">{label}</span>
      {editField === field ? (
        <div className="fdp-inline-edit">
          {field === 'description' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleInlineEdit(field)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditField(null); }}
              autoFocus
              rows={3}
              className="fdp-inline-input"
            />
          ) : (
            <input
              type={field.includes('date') || field.includes('Date') ? 'date' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleInlineEdit(field)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineEdit(field);
                if (e.key === 'Escape') setEditField(null);
              }}
              autoFocus
              className="fdp-inline-input"
            />
          )}
        </div>
      ) : (
        <span
          className="fdp-info-value fdp-editable"
          onClick={() => startEdit(field, value)}
          title="Cliquer pour modifier"
        >
          {value || <span className="fdp-placeholder">Cliquer pour ajouter</span>}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fdp-edit-icon">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </span>
      )}
    </div>
  );

  return (
    <div className="fdp-info-grid">
      <div className="fdp-info-section">
        <h3 className="fdp-section-title">Informations du dossier</h3>
        <div className="fdp-info-fields">
          <div className="fdp-info-field">
            <span className="fdp-info-label">Reference</span>
            <span className="fdp-info-value">{folder.reference}</span>
          </div>
          <div className="fdp-info-field">
            <span className="fdp-info-label">Type</span>
            <span className="fdp-info-value">{typeLabels[folder.type] || folder.type}</span>
          </div>
          {renderField('Titre', 'title', folder.title)}
          {renderField('Description', 'description', folder.description)}
          <div className="fdp-info-field">
            <span className="fdp-info-label">Ouverture</span>
            <span className="fdp-info-value">{formatDate(folder.openedAt || folder.createdAt)}</span>
          </div>
          {folder.dateEcheance && (
            <div className="fdp-info-field">
              <span className="fdp-info-label">Echeance</span>
              <span className="fdp-info-value">{formatDate(folder.dateEcheance)}</span>
            </div>
          )}
          {folder.closedAt && (
            <div className="fdp-info-field">
              <span className="fdp-info-label">Fermeture</span>
              <span className="fdp-info-value">{formatDate(folder.closedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Judicial fields */}
      {folder.type === 'LITIGATION' && (
        <div className="fdp-info-section">
          <h3 className="fdp-section-title">Informations judiciaires</h3>
          <div className="fdp-info-fields">
            {renderField('Juridiction', 'juridiction', folder.juridiction)}
            {renderField('N. RG', 'numeroRG', folder.numeroRG)}
            {renderField('Chambre', 'chambre', folder.chambre)}
            <div className="fdp-info-field">
              <span className="fdp-info-label">Date audience</span>
              <span className="fdp-info-value">{formatDate(folder.dateAudience)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nature for contracts */}
      {folder.type === 'CONTRACT' && folder.nature && (
        <div className="fdp-info-section">
          <h3 className="fdp-section-title">Informations juridiques</h3>
          <div className="fdp-info-fields">
            <div className="fdp-info-field">
              <span className="fdp-info-label">Nature</span>
              <span className="fdp-info-value">{folder.nature}</span>
            </div>
          </div>
        </div>
      )}

      {/* Client */}
      <div className="fdp-info-section">
        <h3 className="fdp-section-title">Client</h3>
        {folder.client ? (
          <div className="fdp-info-fields">
            <div className="fdp-info-field">
              <span className="fdp-info-label">Nom</span>
              <Link to={`/clients/${folder.client.id}`} className="fdp-info-value fdp-link">
                {getClientName(folder.client)}
              </Link>
            </div>
            {folder.client.email && (
              <div className="fdp-info-field">
                <span className="fdp-info-label">Email</span>
                <span className="fdp-info-value">{folder.client.email}</span>
              </div>
            )}
            {folder.client.phone && (
              <div className="fdp-info-field">
                <span className="fdp-info-label">Telephone</span>
                <span className="fdp-info-value">{folder.client.phone}</span>
              </div>
            )}
            {folder.client.type && (
              <div className="fdp-info-field">
                <span className="fdp-info-label">Type</span>
                <span className="fdp-info-value">{folder.client.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale'}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="fdp-empty-text">Aucun client associe</p>
        )}
      </div>

      {/* Created by */}
      {folder.createdBy && (
        <div className="fdp-info-section">
          <h3 className="fdp-section-title">Creation</h3>
          <div className="fdp-info-fields">
            <div className="fdp-info-field">
              <span className="fdp-info-label">Cree par</span>
              <span className="fdp-info-value">{folder.createdBy.firstName} {folder.createdBy.lastName}</span>
            </div>
            <div className="fdp-info-field">
              <span className="fdp-info-label">Date</span>
              <span className="fdp-info-value">{formatDateTime(folder.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DOCUMENTS TAB
   ══════════════════════════════════════════════════════ */
function DocumentsTab({
  docData, loading, expandedCats, setExpandedCats,
  onToggleExtranet, onDownload, onPreview, onUpload, onCreateFromTemplate,
  onSendForSignature, onSendRegistered,
  contextMenu, setContextMenu,
  showNewCat, setShowNewCat, newCatName, setNewCatName, onAddCategory,
}) {
  const toggleCat = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (loading) {
    return <div className="fdp-tab-loading"><div className="fdp-spinner" /></div>;
  }

  const allCategories = docData.categories || [];
  const uncategorized = docData.uncategorized || [];
  const hasDocs = allCategories.some(c => c.documents?.length > 0) || uncategorized.length > 0;

  return (
    <div className="fdp-docs">
      {/* Toolbar */}
      <div className="fdp-docs-toolbar">
        <h3 className="fdp-section-title-inline">Documents du dossier</h3>
        <div className="fdp-docs-actions">
          <button onClick={() => setShowNewCat(true)} className="fdp-btn fdp-btn-ghost">
            + Categorie
          </button>
          <button onClick={onCreateFromTemplate} className="fdp-btn fdp-btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Depuis un template
          </button>
          <button onClick={onUpload} className="fdp-btn fdp-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Telecharger
          </button>
        </div>
      </div>

      {/* New category inline form */}
      {showNewCat && (
        <div className="fdp-new-cat">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nom de la categorie..."
            className="fdp-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddCategory();
              if (e.key === 'Escape') { setShowNewCat(false); setNewCatName(''); }
            }}
          />
          <button onClick={onAddCategory} className="fdp-btn fdp-btn-primary fdp-btn-sm">Ajouter</button>
          <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="fdp-btn fdp-btn-ghost fdp-btn-sm">Annuler</button>
        </div>
      )}

      {!hasDocs && allCategories.length === 0 ? (
        <div className="fdp-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <h4>Aucun document</h4>
          <p>Televersez votre premier document ou creez-en un depuis un template</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={onCreateFromTemplate} className="fdp-btn fdp-btn-secondary">
              Creer depuis un template
            </button>
            <button onClick={onUpload} className="fdp-btn fdp-btn-primary">Telecharger un document</button>
          </div>
        </div>
      ) : (
        <div className="fdp-doc-tree fdp-tree">
          {/* Categories */}
          {allCategories.map((cat, catIdx) => {
            const isLast = catIdx === allCategories.length - 1 && uncategorized.length === 0;
            const isExpanded = expandedCats[cat.id];
            const docCount = cat.documents?.length || 0;
            return (
              <div key={cat.id} className={`fdp-doc-category fdp-tree-node ${isLast ? 'fdp-tree-node--last' : ''}`}>
                <div className="fdp-cat-header-wrap">
                  <span className="fdp-tree-connector">
                    <span className="fdp-tree-line-h" />
                  </span>
                  <button className="fdp-cat-header" onClick={() => toggleCat(cat.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`fdp-chevron ${isExpanded ? 'fdp-chevron--open' : ''}`}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                    <span className="fdp-cat-name">{cat.name}</span>
                    <span className="fdp-cat-count">{docCount}</span>
                  </button>
                  <button onClick={onUpload} className="fdp-cat-add-btn" title="Ajouter un document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
                {isExpanded && (
                  <div className="fdp-doc-list fdp-tree-children">
                    {docCount > 0 ? (
                      cat.documents.map((doc, docIdx) => (
                        <div key={doc.id} className={`fdp-tree-node ${docIdx === docCount - 1 ? 'fdp-tree-node--last' : ''}`}>
                          <span className="fdp-tree-connector"><span className="fdp-tree-line-h" /></span>
                          <DocumentRow
                            doc={doc}
                            onPreview={onPreview}
                            onDownload={onDownload}
                            onToggleExtranet={onToggleExtranet}
                            onSendForSignature={onSendForSignature}
                            onSendRegistered={onSendRegistered}
                            contextMenu={contextMenu}
                            setContextMenu={setContextMenu}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="fdp-tree-node fdp-tree-node--last">
                        <span className="fdp-tree-connector"><span className="fdp-tree-line-h" /></span>
                        <div className="fdp-empty-cat-drop" onClick={onUpload}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>Glissez des fichiers ici ou cliquez pour uploader</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div className="fdp-doc-category fdp-tree-node fdp-tree-node--last">
              <div className="fdp-cat-header-wrap">
                <span className="fdp-tree-connector"><span className="fdp-tree-line-h" /></span>
                <button className="fdp-cat-header" onClick={() => toggleCat('__uncategorized')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`fdp-chevron ${expandedCats['__uncategorized'] ? 'fdp-chevron--open' : ''}`}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF" stroke="#9CA3AF" strokeWidth="1">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                  </svg>
                  <span className="fdp-cat-name">Non classe</span>
                  <span className="fdp-cat-count">{uncategorized.length}</span>
                </button>
              </div>
              {expandedCats['__uncategorized'] && (
                <div className="fdp-doc-list fdp-tree-children">
                  {uncategorized.map((doc, docIdx) => (
                    <div key={doc.id} className={`fdp-tree-node ${docIdx === uncategorized.length - 1 ? 'fdp-tree-node--last' : ''}`}>
                      <span className="fdp-tree-connector"><span className="fdp-tree-line-h" /></span>
                      <DocumentRow
                        doc={doc}
                        onPreview={onPreview}
                        onDownload={onDownload}
                        onToggleExtranet={onToggleExtranet}
                        onSendForSignature={onSendForSignature}
                        onSendRegistered={onSendRegistered}
                        contextMenu={contextMenu}
                        setContextMenu={setContextMenu}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Document Row ── */
function DocumentRow({ doc, onPreview, onDownload, onToggleExtranet, onSendForSignature, onSendRegistered, contextMenu, setContextMenu }) {
  const iconType = getDocIcon(doc.mimeType);
  const iconColors = {
    pdf: '#EF4444', word: '#2563EB', excel: '#16A34A', image: '#8B5CF6', doc: '#6B7280',
  };
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="fdp-doc-row">
      <div className="fdp-doc-icon" style={{ color: iconColors[iconType] }}>
        <DocTypeIcon type={iconType} />
      </div>
      <div className="fdp-doc-info">
        <span className="fdp-doc-name">{doc.name}</span>
        <span className="fdp-doc-meta">
          {formatSize(doc.size)} &middot; {relativeTime(doc.createdAt)}
          {doc.createdBy && ` &middot; ${doc.createdBy.firstName || ''} ${doc.createdBy.lastName || ''}`}
        </span>
      </div>
      <div className="fdp-doc-badges">
        <span className={`fdp-badge fdp-badge-sm ${docStatusColors[doc.status] || 'fdp-badge-gray'} ${doc.status === 'PENDING_SIGNATURE' ? 'fdp-badge-pulse' : ''}`}>
          {docStatusLabels[doc.status] || doc.status}
        </span>
        {doc.visibleExtranet && (
          <span className="fdp-badge fdp-badge-sm fdp-badge-teal" title="Visible sur l'extranet">
            Extranet
          </span>
        )}
      </div>
      <div className="fdp-doc-actions">
        <button onClick={() => onPreview(doc)} className="fdp-icon-btn" title="Previsualiser">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button onClick={() => onDownload(doc.id)} className="fdp-icon-btn" title="Telecharger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button
          onClick={() => onToggleExtranet(doc.id, doc.visibleExtranet)}
          className={`fdp-icon-btn ${doc.visibleExtranet ? 'fdp-icon-btn-active' : ''}`}
          title={doc.visibleExtranet ? 'Masquer de l\'extranet' : 'Rendre visible sur l\'extranet'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        </button>

        {/* Context menu (three dots) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="fdp-icon-btn"
            title="Plus d'actions"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          {showMenu && (
            <>
              <div className="fdp-ctx-menu">
                <button className="fdp-ctx-item" onClick={() => { setShowMenu(false); onSendForSignature(doc); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Envoyer a la signature
                </button>
                <button className="fdp-ctx-item" onClick={() => { setShowMenu(false); onSendRegistered(doc, 'LRAR'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Envoyer en LRAR
                </button>
                <button className="fdp-ctx-item" onClick={() => { setShowMenu(false); onSendRegistered(doc, 'LR'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Envoyer en LR simple
                </button>
              </div>
              <div className="fdp-ctx-backdrop" onClick={() => setShowMenu(false)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DocTypeIcon({ type }) {
  if (type === 'pdf') return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>;
  if (type === 'word') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (type === 'excel') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="10" y2="21"/></svg>;
  if (type === 'image') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}

/* ══════════════════════════════════════════════════════
   SIGNATURES TAB
   ══════════════════════════════════════════════════════ */
function SignaturesTab({ signatures, loading, onRefreshSigs }) {
  if (loading) return <div className="fdp-tab-loading"><div className="fdp-spinner" /></div>;

  if (!signatures || signatures.length === 0) {
    return (
      <div className="fdp-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <h4>Aucune demande de signature</h4>
        <p>Les signatures demandees sur les documents de ce dossier apparaitront ici</p>
      </div>
    );
  }

  const handleResend = async (sigId) => {
    try {
      await api.post(`/signatures/${sigId}/resend`);
      if (onRefreshSigs) onRefreshSigs();
    } catch { /* ignore */ }
  };

  const handleCancel = async (sigId) => {
    try {
      await api.delete(`/signatures/${sigId}`);
      if (onRefreshSigs) onRefreshSigs();
    } catch { /* ignore */ }
  };

  return (
    <div className="fdp-sigs">
      <h3 className="fdp-section-title-inline">Demandes de signature</h3>
      <div className="fdp-sig-list">
        {signatures.map(sig => (
          <div key={sig.id} className="fdp-sig-card">
            <div className="fdp-sig-header">
              <div className="fdp-sig-doc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>{sig.document?.name || 'Document'}</span>
              </div>
              <div className="fdp-sig-header-right">
                <span className={`fdp-badge fdp-badge-sm ${sigStatutColors[sig.statut] || 'fdp-badge-gray'}`}>
                  {sigStatutLabels[sig.statut] || sig.statut}
                </span>
                <div className="fdp-sig-actions">
                  {(sig.statut === 'envoye' || sig.statut === 'partiellement_signe') && (
                    <button onClick={() => handleResend(sig.id)} className="fdp-icon-btn" title="Relancer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    </button>
                  )}
                  {(sig.statut === 'envoye' || sig.statut === 'partiellement_signe') && (
                    <button onClick={() => handleCancel(sig.id)} className="fdp-icon-btn fdp-icon-btn-danger" title="Annuler">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="fdp-sig-details">
              <div className="fdp-sig-field">
                <span className="fdp-sig-label">Ordre</span>
                <span>{sig.ordreSignature === 'sequentiel' ? 'Sequentiel' : 'Parallele'}</span>
              </div>
              {sig.dateExpiration && (
                <div className="fdp-sig-field">
                  <span className="fdp-sig-label">Expiration</span>
                  <span>{formatDate(sig.dateExpiration)}</span>
                </div>
              )}
              <div className="fdp-sig-field">
                <span className="fdp-sig-label">Creee le</span>
                <span>{formatDateTime(sig.createdAt)}</span>
              </div>
              {sig.sentAt && (
                <div className="fdp-sig-field">
                  <span className="fdp-sig-label">Envoyee le</span>
                  <span>{formatDateTime(sig.sentAt)}</span>
                </div>
              )}
              {sig.completedAt && (
                <div className="fdp-sig-field">
                  <span className="fdp-sig-label">Completee le</span>
                  <span>{formatDateTime(sig.completedAt)}</span>
                </div>
              )}
            </div>
            {/* Signataires */}
            {sig.signataires && Array.isArray(sig.signataires) && sig.signataires.length > 0 && (
              <div className="fdp-sig-signataires">
                <span className="fdp-sig-label">Signataires :</span>
                <div className="fdp-sig-avatars">
                  {sig.signataires.map((s, i) => (
                    <div key={i} className="fdp-sig-avatar" title={`${s.nom || s.email} — ${s.status || 'en attente'}`}>
                      <span className="fdp-sig-avatar-letter">{(s.nom || s.email || '?')[0].toUpperCase()}</span>
                      {s.status === 'signed' || s.status === 'signe' ? (
                        <span className="fdp-sig-check">&#10003;</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TIMELINE TAB
   ══════════════════════════════════════════════════════ */
function TimelineTab({ events, loading, onRefresh }) {
  if (loading) return <div className="fdp-tab-loading"><div className="fdp-spinner" /></div>;

  if (!events || events.length === 0) {
    return (
      <div className="fdp-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h4>Aucun evenement</h4>
        <p>L'historique des actions sur ce dossier apparaitra ici</p>
      </div>
    );
  }

  const typeIcons = {
    dossier_cree: 'folder-plus',
    document_cree: 'file-plus',
    document_modifie: 'file-text',
    document_signe: 'check-circle',
    personne_ajoutee: 'user-plus',
    email_envoye: 'mail',
    signature_demandee: 'shield',
    lrar_envoye: 'send',
    ar_recu: 'inbox',
    extranet_consulte: 'globe',
  };

  const typeColors = {
    dossier_cree: '#10B981',
    document_cree: '#3B82F6',
    document_modifie: '#6366F1',
    document_signe: '#10B981',
    personne_ajoutee: '#8B5CF6',
    email_envoye: '#F59E0B',
    signature_demandee: '#3B82F6',
    lrar_envoye: '#EF4444',
    ar_recu: '#10B981',
    extranet_consulte: '#06B6D4',
  };

  // Group by date
  const grouped = {};
  events.forEach(evt => {
    const key = new Date(evt.createdAt).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(evt);
  });

  return (
    <div className="fdp-timeline">
      <div className="fdp-timeline-header">
        <h3 className="fdp-section-title-inline">Historique</h3>
        <button onClick={onRefresh} className="fdp-btn fdp-btn-ghost fdp-btn-sm">Actualiser</button>
      </div>

      <div className="fdp-timeline-body">
        {Object.entries(grouped).map(([date, evts]) => (
          <div key={date} className="fdp-timeline-group">
            <div className="fdp-timeline-date">{date}</div>
            {evts.map(evt => (
              <div key={evt.id} className="fdp-timeline-item">
                <div className="fdp-timeline-dot" style={{ backgroundColor: typeColors[evt.type] || '#9CA3AF' }} />
                <div className="fdp-timeline-content">
                  <p className="fdp-timeline-desc">{evt.description}</p>
                  <span className="fdp-timeline-time">{relativeTime(evt.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   UPLOAD MODAL
   ══════════════════════════════════════════════════════ */
function UploadModal({ folderId, categories, onClose, onSuccess, onError }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles(dropped);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) setFiles(selected);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadFolderDocument(folderId, file, {
          name: uploadName || file.name,
          category: uploadCategory || undefined,
        });
      }
      onSuccess();
    } catch (e) {
      onError(e.response?.data?.message || 'Erreur lors du televersement');
    }
    setUploading(false);
  };

  return (
    <div className="fdp-modal-overlay" onClick={onClose}>
      <div className="fdp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fdp-modal-header">
          <h2>Telecharger un document</h2>
          <button onClick={onClose} className="fdp-modal-close">&times;</button>
        </div>
        <div className="fdp-modal-body">
          {/* Drop zone */}
          <div
            className={`fdp-dropzone ${dragOver ? 'fdp-dropzone-active' : ''} ${files.length > 0 ? 'fdp-dropzone-has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {files.length === 0 ? (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="fdp-dropzone-text">Glissez-deposez vos fichiers ici</p>
                <p className="fdp-dropzone-sub">ou cliquez pour selectionner (50 Mo max)</p>
              </>
            ) : (
              <div className="fdp-file-list">
                {files.map((f, i) => (
                  <div key={i} className="fdp-file-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{f.name}</span>
                    <span className="fdp-file-size">{formatSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="fdp-upload-fields">
            <div className="fdp-field">
              <label>Nom du document</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Laisser vide pour le nom du fichier"
                className="fdp-input"
              />
            </div>
            {categories.length > 0 && (
              <div className="fdp-field">
                <label>Categorie</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="fdp-input"
                >
                  <option value="">Non classe</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="fdp-modal-footer">
          <button onClick={onClose} className="fdp-btn fdp-btn-secondary">Annuler</button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="fdp-btn fdp-btn-primary"
          >
            {uploading ? 'Envoi en cours...' : `Telecharger ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
