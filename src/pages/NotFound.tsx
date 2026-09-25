import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Não encontramos essa página</h1>
      <p style={{ color: 'var(--atlas-ink-dim)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
        O conteúdo pode ter sido movido, ou ainda não existe neste acervo em construção.
      </p>
      <Link to="/atlas" style={{ color: 'var(--atlas-accent)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
        ← voltar ao Atlas
      </Link>
    </div>
  );
}
