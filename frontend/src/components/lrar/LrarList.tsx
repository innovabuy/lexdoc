import React, { useState } from 'react';
import { Search, Mail } from 'lucide-react';
import { useLrarShipments } from '@/hooks/useLrar';
import { useDebounce } from '@/hooks/useDebounce';
import Input from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import LrarCard from './LrarCard';
import type { LrarStatus, LrarShipment } from '@/lib/types';

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En preparation' },
  { value: 'PROCESSING', label: 'Impression' },
  { value: 'SENT', label: 'Envoyes' },
  { value: 'IN_TRANSIT', label: 'En transit' },
  { value: 'DELIVERED', label: 'Distribues' },
  { value: 'RETURNED', label: 'Retournes' },
];

const LrarList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LrarStatus | ''>('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useLrarShipments({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const shipments = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un envoi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LrarStatus | '');
              setPage(1);
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="Aucun envoi LRAR"
          description={
            search || status
              ? 'Aucun resultat pour ces filtres'
              : 'Commencez par creer un envoi recommande'
          }
        />
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment: LrarShipment) => (
            <LrarCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {pagination.total} envoi{pagination.total > 1 ? 's' : ''} au total
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedent
            </button>
            <span className="text-sm text-gray-700">
              Page {page} sur {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LrarList;
