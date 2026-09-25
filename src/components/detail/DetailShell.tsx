import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './DetailShell.module.css';

interface Props {
  kicker: string;
  title: string;
  meta?: React.ReactNode[];
  children: React.ReactNode;
}

export function DetailShell({ kicker, title, meta, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.backRow}>
          <button type="button" className={styles.backLink} onClick={() => navigate(-1)}>
            ← voltar
          </button>
        </div>

        <span className={styles.kicker}>{kicker}</span>
        <h1 className={styles.title}>{title}</h1>

        {meta && meta.length > 0 && (
          <div className={styles.metaRow}>
            {meta.map((m, i) => (
              <span key={i} className={styles.metaChip}>{m}</span>
            ))}
          </div>
        )}

        {children}
      </motion.div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <p className={styles.prose}>{children}</p>;
}

export function StatusNote({ children }: { children: React.ReactNode }) {
  return <p className={styles.statusNote}>{children}</p>;
}

export { Link };
