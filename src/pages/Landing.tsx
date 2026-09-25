import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ERAS } from '@/data/eras';
import { formatYear } from '@/engine/timeScale';
import { useAtlasStore } from '@/store/atlasStore';
import styles from './Landing.module.css';

const VERBS = ['contar', 'medir', 'comparar', 'agrupar', 'observar ciclos', 'registrar quantidades'];

export function Landing() {
  const navigate = useNavigate();
  const setFocusYear = useAtlasStore((s) => s.setFocusYear);

  function enterAt(year: number) {
    setFocusYear(year);
    navigate('/atlas', { state: { focusYear: year } });
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <motion.span
          className={styles.kicker}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Atlas da Matemática
        </motion.span>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Como começou a matemática?
        </motion.h1>

        <motion.p
          className={styles.question}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Uma viagem interativa pela evolução do pensamento matemático.
        </motion.p>

        <motion.div
          className={styles.verbs}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
        >
          {VERBS.map((v) => (
            <motion.span
              key={v}
              className={styles.verb}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              {v}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          className={styles.scrollHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <span>role para explorar a linha do tempo</span>
          <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      <section className={styles.funnel} aria-label="Grandes eras da história da matemática">
        <p className={styles.funnelIntro}>
          Antes de qualquer fórmula, existiram necessidades: contar rebanhos, prever cheias, dividir terras,
          navegar por estrelas. O Atlas organiza mais de vinte mil anos dessa história em grandes eras — cada
          uma delas, uma porta de entrada para explorar livremente.
        </p>

        {ERAS.map((era, i) => (
          <div key={era.id} className={styles.eraRow}>
            {i > 0 && <div className={styles.connector} aria-hidden="true" />}
            <motion.button
              type="button"
              className={styles.eraCard}
              onClick={() => enterAt((era.startYear + era.endYear) / 2)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
            >
              <span className={styles.eraYears}>
                {formatYear(era.startYear)} — {formatYear(era.endYear)}
              </span>
              <span className={styles.eraName}>{era.name}</span>
              <span className={styles.eraDesc}>{era.description}</span>
            </motion.button>
          </div>
        ))}

        <div className={styles.cta}>
          <Link to="/atlas" className={styles.ctaButton}>
            Entrar no Atlas
          </Link>
          <Link to="/grafo" className={styles.ctaAlt}>
            ou explorar o mapa de ideias
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        Um projeto em construção contínua — a matemática contemporânea é um capítulo em aberto, e este acervo também.
      </footer>
    </div>
  );
}
