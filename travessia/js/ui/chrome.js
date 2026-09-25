// Peças de interface ao redor da linha do tempo: painel, placa "você está
// em", pistas de descoberta, filtros, atlas e abertura.

import { h, clamp, storage } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel, SCALE_LEVELS, SCALE_TARGETS, yearToU, segmentAtYear } from '../core/time.js';
import { renderMap } from './map.js';

// ------------------------------------------------------------ painel

export class Panel {
  constructor(app) {
    this.app = app;
    this.body = h('div.pn-body', { tabindex: -1 });
    this.kind = h('span.pn-kind');
    this.trail = h('ol.pn-trail', { 'aria-label': 'Seu percurso' });
    this.handle = h('div.pn-handle', { 'aria-hidden': 'true' }, h('span'));
    this.el = h('aside.pn', { 'aria-label': 'Detalhes', hidden: true },
      this.handle,
      h('div.pn-bar',
        h('button.pn-btn', { type: 'button', title: 'Voltar', 'aria-label': 'Voltar', onclick: () => history.back() }, '←'),
        this.kind,
        h('button.pn-btn', { type: 'button', title: 'Fechar (Esc)', 'aria-label': 'Fechar', onclick: () => app.close() }, '×')),
      this.body,
      h('footer.pn-foot', h('span.pn-foot-h', 'Percurso'), this.trail));
    app.root.append(this.el);
    this.#sheetDrag();
  }

  show(view, key) {
    const from = this.app.portalFrom; this.app.portalFrom = null;
    const wasOpen = !this.el.hidden;
    this.el.hidden = false;
    this.kind.textContent = view.kind;
    this.body.replaceChildren(view.node);
    this.body.scrollTop = 0;
    this.el.classList.remove('is-peek');
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    this.#pushTrail(key, view);
    this.#lazy(view.node);
    // aberto pelo teclado: leva o foco ao conteúdo, sem rolar
    if (document.activeElement?.closest?.('.mk, .sr, .tl-edge, .pn')) this.body.focus({ preventScroll: true });
    const portal = from && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (portal) this.#portal(from, wasOpen);
    view.node.animate?.([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: portal ? 200 : 0, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)' });
  }

  hide() { this.el.classList.remove('is-open'); this.el.hidden = true; }

  /** imagens só são baixadas quando se aproximam da área visível do painel */
  #lazy(node) {
    this.io?.disconnect();
    const imgs = node.querySelectorAll('img[data-src]');
    if (!imgs.length) return;
    this.io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const img = en.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        this.io.unobserve(img);
      }
    }, { root: this.body, rootMargin: '400px 0px' });
    imgs.forEach((i) => this.io.observe(i));
  }

  /**
   * Entrar no acontecimento: um quadro parte do marcador e se expande até
   * o painel. Dá continuidade espacial — o conteúdo vem de dentro da linha.
   */
  #portal(from, wasOpen) {
    requestAnimationFrame(() => {
      const to = this.body.getBoundingClientRect();
      const g = h('div.portal', { 'aria-hidden': 'true' });
      document.body.append(g);
      const frame = (r) => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      const a = g.animate([{ ...frame(from), opacity: 1 }, { ...frame(to), opacity: 1 }], { duration: wasOpen ? 320 : 400, easing: 'cubic-bezier(.3,.7,.1,1)', fill: 'forwards' });
      a.onfinish = () => g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).onfinish = () => g.remove();
    });
  }

  #pushTrail(key, view) {
    const t = this.app.trail;
    if (t.at(-1)?.key !== key) t.push({ key, title: view.title, kind: view.kind });
    if (t.length > 12) t.shift();
    this.trail.replaceChildren(...t.map((s, i) => h('li', i === t.length - 1
      ? h('span.is-here', s.title)
      : h('a', { href: '#/' + s.key, title: s.kind }, s.title))));
    this.trail.scrollLeft = this.trail.scrollWidth;
  }

  scrollTo(sel) {
    const el = this.body.querySelector(sel);
    if (!el) return;
    const nav = this.body.querySelector('.lyr-nav');
    const off = nav && !nav.contains(el) ? nav.offsetHeight + 8 : 12;
    const top = el.getBoundingClientRect().top - this.body.getBoundingClientRect().top + this.body.scrollTop - off;
    this.body.scrollTo({ top, behavior: 'smooth' });
  }

  // folha inferior no celular: arrastar a alça expande ou recolhe
  #sheetDrag() {
    let y0 = null, h0 = 0;
    this.handle.addEventListener('pointerdown', (e) => {
      y0 = e.clientY; h0 = this.el.getBoundingClientRect().height;
      this.handle.setPointerCapture(e.pointerId); this.el.classList.add('is-dragging');
    });
    this.handle.addEventListener('pointermove', (e) => {
      if (y0 == null) return;
      this.el.style.height = clamp(h0 - (e.clientY - y0), 80, window.innerHeight * 0.94) + 'px';
    });
    this.handle.addEventListener('pointerup', (e) => {
      if (y0 == null) return;
      const dy = e.clientY - y0; y0 = null;
      this.el.classList.remove('is-dragging');
      this.el.style.height = '';
      if (Math.abs(dy) < 6) { this.el.classList.toggle('is-full'); return; }
      if (dy > 120 && !this.el.classList.contains('is-full')) this.app.close();
      else this.el.classList.toggle('is-full', dy < 0);
    });
  }
}

// ------------------------------------------------------------ placa de posição

export class EraPlate {
  constructor(app, root) {
    this.app = app;
    this.where = h('button.ep-where', { type: 'button', title: 'Abrir o período' });
    this.year = h('span.ep-year');
    this.range = h('span.ep-range');
    this.scale = h('div.ep-scale', { role: 'group', 'aria-label': 'Escala do tempo' },
      SCALE_LEVELS.filter((l) => l.id !== 'dias').map((l) => h('button.ep-lvl', { type: 'button', title: l.label, dataset: { lvl: l.id }, onclick: () => this.#goLevel(l.id) }, h('span.ep-long', l.label), h('span.ep-short', l.label.slice(0, 3) + '.'))));
    this.el = h('div.ep', h('span.ep-k', 'Você está em'), this.where, h('div.ep-row', this.year, this.range), this.scale);
    root.append(this.el);
    this.where.addEventListener('click', () => this.period && app.open('periodo', this.period.id));
  }

  #goLevel(id) {
    const tl = this.app.timeline;
    const f = segmentAtYear(tl.year).f;
    tl.flyTo(tl.cu - (tl.W / 2 - tl.viewCenterX) / tl.k, SCALE_TARGETS[id] / f, { duration: 700 });
  }

  update(v) {
    const p = store.periodAt(v.year);
    if (p !== this.period) {
      this.period = p;
      this.where.textContent = p.short;
      this.where.animate?.([{ opacity: 0.2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
    }
    const y = v.year;
    const w = (v.uR - v.uL);
    this.year.textContent = v.level.id === 'milenios' || v.level.id === 'seculos'
      ? (y < 0 ? `c. ${Math.round(-y / 100) * 100 >= 1000 ? (Math.round(-y / 1000)).toLocaleString('pt-BR') + ' mil' : Math.round(-y / 100) * 100} a.C.` : `c. ${Math.round(y / 10) * 10}`)
      : v.level.id === 'decadas' ? `${Math.floor(y / 10) * 10}s` : yearLabel(Math.floor(y));
    this.range.textContent = `escala: ${v.level.label.toLowerCase()}`;
    this.el.querySelectorAll('.ep-lvl').forEach((b) => b.classList.toggle('is-on', b.dataset.lvl === v.level.id || (v.level.id === 'dias' && b.dataset.lvl === 'meses')));
    this.lastW = w;
  }
}

// ------------------------------------------------------------ pistas

export class Clues {
  constructor(app, root) {
    this.app = app;
    this.el = h('div.cl', { 'aria-live': 'polite' });
    root.append(this.el);
  }

  update(v) {
    const key = Math.round(v.uL / 4) + ':' + Math.round(v.uR / 4) + ':' + this.app.visited.size;
    if (key === this.key) return;
    this.key = key;
    clearTimeout(this.t);
    this.t = setTimeout(() => this.#compute(v), 280);
  }

  #compute(v) {
    const inView = v.placed.map((p) => p.ev).filter((e) => e.u0 <= v.uR && e.u1 >= v.uL);
    const br = inView.filter((e) => e.region === 'brasil');
    const clues = [];
    const top = br.slice().sort((a, b) => b.weight - a.weight)[0];
    if (top) {
      const y = top.s.y;
      clues.push({ text: `O que acontecia no mundo em ${yearLabel(y)}?`, go: () => this.app.open('ano', y) });
    }
    const caused = br.map((e) => ({ e, n: store.edgesTo(e.id).filter((x) => x.type === 'causa').length })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n || b.e.weight - a.e.weight)[0];
    if (caused) clues.push({ text: `Veja o que levou a: ${caused.e.title}`, go: () => this.app.open('evento', caused.e.id, { section: '.chain' }) });
    const themeCount = new Map();
    br.forEach((e) => e.themes.forEach((t) => themeCount.set(t, (themeCount.get(t) || 0) + e.weight)));
    const theme = [...themeCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (theme) clues.push({ text: `Siga a linha: ${store.themeById.get(theme[0]).name}`, go: () => this.app.open('tema', theme[0]) });
    const ppl = new Map();
    br.forEach((e) => e.people.forEach((p) => ppl.set(p, (ppl.get(p) || 0) + e.weight)));
    const person = [...ppl.entries()].sort((a, b) => b[1] - a[1])[0];
    if (person) clues.push({ text: `Quem viveu isso: ${store.personById.get(person[0]).name}`, go: () => this.app.open('pessoa', person[0]) });
    const unseen = br.filter((e) => !this.app.visited.has(e.id) && e.weight >= 3).sort((a, b) => b.weight - a.weight)[1];
    if (unseen && clues.length < 4) clues.push({ text: `Ainda não visto: ${unseen.title}`, go: () => this.app.open('evento', unseen.id) });
    if (!clues.length) {
      const p = store.periodAt(v.year);
      clues.push({ text: `Explore o período: ${p.short}`, go: () => this.app.open('periodo', p.id) });
    }
    const pct = Math.round((this.app.visited.size / store.events.length) * 100);
    this.el.replaceChildren(h('span.cl-k', 'Pistas'),
      ...clues.slice(0, this.app.timeline.compact ? 2 : 4).map((c) => h('button.cl-item', { type: 'button', onclick: c.go }, c.text)),
      ...(this.app.visited.size ? [h('span.cl-count', { title: 'Acontecimentos que você já abriu' }, `${this.app.visited.size} de ${store.events.length} descobertos · ${pct}%`)] : []));
  }
}

// ------------------------------------------------------------ filtros

export class Filters {
  constructor(app) {
    this.app = app;
    const f = app.state.filters;
    const chip = (c) => h('button.fl-chip', { type: 'button', 'aria-pressed': 'false', dataset: { cat: c.id }, onclick: (e) => {
      if (f.cats.has(c.id)) f.cats.delete(c.id); else f.cats.add(c.id);
      this.sync(); app.refresh();
    } }, c.name);
    this.regions = h('div.fl-seg', ['all', 'brasil', 'mundo'].map((r) => h('button.fl-chip', { type: 'button', dataset: { region: r }, onclick: () => { f.region = r; this.sync(); app.refresh(); } }, { all: 'Tudo', brasil: 'Brasil', mundo: 'Mundo' }[r])));
    this.el = h('div.fl', { hidden: true, role: 'dialog', 'aria-label': 'Filtros' },
      h('div.fl-head', h('strong', 'Filtrar o território'), h('button.pn-btn', { type: 'button', 'aria-label': 'Fechar', onclick: () => this.toggle(false) }, '×')),
      h('p.fl-h', 'Como filtrar'),
      h('div.fl-seg', ['enfatizar', 'ocultar'].map((m) => h('button.fl-chip', { type: 'button', dataset: { mode: m }, onclick: () => { f.mode = m; this.sync(); app.refresh(); } }, { enfatizar: 'Enfatizar (manter o contexto)', ocultar: 'Ocultar os demais' }[m]))),
      h('p.fl-h', 'Onde'), this.regions,
      h('p.fl-h', 'Camadas temáticas ', h('button.fl-clear', { type: 'button', onclick: () => { f.cats.clear(); this.sync(); app.refresh(); } }, 'limpar')),
      h('div.fl-chips', store.categories.map(chip)),
      h('p.fl-h', 'Linhas temáticas'),
      h('div.fl-themes', store.themes.map((t) => h('button.fl-theme', { type: 'button', onclick: () => { this.toggle(false); app.open('tema', t.id); } }, '↝ ', t.name))),
      h('p.fl-note', 'Sem nenhum tema marcado, todos aparecem. Ao enfatizar, os demais acontecimentos continuam como pontos discretos — o contexto não some.'));
    app.root.append(this.el);
    this.sync();
  }
  toggle(on = this.el.hidden) { this.el.hidden = !on; this.app.btnFilters?.setAttribute('aria-expanded', String(on)); }
  sync() {
    const f = this.app.state.filters;
    this.el.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(f.cats.has(b.dataset.cat))));
    this.el.querySelectorAll('[data-region]').forEach((b) => b.setAttribute('aria-pressed', String(f.region === b.dataset.region)));
    this.el.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(f.mode === b.dataset.mode)));
    const n = f.cats.size + (f.region !== 'all' ? 1 : 0);
    this.app.btnFilters && (this.app.btnFilters.dataset.count = n || '');
  }
}

// ------------------------------------------------------------ atlas

/** mapa sincronizado com a janela de tempo visível */
export class Atlas {
  constructor(app) {
    this.app = app;
    this.box = h('div.at-map');
    this.caption = h('p.at-cap');
    this.el = h('div.at', { hidden: true, 'aria-label': 'Atlas do período visível' },
      h('div.at-head', h('strong', 'Atlas'), h('span.at-sub', 'lugares do trecho visível'), h('button.pn-btn', { type: 'button', 'aria-label': 'Fechar atlas', onclick: () => this.toggle(false) }, '×')),
      this.box, this.caption);
    app.root.append(this.el);
  }
  toggle(on = this.el.hidden) {
    this.el.hidden = !on;
    this.app.btnAtlas?.setAttribute('aria-pressed', String(on));
    storage.set('atlas', on);
    if (on) { this.key = null; this.update(this.last); }
  }
  update(v) {
    this.last = v;
    if (this.el.hidden || !v) return;
    const ids = v.placed.map((p) => p.ev).filter((e) => e.u0 <= v.uR && e.u1 >= v.uL);
    const focus = this.app.focus?.type === 'evento' ? store.byId.get(this.app.focus.id) : null;
    const key = ids.map((e) => e.id).join() + (focus?.id || '');
    if (key === this.key) return;
    this.key = key;
    clearTimeout(this.t);
    this.t = setTimeout(async () => {
      const agg = new Map();
      for (const e of ids) for (const pid of e.places) {
        const pl = store.placeById.get(pid);
        if (!pl || pl.world) continue;
        const a = agg.get(pid) || { id: pid, lat: pl.lat, lon: pl.lon, label: pl.name, weight: 0, evs: [] };
        a.weight += e.weight * 0.6; a.evs.push(e); agg.set(pid, a);
      }
      const active = focus ? new Set(focus.places) : null;
      const points = [...agg.values()].map((p) => ({ ...p, active: active ? active.has(p.id) : p.weight >= 3 }));
      let detail = null;
      if (focus?.hasMap) detail = (await store.detail(focus.id)).map;
      const svg = await renderMap({
        points, routes: detail?.routes, lines: detail?.lines,
        onPick: (p) => this.app.open('lugar', p.id),
        onHover: (p) => { this.app.timeline.highlight = p ? new Set(p.evs.map((e) => e.id)) : null; this.app.timeline.requestRender(); },
      });
      this.box.replaceChildren(svg);
      this.caption.textContent = points.length ? `${points.length} lugar${points.length > 1 ? 'es' : ''} · passe o cursor para ver na linha do tempo` : 'Nenhum lugar associado aos acontecimentos visíveis.';
    }, 160);
  }
}

// ------------------------------------------------------------ abertura

export function intro(app, onStart) {
  const el = h('div.intro', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'intro-t' },
    h('div.intro-in',
      h('p.intro-k', 'Travessia · um atlas navegável da história do Brasil'),
      h('h1#intro-t', 'Não mostramos a história.', h('br'), 'Você a atravessa.'),
      h('p.intro-lead', 'Esta travessia não começa em 1500. Começa milhares de anos antes, com os povos que habitavam este território — e segue, acontecimento por acontecimento, até hoje.'),
      h('ul.intro-how',
        h('li', h('b', 'Role ou arraste'), ' para avançar e voltar no tempo.'),
        h('li', h('b', 'Aproxime'), ' com pinça, Ctrl + roda, duplo clique ou a escala — de milênios a dias.'),
        h('li', h('b', 'Abra um acontecimento'), ' para ver causas, consequências, pessoas, lugares, fontes e o que acontecia ao mesmo tempo.'),
        h('li', h('b', 'Siga as conexões.'), ' Cada acontecimento leva a outros.')),
      h('div.intro-go',
        h('button.intro-btn', { type: 'button', onclick: () => close(true) }, 'Começar a travessia →'),
        h('button.intro-skip', { type: 'button', onclick: () => close(false) }, 'Explorar livremente'))));
  app.root.append(el);
  requestAnimationFrame(() => el.querySelector('.intro-btn').focus());
  const onKey = (e) => e.key === 'Escape' && close(false);
  document.addEventListener('keydown', onKey);
  const close = (guided) => {
    document.removeEventListener('keydown', onKey);
    if (!el.isConnected || el.classList.contains('is-out')) return;
    storage.set('introSeen', true);
    el.inert = true; // sai do caminho do teclado imediatamente
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 500);
    onStart(guided);
  };
}

export { yearToU };
