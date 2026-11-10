/* Disease: where and when one disease, or one group of diseases, was recorded. */
(function () {
  'use strict';
  const A = window.Atlas, C = A.charts;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const CLASSES = ['#d6ece8', '#a3d3cb', '#63b3a8', '#2f8f87', '#0f5f61'];
  let timer = null;

  A.run('disease.html', async function (alive) {
    const S = A.S, st = A.state, main = A.$('#main'), spec = A.spec();
    clearInterval(timer); timer = null;
    const sel = (await A.selection(st.d)) || (await A.selection('g:Malaria')); if (!alive()) return;
    const view = st.v || 'time', share = st.sc !== 'count', unit = share ? 'share of all ' + spec.noun : 'number of ' + spec.noun;
    const fields = A.countFields().concat([
      {key: 'pop', label: 'People', options: [['all', 'Everyone'], ['African', 'Africans, where printed separately'], ['European', 'Europeans, where printed separately']]},
      {key: 'own', label: 'Give each territory its own scale', check: true, chip: 'Own scale for each territory'},
      {key: 'avg', label: 'Smooth with a three-year average', check: true, chip: 'Three-year average'},
      {key: 'log', label: 'Logarithmic scale on the one-chart view', check: true, chip: 'Logarithmic scale'},
      {key: 'lc', label: 'Mark changes of the official list of diseases', check: true, chip: 'List changes hidden'},
      {key: 'rep', label: 'Include tables that repeat an earlier report', check: true, chip: 'Repeated tables included'}
    ]);
    const places = S.territories.filter(T => !T.groups_only).sort((a, b) => a.name.localeCompare(b.name)), slow = !A.isQuick();
    const wait = A.el('p', {class: 'loading'}, 'Reading the full figures…');
    if (slow) main.replaceChildren(A.el('div', {class: 'wrap'}, wait));

    const series = [];
    for (const T of places) {
      if (slow) wait.textContent = 'Reading the full figures, one territory at a time: ' + T.name + '…';
      const data = await A.cells(T.key); if (!alive()) return;
      const tot = new Map(), hit = new Map();
      for (const r of data.rows) { tot.set(r.year, (tot.get(r.year) || 0) + r.value); if (sel.match(r.code)) hit.set(r.year, (hit.get(r.year) || 0) + r.value); }
      let points = data.years.map(year => { const cases = hit.get(year) || 0, total = tot.get(year); return {year, cases, total, value: share ? cases / total * 100 : cases}; });
      if (st.avg === '1') {
        const m = new Map(points.map(p => [p.year, p]));
        points = points.map(p => { const a = m.get(p.year - 1), b = m.get(p.year + 1); return a && b ? {...p, value: (a.value + p.value + b.value) / 3} : null; }).filter(Boolean);
      }
      series.push({T, points, table: new Set(points.map(p => p.year)), cases: d3.sum(points, p => p.cases), seams: st.lc === '1' ? A.seamsFor(T.key) : []});
    }
    const any = series.some(s => s.cases > 0), max = d3.max(series.flatMap(s => s.points), p => p.value) || 1;
    const show = v => share ? A.pct(v) : A.fmt(v);
    const pointTip = (s, p) => '<b>' + A.esc(s.T.name) + ', ' + p.year + '</b><br>' + A.fmt(p.cases) + ' of ' + A.fmt(p.total) + ' ' + A.esc(spec.noun) + ' (' + A.pct(p.cases / p.total * 100) + ')' + (st.avg === '1' ? '<br><span class="dim">Three-year average: ' + show(p.value) + '</span>' : '');

    // heading
    const crumb = A.el('p', {class: 'eyebrow'}, sel.kind);
    if (sel.parent) crumb.append(' · part of ', A.el('a', {href: A.url('disease.html', {d: sel.parent.sel})}, sel.parent.label));
    const page = A.el('div', {class: 'wrap'}, crumb, A.el('h1', {}, sel.title),
      A.el('p', {class: 'lede'}, cap(spec.noun) + ' in ten territories, shown as ' + (share ? 'a share of all ' + spec.noun : 'numbers') + '.'),
      sel.formal ? A.el('p', {class: 'caption'}, sel.formal) : null);
    const chart = A.el('div', {}), captions = [];
    const panel = A.el('section', {class: 'panel'},
      A.el('div', {class: 'row spread'},
        A.segmented('v', [['time', 'Territory by territory'], ['map', 'On the map'], ['together', 'On one chart']], 'View'),
        A.segmented('sc', [['share', 'Share of all cases'], ['count', 'Number of cases']], 'Scale')),
      A.chips(fields), chart);
    page.append(panel);

    if (!any) chart.append(A.el('p', {class: 'empty'}, 'No ' + spec.noun + ' recorded under “' + sel.title + '” for this choice.'));
    else if (view === 'together') {
      const lines = series.filter(s => s.cases > 0).map(s => ({src: s, label: s.T.name, colour: A.palette[S.territories.indexOf(s.T) % A.palette.length], points: s.points}));
      chart.append(A.el('div', {class: 'legend', style: 'margin:14px 0 6px'}, lines.map(s => A.el('a', {href: A.url('place.html', {p: s.src.T.key, y: ''})}, A.el('i', {class: 'swatch', style: 'background:' + s.colour}), s.label))));
      C.lines(chart, {domain: [S.first, S.last], share, log: st.log === '1', tip: (s, p) => pointTip(s.src, p), series: lines});
      captions.push('Lines break where a territory has no table for the year. Point at a dot to read it.');
    } else if (view === 'map') {
      await drawMap(); if (!alive()) return;
    } else {
      C.small(chart, {domain: [S.first, S.last], max, share, colour: sel.colour || '#206c72', own: st.own === '1',
        panels: series.map(s => {
          const top = s.points.reduce((a, p) => p.value > (a ? a.value : 0) ? p : a, null);
          return {src: s, title: s.T.name, href: A.url('place.html', {p: s.T.key, y: ''}), points: s.points, table: s.table, seams: s.seams,
            peak: top ? 'Highest: ' + show(top.value) + ' in ' + top.year : (s.points.length ? 'None recorded' : 'No table')};
        }),
        tip: (p, yr) => {
          const s = p.src, d = s.points.find(x => x.year === yr), seam = s.seams.find(x => x.year === yr);
          return (d ? pointTip(s, d) : '<b>' + A.esc(s.T.name) + ', ' + yr + '</b><br><span class="dim">No table for this year</span>') + (seam ? '<br><span class="dim">The official list of diseases changed this year.</span>' : '');
        }});
      captions.push('Grey years have no table. ' + (st.own === '1' ? 'Each territory has its own scale.' : 'All territories share one scale, so heights can be compared.') + (st.lc === '1' ? ' Dotted lines mark a change of the official list of diseases.' : ''));
    }
    captions.forEach(c => panel.append(A.el('p', {class: 'caption'}, c)));
    panel.append(A.el('p', {class: 'caption'}, A.csvButton(() => series.flatMap(s => s.points.map(p => ({territory: s.T.name, year: p.year, disease: sel.title, count: spec.label, number: p.cases, all_cases: p.total, share_percent: +(p.cases / p.total * 100).toFixed(3)}))), 'atlas-' + sel.sel.replace(/[^A-Za-z0-9]+/g, '-'))),
      A.options(fields));

    // what belongs to it
    if (sel.group != null) {
      const cats = Object.entries(S.cats).filter(([, c]) => c[1] === sel.group && c[2] > 0).sort((a, b) => b[1][2] - a[1][2]);
      const pill = ([k, c]) => A.el('a', {class: 'pill', href: A.url('disease.html', {d: 'k:' + k})}, c[0], A.el('small', {style: 'color:var(--muted)'}, A.fmt(c[2])));
      const box = A.el('section', {class: 'panel'}, A.el('h2', {}, 'Diseases in this group'), A.el('p', {class: 'sub'}, 'With the in-patient cases recorded in all territories and years. Select one to follow it.'), A.el('div', {class: 'pills'}, cats.slice(0, 14).map(pill)));
      if (cats.length > 14) box.append(A.el('details', {class: 'more'}, A.el('summary', {}, 'Show the other ' + (cats.length - 14)), A.el('div', {class: 'pills'}, cats.slice(14).map(pill))));
      page.append(box);
    } else if (sel.cat) {
      const codes = Object.entries(S.codes).filter(([, c]) => c[2] === sel.cat && c[3] > 0).sort((a, b) => b[1][3] - a[1][3]);
      const names = A.el('p', {class: 'sub'}, '');
      const box = A.el('section', {class: 'panel'}, A.el('h2', {}, 'How the reports named it'), names);
      A.get('search.json').then(idx => { const r = idx.find(x => x.k === sel.cat); names.textContent = r && r.r ? r.r.split('|').join(' · ') : 'No other names recorded.'; });
      if (codes.length > 1) box.append(A.el('h3', {style: 'margin-top:16px'}, 'Entries of the classification within it'), A.el('div', {class: 'pills'}, codes.map(([k, c]) => A.el('a', {class: 'pill', href: A.url('disease.html', {d: 'c:' + k})}, c[0], A.el('small', {style: 'color:var(--muted)'}, A.fmt(c[3]))))));
      page.append(box);
    }
    main.replaceChildren(page);

    async function drawMap() {
      const g = await C.geo();
      const values = series.flatMap(s => s.points.map(p => p.value)).filter(v => v > 0).sort(d3.ascending);
      const round = v => +v.toPrecision(v >= 10 ? 2 : 1);
      const cuts = [...new Set([0.2, 0.4, 0.6, 0.8].map(q => round(d3.quantileSorted(values, q))))].filter(v => v > 0);
      const colours = CLASSES.slice(CLASSES.length - cuts.length - 1), scale = d3.scaleThreshold().domain(cuts).range(colours);
      const fill = p => !p ? null : p.value > 0 ? scale(p.value) : '#fbfbf7';
      const years = [...new Set(series.flatMap(s => s.points.map(p => p.year)))].sort((a, b) => a - b);
      const decade = st.mode === 'decade', mapBox = A.el('div', {});
      const legend = A.el('div', {class: 'scale-legend'});
      const edges = [0].concat(cuts);
      colours.forEach((c, i) => legend.append(A.el('div', {}, A.el('i', {style: 'background:' + c}), i === colours.length - 1 ? 'over ' + show(edges[i]) : (i === 0 ? 'up to ' : show(edges[i]) + ' to ') + show(cuts[i]))));
      legend.append(A.el('div', {class: 'gap'}, A.el('i', {style: 'background:#fbfbf7;border:1px solid #cdd3cd'}), 'none recorded'), A.el('div', {}, A.el('i', {style: 'background:repeating-linear-gradient(45deg,#eef1ec,#eef1ec 3px,#a9b5ae 3px,#a9b5ae 4px)'}), 'no table'));
      const tipFor = (s, p, label) => p ? '<b>' + A.esc(s.T.name) + ', ' + label + '</b><br>' + show(p.value) + (p.cases != null ? '<br><span class="dim">' + A.fmt(p.cases) + ' of ' + A.fmt(p.total) + ' ' + A.esc(spec.noun) + '</span>' : '') : '<b>' + A.esc(s.T.name) + ', ' + label + '</b><br><span class="dim">No table</span>';
      const bySeries = Object.fromEntries(series.map(s => [s.T.key, s]));
      const congoTip = '<b>Belgian Congo</b><br><span class="dim">Broad groups only; open its page</span>';
      const modeSeg = A.segmented('mode', [['year', 'One year'], ['decade', 'Decade by decade']], 'Period');
      if (decade) {
        const grid = A.el('div', {class: 'decades'});
        d3.range(1890, 1970, 10).forEach(d0 => {
          const mean = Object.fromEntries(series.map(s => { const ps = s.points.filter(p => p.year >= d0 && p.year < d0 + 10); return [s.T.key, ps.length ? {value: d3.mean(ps, p => p.value), n: ps.length} : null]; }));
          const cell = A.el('article', {}, A.el('h3', {}, d0 + 's'));
          C.map(cell, g, {small: true, label: d0 + 's', fill: k => k === 'congo' ? null : fill(mean[k]), href: k => A.url('place.html', {p: k, y: ''}),
            tip: k => k === 'congo' ? congoTip : tipFor(bySeries[k], mean[k], d0 + 's') + (mean[k] ? '<br><span class="dim">Average of ' + mean[k].n + ' year' + (mean[k].n > 1 ? 's' : '') + '</span>' : '')});
          grid.append(cell);
        });
        chart.append(A.el('div', {class: 'map-controls'}, modeSeg), grid, legend);
        captions.push('Each map is the average of the years available in that decade. Modern boundaries.');
        return;
      }
      let year = years.includes(+st.y) ? +st.y : (years.includes(1936) ? 1936 : years[years.length - 1]);
      const label = A.el('span', {class: 'map-year'}, year), slider = A.el('input', {type: 'range', min: years[0], max: years[years.length - 1], step: 1, value: year, 'aria-label': 'Year'});
      const play = A.el('button', {type: 'button', class: 'seg-like', style: 'border:1px solid #a9b5b1;background:#fff;border-radius:8px;padding:7px 14px;cursor:pointer'}, 'Play');
      const paint = () => {
        label.textContent = year; mapBox.replaceChildren();
        const at = Object.fromEntries(series.map(s => [s.T.key, s.points.find(p => p.year === year) || null]));
        C.map(mapBox, g, {labels: true, label: sel.title + ', ' + year, fill: k => k === 'congo' ? null : fill(at[k]), href: k => A.url('place.html', {p: k, y: k === 'congo' ? '' : String(year)}),
          tip: k => k === 'congo' ? congoTip : tipFor(bySeries[k], at[k], year)});
      };
      const stop = () => { clearInterval(timer); timer = null; play.textContent = 'Play'; };
      slider.addEventListener('input', () => { stop(); year = +slider.value; A.quiet({y: String(year)}); paint(); });
      play.addEventListener('click', () => {
        if (timer) { stop(); return; }
        if (year >= years[years.length - 1]) year = years[0] - 1;
        play.textContent = 'Pause';
        timer = setInterval(() => { year += 1; slider.value = year; A.quiet({y: String(year)}); paint(); if (year >= years[years.length - 1]) stop(); }, 650);
      });
      paint();
      chart.append(A.el('div', {class: 'map-controls'}, modeSeg, play, label, slider), A.el('div', {style: 'max-width:640px;margin:0 auto'}, mapBox), legend);
      captions.push('Select a territory to open its page for that year. Modern boundaries.');
    }
  });
}());
