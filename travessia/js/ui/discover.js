// Modo descoberta: quando o usuário para de navegar, um acontecimento
// visível ganha uma nota discreta ao lado — um fato documentado, um trecho
// da época ou uma conexão. Some ao primeiro movimento. Nunca bloqueia nada.

import { h, storage } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel } from '../core/time.js';

const IDLE_MS = 6500;
const GAP_MS = 22000;

export class Discover {
  constructor(app) {
    this.app = app;
    this.el = h('aside.dc', { hidden: true, 'aria-live': 'polite', 'aria-label': 'Sugestão de descoberta' });
    app.stage.append(this.el);
    this.last = 0;
    this.kind = 0;
    this.dismissals = storage.get('dcDismiss', 0);
    const poke = () => { this.hide(); clearTimeout(this.timer); this.timer = setTimeout(() => this.#maybe(), IDLE_MS); };
    app.on('interact', poke);
    app.on('view', () => { if (!this.el.hidden && !this.settling) this.hide(); clearTimeout(this.timer); this.timer = setTimeout(() => this.#maybe(), IDLE_MS); });
  }

  hide() { this.el.hidden = true; this.anchor = null; }

  async #maybe() {
    const app = this.app;
    if (this.dismissals >= 4) return; // o usuário disse que não quer
    if (Date.now() - this.last < GAP_MS) return;
    if (app.focus || app.mapMode?.on || !app.search.el.hidden || !app.filters.el.hidden || document.querySelector('.intro')) return;
    const tl = app.timeline;
    const W = tl.W - tl.inset.right;
    const cands = [...tl.pool.entries()].map(([id, el]) => ({ ev: store.byId.get(id), el }))
      .filter(({ ev, el }) => {
        const r = el.getBoundingClientRect(), s = app.stage.getBoundingClientRect();
        return ev && r.left - s.left > 40 && r.left - s.left < W - 320 && r.top - s.top > 60 && !el.classList.contains('is-dim');
      });
    if (!cands.length) return;
    const fresh = cands.filter((c) => !app.visited.has(c.ev.id));
    const pool = (fresh.length ? fresh : cands).sort((a, b) => b.ev.weight - a.ev.weight).slice(0, 5);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const note = await this.#note(pick.ev);
    if (!note || app.focus) return;
    this.#show(pick, note);
  }

  /** alterna entre tipos de descoberta, sempre a partir de dados cadastrados */
  async #note(ev) {
    const d = await store.detail(ev.id);
    const kinds = [];
    const fact = d.claims?.find((c) => c.status === 'fato');
    if (fact) kinds.push({ k: 'Você sabia?', text: fact.text, go: 'evento' });
    if (d.excerpts?.length) kinds.push({ k: 'Documento da época', text: `“${d.excerpts[0].text}”`, go: 'evento', section: '#l4' });
    const cause = store.edgesTo(ev.id).find((e) => e.type === 'causa');
    if (cause) kinds.push({ k: 'Veja o que aconteceu antes', text: `${store.byId.get(cause.from).title} (${yearLabel(store.byId.get(cause.from).s.y)}) ajuda a explicar ${ev.title}.`, go: 'evento', section: '#l3' });
    const far = store.edgesFrom(ev.id).find((e) => store.byId.get(e.to)?.t - ev.t > 40);
    if (far) kinds.push({ k: 'Descubra uma conexão', text: `${ev.title} ecoa em ${store.byId.get(far.to).title}, ${yearLabel(store.byId.get(far.to).s.y)}.`, go: 'evento', section: '#l6' });
    kinds.push({ k: 'O que estava acontecendo aqui?', text: `Veja o Brasil e o mundo em ${yearLabel(ev.s.y)}.`, go: 'ano' });
    const n = kinds[this.kind++ % kinds.length];
    return n.text.length > 190 ? { ...n, text: n.text.slice(0, 186) + '…”'.slice(n.text.startsWith('“') ? 0 : 1) } : n;
  }

  #show({ ev, el }, note) {
    const s = this.app.stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    this.last = Date.now();
    const go = () => { this.hide(); note.go === 'ano' ? this.app.open('ano', ev.s.y) : this.app.open('evento', ev.id, { section: note.section }); };
    this.el.replaceChildren(
      h('p.dc-k', note.k),
      h('p.dc-e', `${ev.label} · ${ev.title}`),
      h('p.dc-t', note.text),
      h('div.dc-a',
        h('button.dc-go', { type: 'button', onclick: go }, note.go === 'ano' ? `Explorar ${yearLabel(ev.s.y)} →` : `Explorar ${ev.title.length > 28 ? 'o acontecimento' : ev.title} →`),
        h('button.dc-x', { type: 'button', 'aria-label': 'Dispensar sugestão', onclick: () => { this.hide(); this.dismissals++; storage.set('dcDismiss', this.dismissals); } }, 'dispensar')));
    const compact = this.app.timeline.compact;
    Object.assign(this.el.style, compact ? { left: '12px', right: '12px', top: 'auto', bottom: '12px' } : { left: Math.round(r.left - s.left) + 'px', top: Math.round(r.bottom - s.top + 8) + 'px', right: 'auto', bottom: 'auto' });
    this.settling = true;
    this.el.hidden = false;
    setTimeout(() => (this.settling = false), 50);
    el.classList.add('is-peek');
    setTimeout(() => el.classList.remove('is-peek'), 2500);
  }
}
