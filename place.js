/* Place: what the hospitals of one territory recorded, year by year. */
(function () {
  'use strict';
  const A = window.Atlas, C = A.charts, TOP = 8;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const swatch = c => A.el('i', {class: 'swatch', style: 'background:' + c});

  A.run('place.html', async function (alive) {
    const S = A.S, st = A.state, main = A.$('#main');
    const t = S.T[st.p] ? st.p : 'nigeria', T = S.T[t], spec = A.spec(), view = st.v || 'share';
    // offer only what this territory has figures for: its counts, and the people and sexes of the count on screen;
    // a choice left over from another territory or count falls back to the standard one
    if (T.counts && T.counts.length && !T.counts.includes(st.n)) { A.set({n: T.counts.includes('in') ? 'in' : T.counts[0], m: ''}); return; }
    const pops = T.pops_by ? (T.pops_by[st.n] || []) : T.pops, sexes = T.sexes_by ? (T.sexes_by[st.n] || []) : [];
    if (st.pop !== 'all' && T.pops_by && !pops.includes(st.pop)) { A.set({pop: 'all'}); return; }
    if (st.sx && !sexes.includes(st.sx)) { A.set({sx: ''}); return; }
    const fields = A.countFields(T.counts).concat([
      {key: 'pop', label: 'People', options: [['all', 'Everyone']].concat(pops.map(p => [p, p + ' (as printed)']))},
      ...(sexes.length ? [A.sexField()] : []),
      {key: 'by', label: 'Group diseases by', options: A.BY.concat(S.lists.map(l => [l.key, 'Historical list: ' + l.label]))},
      {key: 'lc', label: 'Mark changes of the official list of diseases', check: true, chip: 'List changes hidden'},
      {key: 'rep', label: 'Include tables that repeat an earlier report', check: true, chip: 'Repeated tables included'}
    ]);
    if (!A.isQuick() || !['african', ''].includes(st.by)) main.replaceChildren(A.el('div', {class: 'wrap'}, A.el('p', {class: 'loading'}, 'Loading the full figures for ' + T.name + '…')));
    const data = await A.cells(t); if (!alive()) return;
    const group = await A.grouper(st.by, t, data.printed); if (!alive()) return;

    const pick = A.el('select', {class: 'title-select', 'aria-label': 'Territory', onchange: e => A.set({p: e.target.value, y: '', pop: 'all'})}, S.territories.slice().sort((a, b) => a.name.localeCompare(b.name)).map(x => A.el('option', {value: x.key}, A.placeLabel(x))));
    pick.value = t;
    const page = A.el('div', {class: 'wrap'}, A.el('p', {class: 'eyebrow'}, 'Place'), pick);
    if (!data.years.length) {
      page.append(A.el('p', {class: 'lede'}, 'The reports of ' + T.name + ' have no figures for this choice.'),
        A.el('section', {class: 'panel'}, A.el('p', {class: 'empty'}, 'Nothing to show for: ' + spec.label.toLowerCase() + (st.pop !== 'all' ? ', ' + st.pop : '') + '. Remove an option below, or choose another territory.'), A.chips(fields), A.options(fields)));
      main.replaceChildren(page); return;
    }
    const first = data.years[0], last = data.years[data.years.length - 1];
    page.append(A.el('p', {class: 'lede'}, cap(spec.noun) + ' by disease, ' + first + ' to ' + last + '.' + (data.printed ? ' The reports of the ' + T.name + ' give broad groups of diseases only, shown here as printed.' : '')
      + (data.partial && data.partial.length ? ' Left out: ' + data.partial.join(', ') + ', where only some tables print men and women apart, or the two do not add up to the printed total.' : '')));

    // layers: the largest groups, the rest together
    const byGroup = new Map();
    for (const r of data.rows) {
      const g = group(r.code, r.year); let L = byGroup.get(g.key);
      if (!L) byGroup.set(g.key, L = {...g, values: new Map(), total: 0});
      L.values.set(r.year, (L.values.get(r.year) || 0) + r.value); L.total += r.value;
    }
    const allLayers = [...byGroup.values()].sort((a, b) => b.total - a.total);
    allLayers.forEach((L, i) => { if (!L.colour) L.colour = A.palette[i % A.palette.length]; });
    let layers = allLayers;
    const foldable = allLayers.length > TOP + 1;
    if (foldable && st.all !== '1') {
      const rest = allLayers.slice(TOP), other = {key: '__other', label: 'All other diseases', colour: '#c6ccc5', values: new Map(), total: 0};
      rest.forEach(L => { L.values.forEach((v, y) => other.values.set(y, (other.values.get(y) || 0) + v)); other.total += L.total; });
      layers = allLayers.slice(0, TOP).concat(other);
    }
    const seams = st.lc === '1' ? A.seamsFor(t) : [];
    // without a chosen year, open the year whose table names the most diseases
    const richest = () => { const n = new Map(); data.rows.forEach(r => { if (r.code !== 'UNCODED') n.set(r.year, (n.get(r.year) || 0) + 1); }); let best = last, top = -1; n.forEach((v, y) => { if (v > top || (v === top && y > best)) { top = v; best = y; } }); return best; };
    const year = data.years.includes(+st.y) ? +st.y : richest();
    const mixed = st.n === 'in' && !st.m && new Set(data.basis.values()).size > 1;

    // the main chart
    const chart = A.el('div', {});
    if (view === 'rank') C.rank(chart, {years: data.years, layers: layers.filter(L => L.key !== '__other'), seams, noun: spec.noun});
    else C.columns(chart, {years: data.years, layers, mode: view, seams, selected: year, noun: spec.noun, label: cap(spec.noun) + ' in ' + T.name + ' by disease group',
      onPick: yr => A.set({y: String(yr)}),
      tip: (yr, tot) => {
        const rows = layers.map(L => [L, L.values.get(yr) || 0]).filter(d => d[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
        return '<b>' + yr + '</b> · ' + A.fmt(tot) + ' ' + A.esc(spec.noun) + (mixed ? '<br><span class="dim">Patients ' + A.basisWord(data.basis.get(yr)) + '</span>' : '') + '<br>' +
          rows.map(d => A.sw(d[0].colour) + A.esc(d[0].label) + ' <span class="dim">' + A.pct(d[1] / tot * 100) + '</span>').join('<br>') + '<br><span class="dim">Select the column to list its diseases</span>';
      }});
    const legend = A.el('div', {class: 'legend'}, layers.map(L => L.sel
      ? A.el('a', {href: A.url('disease.html', {d: L.sel}), title: 'Follow ' + L.label + ' across the territories'}, swatch(L.colour), L.label)
      : A.el('span', {}, swatch(L.colour), L.label)));
    if (foldable) legend.append(A.el('button', {type: 'button', class: 'link', onclick: () => A.set({all: st.all === '1' ? '0' : '1'})}, st.all === '1' ? 'Show the main groups only' : 'Show all ' + allLayers.length + ' groups'));
    const note = view === 'rank'
      ? 'Number 1 is the group with the most ' + spec.noun + ' in that year.'
      : 'Each column is one year; blank years have no surviving table.' + (seams.length ? ' A ▾ marks a year when the official list of diseases changed, so a jump there may come from the list.' : '') + (mixed ? ' Some years count patients treated instead of admitted; point at a column to see which.' : '');
    page.append(A.el('section', {class: 'panel'},
      A.el('div', {class: 'row spread'}, A.el('h2', {}, view === 'rank' ? 'Which groups of diseases led' : cap(spec.noun) + ' by group of diseases'),
        A.segmented('v', [['share', 'As shares'], ['count', 'As numbers'], ['rank', 'As a ranking']], 'How to show the figures')),
      A.chips(fields), chart, legend, A.el('p', {class: 'caption'}, note), A.options(fields)));

    // the diseases of one year
    const dis = new Map(); let total = 0;
    data.rows.forEach(r => {
      if (r.year !== year) return; total += r.value;
      let key, title, colour, sel, grp = '';
      if (data.printed) { const g = group(r.code, r.year); key = g.key; title = g.label; colour = (byGroup.get(g.key) || {}).colour; }
      else if (r.code === 'UNCODED') { key = 'UNCODED'; title = 'Not classified'; colour = '#999999'; }
      else {
        const c = S.codes[r.code], cat = c && c[2];
        if (cat && S.cats[cat]) { key = cat; title = S.cats[cat][0]; colour = S.groups[S.cats[cat][1]].colour; grp = S.groups[S.cats[cat][1]].label; sel = 'k:' + cat; }
        else if (c) { key = r.code; title = c[0]; colour = S.groups[c[1]].colour; grp = S.groups[c[1]].label; sel = 'c:' + r.code; }
        else { key = 'UNCODED'; title = 'Not classified'; colour = '#999999'; }
      }
      let d = dis.get(key); if (!d) dis.set(key, d = {key, title, colour: colour || '#527771', sel, group: grp, value: 0});
      d.value += r.value;
    });
    const list = [...dis.values()].sort((a, b) => b.value - a.value), top = list.slice(0, 12), biggest = top.length ? top[0].value : 1;
    const yi = data.years.indexOf(year);
    const ysel = A.el('select', {'aria-label': 'Year', onchange: e => A.set({y: e.target.value})}, data.years.map(y => A.el('option', {value: y}, y))); ysel.value = year;
    const stepper = A.el('span', {class: 'stepper'},
      A.el('button', {type: 'button', 'aria-label': 'Earlier year', disabled: yi === 0, onclick: () => A.set({y: String(data.years[yi - 1])})}, '‹'), ysel,
      A.el('button', {type: 'button', 'aria-label': 'Later year', disabled: yi === data.years.length - 1, onclick: () => A.set({y: String(data.years[yi + 1])})}, '›'));
    const bars = A.el('div', {class: 'bars'}, A.el('span', {class: 'head'}, data.printed ? 'Group as printed' : 'Disease'), A.el('span', {}), A.el('span', {class: 'head num'}, spec.short), A.el('span', {class: 'head pc'}, 'Share'));
    top.forEach(d => bars.append(
      d.sel ? A.el('a', {href: A.url('disease.html', {d: d.sel}), title: 'Follow this disease across the territories'}, d.title) : A.el('span', {}, d.title),
      A.el('span', {class: 'track'}, A.el('span', {class: 'fill', style: 'display:block;width:' + (d.value / biggest * 100).toFixed(1) + '%;background:' + d.colour})),
      A.el('span', {class: 'num'}, A.fmt(d.value)), A.el('span', {class: 'pc'}, A.pct(d.value / total * 100))));

    const everything = A.el('details', {class: 'more'}, A.el('summary', {}, list.length > 12 ? 'Show all ' + list.length + (data.printed ? ' groups of ' : ' diseases of ') + year : 'Show as a table'));
    everything.addEventListener('toggle', () => {
      if (!everything.open || everything.dataset.done) return; everything.dataset.done = '1';
      everything.append(A.table([{key: 'title', label: data.printed ? 'Group as printed' : 'Disease'}, {key: 'group', label: 'Group'}, {key: 'value', label: 'Number', num: true}, {label: 'Share', num: true, render: r => A.pct(r.value / total * 100)}], list),
        A.el('p', {class: 'caption'}, A.csvButton(() => list.map(d => ({territory: T.name, year, count: spec.label, disease: d.title, group: d.group, number: d.value, share_percent: +(d.value / total * 100).toFixed(3)})), 'atlas-' + t + '-' + year)));
    });
    const printed = A.el('details', {class: 'more'}, A.el('summary', {}, 'The names as the report printed them, and where it is'));
    printed.addEventListener('toggle', async () => {
      if (!printed.open || printed.dataset.done) return; printed.dataset.done = '1';
      const box = A.el('div', {}, A.el('p', {class: 'caption'}, 'Loading…')); printed.append(box);
      try {
        const [meta, full] = [await A.get('meta.json'), await A.full(t)];
        const src = meta.provenance.filter(r => r.territory === t && r.year === year && spec.streams.includes(r.stream) && (st.rep === '1' || !r.source_repeat));
        const yIdx = full.years.indexOf(year), sis = spec.streams.map(s => full.streams.indexOf(s)), pi = full.populations.indexOf(st.pop);
        const names = new Map();
        (full.names || []).forEach(r => { if (r[0] === yIdx && sis.includes(r[1]) && r[2] === pi && (st.rep === '1' || !r[5])) { const code = full.codes[r[3]]; if (!names.has(code)) names.set(code, new Set()); r[4].forEach(n => names.get(code).add(n)); } });
        const byCode = new Map(); data.rows.forEach(r => { if (r.year === year) byCode.set(r.code, (byCode.get(r.code) || 0) + r.value); });
        const rows = [...byCode].sort((a, b) => b[1] - a[1]).map(([code, value]) => ({code: data.printed ? '' : code, title: data.printed ? data.printed[code] : ((S.codes[code] || [])[0] || 'Not classified'), names: [...(names.get(code) || [])].join('; '), value}));
        box.replaceChildren(
          A.el('p', {class: 'caption'}, src.length ? 'Printed in: ' + src.map(r => r.table_title.replace(/\s*\/\s*/g, ', ') + ' (transcribed in ' + r.source_file + ', sheet “' + r.sheet + '”)').join('; ') + '.' : 'The printed table of this year is not indexed.'),
          A.table([{key: 'names', label: 'Printed names'}, {key: 'title', label: 'Classified as'}, {key: 'code', label: 'ICD10h code'}, {key: 'value', label: 'Number', num: true}], rows));
      } catch (e) { box.replaceChildren(A.el('p', {class: 'caption warning'}, 'Could not load the printed names: ' + e.message)); }
    });
    page.append(A.el('section', {class: 'panel'},
      A.el('div', {class: 'row spread'}, A.el('h2', {}, 'The most common ' + (data.printed ? 'groups' : 'diseases') + ' in'), stepper),
      A.el('p', {class: 'sub'}, A.fmt(total) + ' ' + spec.noun + ' in ' + T.name + (mixed ? ', patients ' + A.basisWord(data.basis.get(year)) : '') + '. Select a column above to change the year.'),
      bars, everything, printed));
    main.replaceChildren(page);
  });
}());
