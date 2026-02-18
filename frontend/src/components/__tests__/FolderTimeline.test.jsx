import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import FolderTimeline from '../folders/FolderTimeline';

const mockActivities = [
  {
    id: '1',
    action: 'DOCUMENT_UPLOADED',
    createdAt: '2026-01-15T14:30:00Z',
    user: { name: 'Yves-Marie Bienaimé' },
    metadata: { title: 'Contrat SCI.pdf' },
    changes: null,
  },
  {
    id: '2',
    action: 'FOLDER_PERSON_CREATED',
    createdAt: '2026-01-15T10:00:00Z',
    user: { name: 'Yves-Marie Bienaimé' },
    metadata: { title: 'Marc Durand' },
    changes: null,
  },
  {
    id: '3',
    action: 'FOLDER_CREATED',
    createdAt: '2026-01-14T09:00:00Z',
    user: { name: 'Yves-Marie Bienaimé' },
    metadata: {},
    changes: null,
  },
];

describe('FolderTimeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });
    expect(screen.getByText("Chargement de l'historique...")).toBeInTheDocument();
  });

  it('renders activity labels', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Document téléversé')).toBeInTheDocument();
      expect(screen.getByText('Personne ajoutée')).toBeInTheDocument();
      expect(screen.getByText('Dossier créé')).toBeInTheDocument();
    });
  });

  it('displays user attribution', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      const userNames = screen.getAllByText('Yves-Marie Bienaimé');
      expect(userNames.length).toBeGreaterThan(0);
    });
  });

  it('displays header with activity count', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText("Historique d'activité")).toBeInTheDocument();
      expect(screen.getByText('3 actions enregistrées')).toBeInTheDocument();
    });
  });

  it('has refresh button', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Actualiser')).toBeInTheDocument();
    });
  });

  it('shows empty state when no activities', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: [],
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucune activité')).toBeInTheDocument();
    });
  });

  it('shows metadata details', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 1 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Titre : Contrat SCI.pdf')).toBeInTheDocument();
      expect(screen.getByText('Titre : Marc Durand')).toBeInTheDocument();
    });
  });

  it('shows load more button when hasMore', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockActivities,
            pagination: { page: 1, totalPages: 3 },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Charger plus')).toBeInTheDocument();
    });
  });

  it('shows error state', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Erreur serveur' },
          }),
      })
    );

    renderWithProviders(<FolderTimeline folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
    });
  });
});
