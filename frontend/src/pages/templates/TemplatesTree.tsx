import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryNode } from '@/components/templates/CategoryNode';
import { LoadingOverlay } from '@/components/ui';
import api from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  icon: string | null;
  color: string | null;
  usageCount: number;
  isFavorite: boolean;
  isSystemTemplate: boolean;
}

interface CategoryGroup {
  name: string;
  label: string;
  icon: string;
  templates: Template[];
  subcategories: { name: string; templates: Template[] }[];
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  PROCEDURE_CIVILE: { label: 'Procedure civile', icon: 'ScaleIcon' },
  PROCEDURE_COMMERCIALE: { label: 'Procedure commerciale', icon: 'BuildingOfficeIcon' },
  PROCEDURE_PRUDHOMALE: { label: 'Prud\'hommes', icon: 'UserGroupIcon' },
  PROCEDURE_ADMINISTRATIVE: { label: 'Procedure administrative', icon: 'BuildingLibraryIcon' },
  CONTRATS_AFFAIRES: { label: 'Contrats d\'affaires', icon: 'DocumentTextIcon' },
  CONTRATS_TRAVAIL: { label: 'Contrats de travail', icon: 'BriefcaseIcon' },
  DROIT_SOCIETES: { label: 'Droit des societes', icon: 'BuildingOffice2Icon' },
  DROIT_IMMOBILIER: { label: 'Droit immobilier', icon: 'HomeIcon' },
  DROIT_FAMILLE: { label: 'Droit de la famille', icon: 'UsersIcon' },
  COURRIERS_CLIENTS: { label: 'Courriers clients', icon: 'EnvelopeIcon' },
  COURRIERS_ADVERSAIRES: { label: 'Courriers adversaires', icon: 'EnvelopeOpenIcon' },
  COURRIERS_JURIDICTIONS: { label: 'Courriers juridictions', icon: 'InboxIcon' },
  RELANCES: { label: 'Relances', icon: 'BellIcon' },
  CUSTOM: { label: 'Personnalises', icon: 'PencilSquareIcon' },
};

export default function TemplatesTree() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['builder-templates'],
    queryFn: async () => {
      const response = await api.get('/builder-templates');
      return response.data as Template[];
    },
  });

  // Group templates by category
  const groupedTemplates: CategoryGroup[] = Object.entries(categoryLabels).map(
    ([key, { label, icon }]) => {
      const categoryTemplates = (templates || []).filter(
        (t) => t.category === key
      );

      // Group by subcategory
      const subcategoryMap = new Map<string, Template[]>();
      const noSubcategory: Template[] = [];

      categoryTemplates.forEach((t) => {
        if (t.subcategory) {
          const existing = subcategoryMap.get(t.subcategory) || [];
          subcategoryMap.set(t.subcategory, [...existing, t]);
        } else {
          noSubcategory.push(t);
        }
      });

      const subcategories = Array.from(subcategoryMap.entries()).map(
        ([name, templates]) => ({ name, templates })
      );

      return {
        name: key,
        label,
        icon,
        templates: noSubcategory,
        subcategories,
      };
    }
  ).filter((g) => g.templates.length > 0 || g.subcategories.length > 0);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Filter templates based on search
  const filteredGroups = groupedTemplates
    .map((group) => ({
      ...group,
      templates: group.templates.filter(
        (t) =>
          (!showFavoritesOnly || t.isFavorite) &&
          (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
      subcategories: group.subcategories.map((sub) => ({
        ...sub,
        templates: sub.templates.filter(
          (t) =>
            (!showFavoritesOnly || t.isFavorite) &&
            (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
      })).filter((sub) => sub.templates.length > 0),
    }))
    .filter((g) => g.templates.length > 0 || g.subcategories.length > 0);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bibliotheque de modeles</h1>
        <p className="text-gray-500 mt-1">
          Parcourez et utilisez les modeles de documents juridiques
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un modele..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
            showFavoritesOnly
              ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg
            className={`w-5 h-5 ${showFavoritesOnly ? 'text-yellow-500' : 'text-gray-400'}`}
            fill={showFavoritesOnly ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          Favoris
        </button>
      </div>

      {/* Categories tree */}
      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <CategoryNode
            key={group.name}
            category={group}
            isExpanded={expandedCategories.includes(group.name)}
            onToggle={() => toggleCategory(group.name)}
            searchTerm={searchTerm}
          />
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Aucun modele trouve</p>
          </div>
        )}
      </div>
    </div>
  );
}
