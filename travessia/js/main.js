// Ponto de entrada: carrega os dados, monta a interface e conecta as rotas.
//
// Rotas (hash):  #/evento/<id>  #/pessoa/<id>  #/lugar/<id>  #/tema/<id>
//                #/periodo/<id> #/ano/<ano>

import { store } from './core/store.js';
import { h, $, Emitter, storage } from './core/dom.js';
import { yearToU, U_MAX } from './core/time.js';
import { Timeline } from './timeline/timeline.js';
import { Overview } from './timeline/overview.js';
import { VIEWS } from './views/views.js';
import { Search } from './ui/search.js';
import { Panel, EraPlate, Clues, Filters, Atlas, intro } from './ui/chrome.js';

class App extends Emitter {
  state = { study: storage.get('study', false), filters: { cats: new Set(), region: 'all' } };
  visited = new Set(storage.get('visited', []));
  trail = [];
  focus = null;

  async start() {
    this.root = $('#app');
    this.stage = $('#stage');
    try {
      await store.load();
    } catch (err) {
      $('#loading').replaceChildren(h('p', 'Não foi possível carregar os dados.'), h('p.small', String(err.message)), h('p.small', 'Sirva a pasta por HTTP (ex.: npx http-server travessia).'));
      throw err;
    }
    this.timeline = new Timeline(this.stage, this);
    this.overview = new Overview($('#overview'), this.timeline);
    this.plate = new EraPlate(this, $('#plate'));
    this.clues = new Clues(this, $('#clues'));
    this.panel = new Panel(this);
    this.search = new Search(this);
    this.filters = new Filters(this);
    this.atlas = new Atlas(this);
    this.#wireHeader();
    new ResizeObserver(() => this.#syncSheet()).observe(this.panel.el);
    this.on('view', (v) => { this.overview.update(); this.plate.update(v); this.clues.update(v); this.atlas.update(v); });
    this.#keys();
    window.addEventListener('hashchange', () => this.route());
    document.body.classList.toggle('is-study', this.state.study);
    $('#loading').remove();
    this.overview.draw();

    // começa vendo o todo: do tempo profundo até hoje
    this.timeline.setView(U_MAX / 2, this.timeline.kMin);
    if (location.hash.length > 2) this.route();
    else if (!storage.get('introSeen', false)) intro(this, (guided) => guided && this.#guidedStart());
    else this.#guidedStart(true);
    if (storage.get('atlas', false) && !this.timeline.compact) this.atlas.toggle(true);
  }

  #guidedStart(quiet) {
    // aproxima dos séculos anteriores a 1500 — a travessia não começa com Cabral
    setTimeout(() => this.timeline.frameYears(-600, 1560, 0.04), quiet ? 50 : 350);
  }

  #wireHeader() {
    $('#btn-search').addEventListener('click', () => this.search.open());
    this.btnFilters = $('#btn-filters');
    this.btnFilters.addEventListener('click', () => this.filters.toggle());
    this.btnAtlas = $('#btn-atlas');
    this.btnAtlas.addEventListener('click', () => this.atlas.toggle());
    const study = $('#btn-study');
    study.setAttribute('aria-pressed', String(this.state.study));
    study.addEventListener('click', () => {
      this.state.study = !this.state.study;
      storage.set('study', this.state.study);
      study.setAttribute('aria-pressed', String(this.state.study));
      document.body.classList.toggle('is-study', this.state.study);
      this.timeline.requestRender();
      if (this.focus) this.#render(this.focus.type, this.focus.id, { keepCamera: true });
    });
    $('#brand').addEventListener('click', (e) => { e.preventDefault(); this.close(); this.timeline.flyTo(U_MAX / 2, this.timeline.kMin); });
  }

  #keys() {
    window.addEventListener('keydown', (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); this.search.open(); return; }
      if (typing || !this.search.el.hidden) return;
      const tl = this.timeline;
      const step = (tl.W / tl.k) * 0.18;
      if (e.key === 'Escape') { if (!this.filters.el.hidden) this.filters.toggle(false); else this.close(); }
      else if (e.key === 'ArrowRight' && !e.target.closest?.('.pn')) tl.flyTo(tl.cu + step - (tl.W / 2 - tl.viewCenterX) / tl.k, tl.k, { duration: 260 });
      else if (e.key === 'ArrowLeft' && !e.target.closest?.('.pn')) tl.flyTo(tl.cu - step - (tl.W / 2 - tl.viewCenterX) / tl.k, tl.k, { duration: 260 });
      else if (e.key === '+' || e.key === '=') tl.zoomAtAnimated(tl.viewCenterX, 2.2);
      else if (e.key === '-' || e.key === '_') tl.zoomAtAnimated(tl.viewCenterX, 1 / 2.2);
      else if (e.key === 'Home') tl.flyTo(0, tl.k);
      else if (e.key === 'End') tl.flyTo(yearToU(new Date().getFullYear()), tl.k);
    });
  }

  /** navegação: toda abertura passa pela URL, então voltar/avançar funciona */
  open(type, id, opts = {}) {
    this.pending = opts;
    const hash = `#/${type}/${id}`;
    if (location.hash === hash) this.route(); else location.hash = hash;
  }

  close() {
    if (location.hash) history.pushState(null, '', location.pathname + location.search);
    this.#clear();
  }

  /** no celular, a linha do tempo se ajusta ao espaço acima da folha */
  #syncSheet() {
    const tl = this.timeline;
    if (!tl.compact || this.panel.el.hidden) { tl.setInsetBottom(0); return; }
    const sheetTop = this.panel.el.getBoundingClientRect().top;
    const stage = this.stage.getBoundingClientRect();
    tl.setInsetBottom(stage.bottom - sheetTop);
  }

  #clear() {
    this.focus = null;
    this.panel.hide();
    this.timeline.inset.right = 0;
    this.timeline.setInsetBottom(0);
    this.timeline.setFocus(null);
    this.stage.classList.remove('has-panel');
  }

  route() {
    const m = /^#\/(\w+)\/(.+)$/.exec(decodeURIComponent(location.hash));
    if (!m || !VIEWS[m[1]]) { this.#clear(); return; }
    this.#render(m[1], m[2], this.pending || {});
    this.pending = null;
  }

  async #render(type, id, opts) {
    const token = (this.renderToken = {});
    const view = await VIEWS[type](this, id);
    if (token !== this.renderToken) return;
    if (!view) { this.#clear(); return; }
    this.focus = { type, id };
    const wide = !this.timeline.compact;
    this.timeline.inset.right = wide ? Math.min(560, this.timeline.W * 0.44) : 0;
    this.stage.classList.toggle('has-panel', wide);
    this.panel.show(view, `${type}/${id}`);
    this.#syncSheet();
    setTimeout(() => this.#syncSheet(), 380);
    this.timeline.setFocus(this.focus);
    if (type === 'evento') {
      this.visited.add(id); storage.set('visited', [...this.visited]);
    }
    if (!opts.keepCamera) {
      if (type === 'evento') this.timeline.frameEvent(store.byId.get(id));
      else if (view.frame) this.timeline.frameYears(view.frame[0], view.frame[1], 0.08);
      else if (type === 'pessoa' && this.timeline.span) this.timeline.frameYears(this.timeline.span[0], this.timeline.span[1], 0.1);
      else if (view.year != null) this.timeline.flyTo(yearToU(view.year), Math.max(this.timeline.k, 6));
    }
    if (opts.section) setTimeout(() => this.panel.scrollTo(opts.section), 300);
    document.title = `${view.title} · Travessia`;
  }

  refresh() { this.timeline.requestRender(); }
}

const app = new App();
app.start();
window.travessia = app; // útil para depuração no console
