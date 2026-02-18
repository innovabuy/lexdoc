import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function Breadcrumb({ folderId, onNavigate }) {
  const { data: breadcrumb } = useQuery({
    queryKey: ['breadcrumb', folderId],
    queryFn: async () => {
      if (!folderId) return [];

      const { data } = await api.get(`/folders/${folderId}/breadcrumb`);
      return data?.data || data;
    },
    enabled: !!folderId,
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-blue-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Accueil
      </button>

      {breadcrumb?.map((folder, index) => (
        <span key={folder.id} className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button
            onClick={() => onNavigate(folder.id)}
            className={`hover:text-blue-600 transition-colors ${
              index === breadcrumb.length - 1 ? 'font-semibold text-gray-900' : ''
            }`}
          >
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
