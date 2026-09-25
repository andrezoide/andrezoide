import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtlasStore } from '@/store/atlasStore';
import { search, type SearchEntry } from '@/data';
import { formatYear } from '@/engine/timeScale';
import styles from './GlobalSearch.module.css';

const KIND_LABEL: Record<string, string> = {
  concept: 'Conceito',
  person: 'Pessoa',
  formula: 'Fórmula',
  problem: 'Problema',
  civilization: 'Civilização',
  period: 'Período',
  area: 'Área',
  document: 'Documento',
};

export function GlobalSearch() {
  const open = useAtlasStore((s) => s.searchOpen);
  const setOpen = useAtlasStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => (query.trim() ? search(query, 12) : []), [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (!open && e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  function go(entry: SearchEntry) {
    navigate(entry.route);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      go(results[activeIndex]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Pesquisar no Atlas da Matemática"
          >
            <div className={styles.inputRow}>
              <SearchIcon />
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Pesquisar matemática — conceitos, pessoas, fórmulas, períodos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Campo de pesquisa"
                aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results-list"
              />
              <kbd className={styles.esc}>esc</kbd>
            </div>

            {results.length > 0 && (
              <ul className={styles.results} id="search-results-list" role="listbox">
                {results.map((r, i) => (
                  <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === activeIndex} id={`search-result-${i}`}>
                    <button
                      type="button"
                      className={i === activeIndex ? styles.resultActive : styles.result}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => go(r)}
                    >
                      <span className={styles.resultKind}>{KIND_LABEL[r.kind] ?? r.kind}</span>
                      <span className={styles.resultTitle}>{r.title}</span>
                      {r.year !== 0 && <span className={styles.resultYear}>{formatYear(r.year)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.trim() && results.length === 0 && (
              <p className={styles.empty}>Nenhum resultado para "{query}".</p>
            )}

            {!query.trim() && (
              <p className={styles.hint}>
                Experimente: <button className={styles.hintChip} onClick={() => setQuery('Euler')}>Euler</button>
                <button className={styles.hintChip} onClick={() => setQuery('derivada')}>derivada</button>
                <button className={styles.hintChip} onClick={() => setQuery('Mesopotâmia')}>Mesopotâmia</button>
                <button className={styles.hintChip} onClick={() => setQuery('criptografia')}>criptografia</button>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
