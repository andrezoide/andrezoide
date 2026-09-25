import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { ATLAS_NODES, routeFor } from '@/data';
import { ERAS } from '@/data/eras';
import { yearToX, xToYear, WORLD_WIDTH, formatYear } from '@/engine/timeScale';
import { laneY, laneCountFor, laneLabelsFor, visibleInLens } from '@/engine/layout';
import { PERIOD_BY_ID } from '@/data/periods';
import { lodForScale, LOD } from '@/types/atlas';
import { useAtlasStore } from '@/store/atlasStore';
import { NodeCard } from './NodeCard';
import { EraRibbon } from './EraRibbon';
import { CivilizationBands } from './CivilizationBands';
import { LaneLabels } from './LaneLabels';
import { Minimap } from './Minimap';
import styles from './AtlasCanvas.module.css';

const MIN_K = 0.045;
const MAX_K = 40;
const X_MARGIN = 400;
const ERA_IDS = new Set(ERAS.map((e) => e.id));

export function AtlasCanvas() {
  const outerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLDivElement, unknown>>();
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const lastKRef = useRef(1);
  const effectiveYRef = useRef(150);

  const location = useLocation();
  const navigate = useNavigate();
  const lens = useAtlasStore((s) => s.lens);
  const filters = useAtlasStore((s) => s.filters);
  const setFocusYear = useAtlasStore((s) => s.setFocusYear);
  const markVisited = useAtlasStore((s) => s.markVisited);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);

  const [viewport, setViewport] = useState({ x: 0, y: 150, k: 0.08, width: 1200, height: 800 });
  const laneCount = laneCountFor(lens);
  const worldHeight = laneY(laneCount) + 80;

  /**
   * d3-zoom assume escala uniforme (x e y). Como só escalamos X (scaleX),
   * um gesto de zoom (roda do mouse, pinça, duplo clique) faria o cálculo
   * interno de "ty" do d3 divergir a cada gesto sucessivo. Por isso
   * recalculamos Y nós mesmos: gestos de zoom "congelam" Y (mantêm as raias
   * exatamente onde estão, só o tempo se move sob o cursor); arrastar
   * (pan puro, k inalterado) e transformações programáticas nossas
   * (botões, minimapa, estado inicial) continuam livres para mover Y.
   */
  const applyTransform = useCallback((t: ZoomTransform, sourceEvent: unknown) => {
    transformRef.current = t;
    const kChanged = Math.abs(t.k - lastKRef.current) > 1e-9;
    if (sourceEvent == null || !kChanged) {
      effectiveYRef.current = t.y;
    }
    lastKRef.current = t.k;
    const effectiveY = effectiveYRef.current;

    if (worldRef.current) {
      // Só o eixo do tempo (X) é ampliado pelo zoom — as raias (Y) mantêm
      // altura constante em pixels, para que o zoom revele mais conhecimento
      // em vez de simplesmente esticar a altura das raias.
      worldRef.current.style.transform = `translate(${t.x}px, ${effectiveY}px) scaleX(${t.k})`;
    }
    const width = outerRef.current?.clientWidth ?? 1200;
    const height = outerRef.current?.clientHeight ?? 800;
    setViewport({ x: t.x, y: effectiveY, k: t.k, width, height });
    const centerWorldX = (-t.x + width / 2) / t.k;
    setFocusYear(xToYear(centerWorldX));
  }, [setFocusYear]);

  useEffect(() => {
    if (!outerRef.current) return;
    const el = outerRef.current;
    const width = el.clientWidth;
    const height = el.clientHeight;

    const z = d3zoom<HTMLDivElement, unknown>()
      .scaleExtent([MIN_K, MAX_K])
      .translateExtent([[-200, -4000], [WORLD_WIDTH + 200, worldHeight + 4000]])
      .filter((event) => !event.ctrlKey || event.type === 'wheel')
      .on('zoom', (event) => applyTransform(event.transform, event.sourceEvent));

    zoomRef.current = z;
    select(el).call(z);
    el.style.touchAction = 'none';

    // Estado inicial: se veio de um ano focado (clique na Landing), aproxima ali;
    // caso contrário, mostra o Atlas inteiro (visão macro, como um mapa-múndi).
    const stateYear = (location.state as { focusYear?: number } | null)?.focusYear;
    let initial: ZoomTransform;
    if (typeof stateYear === 'number') {
      const k = 0.4;
      const cx = yearToX(stateYear);
      initial = zoomIdentity.translate(width / 2 - cx * k, height / 2 - laneY(2)).scale(k);
    } else {
      const k = Math.max(MIN_K, Math.min(0.11, width / WORLD_WIDTH));
      initial = zoomIdentity.translate(width / 2 - (WORLD_WIDTH / 2) * k, 150).scale(k);
    }
    select(el).call(z.transform, initial);

    function onResize() {
      const t = transformRef.current;
      applyTransform(zoomIdentity.translate(t.x, effectiveYRef.current).scale(t.k), null);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLod = lodForScale(viewport.k);

  const visibleNodes = useMemo(() => {
    const x0 = (-viewport.x - X_MARGIN) / viewport.k;
    const x1 = (-viewport.x + viewport.width + X_MARGIN) / viewport.k;

    return ATLAS_NODES.filter((n) => {
      if (n.kind === 'period' && ERA_IDS.has(n.id)) return false; // eras vivem só na EraRibbon
      if (n.level > currentLod) return false;
      if (!visibleInLens(n, lens)) return false;
      const nx = yearToX(n.year);
      if (nx < x0 || nx > x1) return false;
      if (filters.eraIds.length) {
        const eraId = n.periodId ? PERIOD_BY_ID.get(n.periodId)?.eraId : undefined;
        if (!eraId || !filters.eraIds.includes(eraId)) return false;
      }
      if (filters.civilizationIds.length && n.civilizationId && !filters.civilizationIds.includes(n.civilizationId)) {
        return false;
      }
      if (filters.areaIds.length && n.areaIds.length && !n.areaIds.some((a) => filters.areaIds.includes(a))) {
        return false;
      }
      if (filters.levels.length && n.educationLevel && !filters.levels.includes(n.educationLevel)) {
        return false;
      }
      return true;
    });
  }, [viewport, currentLod, lens, filters]);

  function goTo(kind: string, id: string) {
    markVisited(id);
    navigate(routeFor(kind as never, id));
  }

  function zoomBy(factor: number) {
    if (!outerRef.current || !zoomRef.current) return;
    const width = outerRef.current.clientWidth;
    const t = transformRef.current;
    const newK = Math.max(MIN_K, Math.min(MAX_K, t.k * factor));
    // Ancora no centro da tela (em X); Y é construído explicitamente para
    // não depender do cálculo interno do d3 (que assumiria escala em Y também).
    const worldCenterX = (width / 2 - t.x) / t.k;
    const newX = width / 2 - worldCenterX * newK;
    const target = zoomIdentity.translate(newX, effectiveYRef.current).scale(newK);
    select(outerRef.current).transition().duration(reducedMotion ? 0 : 280).call(zoomRef.current.transform, target);
  }

  function resetView() {
    if (!outerRef.current || !zoomRef.current) return;
    const width = outerRef.current.clientWidth;
    const k = Math.max(MIN_K, Math.min(0.11, width / WORLD_WIDTH));
    const t = zoomIdentity.translate(width / 2 - (WORLD_WIDTH / 2) * k, 150).scale(k);
    select(outerRef.current).transition().duration(reducedMotion ? 0 : 400).call(zoomRef.current.transform, t);
  }

  function panTo(worldX: number, k = 0.4) {
    if (!outerRef.current || !zoomRef.current) return;
    const width = outerRef.current.clientWidth;
    const height = outerRef.current.clientHeight;
    const t = zoomIdentity.translate(width / 2 - worldX * k, height / 2 - laneY(2)).scale(k);
    select(outerRef.current).transition().duration(reducedMotion ? 0 : 450).call(zoomRef.current.transform, t);
  }

  const laneLabels = laneLabelsFor(lens);

  return (
    <div className={styles.wrap}>
      <div ref={outerRef} className={styles.viewport}>
        <div ref={worldRef} className={styles.world} style={{ width: WORLD_WIDTH, height: worldHeight }}>
          <EraRibbon k={viewport.k} />
          {currentLod > LOD.MACRO && <LaneBackgrounds count={laneCount} />}
          {currentLod > LOD.MACRO && lens === 'civilization' && <CivilizationBands k={viewport.k} />}
          {visibleNodes.map((n) => (
            <NodeCard
              key={`${n.kind}-${n.id}`}
              node={n}
              lod={currentLod}
              lens={lens}
              k={viewport.k}
              onOpen={() => goTo(n.kind, n.id)}
            />
          ))}
        </div>
      </div>

      {currentLod > LOD.MACRO && <LaneLabels labels={laneLabels} viewport={viewport} />}

      <div className={styles.zoomControls} role="group" aria-label="Controles de zoom">
        <button type="button" onClick={() => zoomBy(1.6)} aria-label="Aproximar (zoom in)">+</button>
        <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label="Afastar (zoom out)">−</button>
        <button type="button" onClick={resetView} aria-label="Ver o Atlas inteiro" className={styles.resetBtn}>
          ⤢
        </button>
      </div>

      <div className={styles.lodBadge}>{lodLabel(currentLod)}</div>

      <Minimap viewport={viewport} onJump={panTo} />
    </div>
  );
}

function LaneBackgrounds({ count }: { count: number }) {
  return (
    <div className={styles.laneBackgrounds} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={i % 2 === 0 ? styles.laneBgEven : styles.laneBgOdd}
          style={{ top: laneY(i) - 10, height: 58 }}
        />
      ))}
    </div>
  );
}

function lodLabel(lod: number): string {
  switch (lod) {
    case LOD.MACRO: return 'Visão macro · grandes eras';
    case LOD.PERIOD: return 'Períodos e civilizações';
    case LOD.AREA: return 'Áreas da matemática';
    case LOD.CONCEPT: return 'Conceitos e pessoas';
    case LOD.DETAIL: return 'Fórmulas e problemas';
    default: return 'Exploração profunda';
  }
}

export { yearToX, formatYear, ERAS };
