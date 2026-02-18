import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import Clients from '../Clients';

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

const mockClients = [
  {
    id: '1',
    type: 'INDIVIDUAL',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.fr',
    phone: '01 23 45 67 89',
    city: 'Paris',
    hasExternet: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'COMPANY',
    companyName: 'SCI Horizon',
    siret: '12345678901234',
    email: 'contact@sci-horizon.fr',
    phone: '01 98 76 54 32',
    city: 'Lyon',
    hasExternet: false,
    createdAt: '2026-01-20T10:00:00Z',
  },
];

describe('Clients Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        data: mockClients,
        pagination: { total: 2, page: 1, pageSize: 20 },
      },
    });
  });

  it('renders page title', () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    // Title text appears in the page (also in sidebar nav)
    const headings = screen.getAllByText('Clients');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders client names', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('SCI Horizon')).toBeInTheDocument();
    });
  });

  it('displays client types', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Particulier')).toBeInTheDocument();
      expect(screen.getByText('Société')).toBeInTheDocument();
    });
  });

  it('displays extranet status', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Non actif')).toBeInTheDocument();
    });
  });

  it('displays total count', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('2 clients')).toBeInTheDocument();
    });
  });

  it('has search input', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Rechercher par nom, email, SIRET...')).toBeInTheDocument();
    });
  });

  it('has action buttons for each client', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      const viewButtons = screen.getAllByText('Voir');
      const editButtons = screen.getAllByText('Éditer');
      const deleteButtons = screen.getAllByText('Suppr.');
      expect(viewButtons).toHaveLength(2);
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  it('opens create modal on button click', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Nouveau client')).toBeInTheDocument();
    });

    const buttons = screen.getAllByText(/Nouveau client/);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Type de client *')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation dialog', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getAllByText('Suppr.')).toHaveLength(2);
    });

    const deleteButtons = screen.getAllByText('Suppr.');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Supprimer ce client ?')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });
  });

  it('shows empty state when no clients', async () => {
    api.get.mockResolvedValue({
      data: { data: [], pagination: { total: 0, page: 1, pageSize: 20 } },
    });

    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucun client')).toBeInTheDocument();
    });
  });

  it('displays SIRET for company clients', async () => {
    renderWithProviders(<Clients />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('SIRET: 12345678901234')).toBeInTheDocument();
    });
  });
});
