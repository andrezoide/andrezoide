import { useParams } from 'react-router-dom';
import { CIVILIZATION_BY_ID } from '@/data/civilizations';
import { PEOPLE } from '@/data/people';
import { CONCEPTS } from '@/data/concepts';
import { PERIODS } from '@/data/periods';
import { DetailShell, Section, Prose } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { formatYear } from '@/engine/timeScale';
import { relationshipsFor } from '@/data/relationships';
import { NotFound } from './NotFound';

export function CivilizationPage() {
  const { id } = useParams();
  const civ = id ? CIVILIZATION_BY_ID.get(id) : undefined;
  if (!civ) return <NotFound />;

  const people = PEOPLE.filter((p) => p.civilizationId === civ.id);
  const concepts = CONCEPTS.filter((c) => c.civilizationIds.includes(civ.id));
  const periods = PERIODS.filter((p) => p.civilizationIds.includes(civ.id));
  const links = relationshipsFor({ kind: 'civilization', id: civ.id }).filter((r) => r.type === 'influenced' || r.type === 'contemporaryOf');

  return (
    <DetailShell
      kicker="Civilização"
      title={civ.name}
      meta={[civ.region, `${formatYear(civ.activeStart)} – ${formatYear(civ.activeEnd)}`]}
    >
      <Section title="Contexto">
        <Prose>{civ.description}</Prose>
      </Section>

      <Section title="Destaques">
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {civ.highlights.map((h, i) => (
            <li key={i}><Prose>{h}</Prose></li>
          ))}
        </ul>
      </Section>

      <Section title="Períodos">
        <EntityChips items={periods.map((p) => ({ id: p.id, title: p.name, kind: 'period' as const }))} />
      </Section>

      <Section title="Pessoas">
        <EntityChips items={people.map((p) => ({ id: p.id, title: p.name, kind: 'person' as const }))} />
      </Section>

      <Section title="Conceitos">
        <EntityChips items={concepts.map((c) => ({ id: c.id, title: c.title, kind: 'concept' as const }))} />
      </Section>

      {links.length > 0 && (
        <Section title="Circulação de conhecimento">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {links.map((l) => (
              <li key={l.id}><Prose>{l.note}</Prose></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Fontes">
        <SourceList sourceIds={civ.sources} />
      </Section>
    </DetailShell>
  );
}
