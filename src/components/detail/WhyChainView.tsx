import { motion } from 'framer-motion';
import type { WhyChainStep } from '@/types/content';
import styles from './WhyChainView.module.css';

export function WhyChainView({ steps }: { steps: WhyChainStep[] }) {
  return (
    <div className={styles.chain}>
      {steps.map((step, i) => (
        <motion.div
          key={i}
          className={styles.step}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          {i > 0 && <div className={styles.arrow} aria-hidden="true">↓</div>}
          <div className={styles.row}>
            <span className={styles.label}>{step.label}</span>
            <p className={styles.text}>{step.text}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
