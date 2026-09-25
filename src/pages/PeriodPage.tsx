import { useParams } from 'react-router-dom';
import { PERIOD_BY_ID } from '@/data/periods';
import { ERA_BY_ID } from '@/data/eras';
import { CIVILIZATION_BY_ID } from '@/data/civilizations';
import { CONCEPTS } from '@/data/concepts';
import { PEOPLE } from '@/data/people';
import { PROBLEMS } from '@/data/problems';
import { DOCUMENTS } from '@/data/documents';
import { DetailShell, Section, Prose } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { formatYear } from '@/engine/timeScale';
import { NotFound } from './NotFound';

export function PeriodPage() {
  const { id } = useParams();
  const period = id ? PERIOD_BY_ID.get(id) : undefined;
  if (!period) return <NotFound />;

  const era = ERA_BY_ID.get(period.eraId);
  const civs = period.civilizationIds.map((c) => CIVILIZATION_BY_ID.get(c)).filter(Boolean);
  const concepts = CONCEPTS.filter((c) => c.periodIds.includes(period.id));
  const people = PEOPLE.filter((p) => p.periodIds.includes(period.id));
  const problems = PROBLEMS.filter((p) => p.periodId === period.id);
  const documents = DOCUMENTS.filter((d) => d.periodId === period.id);

  return (
    <DetailShell
      kicker={`Período · ${era?.name ?? ''}`}
      title={period.name}
      meta={[`${formatYear(period.startYear)} – ${formatYear(period.endYear)}`, ...civs.map((c) => c!.name)]}
    >
      <Section title="Visão geral">
        <Prose>{period.summary}</Prose>
      </Section>

      <Section title="Conceitos deste período">
        <EntityChips items={concepts.map((c) => ({ id: c.id, title: c.title, kind: 'concept' as const }))} />
      </Section>

      <Section title="Pessoas">
        <EntityChips items={people.map((p) => ({ id: p.id, title: p.name, kind: 'person' as const }))} />
      </Section>

      {problems.length > 0 && (
        <Section title="Problemas históricos">
          <EntityChips items={problems.map((p) => ({ id: p.id, title: p.title, kind: 'problem' as const }))} />
        </Section>
      )}

      {documents.length > 0 && (
        <Section title="Documentos">
          <EntityChips items={documents.map((d) => ({ id: d.id, title: d.title, kind: 'document' as const }))} />
        </Section>
      )}
    </DetailShell>
  );
}
