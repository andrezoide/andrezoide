import { AtlasCanvas } from '@/components/atlas/AtlasCanvas';
import { useAtlasStore, type LensMode } from '@/store/atlasStore';
import styles from './AtlasExplorer.module.css';

const LENS_OPTIONS: { id: LensMode; label: string }[] = [
  { id: 'chronology', label: 'Cronologia' },
  { id: 'civilization', label: 'Civilizações' },
  { id: 'area', label: 'Áreas' },
];

export function AtlasExplorer() {
  const lens = useAtlasStore((s) => s.lens);
  const setLens = useAtlasStore((s) => s.setLens);

  return (
    <div className={styles.page}>
      <div className={styles.lensSwitch} role="radiogroup" aria-label="Modo de organização do Atlas">
        {LENS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={lens === opt.id}
            className={lens === opt.id ? styles.lensBtnActive : styles.lensBtn}
            onClick={() => setLens(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>arraste para navegar · role para dar zoom · clique em um nó para explorar</p>
      <AtlasCanvas />
    </div>
  );
}
