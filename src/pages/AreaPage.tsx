import { useParams, Link } from 'react-router-dom';
import { AREA_BY_ID } from '@/data/areas';
import { CONCEPTS, CONCEPT_BY_ID } from '@/data/concepts';
import { DetailShell, Section, Prose } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { routeFor } from '@/data';
import { NotFound } from './NotFound';
import styles from './AreaPage.module.css';

export function AreaPage() {
  const { id } = useParams();
  const area = id ? AREA_BY_ID.get(id) : undefined;
  if (!area) return <NotFound />;

  const concepts = CONCEPTS.filter((c) => c.areaIds.includes(area.id));

  return (
    <DetailShell kicker="Área da matemática" title={area.name} meta={[`${concepts.length} conceitos`]}>
      <Section title="Sobre">
        <Prose>{area.description}</Prose>
      </Section>

      <Section title="Linha de evolução">
        <div className={styles.timeline}>
          {area.evolutionLine.map((step, i) => {
            const concept = CONCEPT_BY_ID.get(step.conceptId);
            return (
              <div key={step.conceptId} className={styles.step}>
                {i > 0 && <div className={styles.arrow}>↓</div>}
                <Link to={routeFor('concept', step.conceptId)} className={styles.conceptName} style={{ borderColor: area.color }}>
                  {concept?.title ?? step.conceptId}
                </Link>
                <p className={styles.note}>{step.note}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Todos os conceitos desta área">
        <EntityChips items={concepts.map((c) => ({ id: c.id, title: c.title, kind: 'concept' as const }))} />
      </Section>
    </DetailShell>
  );
}
