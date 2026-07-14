// GO-LIVE-6 B1 — le modal "Nouveau client" doit collecter Nom ET Prénom pour un
// particulier, et envoyer firstName + lastName (l'API exige les deux).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientQuickCreate from '../ClientQuickCreate';

vi.mock('../../../services/clientsApi', () => ({
  createClient: vi.fn(() => Promise.resolve({ id: 'c1', firstName: 'Jean', lastName: 'Dupont' })),
}));
import { createClient } from '../../../services/clientsApi';

describe('ClientQuickCreate (B1 — prénom particulier)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche Nom ET Prénom pour un particulier et envoie firstName + lastName', async () => {
    render(<ClientQuickCreate open onClose={() => {}} onCreated={() => {}} />);
    expect(screen.getByPlaceholderText('Dupont')).toBeInTheDocument();   // Nom
    expect(screen.getByPlaceholderText('Jean')).toBeInTheDocument();     // Prénom
    fireEvent.change(screen.getByPlaceholderText('Dupont'), { target: { value: 'Dupont' } });
    fireEvent.change(screen.getByPlaceholderText('Jean'), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByPlaceholderText('contact@example.fr'), { target: { value: 'j@d.fr' } });
    fireEvent.click(screen.getByText('Créer'));
    await waitFor(() => expect(createClient).toHaveBeenCalledTimes(1));
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INDIVIDUAL', firstName: 'Jean', lastName: 'Dupont' })
    );
  });

  it('ne soumet pas si le prénom manque', () => {
    render(<ClientQuickCreate open onClose={() => {}} onCreated={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Dupont'), { target: { value: 'Dupont' } });
    fireEvent.change(screen.getByPlaceholderText('contact@example.fr'), { target: { value: 'j@d.fr' } });
    fireEvent.click(screen.getByText('Créer'));
    expect(createClient).not.toHaveBeenCalled();
  });

  it('une personne morale ne demande pas de prénom', () => {
    render(<ClientQuickCreate open onClose={() => {}} onCreated={() => {}} />);
    fireEvent.click(screen.getByText('PM'));
    expect(screen.queryByPlaceholderText('Jean')).not.toBeInTheDocument();
  });
});
