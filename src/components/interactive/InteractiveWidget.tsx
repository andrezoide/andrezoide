import type { InteractiveSpec } from '@/types/content';
import { FORMULA_BY_ID } from '@/data/formulas';
import { FormulaExplorer } from './FormulaExplorer';
import { FunctionGrapher } from './FunctionGrapher';
import { GeometryTriangle } from './GeometryTriangle';
import { UnitCircle } from './UnitCircle';

export function InteractiveWidget({ spec }: { spec?: InteractiveSpec }) {
  if (!spec || spec.kind === 'none') return null;

  if (spec.kind === 'formula-explorer') {
    const formula = FORMULA_BY_ID.get(spec.formulaId);
    if (!formula) return null;
    return <FormulaExplorer formula={formula} />;
  }
  if (spec.kind === 'function-grapher') return <FunctionGrapher initial={spec.initial} />;
  if (spec.kind === 'geometry-triangle') return <GeometryTriangle />;
  if (spec.kind === 'unit-circle') return <UnitCircle />;
  return null;
}
