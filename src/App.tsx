import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Layout } from '@/components/layout/Layout';
import { Landing } from '@/pages/Landing';
import { PageLoader } from '@/components/layout/PageLoader';
import { useReducedMotionSync } from '@/hooks/useReducedMotionSync';

const AtlasExplorer = lazy(() => import('@/pages/AtlasExplorer').then((m) => ({ default: m.AtlasExplorer })));
const ConceptPage = lazy(() => import('@/pages/ConceptPage').then((m) => ({ default: m.ConceptPage })));
const PersonPage = lazy(() => import('@/pages/PersonPage').then((m) => ({ default: m.PersonPage })));
const FormulaPage = lazy(() => import('@/pages/FormulaPage').then((m) => ({ default: m.FormulaPage })));
const ProblemPage = lazy(() => import('@/pages/ProblemPage').then((m) => ({ default: m.ProblemPage })));
const CivilizationPage = lazy(() => import('@/pages/CivilizationPage').then((m) => ({ default: m.CivilizationPage })));
const PeriodPage = lazy(() => import('@/pages/PeriodPage').then((m) => ({ default: m.PeriodPage })));
const AreaPage = lazy(() => import('@/pages/AreaPage').then((m) => ({ default: m.AreaPage })));
const DocumentPage = lazy(() => import('@/pages/DocumentPage').then((m) => ({ default: m.DocumentPage })));
const GraphView = lazy(() => import('@/pages/GraphView').then((m) => ({ default: m.GraphView })));
const OpenProblemsPage = lazy(() => import('@/pages/OpenProblemsPage').then((m) => ({ default: m.OpenProblemsPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

export default function App() {
  useReducedMotionSync();
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <div className="atlas-backdrop" aria-hidden="true" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="/atlas" element={<AtlasExplorer />} />
              <Route path="/grafo" element={<GraphView />} />
              <Route path="/problemas-abertos" element={<OpenProblemsPage />} />
              <Route path="/conceito/:id" element={<ConceptPage />} />
              <Route path="/pessoa/:id" element={<PersonPage />} />
              <Route path="/formula/:id" element={<FormulaPage />} />
              <Route path="/problema/:id" element={<ProblemPage />} />
              <Route path="/civilizacao/:id" element={<CivilizationPage />} />
              <Route path="/periodo/:id" element={<PeriodPage />} />
              <Route path="/area/:id" element={<AreaPage />} />
              <Route path="/documento/:id" element={<DocumentPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ThemeProvider>
    </MotionConfig>
  );
}
