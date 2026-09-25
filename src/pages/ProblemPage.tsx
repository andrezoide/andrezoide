import { useParams } from 'react-router-dom';
import { PROBLEM_BY_ID } from '@/data/problems';
import { CONCEPT_BY_ID } from '@/data/concepts';
import { PERIOD_BY_ID } from '@/data/periods';
import { CIVILIZATION_BY_ID } from '@/data/civilizations';
import { DetailShell, Section, Prose, StatusNote } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { MathematicalPaper } from '@/components/math/MathematicalPaper';
import { TryItYourself } from '@/components/math/TryItYourself';
import { NotFound } from './NotFound';

export function ProblemPage() {
  const { id } = useParams();
  const problem = id ? PROBLEM_BY_ID.get(id) : undefined;
  if (!problem) return <NotFound />;

  const period = PERIOD_BY_ID.get(problem.periodId);
  const civ = CIVILIZATION_BY_ID.get(problem.civilizationId);

  return (
    <DetailShell
      kicker="Problema histórico"
      title={problem.title}
      meta={[period?.name, civ?.name].filter(Boolean) as string[]}
    >
      {problem.status.status !== 'documented' && (
        <StatusNote>{problem.status.note}</StatusNote>
      )}

      <Section title="Contexto">
        <Prose>{problem.context}</Prose>
      </Section>

      <Section title="O problema">
        <Prose>{problem.problemText}</Prose>
      </Section>

      {problem.tryIt && (
        <Section title="Tente você mesmo">
          <TryItYourself data={problem.tryIt} />
        </Section>
      )}

      <Section title="Abordagem histórica">
        <Prose>{problem.historicalApproach}</Prose>
      </Section>

      <Section title="Solução em notação moderna">
        <MathematicalPaper steps={problem.modernSolutionLatexSteps.map((latex) => ({ latex }))} />
      </Section>

      <Section title="Conceitos envolvidos">
        <EntityChips
          items={problem.conceptIds
            .map((cid) => CONCEPT_BY_ID.get(cid))
            .filter(Boolean)
            .map((c) => ({ id: c!.id, title: c!.title, kind: 'concept' as const }))}
        />
      </Section>

      <Section title="Fontes">
        <SourceList sourceIds={problem.sources} />
      </Section>
    </DetailShell>
  );
}
