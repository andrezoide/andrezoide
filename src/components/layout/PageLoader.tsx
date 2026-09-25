export function PageLoader() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--atlas-ink-dim)',
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
      }}
      role="status"
      aria-live="polite"
    >
      carregando…
    </div>
  );
}
