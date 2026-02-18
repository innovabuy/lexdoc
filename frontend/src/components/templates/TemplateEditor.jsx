import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  getTemplateVariables,
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
  const [libFilter, setLibFilter] = useState('all');

  // Composition (center panel)
  const [composition, setComposition] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Variables panel
  const [showVars, setShowVars] = useState(false);
  const [varGroups, setVarGroups] = useState({});
  const [varSearch, setVarSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Create block modal
  const [showCreateBlock, setShowCreateBlock] = useState(false);

  // Track which free block is focused (for variable insertion)
  const [activeFreeBlockId, setActiveFreeBlockId] = useState(null);
  const freeBlockRefs = useRef({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Fetch ── */
  const fetchTemplate = useCallback(async () => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      if (data.blocks && Array.isArray(data.blocks)) {
        setComposition(data.blocks.map((b, i) => ({
          ...b,
          _sortId: `comp-${b.blockId || b.id || i}-${Date.now()}-${i}`,
          _isFree: b._isFree || false,
        })));
      }
    } catch { /* ignore */ }
  }, [templateId]);

  const fetchBlocks = useCallback(async () => {
    try {
      const data = await getBlocks();
      setAllBlocks(data.grouped || { system: [], standard: [], custom: [] });
    } catch { /* ignore */ }
  }, []);

  const fetchVariables = useCallback(async () => {
    try {
      const data = await getTemplateVariables();
      setVarGroups(data || {});
      // Auto-expand all groups
      const exp = {};
      Object.keys(data || {}).forEach(k => { exp[k] = true; });
      setExpandedGroups(exp);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchTemplate(), fetchBlocks(), fetchVariables()])
      .then(() => setLoading(false));
  }, [fetchTemplate, fetchBlocks, fetchVariables]);

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

  /* ── Filtered variables ── */
  const filteredVarGroups = useMemo(() => {
    if (!varSearch) return varGroups;
    const q = varSearch.toLowerCase();
    const result = {};
    for (const [key, group] of Object.entries(varGroups)) {
      const vars = group.variables.filter(v =>
        v.label.toLowerCase().includes(q) ||
        v.key.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q)
      );
      if (vars.length > 0) result[key] = { ...group, variables: vars };
    }
    return result;
  }, [varGroups, varSearch]);

  /* ── DnD ── */
  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

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
        _isFree: false,
      };

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

    if (active.id !== over.id && !String(active.id).startsWith('lib-') && !String(over.id).startsWith('lib-')) {
      const oldIdx = composition.findIndex(c => c._sortId === active.id);
      const newIdx = composition.findIndex(c => c._sortId === over.id);
      if (oldIdx >= 0 && newIdx >= 0) {
        setComposition(arrayMove(composition, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  /* ── Add/remove blocks ── */
  const addBlockToComposition = (block) => {
    const newItem = {
      _sortId: `comp-${block.id}-${Date.now()}`,
      blockId: block.id,
      title: block.title,
      content: block.content,
      category: block.category,
      variables: block.variables,
      isSystem: block.isSystem,
      _isFree: false,
    };
    setComposition([...composition, newItem]);
    setDirty(true);
  };

  const removeFromComposition = (sortId) => {
    setComposition(composition.filter(c => c._sortId !== sortId));
    setDirty(true);
  };

  /* ── Add free block ── */
  const addFreeBlock = () => {
    const id = `free-${Date.now()}`;
    const newItem = {
      _sortId: id,
      blockId: null,
      title: 'Bloc libre',
      content: '',
      category: 'CUSTOM',
      variables: [],
      isSystem: false,
      _isFree: true,
    };
    setComposition([...composition, newItem]);
    setDirty(true);
    setActiveFreeBlockId(id);
  };

  /* ── Update free block content ── */
  const updateFreeBlockContent = (sortId, content) => {
    setComposition(composition.map(c =>
      c._sortId === sortId ? { ...c, content } : c
    ));
    setDirty(true);
  };

  /* ── Update free block title ── */
  const updateFreeBlockTitle = (sortId, title) => {
    setComposition(composition.map(c =>
      c._sortId === sortId ? { ...c, title } : c
    ));
    setDirty(true);
  };

  /* ── Save free block as custom block ── */
  const saveFreeBlockAsCustom = async (sortId) => {
    const item = composition.find(c => c._sortId === sortId);
    if (!item || !item.content.trim()) return;
    try {
      const created = await createBlock({
        title: item.title || 'Bloc personnalise',
        content: item.content,
        category: 'CUSTOM',
        tags: ['custom', 'libre'],
      });
      // Update composition to reference the saved block
      setComposition(composition.map(c =>
        c._sortId === sortId
          ? { ...c, blockId: created.id, _isFree: false }
          : c
      ));
      await fetchBlocks();
      setDirty(true);
    } catch { /* ignore */ }
  };

  /* ── Insert variable into active free block ── */
  const insertVariable = (varKey) => {
    if (!activeFreeBlockId) return;
    const ref = freeBlockRefs.current[activeFreeBlockId];
    if (!ref) return;

    const tag = `{{${varKey}}}`;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const text = ref.value;
    const newText = text.substring(0, start) + tag + text.substring(end);

    updateFreeBlockContent(activeFreeBlockId, newText);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ref.focus();
      const pos = start + tag.length;
      ref.setSelectionRange(pos, pos);
    });
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
        _isFree: c._isFree || false,
        customContent: c._isFree ? c.content : undefined,
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
          <button
            className={`te-vars-toggle ${showVars ? 'te-vars-toggle--active' : ''}`}
            onClick={() => setShowVars(!showVars)}
          >
            {'{ }'}
            Variables
          </button>
          {dirty && <span className="te-unsaved">Modifications non sauvegardees</span>}
          <button onClick={handleSave} className="te-btn te-btn-primary" disabled={saving || !dirty}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
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

          {/* ── Center: Composition ── */}
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
                      onContentChange={(content) => updateFreeBlockContent(item._sortId, content)}
                      onTitleChange={(title) => updateFreeBlockTitle(item._sortId, title)}
                      onSaveAsBlock={() => saveFreeBlockAsCustom(item._sortId)}
                      onFocus={() => setActiveFreeBlockId(item._sortId)}
                      freeBlockRef={(el) => { if (el) freeBlockRefs.current[item._sortId] = el; }}
                    />
                  ))}
                  <button className="te-add-free-block" onClick={addFreeBlock}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Ajouter un bloc libre
                  </button>
                </div>
              </SortableContext>
            )}
          </div>

          {/* ── Right: Variables panel ── */}
          <div className={`te-panel-vars ${showVars ? '' : 'te-panel-vars--hidden'}`}>
            <div className="te-vars-header">
              <h2 className="te-vars-title">Inserer une variable</h2>
              <button onClick={() => setShowVars(false)} className="te-icon-btn" title="Fermer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="te-vars-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="te-vars-search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={varSearch}
                onChange={e => setVarSearch(e.target.value)}
                placeholder="Rechercher..."
                className="te-vars-search"
              />
            </div>

            <div className="te-vars-list">
              {Object.entries(filteredVarGroups).map(([groupKey, group]) => (
                <div key={groupKey} className="te-vars-group">
                  <div
                    className="te-vars-group-header"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                  >
                    <span className="te-vars-group-icon">{group.icon}</span>
                    <span className="te-vars-group-label">{group.label}</span>
                    <span className="te-vars-group-count">{group.variables.length}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`te-vars-group-chevron ${expandedGroups[groupKey] ? 'te-vars-group-chevron--open' : ''}`}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                  {expandedGroups[groupKey] && (
                    <div className="te-vars-items">
                      {group.variables.map(v => (
                        <div key={v.key} className="te-var-item" onClick={() => insertVariable(v.key)} title={v.description}>
                          <div className="te-var-item-info">
                            <span className="te-var-item-label">{v.label}</span>
                            <span className="te-var-item-key">{`{{${v.key}}}`}</span>
                          </div>
                          <span className="te-var-item-insert">Inserer</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

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

      {showCreateBlock && (
        <CreateBlockModal
          onClose={() => setShowCreateBlock(false)}
          onCreate={handleCreateBlock}
          varGroups={varGroups}
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

      <div className="te-lib-block-preview">
        {(block.content || '').substring(0, 100)}{(block.content || '').length > 100 ? '...' : ''}
      </div>

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
   Sortable Composition Block (center panel)
   ══════════════════════════════════════════════════════ */
function SortableBlock({ item, index, onRemove, onContentChange, onTitleChange, onSaveAsBlock, onFocus, freeBlockRef }) {
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
  const [expanded, setExpanded] = useState(item._isFree);

  return (
    <div ref={setNodeRef} style={style} className="te-comp-block" {...attributes}>
      <div className="te-comp-block-header" style={{ borderLeftColor: item._isFree ? '#7C3AED' : catColor }}>
        <div className="te-comp-block-drag" {...listeners} title="Reordonner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/>
            <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
            <circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/>
          </svg>
        </div>
        <span className="te-comp-block-num">{index + 1}</span>
        <span className="te-comp-block-cat-dot" style={{ background: item._isFree ? '#7C3AED' : catColor }} />
        {item._isFree ? (
          <input
            className="te-comp-block-title"
            style={{ border: 'none', background: 'transparent', outline: 'none', font: 'inherit', padding: 0, width: '100%' }}
            value={item.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Titre du bloc libre..."
          />
        ) : (
          <span className="te-comp-block-title">{item.title}</span>
        )}
        <span className="te-comp-block-cat-label" style={{ color: item._isFree ? '#7C3AED' : catColor }}>
          {item._isFree ? 'Libre' : (CATEGORY_LABELS[item.category] || item.category)}
        </span>
        <div className="te-comp-block-actions">
          {item._isFree && item.content?.trim() && (
            <button onClick={onSaveAsBlock} className="te-icon-btn" title="Sauvegarder comme bloc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          )}
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

      {expanded && (
        <div className="te-comp-block-body">
          {item._isFree ? (
            <div className="te-free-block-editor">
              <textarea
                ref={freeBlockRef}
                className="te-free-block-textarea"
                value={item.content}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                placeholder="Tapez votre texte ici... Utilisez le panneau Variables pour inserer des {{variables}}."
                rows={6}
              />
            </div>
          ) : (
            <>
              <pre className="te-comp-block-content">{item.content}</pre>
              {item.variables && item.variables.length > 0 && (
                <div className="te-comp-block-vars">
                  {item.variables.map((v, i) => (
                    <span key={i} className="te-var-tag">{v.key || v}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Create Block Modal
   ══════════════════════════════════════════════════════ */
function CreateBlockModal({ onClose, onCreate, varGroups }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('CUSTOM');
  const textareaRef = useRef(null);

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

  const insertVar = (key) => {
    const ref = textareaRef.current;
    if (!ref) return;
    const tag = `{{${key}}}`;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const newContent = content.substring(0, start) + tag + content.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ref.focus();
      const pos = start + tag.length;
      ref.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="te-modal-overlay" onClick={onClose}>
      <div className="te-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={'Contenu du bloc...\nUtilisez {{variable}} pour les champs dynamiques.'}
                className="te-input te-textarea"
                rows={8}
                required
              />
              {/* Quick variable buttons */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['client.nom_complet', 'client.adresse', 'cabinet.nom', 'dossier.reference', 'date'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => insertVar(k)}
                    className="te-var-tag"
                    style={{ cursor: 'pointer', border: '1px solid #E5E7EB' }}
                  >
                    {k}
                  </button>
                ))}
              </div>
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
