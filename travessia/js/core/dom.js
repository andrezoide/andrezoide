// Pequeno helper para montar DOM a partir de dados, sem framework.
//   h('a.link', { href: '#', onclick }, 'texto', filho)

export function h(tag, props, ...children) {
  let id = null;
  tag = tag.replace(/#([\w-]+)/, (_, x) => { id = x; return ''; });
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props); props = null;
  }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const svgNS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const norm = (str) => String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const storage = {
  get(k, fallback) {
    try { const v = localStorage.getItem('travessia:' + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem('travessia:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
};

/** emissor de eventos mínimo para o estado da aplicação */
export class Emitter {
  #m = new Map();
  on(t, fn) { (this.#m.get(t) || this.#m.set(t, new Set()).get(t)).add(fn); return () => this.#m.get(t).delete(fn); }
  emit(t, d) { this.#m.get(t)?.forEach((fn) => fn(d)); }
}
