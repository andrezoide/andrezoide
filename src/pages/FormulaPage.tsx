import { useParams } from 'react-router-dom';
import { FORMULA_BY_ID } from '@/data/formulas';
import { CONCEPT_BY_ID } from '@/data/concepts';
import { DetailShell, Section, Prose } from '@/components/detail/DetailShell';
import { EntityChips } from '@/components/detail/EntityChips';
import { SourceList } from '@/components/detail/SourceList';
import { MathematicalPaper } from '@/components/math/MathematicalPaper';
import { FormulaExplorer } from '@/components/interactive/FormulaExplorer';
import { TeX } from '@/components/math/TeX';
import { NotFound } from './NotFound';

export function FormulaPage() {
  const { id } = useParams();
  const formula = id ? FORMULA_BY_ID.get(id) : undefined;
  if (!formula) return <NotFound />;

  const concept = CONCEPT_BY_ID.get(formula.conceptId);

  return (
    <DetailShell kicker="Fórmula" title={formula.title}>
      <div style={{ textAlign: 'center', padding: '18px 0 32px' }}>
        <TeX math={formula.latex} display />
      </div>

      <Section title="Que problema ela resolve?">
        <Prose>{formula.problemSolved}</Prose>
      </Section>

      <Section title="História">
        <Prose>{formula.history}</Prose>
      </Section>

      <Section title="Experimente">
        <FormulaExplorer formula={formula} />
      </Section>

      <Section title="Exemplo passo a passo">
        <MathematicalPaper steps={formula.example.latexSteps.map((latex) => ({ latex }))} />
      </Section>

      {concept && (
        <Section title="Conceito relacionado">
          <EntityChips items={[{ id: concept.id, title: concept.title, kind: 'concept' }]} />
        </Section>
      )}

      <Section title="Fontes">
        <SourceList sourceIds={formula.sources} />
      </Section>
    </DetailShell>
  );
}
