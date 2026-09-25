// Mapas em SVG: contorno atual da América do Sul como referência espacial,
// lugares como pontos, rotas e linhas históricas por cima.
// Fronteiras atuais são apenas referência — o mapa avisa isso.

import { s, h } from '../core/dom.js';
import { store } from '../core/store.js';

const K = Math.cos((15 * Math.PI) / 180);
const px = (lon) => lon * K;
const py = (lat) => -lat;
let geo = null;

export async function loadGeo() {
  if (!geo) geo = fetch(new URL('../../data/geo/south-america.json', import.meta.url)).then((r) => r.json());
  return geo;
}

const pathOf = (rings) => rings.map((r) => 'M' + r.map(([lon, lat]) => `${px(lon).toFixed(2)},${py(lat).toFixed(2)}`).join('L') + 'Z').join('');

/**
 * @param {object} o
 *   points: [{ id, lat, lon, label, weight, active }]
 *   routes / lines: [{ label, points: [[lat, lon]...], status }]
 *   bbox: [lonMin, latMin, lonMax, latMax]
 */
export async function renderMap(o = {}) {
  const g = await loadGeo();
  const [x0, y0, x1, y1] = o.bbox || [-76, -35, -32, 7];
  const vb = [px(x0), py(y1), px(x1) - px(x0), py(y0) - py(y1)];
  // escala de traços e textos em pixels de tela quando a largura é conhecida
  const unit = o.pxWidth ? (vb[2] / o.pxWidth) * 3 : vb[2] / 100;
  const svg = s('svg', { viewBox: vb.join(' '), class: 'map', role: 'img', 'aria-label': o.ariaLabel || 'Mapa' });
  // graticule
  const grid = s('g', { class: 'map-grid' });
  for (let lon = -80; lon <= -30; lon += 10) grid.append(s('line', { x1: px(lon), x2: px(lon), y1: py(15), y2: py(-60) }));
  for (let lat = -50; lat <= 10; lat += 10) grid.append(s('line', { x1: px(-85), x2: px(-25), y1: py(lat), y2: py(lat) }));
  grid.append(s('line', { class: 'map-equator', x1: px(-85), x2: px(-25), y1: 0, y2: 0 }));
  svg.append(grid);
  for (const c of g.countries) svg.append(s('path', { d: pathOf(c.rings), class: c.id === 'BR' ? 'map-br' : 'map-land' }));

  for (const l of o.lines || []) {
    const d = 'M' + l.points.map(([la, lo]) => `${px(lo)},${py(la)}`).join('L');
    svg.append(s('path', { d, class: 'map-line' + (l.status ? ' is-' + l.status : '') }, s('title', {}, l.label)));
  }
  for (const r of o.routes || []) {
    const d = 'M' + r.points.map(([la, lo]) => `${px(lo)},${py(la)}`).join('L');
    const path = s('path', { d, class: 'map-route' }, s('title', {}, r.label));
    svg.append(path);
  }
  const pts = s('g', { class: 'map-points' });
  for (const p of o.points || []) {
    const r = unit * (0.7 + Math.min(2.2, (p.weight || 1) * 0.35));
    const node = s('g', { class: 'map-pt' + (p.active ? ' is-active' : ''), transform: `translate(${px(p.lon)},${py(p.lat)})`, tabindex: o.onPick ? 0 : null, role: o.onPick ? 'button' : null },
      s('circle', { r: r * 1.9, class: 'map-halo' }),
      s('circle', { r }),
      s('title', {}, p.label));
    const labeled = o.labels === 'all' || (o.labels === 'top' ? p.active && (p.rank ?? 0) < (o.maxLabels ?? 8) : p.active);
    if (o.labels !== false && labeled) {
      node.append(s('text', { x: r * 1.6, y: unit * 0.9, 'font-size': unit * 3.1 }, p.label));
    }
    if (o.onPick) {
      node.addEventListener('click', () => o.onPick(p));
      node.addEventListener('keydown', (e) => e.key === 'Enter' && o.onPick(p));
      node.addEventListener('mouseenter', () => o.onHover?.(p));
      node.addEventListener('mouseleave', () => o.onHover?.(null));
    }
    pts.append(node);
  }
  svg.append(pts);
  return svg;
}

/** mapa pequeno para um evento, pessoa ou lugar */
export async function placesMap(placeIds, { routes, lines, onPick, highlight } = {}) {
  const places = placeIds.map((id) => store.placeById.get(id)).filter(Boolean);
  const local = places.filter((p) => !p.world);
  const far = places.filter((p) => p.world);
  if (!local.length && !routes?.length && !lines?.length) return far.length ? h('p.map-far', 'Fora do mapa: ', far.map((p) => p.name).join(', ')) : null;
  const svg = await renderMap({
    points: local.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, label: p.name, weight: 3, active: !highlight || highlight.has(p.id) })),
    routes, lines, onPick, labels: 'all', ariaLabel: `Mapa: ${local.map((p) => p.name).join(', ')}`,
  });
  return h('figure.map-fig', svg,
    h('figcaption', far.length ? `Também: ${far.map((p) => p.name).join(', ')}. ` : '', 'Contornos atuais, apenas como referência.'));
}
