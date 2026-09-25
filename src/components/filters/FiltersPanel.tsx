import { AnimatePresence, motion } from 'framer-motion';
import { useAtlasStore } from '@/store/atlasStore';
import { ERAS } from '@/data/eras';
import { CIVILIZATIONS } from '@/data/civilizations';
import { AREAS } from '@/data/areas';
import { EDUCATION_LEVELS } from '@/types/content';
import styles from './FiltersPanel.module.css';

const LEVEL_LABEL: Record<string, string> = {
  curioso: 'Curioso',
  fundamental: 'Fundamental',
  medio: 'Médio',
  universidade: 'Universidade',
  avancado: 'Avançado',
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FiltersPanel() {
  const open = useAtlasStore((s) => s.filtersOpen);
  const setOpen = useAtlasStore((s) => s.setFiltersOpen);
  const filters = useAtlasStore((s) => s.filters);
  const setFilters = useAtlasStore((s) => s.setFilters);
  const clearFilters = useAtlasStore((s) => s.clearFilters);

  const activeCount =
    filters.eraIds.length + filters.civilizationIds.length + filters.areaIds.length + filters.levels.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className={styles.panel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="Filtros"
            aria-modal="true"
          >
            <header className={styles.header}>
              <h2>Filtros</h2>
              <button className={styles.close} onClick={() => setOpen(false)} aria-label="Fechar filtros">
                ✕
              </button>
            </header>

            <div className={styles.body}>
              <FilterGroup label="Era">
                {ERAS.map((era) => (
                  <Chip
                    key={era.id}
                    active={filters.eraIds.includes(era.id)}
                    onClick={() => setFilters({ eraIds: toggle(filters.eraIds, era.id) })}
                  >
                    {era.name}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Civilização / região">
                {CIVILIZATIONS.map((civ) => (
                  <Chip
                    key={civ.id}
                    active={filters.civilizationIds.includes(civ.id)}
                    onClick={() => setFilters({ civilizationIds: toggle(filters.civilizationIds, civ.id) })}
                  >
                    {civ.name}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Área da matemática">
                {AREAS.map((area) => (
                  <Chip
                    key={area.id}
                    active={filters.areaIds.includes(area.id)}
                    onClick={() => setFilters({ areaIds: toggle(filters.areaIds, area.id) })}
                  >
                    {area.name}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Nível">
                {EDUCATION_LEVELS.map((level) => (
                  <Chip
                    key={level}
                    active={filters.levels.includes(level)}
                    onClick={() => setFilters({ levels: toggle(filters.levels, level) })}
                  >
                    {LEVEL_LABEL[level]}
                  </Chip>
                ))}
              </FilterGroup>
            </div>

            <footer className={styles.footer}>
              <span className={styles.count}>{activeCount} filtro{activeCount === 1 ? '' : 's'} ativo{activeCount === 1 ? '' : 's'}</span>
              <button className={styles.clear} onClick={clearFilters} disabled={activeCount === 0}>
                Limpar tudo
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.group}>
      <h3 className={styles.groupLabel}>{label}</h3>
      <div className={styles.chips}>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={active ? styles.chipActive : styles.chip} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}
