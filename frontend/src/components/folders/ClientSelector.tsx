import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Building2, X, ChevronDown } from 'lucide-react';
import { useSearchClients } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import type { Client } from '@/lib/api/clients';

interface ClientSelectorProps {
  selectedClientId: string | null;
  selectedClient?: Client | null;
  onSelect: (client: Client | null) => void;
  label?: string;
  error?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  selectedClient,
  onSelect,
  label = 'Client',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: clients, isLoading } = useSearchClients(debouncedSearch, {
    enabled: debouncedSearch.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  const getClientDisplayName = (client: Client) => {
    if (client.type === 'ENTREPRISE' || client.type === 'ASSOCIATION' || client.type === 'COLLECTIVITE') {
      return client.denomination || client.nom;
    }
    return client.prenom ? `${client.prenom} ${client.nom}` : client.nom;
  };

  const getClientIcon = (client: Client) => {
    if (client.type === 'ENTREPRISE' || client.type === 'ASSOCIATION' || client.type === 'COLLECTIVITE') {
      return <Building2 className="h-4 w-4 text-gray-400" />;
    }
    return <User className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Selected client display or search input */}
      {selectedClient || selectedClientId ? (
        <div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            {selectedClient && getClientIcon(selectedClient)}
            <span className="text-sm text-gray-900">
              {selectedClient ? getClientDisplayName(selectedClient) : 'Client selectionne'}
            </span>
            {selectedClient?.email && (
              <span className="text-xs text-gray-500">({selectedClient.email})</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Rechercher un client..."
            className={`w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedClient && !selectedClientId && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {searchQuery.length < 2 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Tapez au moins 2 caracteres pour rechercher
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Recherche en cours...
            </div>
          ) : clients && clients.length > 0 ? (
            <ul className="py-1">
              {clients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    {getClientIcon(client)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {getClientDisplayName(client)}
                      </div>
                      {client.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {client.email}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {client.type === 'PARTICULIER' ? 'Particulier' :
                       client.type === 'ENTREPRISE' ? 'Entreprise' :
                       client.type === 'ASSOCIATION' ? 'Association' : 'Collectivite'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Aucun client trouve
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ClientSelector;
