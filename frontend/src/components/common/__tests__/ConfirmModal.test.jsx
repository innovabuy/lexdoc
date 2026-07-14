// GO-LIVE-6 M4 — modale de confirmation applicative (remplace confirm() natif).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal (M4)', () => {
  it('ne rend rien quand open=false', () => {
    const { container } = render(<ConfirmModal open={false} title="X" message="Y" onConfirm={() => {}} onCancel={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche titre + message et déclenche onConfirm', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open title="Supprimer le document" message="« Acte.docx » sera supprimé." confirmLabel="Supprimer" danger onConfirm={onConfirm} onCancel={() => {}} />);
    expect(screen.getByText('Supprimer le document')).toBeInTheDocument();
    expect(screen.getByText(/Acte\.docx/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Supprimer'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('déclenche onCancel sur Annuler', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal open title="X" message="Y" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
