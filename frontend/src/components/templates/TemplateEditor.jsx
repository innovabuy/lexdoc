import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getTemplate,
  saveTemplateBlocks,
  getBlocks,
  createBlock,
} from '../../services/templateApi';
import './TemplateEditor.css';

/* ── Category config ── */
const CATEGORY_LABELS = {
  INTRO: 'Introduction',
  FAITS: 'Faits',
  MOYENS: 'Moyens',
  DISPOSITIF: 'Dispositif',
  SIGNATURE: 'Signature',
  CLAUSE: 'Clauses',
  CUSTOM: 'Personnalise',
};
const CATEGORY_COLORS = {
  INTRO: '#3B82F6',
  FAITS: '#F59E0B',
  MOYENS: '#8B5CF6',
  DISPOSITIF: '#10B981',
  SIGNATURE: '#6B7280',
  CLAUSE: '#EC4899',
  CUSTOM: '#7C3AED',
};

export default function TemplateEditor({ templateId, onClose, onSaved }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Block library
  const [allBlocks, setAllBlocks] = useState({ system: [], standard: [], custom: [] });
  const [libSearch, setLibSearch] = useState('');
  const [libFilter, setLibFilter] = useState('all'); // 'all', 'system', 'standard', 'custom'

  // Composition (right panel)
  const [composition, setComposition] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Create block modal
  const [showCreateBlock, setShowCreateBlock] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Fetch ── */
  const fetchTemplate = useCallback(async () => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      // Initialize composition from saved blocks
      if (data.blocks && Array.isArray(data.blocks)) {
        setComposition(data.blocks.map((b, i) => ({ ...b, _sortId: `comp-${b.blockId || b.id || i}-${Date.now()}-${i}` })));
      }
    } catch { /* ignore */ }
  }, [templateId]);

  const fetchBlocks = useCallback(async () => {
    try {
      const data = await getBlocks();
      setAllBlocks(data.grouped || { system: [], standard: [], custom: [] });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchTemplate(), fetchBlocks()]).then(() => setLoading(false));
  }, [fetchTemplate, fetchBlocks]);

  /* ── Library filtering ── */
  const filteredLibrary = useMemo(() => {
    const sections = [];
    const filter = (blocks) => {
      if (!libSearch) return blocks;
      const q = libSearch.toLowerCase();
      return blocks.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.content || '').toLowerCase().includes(q)
      );
    };

    if (libFilter === 'all' || libFilter === 'system') {
      const items = filter(allBlocks.system || []);
      if (items.length > 0) sections.push({ key: 'system', label: 'Systeme', items });
    }
    if (libFilter === 'all' || libFilter === 'standard') {
      const items = filter(allBlocks.standard || []);
      if (items.length > 0) sections.push({ key: 'standard', label: 'Standard', items });
    }
    if (libFilter === 'all' || libFilter === 'custom') {
      const items = filter(allBlocks.custom || []);
      if (items.length > 0) sections.push({ key: 'custom', label: 'Personnalise', items });
    }
    return sections;
  }, [allBlocks, libSearch, libFilter]);

  /* ── DnD ── */
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    // If dragging from library to composition
    if (String(active.id).startsWith('lib-') && !String(over.id).startsWith('lib-')) {
      const blockId = String(active.id).replace('lib-', '');
      const block = [...(allBlocks.system || []), ...(allBlocks.standard || []), ...(allBlocks.custom || [])]
        .find(b => b.id === blockId);
      if (!block) return;

      const newItem = {
        _sortId: `comp-${block.id}-${Date.now()}`,
        blockId: block.id,
        title: block.title,
        content: block.content,
        category: block.category,
        variables: block.variables,
        isSystem: block.isSystem,
      };

      // Insert at the position of 'over'
      const overIdx = composition.findIndex(c => c._sortId === over.id);
      if (overIdx >= 0) {
        const updated = [...composition];
        updated.splice(overIdx, 0, newItem);
        setComposition(updated);
      } else {
        setComposition([...composition, newItem]);
      }
      setDirty(true);
      return;
    }

    // Reorder within composition
    if (active.id !== over.id && !String(active.id).startsWith('lib-') && !String(over.id).startsWith('lib-')) {
      const oldIdx = composition.findIndex(c => c._sortId === active.id);
      const newIdx = composition.findIndex(c => c._sortId === over.id);
      if (oldIdx >= 0 && newIdx >= 0) {
        setComposition(arrayMove(composition, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  /* ── Add block from library (click) ── */
  const addBlockToComposition = (block) => {
    const newItem = {
      _sortId: `comp-${block.id}-${Date.now()}`,
      blockId: block.id,
      title: block.title,
      content: block.content,
      category: block.category,
      variables: block.variables,
      isSystem: block.isSystem,
    };
    setComposition([...composition, newItem]);
    setDirty(true);
  };

  /* ── Remove block from composition ── */
  const removeFromComposition = (sortId) => {
    setComposition(composition.filter(c => c._sortId !== sortId));
    setDirty(true);
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const blocks = composition.map((c, i) => ({
        blockId: c.blockId,
        title: c.title,
        content: c.content,
        category: c.category,
        variables: c.variables,
        isSystem: c.isSystem,
        order: i,
      }));
      await saveTemplateBlocks(templateId, blocks);
      setDirty(false);
      if (onSaved) onSaved();
    } catch { /* ignore */ }
    setSaving(false);
  };

  /* ── Create custom block ── */
  const handleCreateBlock = async (blockData) => {
    try {
      await createBlock(blockData);
      await fetchBlocks();
      setShowCreateBlock(false);
    } catch { /* ignore */ }
  };

  /* ── Active drag item ── */
  const activeDragItem = useMemo(() => {
    if (!activeId) return null;
    if (String(activeId).startsWith('lib-')) {
      const blockId = String(activeId).replace('lib-', '');
      return [...(allBlocks.system || []), ...(allBlocks.standard || []), ...(allBlocks.custom || [])]
        .find(b => b.id === blockId);
    }
    return composition.find(c => c._sortId === activeId);
  }, [activeId, allBlocks, composition]);

  if (loading) {
    return (
      <div className="te-loading">
        <div className="te-spinner" />
      </div>
    );
  }

  return (
    <div className="te-container">
      {/* Header */}
      <div className="te-header">
        <div className="te-header-left">
          <button onClick={onClose} className="te-back-btn" title="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="te-title">{template?.name || 'Template'}</h1>
            <p className="te-subtitle">{composition.length} bloc{composition.length > 1 ? 's' : ''} dans la composition</p>
          </div>
        </div>
        <div className="te-header-right">
          {dirty && <span className="te-unsaved">Modifications non sauvegardees</span>}
          <button onClick={handleSave} className="te-btn te-btn-primary" disabled={saving || !dirty}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="te-panels">
          {/* ── Left: Block Library ── */}
          <div className="te-panel-left">
            <div className="te-lib-header">
              <h2 className="te-lib-title">Blocs disponibles</h2>
              <button onClick={() => setShowCreateBlock(true)} className="te-btn te-btn-ghost te-btn-sm" title="Creer un bloc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Search */}
            <div className="te-lib-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="te-lib-search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={libSearch}
                onChange={e => setLibSearch(e.target.value)}
                placeholder="Rechercher..."
                className="te-lib-search"
              />
            </div>

            {/* Filter pills */}
            <div className="te-lib-filters">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'system', label: 'Systeme' },
                { key: 'standard', label: 'Standard' },
                { key: 'custom', label: 'Perso' },
              ].map(f => (
                <button
                  key={f.key}
                  className={`te-lib-pill ${libFilter === f.key ? 'active' : ''}`}
                  onClick={() => setLibFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Block list */}
            <div className="te-lib-blocks">
              {filteredLibrary.length === 0 ? (
                <div className="te-lib-empty">Aucun bloc trouve</div>
              ) : (
                filteredLibrary.map(section => (
                  <div key={section.key} className="te-lib-section">
                    <div className="te-lib-section-header">
                      <span className={`te-lib-dot te-lib-dot-${section.key}`} />
                      {section.label}
                      <span className="te-lib-section-count">{section.items.length}</span>
                    </div>
                    {section.items.map(block => (
                      <LibraryBlock
                        key={block.id}
                        block={block}
                        onAdd={() => addBlockToComposition(block)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right: Composition ── */}
          <div className="te-panel-right">
            <div className="te-comp-header">
              <h2 className="te-comp-title">Composition du document</h2>
              <span className="te-comp-count">{composition.length} bloc{composition.length > 1 ? 's' : ''}</span>
            </div>

            {composition.length === 0 ? (
              <div className="te-comp-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                <p>Cliquez sur un bloc ou glissez-le ici pour commencer la composition</p>
              </div>
            ) : (
              <SortableContext
                items={composition.map(c => c._sortId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="te-comp-list">
                  {composition.map((item, idx) => (
                    <SortableBlock
                      key={item._sortId}
                      item={item}
                      index={idx}
                      onRemove={() => removeFromComposition(item._sortId)}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeDragItem && (
            <div className="te-drag-overlay">
              <div className="te-block-header" style={{ borderColor: CATEGORY_COLORS[activeDragItem.category] || '#6B7280' }}>
                <span className="te-block-cat-dot" style={{ background: CATEGORY_COLORS[activeDragItem.category] || '#6B7280' }} />
                <span className="te-block-title">{activeDragItem.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create block modal */}
      {showCreateBlock && (
        <CreateBlockModal
          onClose={() => setShowCreateBlock(false)}
          onCreate={handleCreateBlock}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Library Block (draggable from left panel)
   ══════════════════════════════════════════════════════ */
function LibraryBlock({ block, onAdd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `lib-${block.id}`,
    data: { type: 'library', block },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const catColor = CATEGORY_COLORS[block.category] || '#6B7280';

  return (
    <div ref={setNodeRef} style={style} className="te-lib-block" {...attributes}>
      <div className="te-lib-block-header" style={{ borderLeftColor: catColor }}>
        <div className="te-lib-block-drag" {...listeners} title="Glisser pour ajouter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/>
            <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
            <circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/>
          </svg>
        </div>
        <div className="te-lib-block-info">
          <span className="te-lib-block-title">{block.title}</span>
          <span className="te-lib-block-cat">{CATEGORY_LABELS[block.category] || block.category}</span>
        </div>
        <button onClick={onAdd} className="te-lib-block-add" title="Ajouter au document">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Content preview */}
      <div className="te-lib-block-preview">
        {(block.content || '').substring(0, 100)}{(block.content || '').length > 100 ? '...' : ''}
      </div>

      {/* Variable tags */}
      {block.variables && block.variables.length > 0 && (
        <div className="te-lib-block-vars">
          {block.variables.slice(0, 4).map((v, i) => (
            <span key={i} className="te-var-tag">{v.key || v}</span>
          ))}
          {block.variables.length > 4 && (
            <span className="te-var-tag te-var-more">+{block.variables.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Sortable Composition Block (right panel)
   ══════════════════════════════════════════════════════ */
function SortableBlock({ item, index, onRemove }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item._sortId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const catColor = CATEGORY_COLORS[item.category] || '#6B7280';
  const [expanded, setExpanded] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="te-comp-block" {...attributes}>
      <div className="te-comp-block-header" style={{ borderLeftColor: catColor }}>
        <div className="te-comp-block-drag" {...listeners} title="Reordonner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/>
            <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
            <circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/>
          </svg>
        </div>
        <span className="te-comp-block-num">{index + 1}</span>
        <span className="te-comp-block-cat-dot" style={{ background: catColor }} />
        <span className="te-comp-block-title">{item.title}</span>
        <span className="te-comp-block-cat-label" style={{ color: catColor }}>
          {CATEGORY_LABELS[item.category] || item.category}
        </span>
        <div className="te-comp-block-actions">
          <button onClick={() => setExpanded(!expanded)} className="te-icon-btn" title={expanded ? 'Reduire' : 'Developper'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button onClick={onRemove} className="te-icon-btn te-icon-btn-danger" title="Retirer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="te-comp-block-body">
          <pre className="te-comp-block-content">{item.content}</pre>
          {item.variables && item.variables.length > 0 && (
            <div className="te-comp-block-vars">
              {item.variables.map((v, i) => (
                <span key={i} className="te-var-tag">{v.key || v}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Create Block Modal
   ══════════════════════════════════════════════════════ */
function CreateBlockModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('CUSTOM');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onCreate({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: ['custom'],
    });
  };

  return (
    <div className="te-modal-overlay" onClick={onClose}>
      <div className="te-modal" onClick={e => e.stopPropagation()}>
        <div className="te-modal-header">
          <h2>Nouveau bloc personnalise</h2>
          <button onClick={onClose} className="te-modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="te-modal-body">
            <div className="te-field">
              <label>Titre du bloc *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Clause de non-concurrence"
                className="te-input"
                autoFocus
                required
              />
            </div>
            <div className="te-field">
              <label>Categorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="te-input">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="te-field">
              <label>Contenu *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Contenu du bloc... Utilisez {variable} pour les champs dynamiques"
                className="te-input te-textarea"
                rows={8}
                required
              />
              <span className="te-field-hint">Utilisez {'{variable}'} pour inserer des champs dynamiques</span>
            </div>
          </div>
          <div className="te-modal-footer">
            <button type="button" onClick={onClose} className="te-btn te-btn-secondary">Annuler</button>
            <button type="submit" className="te-btn te-btn-primary" disabled={!title.trim() || !content.trim()}>
              Creer le bloc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
