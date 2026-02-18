import { useParams } from 'react-router-dom';

export default function ClientDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
        Fiche Client
      </h1>
      <p style={{ color: '#64748b' }}>
        Client ID : {id} — Page en construction (Phase 2)
      </p>
    </div>
  );
}
