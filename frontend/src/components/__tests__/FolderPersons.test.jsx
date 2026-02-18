import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import FolderPersons from '../folders/FolderPersons';

const mockPersons = [
  {
    id: '1',
    type: 'PHYSIQUE',
    role: 'PARTIE_ADVERSE',
    roleLabel: 'Partie adverse',
    firstName: 'Marc',
    lastName: 'Durand',
    email: 'marc.durand@email.fr',
    phone: '01 23 45 67 89',
    company: '',
  },
  {
    id: '2',
    type: 'MORALE',
    role: 'EXPERT',
    roleLabel: 'Expert',
    firstName: 'Sophie',
    lastName: 'Martin',
    company: 'Cabinet Martin',
    email: 'contact@cabinet-martin.fr',
    phone: '01 98 76 54 32',
  },
];

describe('FolderPersons', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders persons list', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Marc Durand')).toBeInTheDocument();
      expect(screen.getByText('Cabinet Martin')).toBeInTheDocument();
    });
  });

  it('displays person roles', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Partie adverse')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });
  });

  it('displays person types', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Physique')).toBeInTheDocument();
      expect(screen.getByText('Morale')).toBeInTheDocument();
    });
  });

  it('displays emails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('marc.durand@email.fr')).toBeInTheDocument();
      expect(screen.getByText('contact@cabinet-martin.fr')).toBeInTheDocument();
    });
  });

  it('has add button', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('+ Ajouter une personne')).toBeInTheDocument();
    });
  });

  it('has edit and delete actions', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getAllByText('Modifier')).toHaveLength(2);
      expect(screen.getAllByText('Supprimer')).toHaveLength(2);
    });
  });

  it('shows empty state when no persons', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Aucune personne liée')).toBeInTheDocument();
    });
  });

  it('renders header text', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Personnes liées')).toBeInTheDocument();
    });
  });

  it('shows contact for morale type person', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPersons }),
      })
    );

    renderWithProviders(<FolderPersons folderId="folder-1" />, { authValue: mockAuthenticatedUser });

    await waitFor(() => {
      expect(screen.getByText('Contact: Sophie Martin')).toBeInTheDocument();
    });
  });
});
