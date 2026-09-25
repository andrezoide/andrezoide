// Checkpoints de compreensão, gerados a partir das conexões cadastradas.
// Nada de pontos ou medalhas: uma pergunta, uma resposta, uma explicação.

import { h, storage } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel } from '../core/time.js';

export const done = () => storage.get('checkpoints', {});
const mark = (id, ok) => { const d = done(); d[id] = ok ? 'ok' : (d[id] || 'tried'); storage.set('checkpoints', d); };

// aleatoriedade estável por evento, para que a pergunta não mude a cada abertura
function rng(seed) {
  let x = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}
const shuffle = (arr, r) => arr.map((v) => [r(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

function causeQuestion(ev, r) {
  const causes = store.edgesTo(ev.id).filter((e) => e.type === 'causa').map((e) => store.byId.get(e.from)).filter(Boolean);
  if (!causes.length) return null;
  const right = causes[Math.floor(r() * causes.length)];
  const linked = new Set([ev.id, ...store.neighbors(ev.id).map((n) => n.event.id)]);
  const pool = store.events.filter((o) => !linked.has(o.id) && o.region === ev.region && o.t < ev.t && ev.t - o.t < Math.max(60, Math.abs(ev.t - right.t) * 3));
  if (pool.length < 2) return null;
  const wrong = shuffle(pool, r).slice(0, 2);
  const edge = store.edgesTo(ev.id).find((e) => e.from === right.id);
  return {
    kind: 'escolha',
    q: `Segundo as conexões desta travessia, qual destes acontecimentos contribuiu para “${ev.title}”?`,
    options: shuffle([right, ...wrong], r).map((o) => ({ ev: o, ok: o === right })),
    explain: `${right.title} (${right.label}) aparece como causa${edge?.note ? ` — ${edge.note}` : ''}. Os outros não têm ligação causal cadastrada com este acontecimento.`,
  };
}

function orderQuestion(ev, r) {
  const before = store.causes(ev.id, 1)[0] || [];
  const after = store.consequences(ev.id, 1)[0] || [];
  const pick = (list) => list.filter((n) => Math.abs(n.event.t - ev.t) > 0.5)[Math.floor(r() * list.length)]?.event;
  const a = pick(before), c = pick(after);
  if (!a || !c) return null;
  const correct = [a, ev, c];
  return {
    kind: 'ordem',
    q: 'Coloque em ordem cronológica: clique do mais antigo para o mais recente.',
    items: shuffle(correct, r),
    correct: correct.map((e) => e.id),
    explain: correct.map((e) => `${e.label}: ${e.title}`).join(' → '),
  };
}

export function checkpoint(app, ev) {
  const r = rng(ev.id);
  const q = causeQuestion(ev, r) || orderQuestion(ev, r);
  if (!q) return null;
  const state = done()[ev.id];
  const feedback = h('p.cp-feedback', { role: 'status', 'aria-live': 'polite' });
  const body = h('div.cp-body', h('p.cp-q', q.q));

  if (q.kind === 'escolha') {
    const list = h('ol.cp-options');
    q.options.forEach((o) => list.append(h('li', h('button.cp-opt', {
      type: 'button',
      onclick: (e) => {
        list.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        e.currentTarget.classList.add(o.ok ? 'is-right' : 'is-wrong');
        list.querySelector('[data-ok="1"]')?.classList.add('is-right');
        feedback.replaceChildren(h('strong', o.ok ? 'Isso. ' : 'Ainda não. '), q.explain);
        mark(ev.id, o.ok);
        retry.hidden = false;
      },
      dataset: { ok: o.ok ? '1' : '0' },
    }, h('span.cp-date', yearLabel(o.ev.s.y)), ' ', o.ev.title))));
    body.append(list);
  } else {
    const chosen = [];
    const list = h('ol.cp-options.is-order');
    q.items.forEach((o) => list.append(h('li', h('button.cp-opt', {
      type: 'button',
      onclick: (e) => {
        const b = e.currentTarget;
        if (b.disabled) return;
        chosen.push(o.id); b.disabled = true;
        b.prepend(h('span.cp-rank', String(chosen.length)));
        if (chosen.length === q.items.length) {
          const ok = chosen.every((id, i) => id === q.correct[i]);
          feedback.replaceChildren(h('strong', ok ? 'Ordem certa. ' : 'Não é essa a ordem. '), q.explain);
          mark(ev.id, ok);
          retry.hidden = false;
        }
      },
    }, o.title))));
    body.append(list);
  }
  const retry = h('button.cp-retry', { type: 'button', hidden: true, onclick: () => { const n = checkpoint(app, ev); wrap.replaceWith(n); } }, 'Tentar de novo');
  body.append(feedback, retry);
  const wrap = h(app.state.study ? 'section.cp.is-open' : 'details.cp',
    app.state.study
      ? h('h3.pv-h', 'Checkpoint de compreensão', state === 'ok' ? h('span.cp-done', ' ✓ concluído') : null)
      : h('summary.pv-h', 'Checkpoint de compreensão', state === 'ok' ? h('span.cp-done', ' ✓ concluído') : null),
    body);
  return wrap;
}
