/* Atlas of disease: shared state, data and interface pieces. Plain ES2020, no build step. */
(function () {
  'use strict';
  const A = window.Atlas = {};

  // ---------- small helpers
  A.$ = (q, root = document) => root.querySelector(q);
  A.el = function (tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(3)) if (kid != null && kid !== false) n.append(kid);
    return n;
  };
  A.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  A.fmt = v => v == null || !isFinite(v) ? '–' : new Intl.NumberFormat('en-GB', {maximumFractionDigits: Math.abs(v) < 10 && v % 1 ? 1 : 0}).format(v);
  A.pct = v => v == null || !isFinite(v) ? '–' : (v >= 10 ? v.toFixed(0) : v >= 0.05 ? v.toFixed(1) : v > 0 ? '<0.1' : '0') + '%';
  A.fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  A.palette = ['#206c72', '#d0a344', '#8a6f91', '#c0603d', '#5b8db8', '#7b8b60', '#a47a68', '#3a6e4f', '#9c4864', '#5c5d9a', '#96752b', '#527771'];

  // ---------- what can be counted, in plain words
  A.COUNTS = {
    // 'count: …' is each printed table's own figure (admissions where the table prints them, else patients treated, and the
    // other way round for out-patients), so that a year whose tables print different measures counts every table
    in: {label: 'In-patients', noun: 'in-patient cases', short: 'Cases', streams: ['in-patients'], order: ['count: admitted, else treated', 'admitted during year', 'treated during year']},
    died: {label: 'Deaths in hospital', noun: 'deaths in hospital', short: 'Deaths', streams: ['in-patients'], order: ['died']},
    out: {label: 'Out-patients', noun: 'out-patient cases', short: 'Cases', streams: ['out-patients'], order: ['count: treated, else admitted', 'treated during year', 'admitted during year']},
    both: {label: 'In- and out-patients together', noun: 'cases (in- and out-patients together)', short: 'Cases', streams: ['both', 'in-patients and out-patients', 'in-patients and out-patients (not separated)', 'not separated'], order: ['count: treated, else admitted', 'treated during year', 'admitted during year']},
    deaths: {label: 'Deaths, from separate death tables', noun: 'deaths', short: 'Deaths', streams: ['deaths'], order: ['died']}
  };
  A.BY = [['african', 'Disease groups (standard)'], ['histcat', 'HistCat groups'], ['chapter', 'ICD-10 chapters'], ['kippen', 'Kippen’s 32 groups'], ['preston', 'Preston’s 12 groups']];

  // ---------- the selection, kept in the page address; only what differs from the standard view is written
  const DEFAULTS = {p: '', d: 'g:Malaria', y: '', v: '', sc: 'share', n: 'in', m: '', pop: 'all', sx: '', by: 'african', log: '0', avg: '0', lc: '1', rep: '0', all: '0', own: '0', mode: 'year'};
  const CARRIED = ['n', 'm', 'pop', 'sx', 'by', 'log', 'avg', 'lc', 'rep', 'sc', 'p', 'd'];
  A.DEFAULTS = DEFAULTS;
  A.read = function () {
    const p = new URLSearchParams(location.hash.slice(1)), s = {...DEFAULTS};
    for (const k of Object.keys(s)) if (p.has(k)) s[k] = p.get(k);
    return s;
  };
  function hash(state) {
    return Object.keys(DEFAULTS).filter(k => state[k] != null && state[k] !== DEFAULTS[k])
      .map(k => k + '=' + encodeURIComponent(state[k]).replace(/%3A/g, ':').replace(/%20/g, '+')).join('&');
  }
  A.url = function (page, changes = {}) {
    const base = {};
    if (page === A.page) Object.assign(base, A.state); else CARRIED.forEach(k => { base[k] = A.state[k]; });
    const h = hash({...base, ...changes});
    return page + (h ? '#' + h : '');
  };
  A.set = function (changes) {
    const h = hash({...A.state, ...changes});
    if (h === location.hash.slice(1)) return;
    location.hash = h;
  };
  A.quiet = function (changes) {   // change the address without redrawing the page (sliders)
    Object.assign(A.state, changes);
    history.replaceState(null, '', location.pathname + location.search + '#' + hash(A.state));
  };

  // ---------- data
  const store = new Map();
  const stamped = f => 'data/' + f + (A.S && A.S.stamp ? '?v=' + A.S.stamp : '');   // a rebuilt atlas is never mixed with cached files
  A.get = function (file) {
    if (!store.has(file)) store.set(file, fetch(stamped(file), file === 'start.json' ? {cache: 'no-cache'} : {}).then(r => { if (!r.ok) throw new Error(file + ': HTTP ' + r.status); return r.json(); }));
    return store.get(file);
  };
  let fullKey = '', fullData = null;
  A.full = async function (t) {   // the large file of one territory; only one is kept in memory
    if (fullKey === t) return fullData;
    fullKey = ''; fullData = null;
    const load = async f => { const r = await fetch(stamped(f)); if (!r.ok) throw new Error(f + ': HTTP ' + r.status); return r.json(); };
    const base = await load(t + '.json');
    if (base.parts) {
      for (const k of ['cells', 'repeat_cells', 'names', 'sex_cells', 'sex_repeat_cells']) base[k] = [];
      for (const f of base.parts) { const p = await load(f); for (const k of ['cells', 'repeat_cells', 'names', 'sex_cells', 'sex_repeat_cells']) base[k] = base[k].concat(p[k] || []); }
    }
    fullKey = t; fullData = base;
    return base;
  };
  A.spec = function (st = A.state) {
    const c = A.COUNTS[st.n] || A.COUNTS.in;
    let order = c.order;
    if (st.n === 'in' && st.m === 'admitted') order = ['admitted during year'];
    if (st.n === 'in' && st.m === 'treated') order = ['treated during year'];
    if (st.sx === 'male' || st.sx === 'female') {   // men or women alone, where a report prints them apart
      const who = st.sx === 'male' ? 'men' : 'women';
      return {...c, order, label: c.label + ' (' + who + ')', noun: c.noun + ' among ' + who};
    }
    return {...c, order};
  };
  A.isQuick = (st = A.state) => ['in', 'died', 'out'].includes(st.n) && !st.m && st.pop === 'all' && st.rep !== '1' && !st.sx;
  const quickCache = new Map();
  const EMPTY = () => ({years: [], basis: new Map(), rows: [], printed: null});

  // One count per territory and year: rows of {year, code, value}; basis says which printed measure a year uses.
  A.cells = async function (t, st = A.state) {
    if (A.isQuick(st)) {
      const key = st.n + '|' + t;
      if (quickCache.has(key)) return quickCache.get(key);
      const q = (await A.get('quick_' + st.n + '.json')).territories[t];
      const out = q ? {years: q.years, basis: new Map(q.years.map((y, i) => [y, q.basis[i]])), rows: q.cells.map(r => ({year: q.years[r[0]], code: q.codes[r[1]], value: r[2]})), printed: q.printed || null} : EMPTY();
      quickCache.set(key, out);
      return out;
    }
    const b = await A.full(t), spec = A.spec(st), pi = b.populations.indexOf(st.pop);
    const sis = spec.streams.map(s => b.streams.indexOf(s)).filter(i => i >= 0);
    const mis = spec.order.map(m => b.measures.indexOf(m)).filter(i => i >= 0);
    if (pi < 0 || !sis.length || !mis.length) return EMPTY();
    const sx = st.sx === 'male' ? 0 : st.sx === 'female' ? 1 : -1;   // sex cells end with 0 (men) or 1 (women)
    const cells = sx < 0 ? (st.rep === '1' ? b.cells.concat(b.repeat_cells || []) : b.cells)
      : (st.rep === '1' ? (b.sex_cells || []).concat(b.sex_repeat_cells || []) : (b.sex_cells || [])).filter(r => r[7] === sx);
    const byYear = new Map();
    for (const r of cells) {
      if (r[2] !== pi || !sis.includes(r[1]) || !mis.includes(r[3])) continue;
      let m = byYear.get(r[0]); if (!m) byYear.set(r[0], m = new Map());
      let a = m.get(r[3]); if (!a) m.set(r[3], a = []);
      a.push(r);
    }
    // men or women alone: only the years whose tables all print the sexes apart, that is men + women within 5% of the
    // both-sexes figure (other years print only some tables by sex, or their columns do not add up to the total)
    let whole = () => true;
    if (sx >= 0) {
      const sums = list => { const s = new Map(); for (const r of list) if (r[2] === pi && sis.includes(r[1])) { const k = r[0] + '|' + r[3]; s.set(k, (s.get(k) || 0) + r[5]); } return s; };
      const both = sums(st.rep === '1' ? b.cells.concat(b.repeat_cells || []) : b.cells);
      const apart = sums(st.rep === '1' ? (b.sex_cells || []).concat(b.sex_repeat_cells || []) : (b.sex_cells || []));
      whole = (yi, mi) => { const a = both.get(yi + '|' + mi) || 0, s = apart.get(yi + '|' + mi) || 0; return a > 0 && s >= 0.95 * a && s <= 1.05 * a; };
    }
    const out = EMPTY(); out.partial = [];
    [...byYear.keys()].sort((x, y) => x - y).forEach(yi => {
      const m = byYear.get(yi), mi = mis.find(i => m.has(i)), year = b.years[yi], sum = new Map();
      if (!whole(yi, mi)) { out.partial.push(year); return; }
      for (const r of m.get(mi)) sum.set(r[4], (sum.get(r[4]) || 0) + r[5]);
      let any = false;
      for (const [ci, v] of sum) if (v) { out.rows.push({year, code: b.codes[ci], value: v}); any = true; }
      if (any) { out.years.push(year); out.basis.set(year, A.yearBasis(b, mi, sis, pi, year)); }
    });
    if (b.printed_groups && Object.keys(b.printed_groups).length) out.printed = b.printed_groups;
    return out;
  };
  // which printed measure a year's count rests on: a, t, d, or m where its tables differ (count_basis from the builder)
  A.yearBasis = function (b, mi, sis, pi, year) {
    const m = b.measures[mi];
    if (!m.startsWith('count:')) return m[0];
    const by = (b.count_basis || {})[m] || {}, pop = b.populations[pi], got = new Set();
    for (const si of sis) { const f = ((by[b.streams[si]] || {})[pop] || {})[year]; if (f) got.add(f); }
    return got.size === 1 ? [...got][0] : got.size ? 'm' : '';
  };
  A.basisWord = f => f === 'a' ? 'admitted during the year' : f === 't' ? 'treated during the year' : f === 'd' ? 'died' : f === 'm' ? 'admitted, or treated where a table prints no admissions' : '';

  // ---------- grouping codes: returns a function (code, year) -> {key, label, colour, sel}
  const lensCache = new Map();
  function itemMapping(codes, target, source) {   // items of list `target`, merged where the list in force could not separate them
    const ck = target + '|' + source; if (lensCache.has(ck)) return lensCache.get(ck);
    const parent = new Map();
    const find = x => { if (!parent.has(x)) parent.set(x, x); if (parent.get(x) !== x) parent.set(x, find(parent.get(x))); return parent.get(x); };
    const join = (a, b) => parent.set(find(b), find(a));
    const split = s => String(s || '').split(/[;|,]/).map(x => x.trim()).filter(Boolean);
    const sourceItems = new Map();
    Object.values(codes).forEach(c => {
      const r = c.lists && c.lists[target]; if (!r || !r.item) return;
      find(r.item); split(r.combined).forEach(i => join(r.item, i));
      if (source) { const s = c.lists[source]; if (s && s.item) { const sk = split(s.combined), key = sk.length ? sk.sort().join(';') : s.item; if (!sourceItems.has(key)) sourceItems.set(key, []); sourceItems.get(key).push(r.item); } }
    });
    sourceItems.forEach(items => items.forEach(i => join(items[0], i)));
    const comps = new Map(); parent.forEach((_, k) => { const root = find(k); if (!comps.has(root)) comps.set(root, []); comps.get(root).push(k); });
    const result = new Map();
    Object.entries(codes).forEach(([code, c]) => {
      const item = c.lists && c.lists[target] && c.lists[target].item; if (!item) return;
      const items = comps.get(find(item)).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
      const several = items.length > 4 ? items.slice(0, 3).join(', ') + ' and ' + (items.length - 3) + ' others' : items.join(', ');
      result.set(code, {key: items.join(' + '), label: items.length > 1 ? 'Items ' + several + ' (not separable in the reports)' : item + ' · ' + c.lists[target].title});
    });
    lensCache.set(ck, result); return result;
  }
  A.grouper = async function (by, t, printed) {
    const S = A.S;
    if (printed) {   // groups as printed (Belgian Congo): the same heading under another numbering is one group
      // only case, numbering, "&" and the reports' own abbreviations are evened out; the wording stays the reports'
      const tidy = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/^\s*(groupe\s+)?([ivxlc]+|\d+)\s*[.\-–—:]+\s*/, '').replace(/&/g, ' et ').replace(/\bmal\.\s*/g, 'maladies ')
        .replace(/\bpest\.\s*/g, 'pestilentielles ').replace(/\btransm\.\s*/g, 'transmissibles').replace(/\bchirurg\.\s*/g, 'chirurgicales ')
        .replace(/apperail/g, 'appareil').replace(/[,;]?\s*etc\.?\s*$/, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
      return code => { const label = tidy(printed[code]) || String(printed[code] || code); return {key: label, label: label.charAt(0).toUpperCase() + label.slice(1)}; };
    }
    const african = code => { const c = S.codes[code], g = S.groups[c ? c[1] : S.unc]; return {key: g.key, label: g.label, colour: g.colour, sel: g.key === 'UNCODED' ? null : 'g:' + g.key}; };
    if (by === 'african' || !by) return african;
    const full = await A.get('codes.json');
    const field = {histcat: 'histcat', kippen: 'group_kippen', preston: 'group_preston'}[by];
    if (field) {
      const scheme = new Map(S.schemes[by].map(g => [g.key, g])), kind = {histcat: 'h', kippen: 'kp', preston: 'pr'}[by];
      return code => { const k = (full[code] && full[code][field]) || 'Not classified', g = scheme.get(k); return {key: k, label: k, colour: g && g.colour, sel: g ? kind + ':' + k : null}; };
    }
    if (by === 'chapter') return code => { const c = full[code]; return c && c.chapter ? {key: c.chapter, label: c.chapter + '. ' + c.chapter_title, sel: 'ch:' + c.chapter} : {key: 'Not classified', label: 'Not classified'}; };
    if (S.lists.some(l => l.key === by)) {
      const meta = await A.get('meta.json'), streams = A.spec().streams, lens = new Map();
      meta.coverage.filter(r => r.territory === t && streams.includes(r.stream)).forEach(r => {
        const keys = [...new Set(r.lists.map(l => (meta.source_lists.find(x => x.key === l) || {}).lens_key).filter(Boolean))];
        lens.set(r.year, keys.length === 1 ? keys[0] : '');
      });
      return (code, year) => itemMapping(full, by, lens.get(year) || '').get(code) || {key: 'Not in this list', label: 'Not in this list'};
    }
    return african;
  };

  // ---------- a disease selection: 'g:Malaria' (group), 'k:A66' (disease), 'c:B54.000' (one entry), or a group of another scheme
  A.selection = async function (sel) {
    const S = A.S, i = String(sel).indexOf(':'), kind = sel.slice(0, i), key = sel.slice(i + 1);
    if (kind === 'g') {
      const gi = S.groups.findIndex(g => g.key === key), g = S.groups[gi]; if (!g) return null;
      return {sel, kind: 'Disease group', title: g.label, colour: g.colour, match: code => ((S.codes[code] || [0, S.unc])[1]) === gi, group: gi};
    }
    if (kind === 'k') {
      const c = S.cats[key]; if (!c) return null; const g = S.groups[c[1]];
      return {sel, kind: 'Disease', title: c[0], colour: g.colour, match: code => (S.codes[code] || [])[2] === key, parent: {label: g.label, sel: 'g:' + g.key}, cat: key,
        formal: 'In the International Classification of Diseases: ' + key + (c[4] ? ', ' + c[4] : '') + '.'};
    }
    if (kind === 'c') {
      const c = S.codes[key]; if (!c) return null; const g = S.groups[c[1]], cat = S.cats[c[2]];
      return {sel, kind: 'One entry of the classification (' + key + ')', title: c[0], colour: g.colour, match: code => code === key, parent: cat ? {label: cat[0], sel: 'k:' + c[2]} : {label: g.label, sel: 'g:' + g.key}, code: key};
    }
    if (kind === 'l') {   // an item of a historical list: 'l:list1929:38'
      const j = key.indexOf(':'), list = key.slice(0, j), item = key.slice(j + 1), L = S.lists.find(x => x.key === list); if (!L) return null;
      const full = await A.get('codes.json'), at = c => c && c.lists && c.lists[list], sample = Object.values(full).find(c => at(c) && at(c).item === item); if (!sample) return null;
      return {sel, kind: 'Item ' + item + ' of the list: ' + L.label, title: at(sample).title, colour: '#206c72', scheme: list, match: code => !!at(full[code]) && at(full[code]).item === item};
    }
    const field = {h: 'histcat', kp: 'group_kippen', pr: 'group_preston', ch: 'chapter'}[kind]; if (!field) return null;
    const full = await A.get('codes.json'), sample = Object.values(full).find(c => c[field] === key); if (!sample) return null;
    const name = {h: 'HistCat group', kp: 'Group in Kippen’s 32', pr: 'Group in Preston’s 12', ch: 'ICD-10 chapter'}[kind];
    return {sel, kind: name, title: kind === 'ch' ? key + '. ' + sample.chapter_title : key, colour: '#206c72', scheme: {h: 'histcat', kp: 'kippen', pr: 'preston', ch: 'chapter'}[kind], match: code => !!full[code] && full[code][field] === key};
  };

  // ---------- interface pieces
  const ui = {optionsOpen: false};
  A.placeLabel = T => T.name + (T.modern !== T.name ? ' (' + T.modern + ')' : '');
  A.searchBox = function (placeholder, big) {
    const input = A.el('input', {type: 'search', placeholder, 'aria-label': placeholder, autocomplete: 'off', spellcheck: 'false'});
    const list = A.el('ul', {class: 'results', hidden: true}), wrap = A.el('div', {class: 'search' + (big ? ' big' : '')}, input, list);
    let items = [], active = -1, seq = 0;
    function paint() {
      list.replaceChildren();
      if (!items.length) list.append(A.el('li', {class: 'none'}, 'Nothing found. Try a shorter word.'));
      items.forEach((r, i) => list.append(A.el('li', {}, A.el('a', {href: r.href, class: i === active ? 'on' : null, onclick: () => { input.value = ''; list.hidden = true; }}, r.label, A.el('small', {}, r.kind + (r.hint ? ' · ' + r.hint : ''))))));
      list.hidden = false;
    }
    async function update() {
      const q = A.fold(input.value.trim()), mine = ++seq;
      if (q.length < 2) { list.hidden = true; items = []; return; }
      const S = A.S, out = [];
      S.territories.forEach(T => { if (A.fold(T.name + ' ' + T.modern + ' ' + T.printed).includes(q)) out.push({label: A.placeLabel(T), kind: 'Place', href: A.url('place.html', {p: T.key, y: ''})}); });
      S.groups.forEach(g => { if (g.key !== 'UNCODED' && A.fold(g.label + ' ' + g.key).includes(q)) out.push({label: g.label, kind: 'Disease group', href: A.url('disease.html', {d: 'g:' + g.key})}); });
      const idx = await A.get('search.json'); if (mine !== seq) return;
      const starts = [], contains = [], alias = [];
      for (const r of idx) { const t = A.fold(r.t); if (t.startsWith(q)) starts.push(r); else if (t.includes(q)) contains.push(r); else if (r.a.includes(q)) alias.push(r); }
      starts.concat(contains, alias).slice(0, 9).forEach(r => {
        let hint = '';
        if (!A.fold(r.t).includes(q)) { const m = r.a.split('|').find(x => x.includes(q)); if (m) hint = 'printed as “' + m + '”'; }
        out.push({label: r.t, kind: 'Disease', hint, href: A.url('disease.html', {d: 'k:' + r.k})});
      });
      items = out; active = -1; paint();
    }
    input.addEventListener('input', update);
    input.addEventListener('focus', () => { A.get('search.json'); if (items.length) list.hidden = false; });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 180));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; paint(); }
      else if (e.key === 'Enter' && items.length) { location.href = items[Math.max(0, active)].href; input.value = ''; list.hidden = true; input.blur(); }
      else if (e.key === 'Escape') { list.hidden = true; }
    });
    return wrap;
  };
  A.header = function () {
    const h = A.$('#site-header'); h.replaceChildren();
    const nav = [['index.html', 'Home'], ['place.html', 'Places'], ['disease.html', 'Diseases'], ['about.html', 'About the data']];
    h.append(A.el('div', {class: 'wrap'},
      A.el('a', {class: 'brand', href: 'index.html'}, 'Atlas of disease'),
      A.el('nav', {'aria-label': 'Pages'}, nav.map(([f, label]) => A.el('a', {href: f, 'data-page': f, class: f === A.page ? 'here' : null}, label))),
      A.searchBox('Find a disease or a place')));
    A.$('#site-footer').replaceChildren(A.el('div', {class: 'wrap'}, 'Hospital figures as printed in the colonial annual medical reports, 1887–1967. They count patients, not rates of disease in the population. Draft for the authors, not for circulation.',
      A.el('p', {style: 'margin-top:6px'}, 'For specialists: ', A.el('a', {href: 'classifications.html'}, 'how diseases are classified, and other classifications'), '.')));
  };
  A.refreshNav = () => document.querySelectorAll('#site-header nav a').forEach(a => { a.href = a.dataset.page === 'index.html' ? 'index.html' : A.url(a.dataset.page, a.dataset.page === A.page ? {} : {y: ''}); });

  A.segmented = function (key, options, label) {
    const current = A.state[key] || options[0][0];
    return A.el('div', {class: 'seg', role: 'group', 'aria-label': label}, options.map(([v, text]) =>
      A.el('button', {type: 'button', class: current === v ? 'on' : null, 'aria-pressed': String(current === v), onclick: () => A.set({[key]: v === options[0][0] && DEFAULTS[key] === '' ? '' : v})}, text)));
  };
  // fields: {key, label, options: [[value, label], ...]} or {key, label, check: true}
  A.options = function (fields) {
    const changed = fields.filter(f => A.state[f.key] !== DEFAULTS[f.key]);
    const box = A.el('details', {class: 'options'}); box.open = ui.optionsOpen;
    box.addEventListener('toggle', () => { ui.optionsOpen = box.open; });
    box.append(A.el('summary', {}, 'More options' + (changed.length ? ' (' + changed.length + ' changed)' : '')));
    const grid = A.el('div', {class: 'options-grid'});
    fields.forEach(f => {
      if (f.check) {
        const input = A.el('input', {type: 'checkbox', onchange: e => A.set({[f.key]: e.target.checked ? '1' : '0'})}); input.checked = A.state[f.key] === '1';
        grid.append(A.el('label', {class: 'check'}, input, f.label));
      } else {
        const s = A.el('select', {onchange: e => A.set({[f.key]: e.target.value, ...(f.also || {})})}, f.options.map(([v, text]) => A.el('option', {value: v}, text)));
        if (!f.options.some(o => o[0] === A.state[f.key])) s.append(A.el('option', {value: A.state[f.key]}, A.state[f.key]));
        s.value = A.state[f.key];
        grid.append(A.el('label', {}, f.label, s));
      }
    });
    if (changed.length) grid.append(A.el('button', {type: 'button', class: 'link', onclick: () => A.set(Object.fromEntries(fields.map(f => [f.key, DEFAULTS[f.key]])))}, 'Back to the standard view'));
    box.append(grid, A.el('p', {class: 'caption'}, A.el('a', {href: A.url('classifications.html')}, 'How diseases are classified, and other classifications')));
    return box;
  };
  A.chips = function (fields) {
    const changed = fields.filter(f => A.state[f.key] !== DEFAULTS[f.key]);
    if (!changed.length) return null;
    return A.el('div', {class: 'chips', 'aria-label': 'Options in use'}, changed.map(f => {
      const text = f.chip || (f.check ? f.label : ((f.options.find(o => o[0] === A.state[f.key]) || [0, A.state[f.key]])[1]));
      return A.el('span', {class: 'chip'}, text, A.el('button', {type: 'button', title: 'Remove this option', 'aria-label': 'Remove: ' + text, onclick: () => A.set({[f.key]: DEFAULTS[f.key]})}, '×'));
    }));
  };
  A.countFields = function (counts) {   // the choices shared by the Place and Disease pages; counts: the ones with figures
    const f = [{key: 'n', label: 'Patients counted', options: Object.entries(A.COUNTS).filter(([k]) => !counts || counts.includes(k)).map(([k, c]) => [k, c.label]), also: {m: ''}}];
    if (A.state.n === 'in') f.push({key: 'm', label: 'In-patient figure used', options: [['', 'Admitted, or treated where admissions are not printed'], ['admitted', 'Admitted during the year only'], ['treated', 'Treated during the year only']]});
    return f;
  };
  A.sexField = () => ({key: 'sx', label: 'Sex', options: [['', 'Both sexes'], ['male', 'Men, where printed apart'], ['female', 'Women, where printed apart']]});

  // tooltip
  let tip;
  A.tipShow = function (event, html) {
    if (!tip) { tip = A.el('div', {class: 'tip', role: 'status'}); document.body.append(tip); }
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect(), pad = 14;
    let x = event.clientX + pad, y = event.clientY + pad;
    if (x + r.width > innerWidth - 8) x = event.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = event.clientY - r.height - pad;
    tip.style.left = Math.max(6, x) + 'px'; tip.style.top = Math.max(6, y) + 'px';
  };
  A.tipHide = () => { if (tip) tip.hidden = true; };
  A.sw = colour => '<i class="swatch" style="background:' + colour + '"></i>';

  A.csvButton = function (rowsFn, name, label = 'Download these numbers (CSV)') {
    return A.el('button', {type: 'button', class: 'link', onclick: () => {
      const rows = rowsFn(); if (!rows.length) return;
      const blob = new Blob(['﻿' + d3.csvFormat(rows)], {type: 'text/csv;charset=utf-8'}), a = A.el('a', {href: URL.createObjectURL(blob), download: name + '.csv'});
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }}, label);
  };
  A.table = function (columns, rows) {
    const body = rows.map(r => A.el('tr', {}, columns.map(c => { const td = A.el('td', {class: c.num ? 'num' : null}); const v = c.render ? c.render(r) : r[c.key]; td.append(v == null ? '' : (c.num && typeof v === 'number' ? A.fmt(v) : v)); return td; })));
    return A.el('div', {class: 'table-wrap'}, A.el('table', {}, A.el('thead', {}, A.el('tr', {}, columns.map(c => A.el('th', {class: c.num ? 'num' : null, scope: 'col'}, c.label)))), A.el('tbody', {}, body)));
  };
  A.seamsFor = function (t) {   // list changes that concern the patients on screen
    const streams = A.spec().streams;
    return (A.S.seams[t] || []).filter(s => !s.s.length || s.s.some(x => streams.includes(x)))
      .map(s => ({year: s.y, text: 'From ' + s.y + ' the reports follow a different list of diseases (' + s.a + ' → ' + s.b + '). A jump here can come from the list rather than from disease.'}));
  };

  // ---------- start a page
  A.run = async function (page, render) {
    A.page = page; A.state = A.read();
    const main = A.$('#main');
    try {
      if (!window.d3) throw new Error('The chart library could not load. Check the internet connection and reload.');
      const S = A.S = await A.get('start.json');
      S.T = Object.fromEntries(S.territories.map(T => [T.key, T]));
      S.unc = S.groups.findIndex(g => g.key === 'UNCODED');
      A.header();
      let gen = 0;
      const go = async () => {
        const token = ++gen; A.state = A.read(); A.refreshNav(); A.tipHide();
        try { await render(() => token === gen); }
        catch (e) { console.error(e); if (token === gen) main.replaceChildren(A.el('div', {class: 'wrap'}, A.el('p', {class: 'empty warning'}, 'This view could not be drawn: ' + e.message))); }
      };
      window.addEventListener('hashchange', go);
      await go();
    } catch (e) {
      console.error(e);
      main.replaceChildren(A.el('div', {class: 'wrap'}, A.el('p', {class: 'empty warning'}, 'The atlas could not start: ' + e.message)));
    }
  };
}());
