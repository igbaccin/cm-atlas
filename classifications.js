/* Codes, groupings and lists. Calculations are shared with test_page.js. */
(function () {
  'use strict';
  const A = window.Atlas, MISSING = '\u0000missing';
  const sum = rows => rows.reduce((n, r) => n + r, 0);
  const order = (a, b) => String(a).localeCompare(String(b), 'en', {numeric: true});
  const counted = k => !!k && k !== 'UNCODED';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const p = (s, cls) => A.el('p', {class: cls}, s);
  const table = (columns, rows) => {
    const node = A.table(columns, rows); node.setAttribute('tabindex', '0'); node.setAttribute('role', 'region');
    node.setAttribute('aria-label', 'Data table; scroll to read all rows and columns'); return node;
  };
  const caption = (ctx, extra = '') => p(cap(ctx.noun) + ' across all territories and years. ' + extra, 'caption');
  const fields = {histcat: 'histcat', african: 'group_african', kippen: 'group_kippen', preston: 'group_preston', chapter: 'chapter'};
  const kinds = {histcat: 'h', african: 'g', kippen: 'kp', preston: 'pr', chapter: 'ch'};

  function makeModel(S, codes, lists, names, search) {
    const keys = Object.keys(S.codes).filter(k => counted(k) && codes[k]);
    const categories = new Map(), chapters = new Map(), namesByCategory = new Map();
    const titles = new Map(search.map(r => [r.k, r.t]));
    keys.forEach(k => {
      const c = codes[k], cat = c.icd10_3char || k.slice(0, 3);
      if (!categories.has(cat)) categories.set(cat, []); categories.get(cat).push(k);
      if (c.chapter && !chapters.has(c.chapter)) chapters.set(c.chapter, {key: c.chapter, title: c.chapter_title, first: k});
    });
    // A printed name is the disease as printed with its variety, where the line has one. For the search box the thesaurus
    // also holds each of the two parts on its own; they are taken out here, so that a heading such as "Other Epidemic
    // Diseases" does not stand as a printed name of every variety under it. Each value is [figures, figures with repeats].
    const byCode = new Map();
    names.forEach(r => {
      if (!counted(r.code) || !codes[r.code]) return;
      if (!byCode.has(r.code)) byCode.set(r.code, new Map());
      const m = byCode.get(r.code), v = m.get(r.name) || [0, 0]; v[0] += r.n_figures || 0; v[1] += (r.n_figures || 0) + (r.n_repeated_figures || 0); m.set(r.name, v);
    });
    byCode.forEach((m, code) => {
      const parts = new Map(), cat = codes[code].icd10_3char || code.slice(0, 3);
      m.forEach((v, name) => { const i = name.indexOf(' — '); if (i < 0) return; new Set([name.slice(0, i), name.slice(i + 3)]).forEach(x => { const q = parts.get(x) || [0, 0]; q[0] += v[0]; q[1] += v[1]; parts.set(x, q); }); });
      if (!namesByCategory.has(cat)) namesByCategory.set(cat, new Map());
      const out = namesByCategory.get(cat);
      m.forEach((v, name) => { const q = name.includes(' — ') ? [0, 0] : parts.get(name) || [0, 0]; if (v[1] - q[1] > 0) out.set(name, (out.get(name) || 0) + Math.max(v[0] - q[0], 0)); });
    });
    const choices = [['chapter', 'ICD-10 chapters'], ['histcat', 'HistCat'], ['african', 'Standard groups'], ['kippen', 'Kippen'], ['preston', 'Preston']].concat(S.lists.map(l => [l.key, l.label]));
    const inventory = new Map(S.lists.map(l => [l.key, new Map((lists[l.key] || []).map(r => [String(r.number), r]))]));
    const groups = new Map(S.groups.map(g => [g.key, g]));
    const model = {S, codes, keys, lists, categories, chapters: [...chapters.values()].sort((a, b) => order(a.first, b.first)), namesByCategory, titles, choices, inventory, groups};
    model.maps = new Map(choices.map(([by]) => [by, new Map(keys.map(k => [k, describe(model, by, k)]))]));
    return model;
  }
  function describe(m, by, k) {
    const c = m.codes[k] || {}, l = m.inventory.get(by);
    if (l) {
      const r = (c.lists || {})[by];
      if (!r || r.item == null || r.item === '') return {key: MISSING, label: 'No item recorded', number: '', title: 'No item recorded', missing: true};
      const item = String(r.item), i = l.get(item) || {}, number = i.corrected_number || item;
      const title = i.corrected_title || i.title || r.title || 'Title not recorded';
      return {key: item, label: number + ' · ' + title, number, title, combined: r.combined || '', sel: 'l:' + by + ':' + item};
    }
    const key = c[fields[by]], g = by === 'african' ? m.groups.get(key) : ((m.S.schemes[by] || []).find(r => r.key === key));
    if (!key) return {key: MISSING, label: by === 'chapter' ? 'No chapter recorded' : 'No group recorded', missing: true};
    return {key, label: by === 'chapter' ? key + ' · ' + c.chapter_title : (g && g.label) || key, colour: g && g.colour, sel: kinds[by] + ':' + key};
  }
  function schematicCounts(m) {
    const distinct = field => new Set(m.keys.map(k => m.codes[k][field]).filter(Boolean)).size;
    return {printed: new Set([...m.namesByCategory.values()].flatMap(v => [...v.keys()])).size, code: m.keys.length,
      category: m.categories.size, chapter: distinct('chapter'), histcat: distinct('histcat'), african: distinct('group_african'),
      kippen: distinct('group_kippen'), preston: distinct('group_preston'), item: m.S.lists.length};
  }
  function context(m, quick, n) {
    const totals = new Map();
    for (const t of Object.values(quick.territories)) for (const r of t.cells) {
      const code = A.base(t.codes[r[1]]); totals.set(code, (totals.get(code) || 0) + r[2]);
    }
    const items = new Map();
    m.S.lists.forEach(l => {
      const buckets = new Map();
      m.keys.forEach(k => {
        const r = m.maps.get(l.key).get(k), value = totals.get(k) || 0;
        if (!buckets.has(r.key)) buckets.set(r.key, new Map());
        const b = buckets.get(r.key), cat = m.codes[k].icd10_3char || k.slice(0, 3);
        if (value > 0) b.set(cat, (b.get(cat) || 0) + value);
      }); items.set(l.key, buckets);
    });
    return {m, totals, items, n, noun: A.COUNTS[n].noun, total: sum(m.keys.map(k => totals.get(k) || 0)),
      outside: sum([...totals].filter(([k]) => !m.maps.get('chapter').has(k)).map(([, v]) => v))};
  }
  function follow(ctx, cat) {
    const m = ctx.m, keys = [...(m.categories.get(cat) || [])].sort((a, b) => (ctx.totals.get(b) || 0) - (ctx.totals.get(a) || 0) || order(a, b));
    const total = sum(keys.map(k => ctx.totals.get(k) || 0)), rows = [], groups = {};
    for (const by of Object.keys(fields)) {
      const acc = new Map();
      keys.forEach(k => { const r = m.maps.get(by).get(k); if (!acc.has(r.key)) acc.set(r.key, {...r, cases: 0}); acc.get(r.key).cases += ctx.totals.get(k) || 0; });
      groups[by] = [...acc.values()].sort((a, b) => b.cases - a.cases || order(a.label, b.label));
    }
    m.S.lists.forEach(l => {
      const acc = new Map();
      keys.forEach(k => {
        const r = m.maps.get(l.key).get(k);
        if (!acc.has(r.key)) acc.set(r.key, {...r, list: l, cases: 0, codes: [], combinedItems: new Set(), alternatives: new Map()});
        const row = acc.get(r.key), v = ctx.totals.get(k) || 0; row.cases += v; row.codes.push(k);
        if (r.combined) { row.combinedItems.add(r.combined); r.combined.split(';').map(c => c.trim()).filter(c => c && c !== r.key).forEach(c => { if (!row.alternatives.has(c)) row.alternatives.set(c, {cases: 0, codes: []}); const a = row.alternatives.get(c); a.cases += v; a.codes.push(k); }); }
      });
      [...acc.values()].sort((a, b) => order(a.number || '', b.number || '')).forEach(r => {
        r.others = r.missing ? [] : [...(ctx.items.get(l.key).get(r.key) || new Map())].filter(([k]) => k !== cat).map(([key, cases]) => ({key, cases, title: m.titles.get(key) || (m.S.cats[key] || [key])[0]})).sort((a, b) => b.cases - a.cases);
        r.share = total ? r.cases / total * 100 : null;
        r.status = r.missing ? 'No item recorded' : !r.others.length ? 'An item of its own' : r.others.length <= 5 ? 'Shared with one to five others' : 'Shared with more than five';
        r.tone = r.missing ? 'missing' : !r.others.length ? 'own' : r.others.length <= 5 ? 'few' : 'many'; rows.push(r);
      });
    });
    return {cat, keys, total, rows, groups, title: m.titles.get(cat) || (m.S.cats[cat] || [cat])[0], formal: (m.S.cats[cat] || [])[4] || '', names: [...(m.namesByCategory.get(cat) || new Map())].sort((a, b) => b[1] - a[1] || order(a[0], b[0]))};
  }
  // Degrees use positive cases. Whole transfers have one neighbour on both sides.
  function compare(ctx, from, to, chapter) {
    const m = ctx.m, pairs = new Map(), left = new Map(), right = new Map(); let total = 0;
    const fm = m.maps.get(from), tm = m.maps.get(to);
    m.keys.forEach(k => {
      if (chapter !== 'all' && m.codes[k].chapter !== chapter) return;
      const cases = ctx.totals.get(k) || 0; if (cases <= 0) return;
      const a = fm.get(k), b = tm.get(k), key = JSON.stringify([a.key, b.key]); total += cases;
      if (!pairs.has(key)) pairs.set(key, {key, left: a, right: b, cases: 0, codes: []});
      const r = pairs.get(key); r.cases += cases; r.codes.push(k);
      if (!left.has(a.key)) left.set(a.key, new Set()); left.get(a.key).add(b.key);
      if (!right.has(b.key)) right.set(b.key, new Set()); right.get(b.key).add(a.key);
    });
    const shares = {whole: 0, merged: 0, split: 0, both: 0};
    const rows = [...pairs.values()].sort((a, b) => b.cases - a.cases || order(a.left.label, b.left.label));
    rows.forEach(r => { const destinations = left.get(r.left.key), split = destinations.size > 1, merged = [...destinations].some(k => right.get(k).size > 1); r.status = split ? (merged ? 'both' : 'split') : merged ? 'merged' : 'whole'; shares[r.status] += r.cases; });
    return {from, to, chapter, total, rows, shares};
  }
  function flowData(result, limit = 20) {
    const rows = result.rows.filter(r => r.status !== 'whole'), side = which => {
      const acc = new Map();
      rows.forEach(r => { const d = r[which]; if (!acc.has(d.key)) acc.set(d.key, {...d, cases: 0, members: [d.key], labels: [d.label]}); acc.get(d.key).cases += r.cases; });
      const values = [...acc.values()].sort((a, b) => b.cases - a.cases || order(a.label, b.label));
      if (values.length <= limit) return values;
      const rest = values.slice(limit - 1);
      return values.slice(0, limit - 1).concat({key: '\u0000rest', label: rest.length + ' other items or groups', cases: sum(rest.map(r => r.cases)), members: rest.map(r => r.key), labels: rest.map(r => r.label)});
    };
    const left = side('left'), right = side('right'), links = new Map();
    const lm = new Map(left.flatMap((r, i) => r.members.map(k => [k, i]))), rm = new Map(right.flatMap((r, i) => r.members.map(k => [k, i])));
    rows.forEach(r => { const a = lm.get(r.left.key), b = rm.get(r.right.key), key = a + ':' + b; if (!links.has(key)) links.set(key, {a, b, cases: 0, rows: []}); const link = links.get(key); link.cases += r.cases; link.rows.push(r); });
    return {left, right, links: [...links.values()], total: sum(rows.map(r => r.cases))};
  }
  const listName = s => String(s).replace(/\b(classification|nosology)\b/g, 'list');
  function coverage(m, meta, n) {
    const streams = A.COUNTS[n].streams, index = new Map();
    meta.coverage.filter(r => streams.includes(r.stream) && r.status !== 'none').forEach(r => { const k = r.territory + ':' + r.year; if (!index.has(k)) index.set(k, new Set()); (r.lists || []).forEach(l => index.get(k).add(l)); });
    const source = new Map(meta.source_lists.map(l => [l.key, l]));
    return m.S.territories.map(T => ({T, years: Array.from({length: m.S.last - m.S.first + 1}, (_, i) => {
      const year = m.S.first + i, has = index.has(T.key + ':' + year), keys = [...(index.get(T.key + ':' + year) || [])];
      return {year, has, lists: keys.map(key => { const s = source.get(key) || {key, label: key}; return {key, label: listName(s.label), list: /unresolved/i.test(key) ? '' : s.lens_key || ''}; })};
    })}));
  }
  function inventoryRows(ctx, by) {
    const m = ctx.m, acc = new Map();
    if (by === 'african') m.S.groups.filter(g => g.key !== 'UNCODED').forEach(g => acc.set(g.key, {...g, cases: 0, codes: [], sel: 'g:' + g.key}));
    m.keys.forEach(k => { const r = m.maps.get(by).get(k); if (!acc.has(r.key)) acc.set(r.key, {...r, label: r.title || r.label, cases: 0, codes: []}); acc.get(r.key).cases += ctx.totals.get(k) || 0; acc.get(r.key).codes.push(k); });
    return [...acc.values()].sort((a, b) => m.inventory.has(by) ? order(a.number || '', b.number || '') : 0);
  }

  const boxNames = {printed: 'Printed name', code: 'Code', category: 'Category', chapter: 'Chapter', histcat: 'HistCat', kippen: 'Kippen', preston: 'Preston', african: 'Standard groups', item: 'Item'};
  const boxType = k => ['code', 'category', 'chapter'].includes(k) ? 'icd' : ['printed', 'item'].includes(k) ? 'own' : 'grp';
  const boxOrder = ['printed', 'code', 'item', 'category', 'chapter', 'histcat', 'african', 'kippen', 'preston'];
  const relations = {printed: 'From the reports', code: 'Printed name gives Code', item: 'Code gives Item', category: 'Code gives Category', chapter: 'Category gives Chapter', histcat: 'Category gives HistCat', african: 'HistCat gives Standard groups; some groups split', kippen: 'Category gives Kippen', preston: 'Category gives Preston'};
  const sv = (tag, attrs = {}, text) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); if (text != null) el.textContent = text; return el;
  };
  let measureContext;
  function textWidth(value) {
    if (measureContext === undefined) {
      const canvas = document.createElement('canvas'); measureContext = canvas.getContext ? canvas.getContext('2d') : null;
      if (measureContext) measureContext.font = '14px system-ui';
    }
    return measureContext ? measureContext.measureText(value).width : value.length * 8;
  }
  function wrapText(value, width) {
    const lines = []; let line = '';
    String(value).split(/\s+/).forEach(word => {
      while (textWidth(word) > width) {
        if (line) { lines.push(line); line = ''; }
        let length = 1; while (length < word.length && textWidth(word.slice(0, length + 1)) <= width) length++;
        lines.push(word.slice(0, length)); word = word.slice(length);
      }
      if (line && textWidth(line + ' ' + word) > width) { lines.push(line); line = ''; }
      line += (line ? ' ' : '') + word;
    });
    if (line) lines.push(line); return lines.length ? lines : [''];
  }
  function schematic(values, id, title) {
    const figure = A.el('figure', {class: 'n27-schematic'}), svg = sv('svg', {class: 'n27-wide', role: 'img', 'aria-labelledby': id + '-title ' + id + '-desc'});
    svg.append(sv('title', {id: id + '-title'}, title), sv('desc', {id: id + '-desc'}, 'Read each arrow as gives. Printed name gives Code. Code gives Category and Item. Category gives Chapter, HistCat, Kippen and Preston. HistCat gives Standard groups, with some groups split. All box values are in the text table below.'));
    const defs = sv('defs'), marker = sv('marker', {id: id + '-arrow', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto'});
    marker.append(sv('path', {d: 'M1,1 L7,4 L1,7', fill: 'none', stroke: '#637174', 'stroke-width': 1.5})); defs.append(marker); svg.append(defs);
    const b = {};
    Object.keys(values).forEach(key => {
      const width = ['printed', 'code', 'category'].includes(key) ? 286 : key === 'item' ? 270 : 222;
      const lines = values[key].flatMap(t => wrapText(t, width - 26));
      b[key] = {key, width, lines, height: 50 + lines.length * 19};
    });
    const gap = 54;
    b.printed.x = 397; b.printed.y = 12;
    b.code.x = 397; b.code.y = b.printed.y + b.printed.height + gap;
    b.item.x = 746; b.item.y = b.code.y;
    b.category.x = 397; b.category.y = b.code.y + Math.max(b.code.height, b.item.height) + gap;
    ['chapter', 'histcat', 'kippen', 'preston'].forEach((k, i) => { b[k].x = [57, 305, 553, 801][i]; b[k].y = b.category.y + b.category.height + gap; });
    b.african.x = 305; b.african.y = b.histcat.y + Math.max(...['chapter', 'histcat', 'kippen', 'preston'].map(k => b[k].height)) + gap;
    svg.setAttribute('viewBox', '0 0 1080 ' + (b.african.y + b.african.height + 15));
    const arrow = (a, z, side) => {
      const x1 = a.x + (side ? a.width : a.width / 2), y1 = a.y + (side ? Math.min(a.height, z.height) / 2 : a.height);
      const x2 = z.x + (side ? 0 : z.width / 2), y2 = z.y + (side ? Math.min(a.height, z.height) / 2 : 0);
      svg.append(sv('line', {x1, y1, x2, y2: y2 - (side ? 0 : 4), stroke: '#637174', 'stroke-width': 1.5, 'marker-end': 'url(#' + id + '-arrow)'}));
    };
    arrow(b.printed, b.code); arrow(b.code, b.item, true); arrow(b.code, b.category);
    ['chapter', 'histcat', 'kippen', 'preston'].forEach(k => arrow(b.category, b[k])); arrow(b.histcat, b.african);
    svg.append(sv('text', {x: 432, y: b.african.y - 22, class: 'n27-svg-note'}, 'some groups split'));
    Object.values(b).forEach(r => {
      svg.append(sv('rect', {x: r.x, y: r.y, width: r.width, height: r.height, rx: 8, class: 'n27-box-' + boxType(r.key)}));
      svg.append(sv('text', {x: r.x + 13, y: r.y + 25, class: 'n27-svg-heading'}, boxNames[r.key]));
      r.lines.forEach((line, i) => svg.append(sv('text', {x: r.x + 13, y: r.y + 48 + 19 * i, class: 'n27-svg-value'}, line)));
    });
    const mobile = A.el('div', {class: 'n27-stack'}, boxOrder.map(k => A.el('div', {}, p(relations[k], 'n27-relation'), A.el('div', {class: 'n27-card n27-box-' + boxType(k)}, A.el('h3', {}, boxNames[k]), values[k].map(v => p(v))))));
    const legend = A.el('div', {class: 'legend'}, [['icd', 'ICD-10'], ['grp', 'Groupings'], ['own', 'From the reports’ own time']].map(([kind, label]) => A.el('span', {}, A.el('i', {class: 'swatch n27-box-' + kind}), label)));
    figure.append(svg, mobile, legend, A.el('details', {class: 'more'}, A.el('summary', {}, 'Read the picture as text'), table([{label: 'Box', render: r => boxNames[r]}, {label: 'Values', render: r => values[r].join('; ')}, {label: 'Arrow', render: r => relations[r]}], boxOrder)));
    return figure;
  }
  function overview(ctx) {
    const c = schematicCounts(ctx.m), values = {};
    Object.keys(boxNames).forEach(k => { values[k] = [A.fmt(c[k]) + (k === 'printed' ? ' different printed names' : ['code', 'category', 'chapter'].includes(k) ? ' in use' : ' groups in use')]; });
    values.item = ['in each of ' + A.fmt(c.item) + ' lists'];
    return A.el('section', {class: 'panel prose'}, A.el('h2', {}, '1. How it fits together'), schematic(values, 'n27-overview', 'How codes, groupings and lists fit together'),
      p('The numbers in the boxes count what the data hold: printed names that have a code, and codes, categories, chapters and groups in use. They stay the same whichever count is chosen above.', 'caption'),
      p('Read every arrow as “gives”. Everything below a box is worked out from it.'),
      table([{key: 'word', label: 'Word'}, {key: 'example', label: 'Example'}, {key: 'meaning', label: 'What it tells'}], [
        {word: 'Printed name', example: '“Lobar Pneumonia”', meaning: 'the report’s own words'}, {word: 'Code', example: 'J18.100', meaning: 'the exact diagnosis: lobar pneumonia'},
        {word: 'Category', example: 'J18', meaning: 'the disease: pneumonia'}, {word: 'Chapter', example: 'X', meaning: 'the part of medicine: diseases of the respiratory system'}]),
      p('“Broncho-pneumonia” gets J18.000, another code in the same category. The code tells lobar from broncho, the category says only pneumonia, and the chapter says only respiratory. The category is the first three characters of the code, and each category belongs to one chapter. Code, category and chapter together are ICD-10, the International Classification of Diseases in its tenth revision. The codes are those of ICD10h (release 2024.2), its historical version, built for the study of past causes of death. The other pages of the atlas call a category a disease.'),
      A.el('p', {}, A.el('b', {}, 'Groupings. '), 'A grouping does the chapter’s job in another way: it sorts the categories into groups. Pneumonia falls in “Respiratory” in HistCat, in “Diseases of the respiratory system” in Kippen’s grouping and in “Influenza, pneumonia, bronchitis” in Preston’s. The standard groups are the atlas’s own. They are HistCat with some of its groups divided, so that malaria, for example, stands apart from the other infections, which is why they sit under HistCat.'),
      A.el('p', {}, A.el('b', {}, 'Lists. '), 'A list is an older classification of the same diseases, in most cases the International Classification of Diseases as it stood in an earlier year (1909, 1920, 1929, 1938, 1948). An item is a code of a list. For every code, the item it corresponds to in each list has been recorded: lobar pneumonia, J18.100, is item 108 of the 1929 list. An item is worked out from the code, just as a group is. Every report was printed in the list of its day, so when the list changed, the lines of the report changed with it. The code stays the same through all of that.'));
  }
  function followView(ctx, cat) {
    const d = follow(ctx, cat), m = ctx.m, values = {
      printed: d.names.slice(0, 3).map(([name, n]) => '“' + name + '” (' + A.fmt(n) + ' figures)'),
      code: d.keys.slice(0, 4).map(k => k + ' · ' + m.codes[k].title + ' (' + A.fmt(ctx.totals.get(k) || 0) + ')'),
      category: [d.cat + ' · ' + d.title, d.formal].filter(Boolean),
      item: m.S.lists.map(l => l.label + ': ' + d.rows.filter(r => r.list.key === l.key).map(r => r.number || 'no item recorded').join(', '))
    };
    if (!values.printed.length) values.printed.push('No printed names recorded');
    if (!values.code.length) values.code.push('No codes recorded');
    if (d.names.length > 3) values.printed.push('and ' + A.fmt(d.names.length - 3) + ' more printed names');
    if (d.keys.length > 4) values.code.push('and ' + A.fmt(d.keys.length - 4) + ' more codes');
    Object.keys(fields).forEach(by => { const rows = d.groups[by]; values[by] = rows.length ? [rows[0].label + (rows.length > 1 ? '; and ' + A.fmt(rows.length - 1) + ' other' + (rows.length > 2 ? 's' : '') : '')] : ['None recorded']; });
    return A.el('section', {class: 'panel'}, A.el('h2', {}, '2. Follow one disease'),
      p('Choose a category by its name, printed name or three characters.', 'sub'), A.searchBox('Find a category, for example pneumonia or J18', true, true),
      A.el('h3', {class: 'n27-selected', tabindex: '-1', 'data-category-heading': 'true'}, d.cat + ' · ' + d.title), schematic(values, 'n27-follow', 'Follow ' + d.cat + ', ' + d.title),
      caption(ctx, A.fmt(d.total) + ' under this category. Codes and groups are in the order of this count. Printed names are in the order of the number of printed figures that carry them, whatever the count.'),
      A.el('details', {class: 'more'}, A.el('summary', {}, 'All codes and groups for this category'),
        table([{key: 'code', label: 'Code'}, {key: 'title', label: 'Title'}, {key: 'cases', label: cap(ctx.noun), num: true}], d.keys.map(k => ({code: k, title: m.codes[k].title, cases: ctx.totals.get(k) || 0}))),
        table([{key: 'by', label: 'Chapter or grouping'}, {key: 'label', label: 'Chapter or group'}, {key: 'cases', label: cap(ctx.noun), num: true}], Object.keys(fields).flatMap(by => d.groups[by].map(r => ({...r, by: m.choices.find(c => c[0] === by)[1]}))))),
      A.el('h3', {class: 'n27-selected'}, 'The items for this category'),
      p('An item is shared when other categories have cases under it. Each code is counted once in each list.', 'caption'),
      table([{label: 'List', render: r => r.list.label}, {key: 'number', label: 'Item'}, {label: 'Title and mapping', render: r => A.el('span', {}, r.title, r.combinedItems.size ? r.alternatives.size ? A.el('small', {class: 'n27-mapping'}, [...r.alternatives].map(([item, a]) => A.fmt(a.cases) + ' of these ' + ctx.noun + ' (code' + (a.codes.length > 1 ? 's ' : ' ') + a.codes.join(', ') + ') may also belong under item ' + item + '.').join(' ') + ' Every case is counted once, under item ' + r.number + '.') : null : null)},
        {key: 'cases', label: cap(ctx.noun), num: true}, {label: 'Share of category', num: true, render: r => A.pct(r.share)},
        {label: 'Sharing', render: r => A.el('span', {class: 'n27-status ' + r.tone}, r.status)}, {label: 'Other categories with cases', render: r => {
          if (!r.others.length) return r.missing ? 'No item to compare' : '0';
          return A.el('details', {}, A.el('summary', {}, A.fmt(r.others.length) + (r.others.length === 1 ? ' other category' : ' other categories')), table([{label: 'Category', render: o => A.el('a', {href: A.url('classifications.html', {cat: o.key})}, o.key + ' · ' + o.title)}, {key: 'cases', label: cap(ctx.noun), num: true}], r.others));
        }}], d.rows), caption(ctx, 'Item shares use the cases of the selected category; the counts of other categories use their own cases.'));
  }

  const choose = (key, label, options, value, reset = {}) => {
    const select = A.el('select', {'data-choice': key, onchange: e => A.set({[key]: e.target.value, ...reset})}, options.map(([v, text]) => A.el('option', {value: v}, text))); select.value = value;
    return A.el('label', {}, label, select);
  };
  function interactive(node, label, activate) {
    node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', label);
    const show = e => { const r = node.getBoundingClientRect(); A.tipShow(e && e.clientX != null ? e : {clientX: r.left + r.width / 2, clientY: r.top + r.height / 2}, A.esc(label)); };
    node.addEventListener('pointerenter', show); node.addEventListener('pointerleave', A.tipHide); node.addEventListener('focus', show); node.addEventListener('blur', A.tipHide);
    node.addEventListener('click', activate); node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } if (e.key === 'Escape') A.tipHide(); });
  }
  const flowToken = (kind, keys) => JSON.stringify([kind, ...keys]);
  // what a gathered box or band holds: the first twelve by name, and how many more; selecting it lists them all
  const gathered = (names, what) => 'It holds ' + names.slice(0, 12).join('; ') + (names.length > 12 ? '; and ' + A.fmt(names.length - 12) + ' more ' + what + ', all listed when you select it' : '') + '.';
  function flowPicture(ctx, result) {
    const data = flowData(result), figure = A.el('figure', {class: 'n27-flow'});
    if (!data.total) { figure.append(p(result.total ? 'Every item or group passes whole. All pairs are in the table below.' : 'No cases for this chapter and count.', 'empty')); return figure; }
    const height = Math.max(460, Math.max(data.left.length, data.right.length) * 35), pad = 19;
    const scale = (height - 40 - pad * (Math.max(data.left.length, data.right.length) - 1)) / data.total;
    [data.left, data.right].forEach(side => { let y = 25; side.forEach(r => { r.y = y; r.h = r.cases * scale; r.offset = 0; y += r.h + pad; }); });
    const svg = sv('svg', {viewBox: '0 0 1000 ' + height, role: 'group', 'aria-labelledby': 'n27-flow-title n27-flow-desc'});
    svg.append(sv('title', {id: 'n27-flow-title'}, 'Cases between ' + ctx.m.choices.find(r => r[0] === result.from)[1] + ' and ' + ctx.m.choices.find(r => r[0] === result.to)[1]),
      sv('desc', {id: 'n27-flow-desc'}, 'Box heights and band widths are proportional to cases. Whole transfers are in the table. Focus a box or band for its full name and count. Select it to list its codes. The table below contains every pair.'));
    const pick = (kind, keys) => A.set({flow: flowToken(kind, keys)});
    data.links.forEach(link => {
      const a = data.left[link.a], b = data.right[link.b], y1 = a.y + a.offset, y2 = b.y + b.offset, h = link.cases * scale;
      const path = sv('path', {d: 'M288,' + y1 + ' C465,' + y1 + ' 535,' + y2 + ' 712,' + y2 + ' L712,' + (y2 + h) + ' C535,' + (y2 + h) + ' 465,' + (y1 + h) + ' 288,' + (y1 + h) + 'Z', fill: A.palette[link.a % A.palette.length], class: 'n27-band'});
      interactive(path, a.label + ' → ' + b.label + ': ' + A.fmt(link.cases) + ' ' + ctx.noun + (a.members.length > 1 || b.members.length > 1 ? '. ' + gathered(link.rows.map(r => r.left.label + ' → ' + r.right.label + ' (' + A.fmt(r.cases) + ')'), 'pairs') : ''), () => pick('pairs', link.rows.map(r => r.key))); svg.append(path); a.offset += h; b.offset += h;
    });
    [data.left, data.right].forEach((side, si) => side.forEach((r, i) => {
      const x = si ? 712 : 270, group = sv('g', {class: 'n27-flow-box'});
      group.append(sv('rect', {x, y: r.y, width: 18, height: r.h, fill: r.colour || A.palette[i % A.palette.length]}));
      group.append(sv('rect', {x: si ? 711 : 0, y: r.y - 2, width: 289, height: Math.max(r.h, 9), fill: 'transparent'}));
      group.append(sv('text', {x: si ? 740 : 260, y: r.y + r.h / 2 + 4, 'text-anchor': si ? 'start' : 'end', class: 'n27-svg-value'}, r.label.length > 34 ? r.label.slice(0, 32) + '…' : r.label));
      interactive(group, r.label + ': ' + A.fmt(r.cases) + ' ' + ctx.noun + (r.members.length > 1 ? '. ' + gathered(r.labels, 'items or groups') : ''), () => pick(si ? 'right' : 'left', r.members)); svg.append(group);
    }));
    figure.append(A.el('div', {class: 'n27-flow-scroll', tabindex: '0', role: 'region', 'aria-label': 'Flow picture; scroll horizontally on a narrow screen'}, svg)); return figure;
  }
  function flowSelection(ctx, result, token) {
    let selection; try { selection = JSON.parse(token); } catch (_) { return null; }
    if (!Array.isArray(selection)) return null;
    const [kind, ...keys] = selection, rows = result.rows.filter(r => kind === 'pairs' ? keys.includes(r.key) : (kind === 'left' || kind === 'right') && keys.includes(r[kind].key));
    if (!rows.length) return null;
    const codes = [...new Set(rows.flatMap(r => r.codes))].sort((a, b) => (ctx.totals.get(b) || 0) - (ctx.totals.get(a) || 0));
    return A.el('div', {class: 'n27-selection', tabindex: '-1', 'data-flow-selection': 'true'}, A.el('h3', {}, 'Codes behind the selection'),
      p(rows.map(r => r.left.label + ' → ' + r.right.label).join('; '), 'caption'),
      table([{label: 'Code', render: k => A.el('a', {href: A.url('disease.html', {d: 'c:' + k})}, k)}, {label: 'Title', render: k => ctx.m.codes[k].title}, {label: cap(ctx.noun), num: true, render: k => ctx.totals.get(k) || 0}], codes),
      A.el('button', {type: 'button', class: 'link', onclick: () => A.set({flow: ''})}, 'Clear this selection'));
  }
  function comparisonView(ctx, st) {
    const result = compare(ctx, st.from, st.to, st.chapter), labels = {whole: 'passes whole', merged: 'is merged with others', split: 'is split', both: 'is both split and merged'};
    const names = new Map(ctx.m.choices);
    return A.el('div', {},
      A.el('div', {class: 'n27-controls'}, choose('from', 'From', ctx.m.choices, st.from, {flow: ''}), choose('to', 'To', ctx.m.choices, st.to, {flow: ''}), choose('chapter', 'Chapter', [['all', 'All chapters']].concat(ctx.m.chapters.map(r => [r.key, r.key + ' · ' + r.title])), st.chapter, {flow: ''})),
      p(result.total ? 'Of ' + A.fmt(result.total) + ' ' + ctx.noun + ', ' + Object.keys(labels).map(k => A.pct(result.shares[k] / result.total * 100) + ' ' + labels[k]).join('; ') + '.' : 'There are no cases for this chapter and count.', 'n27-summary'),
      p('An item or group on the left passes whole when all its cases go to one item or group on the right that takes nothing else. It is split when its cases go to several, and merged when the one it goes to also takes cases from others. The shares count the cases of the chosen chapter. Cases whose code has no item in a list stand under “No item recorded”.', 'caption'),
      p('Where a list could place a code under either of two items, the code is counted once, under the item recorded for it. Both sides hold the same cases.', 'caption'),
      A.el('div', {class: 'row spread n27-selected'}, A.el('b', {}, names.get(st.from)), A.el('b', {}, names.get(st.to))), flowPicture(ctx, result),
      caption(ctx, 'Chapter: ' + (st.chapter === 'all' ? 'all chapters' : st.chapter) + '. Select a box or band to see its codes. On a narrow screen, scroll the picture or use the pairs table.'), flowSelection(ctx, result, st.flow),
      A.el('h3', {class: 'n27-selected'}, 'Every pair'),
      table([{label: 'From: ' + names.get(st.from), render: r => r.left.label}, {label: 'To: ' + names.get(st.to), render: r => r.right.label}, {key: 'cases', label: cap(ctx.noun), num: true}, {label: 'Transfer', render: r => labels[r.status]}, {label: 'Codes', render: r => A.el('button', {type: 'button', class: 'link', onclick: () => A.set({flow: flowToken('pairs', [r.key])})}, A.fmt(r.codes.length) + (r.codes.length === 1 ? ' code' : ' codes'))}], result.rows),
      caption(ctx, 'Chapter: ' + (st.chapter === 'all' ? 'all chapters' : st.chapter) + '. Pairs with cases are shown, including whole transfers.'),
      A.csvButton(() => result.rows.map(r => ({from: names.get(st.from), from_item_or_group: r.left.label, to: names.get(st.to), to_item_or_group: r.right.label, chapter: st.chapter, count: ctx.noun, cases: r.cases, transfer: labels[r.status], codes: r.codes.join('; ')})), 'atlas-pairs-' + st.from + '-' + st.to + '-' + st.chapter + '-' + ctx.n));
  }
  function coverageView(ctx, meta) {
    const rows = coverage(ctx.m, meta, ctx.n), lists = ctx.m.S.lists, colour = key => { const i = lists.findIndex(l => l.key === key); return i < 0 ? '#9aa5a2' : A.palette[i % A.palette.length]; };
    const cellText = (T, y) => T.name + ', ' + y.year + ': ' + (y.lists.length ? y.lists.map(l => l.label).join('; ') : y.has ? 'list not named' : 'no return for this count');
    const svg = sv('svg', {viewBox: '0 0 ' + (210 + (ctx.m.S.last - ctx.m.S.first + 1) * 11) + ' ' + (42 + rows.length * 30), role: 'group', 'aria-labelledby': 'n27-coverage-title n27-coverage-desc'});
    svg.append(sv('title', {id: 'n27-coverage-title'}, 'The lists followed in each territory and year'), sv('desc', {id: 'n27-coverage-desc'}, 'Each territory has one row. Each year has one cell. Several coloured strips and a plus sign mean several lists. Focus or point at a cell for names. The full table is below.'));
    for (let y = ctx.m.S.first; y <= ctx.m.S.last; y++) if (y === ctx.m.S.first || y === ctx.m.S.last || y % 10 === 0) svg.append(sv('text', {x: 180 + (y - ctx.m.S.first) * 11, y: 15, class: 'n27-svg-note'}, y));
    rows.forEach((r, i) => {
      svg.append(sv('text', {x: 0, y: 43 + i * 30, class: 'n27-svg-value'}, r.T.name));
      r.years.forEach((y, j) => {
        const cell = sv('g', {tabindex: 0, role: 'img', 'aria-label': cellText(r.T, y)}), x = 180 + j * 11, top = 28 + i * 30;
        const parts = y.lists.length ? y.lists : [{list: ''}];
        parts.forEach((l, k) => cell.append(sv('rect', {x, y: top + k * 20 / parts.length, width: 10, height: 20 / parts.length, fill: y.has ? colour(l.list) : '#ebece5', stroke: '#fffefa', 'stroke-width': .3})));
        if (y.lists.length > 1) cell.append(sv('text', {x: x + 5, y: top + 14, 'text-anchor': 'middle', class: 'n27-multiple'}, '+'));
        const show = e => { const rect = cell.getBoundingClientRect(); A.tipShow(e && e.clientX != null ? e : {clientX: rect.left, clientY: rect.top}, A.esc(cellText(r.T, y))); };
        cell.addEventListener('pointerenter', show); cell.addEventListener('pointerleave', A.tipHide); cell.addEventListener('focus', show); cell.addEventListener('blur', A.tipHide); cell.addEventListener('keydown', e => { if (e.key === 'Escape') A.tipHide(); }); svg.append(cell);
      });
    });
    return A.el('div', {}, caption(ctx, 'Each cell shows the list that the returns of that year follow (' + A.COUNTS[ctx.n].streams.join(', ') + ').'),
      A.el('div', {class: 'n27-coverage-scroll', tabindex: '0', role: 'region', 'aria-label': 'Territories and years; scroll horizontally on a narrow screen'}, svg),
      A.el('div', {class: 'legend'}, lists.map(l => A.el('span', {}, A.el('i', {class: 'swatch', style: 'background:' + colour(l.key)}), l.label)), A.el('span', {}, A.el('i', {class: 'swatch', style: 'background:#9aa5a2'}), 'A colony’s own list, or a list not named with certainty'), A.el('span', {}, A.el('i', {class: 'swatch', style: 'background:#ebece5'}), 'No return for this count'), A.el('span', {}, '+ Several lists')),
      p('Point at a year, or move to it with the keyboard, to read the name of its list. A grey cell is a year printed in a colony’s own list, or in a list that could not be named with certainty, such as the 1948 revision where its short and its detailed list cannot be told apart. A pale cell is a year with no return for this count.', 'caption'),
      A.el('details', {class: 'more'}, A.el('summary', {}, 'Read every territory and year as a table'), table([{key: 'territory', label: 'Territory'}, {key: 'year', label: 'Year'}, {key: 'lists', label: 'Lists followed'}], rows.flatMap(r => r.years.map(y => ({territory: r.T.name, year: y.year, lists: y.lists.map(l => l.label).join('; ') || (y.has ? 'List not named' : 'No return for this count')}))))));
  }
  function inventoryView(ctx, by) {
    const rows = inventoryRows(ctx, by), isList = ctx.m.inventory.has(by), columns = [];
    if (isList) columns.push({key: 'number', label: 'Item'});
    columns.push({label: isList ? 'Title in the list' : by === 'chapter' ? 'Chapter' : 'Group', render: r => A.el('span', {}, r.colour ? A.el('i', {class: 'swatch', style: 'background:' + r.colour + ';margin-right:8px'}) : null, r.label)},
      {label: 'Codes in use', num: true, render: r => r.codes.length}, {key: 'cases', label: cap(ctx.noun), num: true}, {label: 'Share', num: true, render: r => A.pct(ctx.total ? r.cases / ctx.total * 100 : null)},
      {label: 'Disease page', render: r => r.sel && r.cases ? A.el('a', {href: A.url('disease.html', {d: r.sel, v: ''})}, 'Follow across territories') : ''});
    return A.el('div', {}, A.el('h3', {}, 'Read the figures through'), A.el('div', {class: 'n27-controls'}, choose('by', 'Grouping or list', ctx.m.choices, by)),
      A.el('a', {href: A.url('place.html', {by, y: ''})}, isList ? 'Open a place with this list' : by === 'chapter' ? 'Open a place by chapter' : 'Open a place with this grouping'),
      table(columns, rows), caption(ctx, 'Codes without a recorded mapping remain in a separate row. ' + (isList ? 'Items with no codes in use are omitted. Where the report’s list could not separate items, the Place page shows them together.' : '')),
      A.csvButton(() => rows.map(r => ({grouping_or_list: by, item: r.number || '', title: r.label, codes: r.codes.length, count: ctx.noun, cases: r.cases})), 'atlas-groups-items-' + by + '-' + ctx.n));
  }
  function originsView(ctx) {
    const facts = [
      ['ICD-10 chapters', 'The 22 chapters of ICD-10; a chapter is the coarsest part of the code itself.'],
      ['HistCat', 'The grouping that comes with ICD10h and that studies of European causes of death use.'],
      ['Standard groups', 'The atlas’s own grouping, HistCat with three of its groups divided. Its single group of infectious diseases is divided so that malaria, sleeping sickness, leprosy, venereal disease and yaws, worm infections and the childhood infections can each be seen. The Z codes of ICD-10 (examinations, antenatal and postnatal care, vaccinations and other contacts with health services) are taken out of its external causes. Its group “Other” is divided by ICD-10 chapter into skin diseases, diseases of the eye and ear, diseases of the bones, joints and muscles, and nutritional and endocrine diseases. A draft, open to change.'],
      ['Kippen', 'The 32 groups that Rebecca Kippen devised for historical causes of death.'],
      ['Preston', 'The 12 groups of Preston, Keyfitz and Schoen, Causes of Death: Life Tables for National Populations (1972).'],
      ['Registrar-General 1901', 'The list of the Registrar-General of England and Wales of 1901. No report in the collection follows it; it is kept for comparison.'],
      ['International List 1909', 'The second revision of the International List of Causes of Death, as the International Classification of Diseases was called before 1948.'],
      ['International List 1920', 'The third revision of the International List of Causes of Death, as the International Classification of Diseases was called before 1948.'],
      ['International List 1929', 'The fourth revision of the International List of Causes of Death, as the International Classification of Diseases was called before 1948.'],
      ['International List 1938', 'The fifth revision of the International List of Causes of Death, as the International Classification of Diseases was called before 1948.'],
      ['1948 List A', 'The sixth revision, in its short list of 150 items (A 1 to A 150).'],
      ['1948 detailed list', 'The sixth revision, in its detailed list of three-digit codes.'],
      ['The colonies’ own lists', 'In some years a colony printed its returns in a list of its own. Their lines have codes like any others, and part 4 shows the years.']
    ];
    return A.el('div', {class: 'prose'}, facts.map(([title, text]) => A.el('div', {class: 'n27-origin'}, A.el('h3', {}, title), p(text))));
  }
  function fold(id, title, hint, fill, st) {
    const body = A.el('div', {}), d = A.el('details', {class: 'fold n27-fold', 'data-section': id}, A.el('summary', {}, title, A.el('small', {}, hint)), body);
    const populate = () => { if (!d.dataset.done) { body.append(fill()); d.dataset.done = '1'; } };
    d.open = st.sections.split(',').includes(id); if (d.open) populate();
    d.addEventListener('toggle', () => {
      if (d.open) populate();
      const next = new Set((A.state.sections || '').split(',').filter(Boolean));
      if (d.open) next.add(id); else next.delete(id);
      A.quiet({sections: [...next].sort().join(',')});
    }); return d;
  }
  let modelPromise;
  const getModel = () => modelPromise || (modelPromise = Promise.all(['codes.json', 'lists.json', 'thesaurus.json', 'search.json'].map(A.get)).then(([c, l, n, s]) => makeModel(A.S, c, l, n, s)));
  A.codesPage = {makeModel, schematicCounts, context, follow, compare, flowData, coverage, inventoryRows, overview, followView, comparisonView, coverageView, inventoryView, originsView, schematic, flowSelection};
  A.run('classifications.html', async function (alive) {
    const raw = {...A.state}, n = ['in', 'out', 'died'].includes(raw.n) ? raw.n : 'in';
    const [m, quick, meta] = await Promise.all([getModel(), A.get('quick_' + n + '.json'), A.get('meta.json')]); if (!alive()) return;
    const keys = m.choices.map(r => r[0]);
    const st = {...raw, n, cat: m.categories.has(raw.cat) ? raw.cat : m.categories.has('J18') ? 'J18' : [...m.categories.keys()][0], from: keys.includes(raw.from) ? raw.from : keys.includes('list1938') ? 'list1938' : keys[0], to: keys.includes(raw.to) ? raw.to : keys.includes('list1948a') ? 'list1948a' : keys[0], chapter: raw.chapter === 'all' || m.chapters.some(c => c.key === raw.chapter) ? raw.chapter : m.chapters.some(c => c.key === 'I') ? 'I' : 'all', by: keys.includes(raw.by) ? raw.by : 'african'};
    // One count across the complete atlas; carried Place/Disease filters do not narrow it.
    Object.assign(st, {m: '', pop: 'all', sx: '', fac: '', ill: '', rep: '0', p: '', y: ''});
    const normal = {}; Object.keys(st).forEach(k => { if (st[k] !== raw[k]) normal[k] = st[k]; }); if (Object.keys(normal).length) A.quiet(normal);
    const ctx = context(m, quick, n), page = A.el('div', {class: 'wrap n27'}, A.el('h1', {}, 'Codes, groupings and lists'),
      p('From the report’s printed name to its code, category, chapter, groups and items.', 'lede'),
      A.el('section', {class: 'panel n27-count'}, A.el('h2', {}, 'One count throughout this page'), A.segmented('n', [['in', 'In-patient cases'], ['out', 'Out-patient cases'], ['died', 'Deaths in hospital']], 'Count throughout this page'),
        caption(ctx, A.fmt(ctx.total) + ' with a code. ' + (ctx.outside ? 'A further ' + A.fmt(ctx.outside) + ' stand under broad printed groups or carry no code, and are left out of this page. ' : '') + 'All people and facilities are included; repeated tables are excluded.')),
      overview(ctx), followView(ctx, st.cat), A.el('section', {class: 'panel'},
        fold('3', '3. From one list or grouping to another', 'follow the same cases between items and groups', () => comparisonView(ctx, st), st),
        fold('4', '4. The list each territory’s reports follow', 'every territory and year', () => coverageView(ctx, meta), st),
        fold('5', '5. The groups of a grouping, the items of a list', 'read the figures through', () => inventoryView(ctx, st.by), st),
        fold('6', '6. Where each grouping and list comes from', 'short notes on their origins', () => originsView(ctx), st)));
    const active = document.activeElement, oldSection = active && active.closest ? active.closest('[data-section]') : null;
    const focusSection = oldSection && oldSection.dataset.section, choice = active && active.dataset && active.dataset.choice;
    const countFocus = active && active.closest && active.closest('.n27-count');
    const categoryFocus = active && active.closest && active.closest('.n27') && active.closest('.search');
    A.$('#main').replaceChildren(page);
    if (choice) { const next = page.querySelector('[data-choice="' + choice + '"]'); if (next) next.focus(); }
    else if (st.flow && focusSection === '3') { const selected = page.querySelector('[data-flow-selection]'); if (selected) selected.focus(); }
    else if (focusSection) { const summary = page.querySelector('[data-section="' + focusSection + '"] summary'); if (summary) summary.focus(); }
    else if (countFocus) { const button = page.querySelector('.n27-count button.on'); if (button) button.focus(); }
    else if (categoryFocus) { const heading = page.querySelector('[data-category-heading]'); if (heading) heading.focus(); }
  });
}());
