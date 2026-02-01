import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Check } from 'lucide-react';
import { getDocuments } from '@/lib/api/documents';
import Input from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { formatBytes, formatDate } from '@/lib/utils/formatters';

interface Props {
  selectedDocument: any;
  onSelect: (document: any) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  reference: string;
  onReferenceChange: (reference: string) => void;
}

const LrarDocumentSelect: React.FC<Props> = ({
  selectedDocument,
  onSelect,
  subject,
  onSubjectChange,
  reference,
  onReferenceChange,
}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search: debouncedSearch }],
    queryFn: () => getDocuments({ search: debouncedSearch, limit: 20 }),
  });

  const documents = data?.data || [];

  // Filter only PDF documents
  const pdfDocuments = documents.filter(
    (doc: any) => doc.mimeType === 'application/pdf'
  );

  return (
    <div className="space-y-6">
      {/* Subject and reference */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informations de l'envoi
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objet du courrier *
          </label>
          <Input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Ex: Mise en demeure - Dossier n12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference (optionnelle)
          </label>
          <Input
            type="text"
            value={reference}
            onChange={(e) => onReferenceChange(e.target.value)}
            placeholder="Ex: REF-2024-001"
          />
        </div>
      </div>

      {/* Document selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Document a envoyer
        </h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : pdfDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun document PDF trouve</p>
              <p className="text-sm mt-1">
                Seuls les documents PDF peuvent etre envoyes en LRAR
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
              {pdfDocuments.map((doc: any) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  className={`
                    w-full flex items-center p-4 text-left hover:bg-gray-50 transition-colors
                    ${selectedDocument?.id === doc.id ? 'bg-primary-50' : ''}
                  `}
                >
                  <div className="flex-shrink-0 mr-4">
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${selectedDocument?.id === doc.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-red-100 text-red-600'
                        }
                      `}
                    >
                      {selectedDocument?.id === doc.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title || doc.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(doc.size)} - {formatDate(doc.createdAt)}
                    </p>
                  </div>

                  {selectedDocument?.id === doc.id && (
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Selectionne
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LrarDocumentSelect;
