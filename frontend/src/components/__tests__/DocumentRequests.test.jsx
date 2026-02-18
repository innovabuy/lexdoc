import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import DocumentRequests from '../folders/DocumentRequests';

const mockRequests = [
  {
    id: '1',
    title: 'Kbis de moins de 3 mois',
    description: 'Merci de fournir un Kbis récent',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: '2026-03-01T00:00:00Z',
    reminderCount: 1,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Pièce d\'identité',
    description: null,
    status: 'COMPLETED',
    priority: 'NORMAL',
    dueDate: null,
    reminderCount: 0,
    createdAt: '2026-01-20T10:00:00Z',
    responseDocument: { name: 'cni_dupont.pdf' },
  },
];

describe('DocumentRequests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders request titles', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Kbis de moins de 3 mois')).toBeInTheDocument();
      expect(screen.getByText("Pièce d'identité")).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      const pendingBadges = screen.getAllByText(/En attente/);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays priority levels', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText(/haute/i)).toBeInTheDocument();
      expect(screen.getByText(/normale/i)).toBeInTheDocument();
    });
  });

  it('shows reminder count', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('(1 relance)')).toBeInTheDocument();
    });
  });

  it('shows response document', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Document reçu: cni_dupont.pdf')).toBeInTheDocument();
    });
  });

  it('has Nouvelle demande button', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Nouvelle demande')).toBeInTheDocument();
    });
  });

  it('shows pending count in header', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('1 demande(s) en attente')).toBeInTheDocument();
    });
  });

  it('shows empty state when no requests', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucune demande de pièce')).toBeInTheDocument();
    });
  });

  it('shows description when available', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockRequests }),
      })
    );

    renderWithProviders(<DocumentRequests folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Merci de fournir un Kbis récent')).toBeInTheDocument();
    });
  });
});
