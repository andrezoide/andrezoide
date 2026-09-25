import { useParams } from 'react-router-dom';
import { PERSON_BY_ID } from '@/data/people';
import { CONCEPT_BY_ID } from '@/data/concepts';
import { CIVILIZATION_BY_ID } from '@/data/civilizations';
import { DetailShell, Section, Prose, StatusNote } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { formatYear } from '@/engine/timeScale';
import { NotFound } from './NotFound';

export function PersonPage() {
  const { id } = useParams();
  const person = id ? PERSON_BY_ID.get(id) : undefined;
  if (!person) return <NotFound />;

  const civ = person.civilizationId ? CIVILIZATION_BY_ID.get(person.civilizationId) : undefined;
  const dates = person.birthYear
    ? `${person.approxDates ? 'c. ' : ''}${formatYear(person.birthYear)}${person.deathYear ? ` – ${formatYear(person.deathYear)}` : ''}`
    : undefined;

  return (
    <DetailShell
      kicker="Pessoa"
      title={person.name}
      meta={[dates, civ?.name].filter(Boolean) as string[]}
    >
      {person.status && (
        <StatusNote>
          {person.status.note}
        </StatusNote>
      )}

      <Section title="Biografia">
        <Prose>{person.bio}</Prose>
      </Section>

      <Section title="Contribuições">
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {person.contributions.map((c, i) => (
            <li key={i}><Prose>{c}</Prose></li>
          ))}
        </ul>
      </Section>

      <Section title="Conceitos associados">
        <EntityChips
          items={person.conceptIds
            .map((cid) => CONCEPT_BY_ID.get(cid))
            .filter(Boolean)
            .map((c) => ({ id: c!.id, title: c!.title, kind: 'concept' as const }))}
        />
      </Section>

      <Section title="Fontes">
        <SourceList sourceIds={person.sources} />
      </Section>
    </DetailShell>
  );
}
