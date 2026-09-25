import { Link, NavLink } from 'react-router-dom';
import { useAtlasStore } from '@/store/atlasStore';
import styles from './TopBar.module.css';

export function TopBar() {
  const setSearchOpen = useAtlasStore((s) => s.setSearchOpen);
  const setFiltersOpen = useAtlasStore((s) => s.setFiltersOpen);

  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.brand} aria-label="Página inicial do Atlas da Matemática">
        <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1.25" />
          <path d="M32 18a14 14 0 0 1 12.12 21" stroke="var(--atlas-accent)" strokeWidth="1.5" />
        </svg>
        <span className={styles.brandText}>Atlas da Matemática</span>
      </Link>

      <nav className={styles.nav} aria-label="Navegação principal">
        <NavLink to="/atlas" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
          Atlas
        </NavLink>
        <NavLink to="/grafo" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
          Mapa de ideias
        </NavLink>
        <NavLink to="/problemas-abertos" className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}>
          Em aberto
        </NavLink>
      </nav>

      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} onClick={() => setFiltersOpen(true)} aria-label="Abrir filtros">
          <FilterIcon />
          <span className={styles.actionLabel}>Filtros</span>
        </button>
        <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)}>
          <SearchIcon />
          <span className={styles.actionLabel}>Pesquisar</span>
          <kbd className={styles.kbd}>/</kbd>
        </button>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
