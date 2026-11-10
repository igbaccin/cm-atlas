/* Home: two ways in, a place or a disease. */
(function () {
  'use strict';
  const A = window.Atlas, C = A.charts;
  const QUICK = ['Malaria', 'Tuberculosis', 'Trypanosomiasis', 'Leprosy', 'Venereal and treponemal disease', 'Helminths', 'Diarrhoea', 'Airborne childhood infections', 'Respiratory', 'External'];
  A.run('index.html', async function (alive) {
    const S = A.S, main = A.$('#main');
    const mapBox = A.el('div', {}, A.el('p', {class: 'loading'}, 'Drawing the map…')), stripBox = A.el('div', {});
    const pills = QUICK.map(k => S.groups.find(g => g.key === k)).filter(Boolean).map(g =>
      A.el('a', {class: 'pill', href: A.url('disease.html', {d: 'g:' + g.key})}, A.el('i', {class: 'swatch', style: 'background:' + g.colour}), g.label));
    main.replaceChildren(A.el('div', {class: 'wrap'},
      A.el('h1', {}, 'What did colonial hospitals record?'),
      A.el('p', {class: 'lede'}, 'The diseases reported each year by government hospitals in eleven African territories, 1887 to 1967, taken from the printed annual medical reports.'),
      A.el('div', {class: 'home-grid'},
        A.el('section', {class: 'panel', style: 'margin-top:0'},
          A.el('h2', {}, 'Start with a place'),
          A.el('p', {class: 'sub'}, 'Choose a territory on the map or in the list.'),
          mapBox),
        A.el('div', {},
          A.el('section', {class: 'panel', style: 'margin-top:0'},
            A.el('h2', {}, 'Start with a disease'),
            A.el('p', {class: 'sub'}, 'Type a name as you know it, or as the reports printed it.'),
            A.searchBox('For example: malaria, yaws, pneumonia', true),
            A.el('div', {class: 'pills'}, pills)),
          A.el('section', {class: 'panel'},
            A.el('h2', {}, 'The eleven territories'),
            A.el('ul', {class: 'place-list'}, S.territories.slice().sort((a, b) => a.name.localeCompare(b.name)).map(T =>
              A.el('li', {}, A.el('a', {href: A.url('place.html', {p: T.key, y: ''})}, A.el('span', {}, A.placeLabel(T)), A.el('small', {}, T.first + '–' + T.last)))))))),
      A.el('section', {class: 'panel'},
        A.el('h2', {}, 'Which years are covered'),
        A.el('p', {class: 'sub'}, 'Dark: the year has in-patient figures by disease. Pale: only other tables survive. Select a year to open it.'),
        stripBox)));
    C.strip(stripBox, {href: (T, y) => A.url('place.html', {p: T.key, y})});
    try {
      const g = await C.geo(); if (!alive()) return;
      mapBox.replaceChildren();
      C.map(mapBox, g, {labels: true, label: 'The eleven territories on a map of Africa', fill: () => '#2f8088', href: k => A.url('place.html', {p: k, y: ''}),
        tip: k => { const T = S.T[k]; return '<b>' + A.esc(A.placeLabel(T)) + '</b><br>' + T.first + '–' + T.last + (T.groups_only ? '<br>Broad groups of diseases only' : '') + '<br><span class="dim">Select to open</span>'; }});
      mapBox.append(A.el('p', {class: 'caption'}, 'Modern boundaries, to locate the territories.'));
    } catch (e) { mapBox.replaceChildren(A.el('p', {class: 'caption'}, 'The map could not be drawn (' + e.message + '). Use the list of territories.')); }
  });
}());
