import { Link } from 'react-router-dom';
import type { NodeKind } from '@/types/content';
import { routeFor } from '@/data';
import styles from './EntityChips.module.css';

export interface ChipItem {
  id: string;
  title: string;
  kind: NodeKind;
  subtitle?: string;
}

export function EntityChips({ items }: { items: ChipItem[] }) {
  if (items.length === 0) {
    return <p className={styles.empty}>Nada registrado aqui ainda.</p>;
  }
  return (
    <div className={styles.wrap}>
      {items.map((item) => (
        <Link key={`${item.kind}-${item.id}`} to={routeFor(item.kind, item.id)} className={styles.chip}>
          {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  );
}
