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
  updateBlock,
  deleteBlock,
  getTemplateVariables,
} from '../../services/templateApi';
import './TemplateEditor.css';

/* ── Category config ── */
const CATEGORY_LABELS = {
  INTRO: 'Introduction',
  FAITS: 'Faits',
  MOYENS: 'Moyens',
  DISPOSITIF: 'Dispositif',
  CONCLUSION: 'Conclusion',
  SIGNATURE: 'Signature',
  CLAUSE: 'Clauses',
  CUSTOM: 'Personnalise',
  AUTRE: 'Autre',
};
const CATEGORY_COLORS = {
  INTRO: '#3B82F6',
  FAITS: '#F59E0B',
  MOYENS: '#8B5CF6',
  DISPOSITIF: '#10B981',
  CONCLUSION: '#0EA5E9',
  SIGNATURE: '#6B7280',
  CLAUSE: '#EC4899',
  CUSTOM: '#7C3AED',
  AUTRE: '#6B7280',
};

/* ── Helper: extract {{variables}} from text ── */
function extractVarsFromText(text) {
  if (!text) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const vars = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const v = match[1].trim().split(' ')[0];
    if (!v.startsWith('#') && !v.startsWith('/') && v !== 'else' && !v.startsWith('@') && v !== 'this') {
      vars.add(v);
    }
  }
  return Array.from(vars);
}

export default function TemplateEditor({ templateId, onClose, onSaved }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Block library
  const [allBlocks, setAllBlocks] = useState({ system: [], standard: [], custom: [], personalise: [] });
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

  // Modals
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(null); // sortId of block to save
  const [editingBlock, setEditingBlock] = useState(null); // block object to edit

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
          _localContent: null, // local edits (null = use original)
        })));
      }
    } catch { /* ignore */ }
  }, [templateId]);

  const fetchBlocks = useCallback(async () => {
    try {
      const data = await getBlocks();
      setAllBlocks(data.grouped || { system: [], standard: [], custom: [], personalise: [] });
    } catch { /* ignore */ }
  }, []);

  const fetchVariables = useCallback(async () => {
    try {
      const data = await getTemplateVariables();
      setVarGroups(data || {});
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

    // Personalise first
    if (libFilter === 'all' || libFilter === 'personalise') {
      const items = filter(allBlocks.personalise || []);
      if (items.length > 0 || libFilter === 'personalise') {
        sections.push({ key: 'personalise', label: 'Mes blocs personnalises', items });
      }
    }
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
      const block = [...(allBlocks.system || []), ...(allBlocks.standard || []), ...(allBlocks.custom || []), ...(allBlocks.personalise || [])]
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
        isPersonalise: block.isPersonalise,
        _isFree: false,
        _localContent: null,
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
      isPersonalise: block.isPersonalise,
      _isFree: false,
      _localContent: null,
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
      isPersonalise: false,
      _isFree: true,
      _localContent: null,
    };
    setComposition([...composition, newItem]);
    setDirty(true);
    setActiveFreeBlockId(id);
  };

  /* ── Update free block content ── */
  const updateFreeBlockContent = (sortId, content) => {
    setComposition(composition.map(c =>
      c._sortId === sortId ? { ...c, content, _localContent: c.blockId ? content : null } : c
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

    requestAnimationFrame(() => {
      ref.focus();
      const pos = start + tag.length;
      ref.setSelectionRange(pos, pos);
    });
  };

  /* ── Save free block as personalise ── */
  const handleSaveToLibrary = async (sortId, { title, category, description }) => {
    const item = composition.find(c => c._sortId === sortId);
    if (!item || !item.content.trim()) return;
    try {
      const created = await createBlock({
        title: title || item.title || 'Mon bloc',
        content: item.content,
        category: category || 'CUSTOM',
        description: description || null,
        isPersonalise: true,
        tags: ['custom', 'personalise'],
      });
      // Update composition to reference the saved block
      setComposition(composition.map(c =>
        c._sortId === sortId
          ? { ...c, blockId: created.id, _isFree: false, isPersonalise: true, _localContent: null }
          : c
      ));
      await fetchBlocks();
      setDirty(true);
      setShowSaveModal(null);
    } catch { /* ignore */ }
  };

  /* ── Update existing block in library ── */
  const handleUpdateInLibrary = async (sortId) => {
    const item = composition.find(c => c._sortId === sortId);
    if (!item?.blockId || !item.content?.trim()) return;
    try {
      await updateBlock(item.blockId, {
        content: item.content,
        title: item.title,
      });
      setComposition(composition.map(c =>
        c._sortId === sortId ? { ...c, _localContent: null } : c
      ));
      await fetchBlocks();
    } catch { /* ignore */ }
  };

  /* ── Delete personal block from library ── */
  const handleDeleteBlock = async (blockId) => {
    try {
      await deleteBlock(blockId);
      await fetchBlocks();
    } catch { /* ignore */ }
  };

  /* ── Edit personal block ── */
  const handleEditBlock = async (blockData) => {
    if (!editingBlock) return;
    try {
      await updateBlock(editingBlock.id, blockData);
      await fetchBlocks();
      setEditingBlock(null);
    } catch { /* ignore */ }
  };

  /* ── Save composition ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const blocks = composition.map((c, i) => ({
        blockId: c.blockId,
        title: c.title,
        content: c._localContent || c.content,
        category: c.category,
        variables: c.variables,
        isSystem: c.isSystem,
        order: i,
        _isFree: c._isFree || false,
        customContent: c._isFree ? c.content : (c._localContent || undefined),
      }));
      await saveTemplateBlocks(templateId, blocks);
      setDirty(false);
      if (onSaved) onSaved();
    } catch { /* ignore */ }
    setSaving(false);
  };

  /* ── Create custom block from modal ── */
  const handleCreateBlock = async (blockData) => {
    try {
      await createBlock({ ...blockData, isPersonalise: true, tags: ['custom', 'personalise'] });
      await fetchBlocks();
      setShowCreateBlock(false);
    } catch { /* ignore */ }
  };

  /* ── Active drag item ── */
  const activeDragItem = useMemo(() => {
    if (!activeId) return null;
    if (String(activeId).startsWith('lib-')) {
      const blockId = String(activeId).replace('lib-', '');
      return [...(allBlocks.system || []), ...(allBlocks.standard || []), ...(allBlocks.custom || []), ...(allBlocks.personalise || [])]
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
              <button onClick={() => setShowCreateBlock(true)} className="te-btn te-btn-ghost te-btn-sm" title="Creer un bloc personnalise">
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
                { key: 'personalise', label: 'Mes blocs' },
                { key: 'system', label: 'Systeme' },
                { key: 'standard', label: 'Standard' },
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
              {filteredLibrary.length === 0 || filteredLibrary.every(s => s.items.length === 0) ? (
                <div className="te-lib-empty">
                  {libFilter === 'personalise' ? (
                    <>
                      <p>Aucun bloc personnalise</p>
                      <button onClick={() => setShowCreateBlock(true)} className="te-btn te-btn-primary te-btn-sm" style={{ marginTop: 8 }}>
                        + Creer un bloc
                      </button>
                    </>
                  ) : 'Aucun bloc trouve'}
                </div>
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
                        isPersonalise={section.key === 'personalise'}
                        onEdit={() => setEditingBlock(block)}
                        onDelete={() => handleDeleteBlock(block.id)}
                      />
                    ))}
                    {section.key === 'personalise' && (
                      <button onClick={() => setShowCreateBlock(true)} className="te-add-perso-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Creer un bloc
                      </button>
                    )}
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
                      onSaveToLibrary={() => setShowSaveModal(item._sortId)}
                      onUpdateInLibrary={() => handleUpdateInLibrary(item._sortId)}
                      onFocus={() => setActiveFreeBlockId(item._sortId)}
                      freeBlockRef={(el) => { if (el) freeBlockRefs.current[item._sortId] = el; }}
                      onInsertVariable={insertVariable}
                      showVars={showVars}
                      onToggleVars={() => setShowVars(true)}
                      varGroups={varGroups}
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

      {showSaveModal && (
        <SaveToLibraryModal
          item={composition.find(c => c._sortId === showSaveModal)}
          onClose={() => setShowSaveModal(null)}
          onSave={(data) => handleSaveToLibrary(showSaveModal, data)}
        />
      )}

      {editingBlock && (
        <EditBlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSave={handleEditBlock}
          varGroups={varGroups}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Library Block (draggable from left panel)
   ══════════════════════════════════════════════════════ */
function LibraryBlock({ block, onAdd, isPersonalise, onEdit, onDelete }) {
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
    <div ref={setNodeRef} style={style} className={`te-lib-block ${isPersonalise ? 'te-lib-block--perso' : ''}`} {...attributes}>
      <div className="te-lib-block-header" style={{ borderLeftColor: isPersonalise ? '#7C3AED' : catColor }}>
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
        <div className="te-lib-block-btns">
          {isPersonalise && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="te-lib-block-action" title="Modifier">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce bloc ?')) onDelete(); }} className="te-lib-block-action te-lib-block-action--danger" title="Supprimer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </>
          )}
          <button onClick={onAdd} className="te-lib-block-add" title="Ajouter au document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="te-lib-block-preview">
        {(block.content || '').substring(0, 80)}{(block.content || '').length > 80 ? '...' : ''}
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
function SortableBlock({ item, index, onRemove, onContentChange, onTitleChange, onSaveToLibrary, onUpdateInLibrary, onFocus, freeBlockRef, onInsertVariable, showVars, onToggleVars, varGroups }) {
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
  const isFreeOrEditable = item._isFree || (item.isPersonalise && !item.isSystem);
  const [expanded, setExpanded] = useState(item._isFree);
  const hasLocalChanges = item._localContent !== null && item._localContent !== undefined;
  const contentVars = extractVarsFromText(item.content);

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
            className="te-comp-block-title-input"
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
          {/* Save to library — free blocks only */}
          {item._isFree && item.content?.trim() && !item.blockId && (
            <button onClick={onSaveToLibrary} className="te-icon-btn" title="Sauvegarder dans ma bibliotheque">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          )}
          {/* Update in library — library blocks with local changes */}
          {hasLocalChanges && item.blockId && !item.isSystem && (
            <button onClick={onUpdateInLibrary} className="te-icon-btn" title="Mettre a jour dans la bibliotheque">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
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
          {isFreeOrEditable ? (
            <div className="te-free-block-editor">
              <div className="te-free-block-toolbar">
                <button
                  type="button"
                  className="te-btn te-btn-ghost te-btn-sm"
                  onClick={onToggleVars}
                  title="Inserer une variable"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                  Inserer variable
                </button>
                {contentVars.length > 0 && (
                  <span className="te-free-block-var-count">{contentVars.length} variable{contentVars.length > 1 ? 's' : ''}</span>
                )}
              </div>
              <textarea
                ref={freeBlockRef}
                className="te-free-block-textarea"
                value={item.content}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                placeholder={'Tapez votre texte ici...\nUtilisez "Inserer variable" ou le panneau de droite pour ajouter des {{variables}}.'}
                rows={6}
              />
              {/* Show extracted variables as badges */}
              {contentVars.length > 0 && (
                <div className="te-free-block-vars">
                  {contentVars.map(v => (
                    <span key={v} className="te-var-badge">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <RenderedContent content={item.content} />
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

/* ── Rendered content with highlighted variables ── */
function RenderedContent({ content }) {
  if (!content) return null;
  // Split content by {{...}} and render with badges
  const parts = content.split(/(\{\{[^}]+\}\})/g);
  return (
    <pre className="te-comp-block-content">
      {parts.map((part, i) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          return <span key={i} className="te-var-badge-inline">{part}</span>;
        }
        return part;
      })}
    </pre>
  );
}

/* ══════════════════════════════════════════════════════
   Save to Library Modal
   ══════════════════════════════════════════════════════ */
function SaveToLibraryModal({ item, onClose, onSave }) {
  const [title, setTitle] = useState(item?.title || 'Mon bloc');
  const [category, setCategory] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), category, description: description.trim() || null });
    setSaving(false);
  };

  const contentVars = extractVarsFromText(item.content);

  return (
    <div className="te-modal-overlay" onClick={onClose}>
      <div className="te-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="te-modal-header">
          <h2>Sauvegarder dans ma bibliotheque</h2>
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
                placeholder="Ex: Mon paragraphe prejudice"
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
              <label>Description (optionnel)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Paragraphe type pour chiffrage du prejudice"
                className="te-input"
              />
            </div>
            {/* Preview */}
            <div className="te-field">
              <label>Apercu du contenu</label>
              <pre className="te-save-preview">{item.content}</pre>
            </div>
            {contentVars.length > 0 && (
              <div className="te-field">
                <label>Variables detectees ({contentVars.length})</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {contentVars.map(v => (
                    <span key={v} className="te-var-badge">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="te-modal-footer">
            <button type="button" onClick={onClose} className="te-btn te-btn-secondary">Annuler</button>
            <button type="submit" className="te-btn te-btn-primary" disabled={!title.trim() || saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Edit Block Modal
   ══════════════════════════════════════════════════════ */
function EditBlockModal({ block, onClose, onSave, varGroups }) {
  const [title, setTitle] = useState(block.title);
  const [content, setContent] = useState(block.content);
  const [category, setCategory] = useState(block.category);
  const [description, setDescription] = useState(block.description || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      description: description.trim() || null,
    });
    setSaving(false);
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

  const contentVars = extractVarsFromText(content);

  return (
    <div className="te-modal-overlay" onClick={onClose}>
      <div className="te-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="te-modal-header">
          <h2>Modifier le bloc</h2>
          <button onClick={onClose} className="te-modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="te-modal-body">
            <div className="te-field">
              <label>Titre *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
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
              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description optionnelle"
                className="te-input"
              />
            </div>
            <div className="te-field">
              <label>Contenu *</label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="te-input te-textarea"
                rows={8}
                required
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['client.nom_complet', 'client.civilite', 'client.adresse', 'cabinet.nom', 'cabinet.adresse', 'dossier.reference', 'date'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => insertVar(k)}
                    className="te-var-badge"
                    style={{ cursor: 'pointer', border: '1px solid #BFDBFE' }}
                  >
                    {`{{${k}}}`}
                  </button>
                ))}
              </div>
            </div>
            {contentVars.length > 0 && (
              <div className="te-field">
                <label>Variables ({contentVars.length})</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {contentVars.map(v => (
                    <span key={v} className="te-var-badge">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="te-modal-footer">
            <button type="button" onClick={onClose} className="te-btn te-btn-secondary">Annuler</button>
            <button type="submit" className="te-btn te-btn-primary" disabled={!title.trim() || !content.trim() || saving}>
              {saving ? 'Sauvegarde...' : 'Mettre a jour'}
            </button>
          </div>
        </form>
      </div>
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
  const [description, setDescription] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onCreate({
      title: title.trim(),
      content: content.trim(),
      category,
      description: description.trim() || null,
      tags: ['custom', 'personalise'],
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

  const contentVars = extractVarsFromText(content);

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
              <label>Description (optionnel)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Paragraphe type pour chiffrage du prejudice"
                className="te-input"
              />
            </div>
            <div className="te-field">
              <label>Contenu *</label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={'Contenu du bloc...\nUtilisez les boutons ci-dessous pour inserer des variables.'}
                className="te-input te-textarea"
                rows={8}
                required
              />
              {/* Quick variable buttons */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['client.civilite', 'client.nom_complet', 'client.adresse', 'cabinet.nom', 'cabinet.adresse', 'dossier.reference', 'date'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => insertVar(k)}
                    className="te-var-badge"
                    style={{ cursor: 'pointer', border: '1px solid #BFDBFE' }}
                  >
                    {`{{${k}}}`}
                  </button>
                ))}
              </div>
            </div>
            {contentVars.length > 0 && (
              <div className="te-field">
                <label>Variables detectees ({contentVars.length})</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {contentVars.map(v => (
                    <span key={v} className="te-var-badge">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            )}
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
