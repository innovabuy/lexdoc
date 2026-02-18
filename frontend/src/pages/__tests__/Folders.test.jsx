import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import Folders from '../Folders';

// Mock api module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../services/api';

describe('Folders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: [
          {
            id: '1',
            title: 'Dossier Dupont',
            reference: 'DOS-2026-0001',
            description: 'Litige immobilier',
            type: 'LITIGATION',
            status: 'OPEN',
            color: '#3B82F6',
            createdAt: '2026-01-15T10:00:00Z',
            client: { firstName: 'Jean', lastName: 'Dupont' },
          },
          {
            id: '2',
            title: 'Contrat SCI',
            reference: 'DOS-2026-0002',
            description: 'Rédaction contrat',
            type: 'CONTRACT',
            status: 'IN_PROGRESS',
            color: '#10B981',
            createdAt: '2026-01-20T10:00:00Z',
            client: { companyName: 'SCI Horizon' },
          },
        ],
        pagination: { total: 2, page: 1, pageSize: 12 },
      },
    });
  });

  it('renders page title', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    // Title text appears in the page content area
    const headings = screen.getAllByText('Dossiers');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders folder cards', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Dossier Dupont')).toBeInTheDocument();
      expect(screen.getByText('Contrat SCI')).toBeInTheDocument();
    });
  });

  it('displays folder references', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Réf: DOS-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Réf: DOS-2026-0002')).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Ouvert')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });
  });

  it('displays total count', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('2 dossiers')).toBeInTheDocument();
    });
  });

  it('has search input', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Rechercher par titre, référence...')).toBeInTheDocument();
    });
  });

  it('has Nouveau dossier button', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Nouveau dossier')).toBeInTheDocument();
    });
  });

  it('opens create modal on button click', async () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Nouveau dossier')).toBeInTheDocument();
    });

    // Click first "Nouveau dossier" button (header)
    const buttons = screen.getAllByText(/Nouveau dossier/);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Titre *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Titre du dossier')).toBeInTheDocument();
    });
  });

  it('shows empty state when no folders', async () => {
    api.get.mockResolvedValue({
      data: { data: [], pagination: { total: 0, page: 1, pageSize: 12 } },
    });

    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucun dossier')).toBeInTheDocument();
    });
  });

  it('has view mode toggle', () => {
    renderWithProviders(<Folders />, { authValue: mockAuthenticatedUser });

    // View toggle buttons are rendered (may have duplicates from mobile nav)
    const gridButtons = screen.getAllByText('▦');
    const listButtons = screen.getAllByText('☰');
    expect(gridButtons.length).toBeGreaterThan(0);
    expect(listButtons.length).toBeGreaterThan(0);
  });
});
