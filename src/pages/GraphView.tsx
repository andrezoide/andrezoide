import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from 'd3-force';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { CONCEPTS } from '@/data/concepts';
import { AREAS, AREA_BY_ID } from '@/data/areas';
import { RELATIONSHIPS } from '@/data/relationships';
import { routeFor } from '@/data';
import styles from './GraphView.module.css';

interface GNode extends SimulationNodeDatum {
  id: string;
  kind: 'concept' | 'area';
  title: string;
  color: string;
  radius: number;
}

interface GLink {
  source: string | GNode;
  target: string | GNode;
}

function resolveNode(ref: string | GNode, nodeById: Map<string, GNode>): GNode | undefined {
  if (typeof ref === 'string') return nodeById.get(ref);
  return ref;
}

export function GraphView() {
  const navigate = useNavigate();
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [nodes, setNodes] = useState<GNode[]>([]);
  const [links, setLinks] = useState<GLink[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  const { initialNodes, initialLinks } = useMemo(() => {
    const nodeMap = new Map<string, GNode>();
    for (const area of AREAS) {
      nodeMap.set(`area:${area.id}`, { id: area.id, kind: 'area', title: area.name, color: area.color, radius: 14 });
    }
    for (const concept of CONCEPTS) {
      const area = AREA_BY_ID.get(concept.areaIds[0]);
      nodeMap.set(`concept:${concept.id}`, {
        id: concept.id,
        kind: 'concept',
        title: concept.shortTitle ?? concept.title,
        color: area?.color ?? '#888',
        radius: 7,
      });
    }

    const seen = new Set<string>();
    const initialLinks: GLink[] = [];
    for (const rel of RELATIONSHIPS) {
      if (rel.source.kind !== 'concept' && rel.source.kind !== 'area') continue;
      if (rel.target.kind !== 'concept' && rel.target.kind !== 'area') continue;
      const s = `${rel.source.kind}:${rel.source.id}`;
      const t = `${rel.target.kind}:${rel.target.id}`;
      if (s === t || !nodeMap.has(s) || !nodeMap.has(t)) continue;
      const key = [s, t].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      initialLinks.push({ source: s, target: t });
    }

    return { initialNodes: Array.from(nodeMap.values()), initialLinks };
  }, []);

  useEffect(() => {
    const sim = forceSimulation<GNode>(initialNodes)
      .force('charge', forceManyBody().strength(-90))
      .force(
        'link',
        forceLink<GNode, GLink>(initialLinks)
          .id((d) => `${d.kind}:${d.id}`)
          .distance(48)
          .strength(0.35),
      )
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<GNode>().radius((d) => d.radius + 14))
      .on('tick', () => {
        setNodes([...sim.nodes()]);
      });

    setLinks(initialLinks);

    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialLinks]);

  useEffect(() => {
    if (!outerRef.current || !svgRef.current || !gRef.current) return;
    const el = outerRef.current;
    const z = d3zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        gRef.current?.setAttribute('transform', event.transform.toString());
      });
    select(el).call(z);
    const width = el.clientWidth;
    const height = el.clientHeight;
    select(el).call(z.transform, zoomIdentity.translate(width / 2, height / 2));
  }, []);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [`${n.kind}:${n.id}`, n])), [nodes]);

  function goTo(node: GNode) {
    navigate(routeFor(node.kind === 'area' ? 'area' : 'concept', node.id));
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mapa de ideias</h1>
        <p className={styles.subtitle}>
          Cada ponto é um conceito matemático; os pontos maiores são áreas inteiras. Arraste para navegar, role para
          dar zoom, e clique em qualquer nó para explorar.
        </p>
      </div>

      <div ref={outerRef} className={styles.canvas}>
        <svg ref={svgRef} className={styles.svg} width="100%" height="100%">
          <g ref={gRef}>
            {links.map((l, i) => {
              const s = resolveNode(l.source, nodeById);
              const t = resolveNode(l.target, nodeById);
              if (!s || typeof s.x !== 'number' || !t || typeof t.x !== 'number') return null;
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="var(--atlas-border)"
                  strokeWidth={1}
                  opacity={hovered && hovered !== s.id && hovered !== t.id ? 0.15 : 0.6}
                />
              );
            })}
            {nodes.map((n) => (
              <g
                key={`${n.kind}:${n.id}`}
                transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
                className={styles.node}
                onClick={() => goTo(n)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                opacity={hovered && hovered !== n.id ? 0.45 : 1}
              >
                <circle r={n.radius} fill={n.color} stroke="var(--atlas-bg)" strokeWidth={n.kind === 'area' ? 2.5 : 1.5} />
                <text x={n.radius + 6} y={4} className={n.kind === 'area' ? styles.areaLabel : styles.conceptLabel}>
                  {n.title}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
