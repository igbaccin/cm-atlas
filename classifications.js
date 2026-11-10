/* Classifications: how diseases are counted, and the same figures read through other classifications. For specialists. */
(function () {
  'use strict';
  const A = window.Atlas;
  const NOTES = {
    african: 'The atlas’s own groups: HistCat with its single group of infectious diseases divided, so that malaria, sleeping sickness, leprosy, venereal disease and yaws, worm infections and the childhood infections can each be seen. A draft, open to change.',
    histcat: 'The grouping that comes with ICD10h and that studies of European causes of death use.',
    chapter: 'The chapters of the International Classification of Diseases, tenth revision.',
    kippen: 'The 32 groups of Rebecca Kippen’s classification of historical causes of death.',
    preston: 'The 12 groups of Preston, Keyfitz and Schoen, Causes of Death: Life Tables for National Populations (1972).',
    list: 'A historical list. Each item gathers the codes that the list would have counted under it, so that every report can be read in the list’s own items, before and after the list was in use.'
  };
  A.run('classifications.html', async function (alive) {
    const S = A.S, st = A.state, main = A.$('#main');
    const schemes = [['african', 'The atlas’s standard groups']].concat(A.BY.slice(1), S.lists.map(l => [l.key, l.label]));
    const by = schemes.some(s => s[0] === st.by) ? st.by : 'african', isList = S.lists.some(l => l.key === by);
    const cases = code => (S.codes[code] || [0, 0, 0, 0])[3];
    let rows = [], unused = 0;
    if (by === 'african') {
      const sum = new Map(), n = new Map();
      Object.entries(S.codes).forEach(([code, c]) => { sum.set(c[1], (sum.get(c[1]) || 0) + c[3]); n.set(c[1], (n.get(c[1]) || 0) + 1); });
      rows = S.groups.map((g, i) => ({label: g.label, note: g.key === g.label ? '' : g.key, entries: n.get(i) || 0, cases: sum.get(i) || 0, sel: g.key === 'UNCODED' ? null : 'g:' + g.key, colour: g.colour}));
    } else {
      main.replaceChildren(A.el('div', {class: 'wrap'}, A.el('p', {class: 'loading'}, 'Loading the classification…')));
      const full = await A.get('codes.json'); if (!alive()) return;
      if (isList) {
        const inventory = (await A.get('lists.json'))[by] || []; if (!alive()) return;
        inventory.forEach(it => {
          const total = d3.sum(it.codes, cases);
          if (!it.codes.length) { unused += 1; return; }
          rows.push({number: it.corrected_number || it.number, label: it.corrected_title || it.title, entries: it.codes.length, cases: total, sel: 'l:' + by + ':' + it.number});
        });
      } else {
        const field = {histcat: 'histcat', kippen: 'group_kippen', preston: 'group_preston', chapter: 'chapter'}[by], kind = {histcat: 'h', kippen: 'kp', preston: 'pr', chapter: 'ch'}[by];
        const acc = new Map();
        Object.entries(full).forEach(([code, c]) => {
          const k = c[field]; if (!k) return;
          let r = acc.get(k); if (!r) acc.set(k, r = {key: k, label: by === 'chapter' ? k + '. ' + c.chapter_title : k, entries: 0, cases: 0, sel: kind + ':' + k, first: code});
          r.entries += 1; r.cases += cases(code); if (code < r.first) r.first = code;
        });
        rows = [...acc.values()];
        if (by === 'chapter') rows.sort((a, b) => a.first.localeCompare(b.first));
        else { const order = new Map(S.schemes[by].map((g, i) => [g.key, i])); rows.sort((a, b) => (order.has(a.key) ? order.get(a.key) : 999) - (order.has(b.key) ? order.get(b.key) : 999)); }
      }
    }
    const total = d3.sum(rows, r => r.cases) || 1;
    const choose = A.el('select', {'aria-label': 'Classification', class: 'title-select', style: 'font-size:26px', onchange: e => A.set({by: e.target.value})}, schemes.map(([k, label]) => A.el('option', {value: k}, label)));
    choose.value = by;
    const columns = [];
    if (isList) columns.push({key: 'number', label: 'Item'});
    columns.push({label: isList ? 'Title in the list' : 'Group', render: r => r.colour ? A.el('span', {}, A.el('i', {class: 'swatch', style: 'background:' + r.colour + ';margin-right:8px'}), r.label) : r.label});
    if (by === 'african') columns.push({key: 'note', label: 'Name in the dataset'});
    columns.push({key: 'entries', label: 'ICD10h entries', num: true}, {key: 'cases', label: 'In-patient cases', num: true},
      {label: 'Share', num: true, render: r => A.pct(r.cases / total * 100)},
      {label: '', render: r => r.sel && r.cases ? A.el('a', {href: A.url('disease.html', {d: r.sel, v: ''})}, 'Follow across territories') : ''});
    main.replaceChildren(A.el('div', {class: 'wrap'},
      A.el('p', {class: 'eyebrow'}, 'For specialists'),
      A.el('h1', {}, 'Classifications'),
      A.el('p', {class: 'lede'}, 'How diseases are counted here, and how to read the same figures through another classification.'),
      A.el('section', {class: 'panel prose'}, A.el('h2', {}, 'One code for every printed line'),
        A.el('p', {}, 'Every disease line printed in the reports was given one code of ICD10h (release 2024.2), the historical version of the International Classification of Diseases built for the study of past causes of death. The code belongs to the printed name and never changes with the view.'),
        A.el('p', {}, 'Everything the atlas shows is a way of adding those codes together:'),
        A.el('ul', {class: 'know'},
          A.el('li', {}, A.el('b', {}, 'An entry'), 'is one ICD10h code, for example B54.000, “Malaria, unspecified”. There are ' + A.fmt(Object.keys(S.codes).length) + ' in use.'),
          A.el('li', {}, A.el('b', {}, 'A disease'), 'is an ICD-10 category, the first three characters of the code: B54, malaria of a type not stated. There are ' + A.fmt(Object.keys(S.cats).length) + '. The commonest carry a plain name beside their formal title.'),
          A.el('li', {}, A.el('b', {}, 'A group'), 'is a set of codes under a classification. The pages use the atlas’s standard groups unless another classification is chosen below.')),
        A.el('p', {}, 'The dataset behind the atlas carries, for every printed figure, the code and its place in each of the classifications listed here, so the same regrouping can be done in Stata from the files.')),
      A.el('section', {class: 'panel'},
        A.el('h2', {}, 'Read the figures through'), choose,
        A.el('p', {class: 'sub', style: 'margin-top:12px'}, NOTES[isList ? 'list' : by]),
        A.el('p', {}, A.el('a', {href: A.url('place.html', {by, y: ''})}, by === 'african' ? 'Open a place with the standard groups' : 'Open a place grouped this way'),
          by === 'african' ? '' : ' · the choice stays in force on the place pages until you remove it there.'),
        A.table(columns, rows),
        A.el('p', {class: 'caption'}, 'In-patient cases in all territories and years. ' + (unused ? A.fmt(unused) + ' items of the list are not shown because no printed line falls under them. ' : '') +
          (isList ? 'Where a report’s own list could not separate two items, the place pages show them together.' : '')),
        A.el('p', {class: 'caption'}, A.csvButton(() => rows.map(r => ({classification: by, item: r.number || '', group: r.label, icd10h_entries: r.entries, inpatient_cases: r.cases})), 'atlas-classification-' + by)))));
  });
}());
