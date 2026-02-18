import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import DocumentsGlobal from '../documents/DocumentsGlobal';

// Mock api module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../services/api';

const mockDocuments = [
  {
    id: 'doc-1',
    name: 'Contrat de vente',
    originalName: 'contrat-vente.pdf',
    type: 'CONTRACT',
    status: 'DRAFT',
    mimeType: 'application/pdf',
    size: 125000,
    createdAt: '2026-01-15T10:00:00Z',
    folder: { id: 'folder-1', title: 'Dossier Martin', reference: 'DOS-001' },
    createdBy: { id: 'user-1', firstName: 'Jean', lastName: 'Admin' },
    versionsCount: 0,
    signaturesCount: 0,
  },
  {
    id: 'doc-2',
    name: 'Acte notarie',
    originalName: 'acte-notarie.docx',
    type: 'DEED',
    status: 'SIGNED',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 250000,
    createdAt: '2026-01-20T10:00:00Z',
    folder: { id: 'folder-2', title: 'Dossier Durand', reference: 'DOS-002' },
    createdBy: { id: 'user-1', firstName: 'Jean', lastName: 'Admin' },
    versionsCount: 2,
    signaturesCount: 1,
  },
];

const mockFolders = [
  { id: 'folder-1', title: 'Dossier Martin', reference: 'DOS-001' },
  { id: 'folder-2', title: 'Dossier Durand', reference: 'DOS-002' },
];

describe('DocumentsGlobal Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url.startsWith('/documents')) {
        return Promise.resolve({
          data: {
            data: mockDocuments,
            pagination: { total: 2, page: 1, pageSize: 20 },
          },
        });
      }
      if (url.startsWith('/folders')) {
        return Promise.resolve({
          data: { data: mockFolders, pagination: { total: 2 } },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('renders page title', () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });
    const headings = screen.getAllByText('Tous les documents');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders documents in table', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Contrat de vente')).toBeInTheDocument();
      expect(screen.getByText('Acte notarie')).toBeInTheDocument();
    });
  });

  it('displays document types', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Contrat')).toBeInTheDocument();
      expect(screen.getByText('Acte')).toBeInTheDocument();
    });
  });

  it('displays document statuses', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Brouillon')).toBeInTheDocument();
      expect(screen.getByText('Signe')).toBeInTheDocument();
    });
  });

  it('displays folder names', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Dossier Martin')).toBeInTheDocument();
      expect(screen.getByText('Dossier Durand')).toBeInTheDocument();
    });
  });

  it('displays total count', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('2 documents')).toBeInTheDocument();
    });
  });

  it('has search input', () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });
    expect(screen.getByPlaceholderText('Rechercher par nom...')).toBeInTheDocument();
  });

  it('has filter dropdowns', () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });
    expect(screen.getByText('Tous les types')).toBeInTheDocument();
    expect(screen.getByText('Tous les statuts')).toBeInTheDocument();
    expect(screen.getByText('Tous les dossiers')).toBeInTheDocument();
  });

  it('shows checkbox for selection', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // 1 select-all + 2 per document
      expect(checkboxes.length).toBe(3);
    });
  });

  it('shows empty state when no documents', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/documents')) {
        return Promise.resolve({
          data: { data: [], pagination: { total: 0, page: 1, pageSize: 20 } },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucun document')).toBeInTheDocument();
    });
  });

  it('shows bulk action bar when items selected', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    // Click select-all checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.getByText(/2 documents selectionnes/)).toBeInTheDocument();
    });
  });

  it('has action buttons for each document', async () => {
    renderWithProviders(<DocumentsGlobal />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      const downloadButtons = screen.getAllByTitle('Telecharger');
      const deleteButtons = screen.getAllByTitle('Supprimer');
      expect(downloadButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });
});
