import { useState } from 'react';
import { motion } from 'framer-motion';
import { OPEN_PROBLEMS } from '@/data/openProblems';
import { CONCEPT_BY_ID } from '@/data/concepts';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { formatYear } from '@/engine/timeScale';
import styles from './OpenProblemsPage.module.css';

export function OpenProblemsPage() {
  const [openId, setOpenId] = useState<string | null>(OPEN_PROBLEMS[0]?.id ?? null);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.kicker}>Ainda não resolvido</span>
        <h1 className={styles.title}>Problemas em aberto</h1>
        <p className={styles.intro}>
          A matemática não é um assunto encerrado. Estes problemas são genuinamente desconhecidos — ninguém,
          em lugar nenhum, sabe hoje a resposta. Eles nunca são apresentados aqui como resolvidos.
        </p>

        <div className={styles.list}>
          {OPEN_PROBLEMS.map((p) => {
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className={styles.card}>
                <button type="button" className={styles.cardHead} onClick={() => setOpenId(isOpen ? null : p.id)}>
                  <div>
                    <h2 className={styles.cardTitle}>{p.title}</h2>
                    {p.originYear && <span className={styles.cardYear}>proposto em {formatYear(p.originYear)}</span>}
                  </div>
                  <span className={styles.chevron}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <motion.div
                    className={styles.cardBody}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={styles.statement}>
                      <p>{p.statement}</p>
                    </div>
                    <Block label="Contexto" text={p.context} />
                    <Block label="O que já sabemos" text={p.whatWeKnow} />
                    <Block label="Por que é difícil" text={p.whyHard} />
                    <div className={styles.currentState}>
                      <strong>Estado atual:</strong> {p.currentState}
                    </div>
                    <EntityChips items={p.conceptIds.map((id) => {
                      const c = CONCEPT_BY_ID.get(id);
                      return { id, title: c?.title ?? id, kind: 'concept' as const };
                    })} />
                    <SourceList sourceIds={p.sources} />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className={styles.block}>
      <span className={styles.blockLabel}>{label}</span>
      <p className={styles.blockText}>{text}</p>
    </div>
  );
}
