import { Home, ChevronRight, Folder } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FolderBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

export function FolderBreadcrumb({ items, onNavigate, className }: FolderBreadcrumbProps) {
  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {/* Home / Root */}
        <li>
          <button
            onClick={() => onNavigate(null)}
            className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Documents</span>
          </button>
        </li>

        {/* Path items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />
              {isLast ? (
                <span className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-gray-900">
                  <Folder className="h-4 w-4 text-blue-500" />
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  {item.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default FolderBreadcrumb;
