import { SOURCE_BY_ID } from '@/data/sources';
import styles from './SourceList.module.css';

export function SourceList({ sourceIds }: { sourceIds: string[] }) {
  const sources = sourceIds.map((id) => SOURCE_BY_ID.get(id)).filter(Boolean);
  if (sources.length === 0) return null;

  return (
    <ol className={styles.list}>
      {sources.map((s) => (
        <li key={s!.id} className={styles.item}>
          {s!.url ? (
            <a href={s!.url} target="_blank" rel="noreferrer" className={styles.link}>
              {s!.citation}
            </a>
          ) : (
            <span>{s!.citation}</span>
          )}
          {s!.note && <span className={styles.note}> — {s!.note}</span>}
        </li>
      ))}
    </ol>
  );
}
