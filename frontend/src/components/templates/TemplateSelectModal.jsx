import { useState, useEffect, useMemo } from 'react';
import { getTemplates } from '../../services/foldersApi';

const categoryLabels = {
  contrats: 'Contrats',
  courriers: 'Courriers',
  actes_procedure: 'Actes de procédure',
  conclusions: 'Conclusions',
  divers: 'Divers',
};

const categoryIcons = {
  contrats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  courriers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  actes_procedure: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

export default function TemplateSelectModal({ onSelect, onClose, folderType }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, []);

  // Group by category
  const grouped = useMemo(() => {
    let filtered = templates;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        t => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      filtered = filtered.filter(t => t.category === activeCategory);
    }
    const groups = {};
    filtered.forEach(t => {
      const cat = t.category || 'divers';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [templates, search, activeCategory]);

  const categories = useMemo(() => {
    const cats = {};
    templates.forEach(t => {
      const cat = t.category || 'divers';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return cats;
  }, [templates]);

  return (
    <div className="fdp-modal-overlay" onClick={onClose}>
      <div className="fdp-modal tpl-modal" onClick={e => e.stopPropagation()}>
        <div className="fdp-modal-header">
          <h2>Créer depuis un template</h2>
          <button onClick={onClose} className="fdp-modal-close">&times;</button>
        </div>

        <div className="fdp-modal-body">
          {/* Search */}
          <div className="tpl-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="tpl-search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un template..."
              className="fdp-input tpl-search"
              autoFocus
            />
          </div>

          {/* Category pills */}
          <div className="tpl-cats">
            <button
              className={`tpl-cat-pill ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              Tous ({templates.length})
            </button>
            {Object.entries(categories).map(([cat, count]) => (
              <button
                key={cat}
                className={`tpl-cat-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {categoryLabels[cat] || cat} ({count})
              </button>
            ))}
          </div>

          {/* Template list */}
          {loading ? (
            <div className="fdp-tab-loading"><div className="fdp-spinner" /></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="tpl-empty">
              <p>Aucun template trouve</p>
            </div>
          ) : (
            <div className="tpl-list">
              {Object.entries(grouped).map(([cat, tpls]) => (
                <div key={cat} className="tpl-group">
                  <div className="tpl-group-header">
                    {categoryIcons[cat] || categoryIcons.contrats}
                    <span>{categoryLabels[cat] || cat}</span>
                  </div>
                  {tpls.map(t => (
                    <button
                      key={t.id}
                      className="tpl-item"
                      onClick={() => onSelect(t)}
                    >
                      <div className="tpl-item-info">
                        <span className="tpl-item-name">{t.name}</span>
                        {t.description && (
                          <span className="tpl-item-desc">{t.description}</span>
                        )}
                      </div>
                      <div className="tpl-item-meta">
                        {t.isSystem && <span className="fdp-badge fdp-badge-sm fdp-badge-blue">Systeme</span>}
                        {t.usageCount > 0 && (
                          <span className="tpl-item-usage">{t.usageCount}x</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fdp-modal-footer">
          <button onClick={onClose} className="fdp-btn fdp-btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  );
}
