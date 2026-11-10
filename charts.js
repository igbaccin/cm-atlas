/* Atlas of disease: the charts. D3 only; every chart draws years without a table as gaps, never as zero. */
(function () {
  'use strict';
  const A = window.Atlas, C = A.charts = {};
  const svgEl = (w, h, label) => d3.create('svg').attr('viewBox', [0, 0, w, h]).attr('role', 'img').attr('aria-label', label || '');
  const short = d3.format('~s');

  function seamMarks(svg, seams, xOf, top, bottom, hover) {
    seams.forEach(s => {
      const x = xOf(s.year); if (x == null) return;
      const g = svg.append('g').attr('class', 'seam');
      g.append('line').attr('x1', x).attr('x2', x).attr('y1', top).attr('y2', bottom);
      if (!hover) return;
      g.append('path').attr('d', 'M' + (x - 5) + ',' + (top - 10) + 'h10l-5,8z');
      g.append('rect').attr('x', x - 9).attr('y', top - 14).attr('width', 18).attr('height', 16).attr('fill', 'transparent')
        .on('pointermove', e => A.tipShow(e, A.esc(s.text))).on('pointerleave', A.tipHide);
    });
  }

  // Stacked columns, one per year. o: {years, layers:[{label, colour, values: Map}], mode:'share'|'count', seams, selected, onPick, tip(year,total), noun, label}
  C.columns = function (node, o) {
    const W = 1100, H = 420, m = {l: 54, r: 12, t: 30, b: 30};
    const first = o.years[0], last = o.years[o.years.length - 1], share = o.mode === 'share';
    const x = d3.scaleBand().domain(d3.range(first, last + 1)).range([m.l, W - m.r]).paddingInner(0.14).paddingOuter(0.1);
    const totals = new Map(o.years.map(yr => [yr, d3.sum(o.layers, L => L.values.get(yr) || 0)]));
    const y = d3.scaleLinear().domain([0, share ? 100 : (d3.max(totals.values()) || 1)]).range([H - m.b, m.t]); if (!share) y.nice();
    const svg = svgEl(W, H, o.label), grid = svg.append('g').attr('class', 'grid');
    y.ticks(5).forEach(t => {
      grid.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t));
      svg.append('text').attr('x', m.l - 8).attr('y', y(t) + 4).attr('text-anchor', 'end').text(share ? t + '%' : short(t));
    });
    const step = last - first > 45 ? 10 : 5;
    d3.range(first, last + 1).filter(yr => yr % step === 0).forEach(yr => svg.append('text').attr('x', x(yr) + x.bandwidth() / 2).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(yr));
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#8f9a95');
    const gap = x.step() - x.bandwidth();
    o.years.forEach(yr => {
      const tot = totals.get(yr); if (!tot) return;
      const g = svg.append('g').attr('class', 'col' + (yr === o.selected ? ' sel' : ''));
      let acc = 0;
      o.layers.forEach(L => {
        const v = L.values.get(yr) || 0; if (!v) return;
        const val = share ? v / tot * 100 : v;
        g.append('rect').attr('x', x(yr)).attr('width', x.bandwidth()).attr('y', y(acc + val)).attr('height', Math.max(0, y(acc) - y(acc + val))).attr('fill', L.colour);
        acc += val;
      });
      g.append('rect').attr('class', 'hit').attr('x', x(yr) - gap / 2).attr('width', x.step()).attr('y', m.t).attr('height', H - m.b - m.t)
        .attr('tabindex', 0).attr('role', 'button').attr('aria-label', yr + ': ' + A.fmt(tot) + ' ' + o.noun)
        .on('pointermove', e => A.tipShow(e, o.tip(yr, tot))).on('pointerleave', A.tipHide)
        .on('click', () => o.onPick && o.onPick(yr)).on('keydown', e => { if (e.key === 'Enter' && o.onPick) o.onPick(yr); });
    });
    seamMarks(svg, o.seams || [], yr => yr > first && yr <= last ? x(yr) - gap / 2 : null, m.t, H - m.b, true);
    node.append(svg.node());
  };

  // Rank of each layer in each year. o: {years, layers:[{label, colour, values}], seams}
  C.rank = function (node, o) {
    const W = 1100, n = o.layers.length, H = 60 + n * 34, m = {l: 34, r: 250, t: 24, b: 30};
    const first = o.years[0], last = o.years[o.years.length - 1];
    const x = d3.scaleLinear().domain([first, last]).range([m.l + 10, W - m.r]);
    const y = d3.scalePoint().domain(d3.range(1, n + 1)).range([m.t + 10, H - m.b - 10]);
    const svg = svgEl(W, H, 'Rank of the main disease groups in each year');
    d3.range(1, n + 1).forEach(r => svg.append('text').attr('x', m.l - 8).attr('y', y(r) + 4).attr('text-anchor', 'end').text(r));
    const step = last - first > 45 ? 10 : 5;
    d3.range(first, last + 1).filter(yr => yr % step === 0).forEach(yr => svg.append('text').attr('x', x(yr)).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(yr));
    const rank = new Map();   // year -> Map(layer index -> rank)
    o.years.forEach(yr => {
      const order = o.layers.map((L, i) => [i, L.values.get(yr) || 0]).filter(d => d[1] > 0).sort((a, b) => b[1] - a[1]);
      rank.set(yr, new Map(order.map((d, k) => [d[0], k + 1])));
    });
    seamMarks(svg, o.seams || [], yr => yr > first && yr <= last ? x(yr - 0.5) : null, m.t, H - m.b, true);
    const line = d3.line().x(d => x(d.year)).y(d => y(d.rank)).curve(d3.curveMonotoneX);
    const ends = [];
    o.layers.forEach((L, i) => {
      const pts = o.years.filter(yr => rank.get(yr).has(i)).map(yr => ({year: yr, rank: rank.get(yr).get(i), value: L.values.get(yr)}));
      if (!pts.length) return;
      let run = [];
      const flush = () => { if (run.length > 1) svg.append('path').attr('d', line(run)).attr('fill', 'none').attr('stroke', L.colour).attr('stroke-width', 2.4).attr('opacity', .85); run = []; };
      pts.forEach((p, k) => { if (k && o.years.indexOf(p.year) !== o.years.indexOf(pts[k - 1].year) + 1) flush(); run.push(p); });
      flush();
      pts.forEach(p => svg.append('circle').attr('cx', x(p.year)).attr('cy', y(p.rank)).attr('r', 4).attr('fill', L.colour).attr('stroke', '#fffefa')
        .on('pointermove', e => A.tipShow(e, '<b>' + A.esc(L.label) + '</b><br>' + p.year + ': number ' + p.rank + ' · ' + A.fmt(p.value) + ' ' + A.esc(o.noun))).on('pointerleave', A.tipHide));
      const lastP = pts[pts.length - 1];
      ends.push({y: y(lastP.rank), label: L.label, colour: L.colour, x: x(lastP.year)});
    });
    ends.sort((a, b) => a.y - b.y); ends.forEach((e, k) => { if (k && e.y - ends[k - 1].y < 14) e.y = ends[k - 1].y + 14; });
    ends.forEach(e => {
      svg.append('line').attr('x1', e.x + 6).attr('x2', W - m.r + 8).attr('y1', e.y).attr('y2', e.y).attr('stroke', e.colour).attr('stroke-dasharray', '1 3');
      svg.append('text').attr('x', W - m.r + 12).attr('y', e.y + 4).attr('fill', '#202d30').text(e.label.length > 38 ? e.label.slice(0, 37) + '…' : e.label);
    });
    node.append(svg.node());
  };

  // Small charts, one per territory. o: {panels:[{title, href, points, table:Set, seams, peak}], domain, max, share, colour, own, tip(panel, year)}
  C.small = function (node, o) {
    const grid = A.el('div', {class: 'small-grid'});
    o.panels.forEach(p => {
      const W = 300, H = 150, m = {l: 36, r: 6, t: 12, b: 20};
      const years = d3.range(o.domain[0], o.domain[1] + 1);
      const x = d3.scaleBand().domain(years).range([m.l, W - m.r]).paddingInner(0.12);
      const top = (o.own ? d3.max(p.points, d => d.value) : o.max) || 1;
      const y = d3.scaleLinear().domain([0, top]).range([H - m.b, m.t]);
      const svg = svgEl(W, H, p.title);
      years.forEach(yr => { if (!p.table.has(yr)) svg.append('rect').attr('class', 'notable').attr('x', x(yr)).attr('width', x.step()).attr('y', m.t).attr('height', H - m.b - m.t); });
      [0, top].forEach(t => svg.append('text').attr('x', m.l - 5).attr('y', y(t) + 4).attr('text-anchor', 'end').text(o.share ? A.pct(t) : short(Math.round(t))));
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#8f9a95');
      years.filter(yr => yr % 20 === 0).forEach(yr => svg.append('text').attr('x', x(yr) + x.bandwidth() / 2).attr('y', H - 5).attr('text-anchor', 'middle').text(yr));
      seamMarks(svg, p.seams || [], yr => yr >= o.domain[0] && yr <= o.domain[1] ? x(yr) : null, m.t, H - m.b, false);
      p.points.forEach(d => { if (d.value > 0) svg.append('rect').attr('x', x(d.year)).attr('width', Math.max(1, x.bandwidth())).attr('y', y(Math.min(d.value, top))).attr('height', y(0) - y(Math.min(d.value, top))).attr('fill', o.colour); });
      svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.b - m.t).attr('fill', 'transparent')
        .on('pointermove', e => { const px = d3.pointer(e)[0], yr = o.domain[0] + Math.max(0, Math.min(years.length - 1, Math.floor((px - m.l) / x.step()))); A.tipShow(e, o.tip(p, yr)); })
        .on('pointerleave', A.tipHide);
      grid.append(A.el('article', {}, A.el('h3', {}, A.el('a', {href: p.href, title: 'Open ' + p.title}, p.title)), A.el('div', {class: 'peak'}, p.peak), svg.node()));
    });
    node.append(grid);
  };

  // All territories on one chart. o: {series:[{label, colour, points:[{year, value}]}], domain, share, log, tip(series, point)}
  C.lines = function (node, o) {
    const W = 1100, H = 440, m = {l: 54, r: 16, t: 16, b: 30};
    const all = o.series.flatMap(s => s.points), max = d3.max(all, d => d.value) || 1;
    const x = d3.scaleLinear().domain(o.domain).range([m.l, W - m.r]);
    const positive = all.filter(d => d.value > 0).map(d => d.value), floor = positive.length ? d3.min(positive) : 1;
    const y = o.log ? d3.scaleLog().domain([floor, max]).range([H - m.b, m.t]).clamp(true) : d3.scaleLinear().domain([0, max]).nice().range([H - m.b, m.t]);
    const svg = svgEl(W, H, 'Territories compared'), grid = svg.append('g').attr('class', 'grid');
    (o.log ? y.ticks(5, '~g') : y.ticks(5)).forEach(t => {
      grid.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t));
      svg.append('text').attr('x', m.l - 8).attr('y', y(t) + 4).attr('text-anchor', 'end').text(o.share ? A.pct(t) : short(t));
    });
    d3.range(Math.ceil(o.domain[0] / 10) * 10, o.domain[1] + 1, 10).forEach(yr => svg.append('text').attr('x', x(yr)).attr('y', H - m.b + 18).attr('text-anchor', 'middle').text(yr));
    const line = d3.line().x(d => x(d.year)).y(d => y(o.log ? Math.max(d.value, floor) : d.value));
    const dots = [];
    o.series.forEach(s => {
      if (!s.points.length) return;
      let run = [];
      const flush = () => { if (run.length > 1) svg.append('path').attr('d', line(run)).attr('fill', 'none').attr('stroke', s.colour).attr('stroke-width', 2).attr('opacity', .9); run = []; };
      s.points.forEach((p, k) => { if (k && p.year !== s.points[k - 1].year + 1) flush(); run.push(p); });
      flush();
      s.points.forEach(p => dots.push({s, p, cx: x(p.year), cy: y(o.log ? Math.max(p.value, floor) : p.value)}));
    });
    dots.forEach(d => svg.append('circle').attr('cx', d.cx).attr('cy', d.cy).attr('r', 2.4).attr('fill', d.s.colour));
    const focus = svg.append('circle').attr('r', 6).attr('fill', 'none').attr('stroke', '#202d30').attr('stroke-width', 1.5).attr('display', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.b - m.t).attr('fill', 'transparent')
      .on('pointermove', e => {
        const [px, py] = d3.pointer(e); let best = null, bd = 1e9;
        dots.forEach(d => { const dist = (d.cx - px) ** 2 + (d.cy - py) ** 2; if (dist < bd) { bd = dist; best = d; } });
        if (!best || bd > 2500) { focus.attr('display', 'none'); A.tipHide(); return; }
        focus.attr('display', null).attr('cx', best.cx).attr('cy', best.cy); A.tipShow(e, o.tip(best.s, best.p));
      })
      .on('pointerleave', () => { focus.attr('display', 'none'); A.tipHide(); });
    node.append(svg.node());
  };

  // ---------- map of Africa on modern boundaries
  const WORLD = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
  const IDS = {894: 'zambia', 72: 'bechuanaland', 800: 'uganda', 180: 'congo', 288: 'gold_coast', 454: 'malawi', 694: 'sierra_leone', 404: 'kenya', 566: 'nigeria'};
  const AFRICA = new Set([12, 24, 204, 72, 854, 108, 120, 132, 140, 148, 174, 178, 180, 262, 818, 226, 232, 748, 231, 266, 270, 288, 324, 624, 384, 404, 426, 430, 434, 450, 454, 466, 478, 480, 504, 508, 516, 562, 566, 646, 678, 686, 690, 694, 706, 710, 728, 729, 834, 768, 788, 800, 894, 716, 732]);
  const LABEL = {sierra_leone: [-9, 4, 'end'], zanzibar: [11, 4, 'start'], malawi: [9, 10, 'start'], gold_coast: [0, 30, 'middle'], uganda: [0, -12, 'middle']};
  let geo;
  C.geo = function () {
    if (!geo) geo = fetch(WORLD).then(r => { if (!r.ok) throw new Error('map boundaries: HTTP ' + r.status); return r.json(); }).then(topology => {
      if (!window.topojson) throw new Error('the map library could not load');
      const countries = topojson.feature(topology, topology.objects.countries).features.filter(f => AFRICA.has(+f.id)), territories = [];
      countries.forEach(f => {
        if (IDS[+f.id]) territories.push({type: 'Feature', key: IDS[+f.id], geometry: f.geometry});
        if (+f.id === 834) {   // Tanzania: the islands of Unguja and Pemba are Zanzibar, the rest Tanganyika
          const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates], islands = [], mainland = [];
          polys.forEach(p => { const c = d3.geoCentroid({type: 'Polygon', coordinates: p}); (c[0] > 38.8 && c[1] > -6.6 ? islands : mainland).push(p); });
          territories.push({type: 'Feature', key: 'tanganyika', geometry: {type: 'MultiPolygon', coordinates: mainland}}, {type: 'Feature', key: 'zanzibar', geometry: {type: 'MultiPolygon', coordinates: islands}});
        }
      });
      return {countries, territories};
    });
    return geo;
  };
  let mapId = 0;
  // o: {fill(key) -> colour or null (no figure), href(key), tip(key) -> html, small, labels}
  C.map = function (node, g, o) {
    const W = o.small ? 300 : 640, H = o.small ? 310 : 660, id = 'hatch' + (++mapId);
    const projection = d3.geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], {type: 'MultiPoint', coordinates: [[-18.5, 37.8], [52, -35.2]]}), path = d3.geoPath(projection);
    const labels = [];
    const svg = svgEl(W, H, o.label || 'Map of Africa');
    const pat = svg.append('defs').append('pattern').attr('id', id).attr('patternUnits', 'userSpaceOnUse').attr('width', 5).attr('height', 5);
    pat.append('rect').attr('width', 5).attr('height', 5).attr('fill', '#eef1ec'); pat.append('path').attr('d', 'M-1,1L1,-1M0,5L5,0M4,6L6,4').attr('stroke', '#a9b5ae').attr('stroke-width', 1);
    svg.append('g').selectAll('path').data(g.countries).join('path').attr('d', path).attr('fill', '#e6e8e2').attr('stroke', '#fffefa').attr('stroke-width', .4);
    g.territories.forEach(f => {
      const colour = o.fill(f.key), paint = colour || 'url(#' + id + ')';
      const a = svg.append('a').attr('href', o.href(f.key)).attr('aria-label', A.S.T[f.key].name);
      const show = e => A.tipShow(e, o.tip(f.key));
      a.append('path').datum(f).attr('d', path).attr('class', 'map-territory').attr('fill', paint).on('pointermove', show).on('pointerleave', A.tipHide);
      const c = projection(d3.geoCentroid(f));
      if (f.key === 'zanzibar') a.append('circle').attr('cx', c[0]).attr('cy', c[1]).attr('r', o.small ? 4 : 6).attr('class', 'map-territory').attr('fill', paint).on('pointermove', show).on('pointerleave', A.tipHide);
      if (o.labels) labels.push([f.key, c]);
    });
    labels.forEach(([key, c]) => { const l = LABEL[key] || [0, 4, 'middle']; svg.append('text').attr('class', 'map-label').attr('x', c[0] + l[0]).attr('y', c[1] + l[1]).attr('text-anchor', l[2]).text(A.S.T[key].name); });
    node.append(svg.node());
  };

  // Years covered, one row per territory. o: {href(T, year)}
  C.strip = function (node, o) {
    const S = A.S, W = 1100, left = 170, row = 26, top = 26, n = S.last - S.first + 1, cell = (W - left - 8) / n;
    const svg = svgEl(W, top + S.territories.length * row + 6, 'Years covered by each territory').attr('class', 'strip');
    d3.range(S.first, S.last + 1).filter(yr => yr % 10 === 0).forEach(yr => svg.append('text').attr('x', left + (yr - S.first + .5) * cell).attr('y', 14).attr('text-anchor', 'middle').text(yr));
    S.territories.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((T, i) => {
      const y = top + i * row, ins = new Set(T.years), other = new Set(T.other_years);
      svg.append('a').attr('href', o.href(T, '')).append('text').attr('x', left - 10).attr('y', y + 14).attr('text-anchor', 'end').text(T.name);
      d3.range(S.first, S.last + 1).forEach(yr => {
        const kind = ins.has(yr) ? 'in' : other.has(yr) ? 'other' : 'none';
        const r = svg.append('rect').attr('class', kind).attr('x', left + (yr - S.first) * cell).attr('y', y).attr('width', cell - 1.2).attr('height', row - 7);
        if (kind === 'none') return;
        r.on('pointermove', e => A.tipShow(e, '<b>' + A.esc(T.name) + ', ' + yr + '</b><br>' + (kind === 'in' ? 'In-patient figures by disease' : 'Other tables only (out-patients, deaths or combined figures)')))
          .on('pointerleave', A.tipHide).on('click', () => { location.href = o.href(T, kind === 'in' ? String(yr) : ''); });
      });
    });
    node.append(svg.node());
  };
}());
