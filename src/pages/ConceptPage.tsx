import { useParams } from 'react-router-dom';
import { CONCEPT_BY_ID } from '@/data/concepts';
import { PERSON_BY_ID } from '@/data/people';
import { FORMULA_BY_ID } from '@/data/formulas';
import { PROBLEM_BY_ID } from '@/data/problems';
import { AREA_BY_ID } from '@/data/areas';
import { PERIOD_BY_ID } from '@/data/periods';
import { DetailShell, Section, Prose, StatusNote } from '@/components/detail/DetailShell';
import { WhyChainView } from '@/components/detail/WhyChainView';
import { NotationEvolutionView } from '@/components/detail/NotationEvolutionView';
import { LayersView } from '@/components/detail/LayersView';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { MathematicalPaper } from '@/components/math/MathematicalPaper';
import { InteractiveWidget } from '@/components/interactive/InteractiveWidget';
import { NotFound } from './NotFound';

const LEVEL_LABEL: Record<string, string> = {
  curioso: 'Nível: curioso',
  fundamental: 'Nível: fundamental',
  medio: 'Nível: médio',
  universidade: 'Nível: universidade',
  avancado: 'Nível: avançado',
};

export function ConceptPage() {
  const { id } = useParams();
  const concept = id ? CONCEPT_BY_ID.get(id) : undefined;
  if (!concept) return <NotFound />;

  const areas = concept.areaIds.map((a) => AREA_BY_ID.get(a)).filter(Boolean);
  const periods = concept.periodIds.map((p) => PERIOD_BY_ID.get(p)).filter(Boolean);

  return (
    <DetailShell
      kicker="Conceito"
      title={concept.title}
      meta={[
        LEVEL_LABEL[concept.level],
        ...areas.map((a) => a!.name),
        ...periods.map((p) => p!.name),
      ]}
    >
      {concept.status && concept.status.status !== 'documented' && (
        <StatusNote>
          {statusLabel(concept.status.status)}
          {concept.status.note ? ` — ${concept.status.note}` : ''}
        </StatusNote>
      )}

      <Section title="Por que isso existe?">
        <WhyChainView steps={concept.whyChain} />
      </Section>

      <Section title="Explicação em camadas">
        <LayersView layers={concept.layers} />
      </Section>

      {concept.examples.length > 0 && (
        <Section title="Exemplo trabalhado">
          {concept.examples.map((ex) => (
            <MathematicalPaper
              key={ex.id}
              title={ex.title}
              steps={ex.latexSteps.map((latex, i) => ({ latex, narration: ex.narration?.[i] }))}
            />
          ))}
        </Section>
      )}

      {concept.interactive && concept.interactive.kind !== 'none' && (
        <Section title="Experimente">
          <InteractiveWidget spec={concept.interactive} />
        </Section>
      )}

      {concept.notationEvolution && (
        <Section title="Evolução da notação">
          <NotationEvolutionView stages={concept.notationEvolution} />
        </Section>
      )}

      {concept.applications.length > 0 && (
        <Section title="Onde é usado">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {concept.applications.map((app, i) => (
              <li key={i} className="prose-li"><Prose>{app}</Prose></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Pessoas envolvidas">
        <EntityChips
          items={concept.peopleIds
            .map((pid) => PERSON_BY_ID.get(pid))
            .filter(Boolean)
            .map((p) => ({ id: p!.id, title: p!.name, kind: 'person' as const }))}
        />
      </Section>

      {concept.formulaIds.length > 0 && (
        <Section title="Fórmulas relacionadas">
          <EntityChips
            items={concept.formulaIds
              .map((fid) => FORMULA_BY_ID.get(fid))
              .filter(Boolean)
              .map((f) => ({ id: f!.id, title: f!.title, kind: 'formula' as const }))}
          />
        </Section>
      )}

      {concept.problemIds.length > 0 && (
        <Section title="Problemas históricos">
          <EntityChips
            items={concept.problemIds
              .map((pid) => PROBLEM_BY_ID.get(pid))
              .filter(Boolean)
              .map((p) => ({ id: p!.id, title: p!.title, kind: 'problem' as const }))}
          />
        </Section>
      )}

      <Section title="Conceitos relacionados">
        <EntityChips
          items={concept.relatedConceptIds
            .map((cid) => CONCEPT_BY_ID.get(cid))
            .filter(Boolean)
            .map((c) => ({ id: c!.id, title: c!.title, kind: 'concept' as const }))}
        />
      </Section>

      <Section title="Fontes">
        <SourceList sourceIds={concept.sources} />
      </Section>
    </DetailShell>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    interpretation: 'Interpretação historiográfica',
    reconstruction: 'Reconstrução didática',
    simplification: 'Simplificação pedagógica',
    hypothesis: 'Hipótese',
    disputed: 'Origem disputada entre historiadores',
  };
  return map[status] ?? status;
}
