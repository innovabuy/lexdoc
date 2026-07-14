// GO-LIVE-6 M2 — la génération ne doit plus être un no-op muet : si un champ requis
// manque, on liste les champs manquants (message) et on les surligne ; sinon on soumet.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MissingFieldsModal from '../MissingFieldsModal';

const fields = [
  { key: 'dossier.montant_article_700', label: 'Montant article 700', required: true, currentValue: '' },
  { key: 'dossier.tribunal_ville', label: 'Ville du tribunal', required: true, currentValue: 'Angers' },
  { key: 'dossier.heure_audience', label: 'Heure', required: false, currentValue: '' },
];

describe('MissingFieldsModal (M2 — feedback au lieu de no-op)', () => {
  it('affiche un message listant les champs manquants au clic, sans soumettre', () => {
    const onSubmit = vi.fn();
    render(<MissingFieldsModal fields={fields} templateName="Assignation" onSubmit={onSubmit} onClose={() => {}} loading={false} />);
    fireEvent.click(screen.getByText('Completer et generer'));
    expect(onSubmit).not.toHaveBeenCalled();
    // le message-résumé liste le champ manquant (et pas le champ déjà rempli)
    expect(screen.getByText(/manquant\(s\).*Montant article 700/i)).toBeInTheDocument();
    expect(screen.queryByText(/manquant\(s\).*Ville du tribunal/i)).not.toBeInTheDocument();
  });

  it('soumet quand tous les champs requis sont remplis', () => {
    const onSubmit = vi.fn();
    render(<MissingFieldsModal fields={fields} templateName="Assignation" onSubmit={onSubmit} onClose={() => {}} loading={false} />);
    fireEvent.change(screen.getByPlaceholderText('Montant article 700'), { target: { value: '2500' } });
    fireEvent.click(screen.getByText('Completer et generer'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ 'dossier.montant_article_700': '2500' }));
  });

  it('le bouton n\'est plus désactivé par la validation (cliquable pour obtenir le feedback)', () => {
    render(<MissingFieldsModal fields={fields} templateName="X" onSubmit={() => {}} onClose={() => {}} loading={false} />);
    expect(screen.getByText('Completer et generer')).not.toBeDisabled();
  });
});
