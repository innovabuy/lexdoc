import { useState } from 'react';
import { Link } from 'react-router-dom';

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

interface Subcategory {
  name: string;
  templates: Template[];
}

interface Category {
  name: string;
  label: string;
  icon: string;
  templates: Template[];
  subcategories: Subcategory[];
}

interface CategoryNodeProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm?: string;
}

export function CategoryNode({
  category,
  isExpanded,
  onToggle,
  searchTerm = '',
}: CategoryNodeProps) {
  const [expandedSubcategories, setExpandedSubcategories] = useState<string[]>([]);

  const toggleSubcategory = (name: string) => {
    setExpandedSubcategories((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const totalTemplates =
    category.templates.length +
    category.subcategories.reduce((sum, sub) => sum + sub.templates.length, 0);

  const highlightMatch = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium text-gray-900">{category.label}</span>
          <span className="text-sm text-gray-500">({totalTemplates})</span>
        </div>
      </button>

      {/* Category content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Direct templates in category */}
          {category.templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  highlightMatch={highlightMatch}
                />
              ))}
            </div>
          )}

          {/* Subcategories */}
          {category.subcategories.map((subcategory) => (
            <div key={subcategory.name} className="border-l-2 border-gray-200 pl-4">
              <button
                onClick={() => toggleSubcategory(subcategory.name)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    expandedSubcategories.includes(subcategory.name) ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium">{subcategory.name}</span>
                <span className="text-sm text-gray-500">
                  ({subcategory.templates.length})
                </span>
              </button>

              {expandedSubcategories.includes(subcategory.name) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {subcategory.templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      highlightMatch={highlightMatch}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  highlightMatch: (text: string) => React.ReactNode;
}

function TemplateCard({ template, highlightMatch }: TemplateCardProps) {
  return (
    <Link
      to={`/document-templates/${template.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 line-clamp-1">
          {highlightMatch(template.name)}
        </h4>
        <div className="flex items-center gap-1">
          {template.isSystemTemplate && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              Systeme
            </span>
          )}
          {template.isFavorite && (
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
      </div>
      {template.description && (
        <p className="text-sm text-gray-500 line-clamp-2">
          {highlightMatch(template.description)}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <span>Utilise {template.usageCount} fois</span>
      </div>
    </Link>
  );
}

export default CategoryNode;
