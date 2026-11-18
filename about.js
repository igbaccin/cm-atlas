/* About the data: the short version first, the detail folded away. */
(function () {
  'use strict';
  const A = window.Atlas, C = A.charts;
  const fold = (title, hint, fill) => {
    const body = A.el('div', {}), d = A.el('details', {class: 'fold'}, A.el('summary', {}, title, A.el('small', {}, hint)), body);
    d.addEventListener('toggle', async () => {
      if (!d.open || d.dataset.done) return; d.dataset.done = '1';
      body.append(A.el('p', {class: 'caption'}, 'Loading…'));
      try { const nodes = await fill(); body.replaceChildren(...[].concat(nodes)); } catch (e) { body.replaceChildren(A.el('p', {class: 'caption warning'}, 'Could not load this section: ' + e.message)); }
    });
    return d;
  };
  const p = text => A.el('p', {}, text);

  A.run('about.html', async function () {
    const S = A.S, main = A.$('#main'), name = k => (S.T[k] || {name: k}).name;
    const know = [
      ['These are hospital patients, not rates of disease.', 'A rise can mean more disease, or simply more hospitals and more people using them. Shares of all cases are the safer comparison, so the atlas shows shares first.'],
      ['What a year covers can change.', 'Some reports print one table for the whole territory, others a table for each hospital, district or region, which the atlas adds up. Some years add mission and voluntary hospitals, dispensaries, prisons or clinics. A jump can come from a change in what the returns cover. On a place’s page, a strip under the columns says how each year was put together, a ◆ marks a change of coverage, and “More options” can leave out the dispensaries, mission hospitals and other services that the reports print apart.'],
      ['Some lines name no illness.', 'The returns also count women delivered without complications, healthy babies, people examined or vaccinated, people kept under observation and found free of illness, and malingerers. All of them are in the charts, as printed. On the pages of a place and of a disease, “More options” can show the lines of illness and injury alone, or the lines of persons without illness alone.'],
      ['Blank years are missing reports, not years without disease.', 'Nothing is filled in or estimated.'],
      ['The official list of diseases changed several times.', 'When a territory adopted a new list, cases could move from one line to another. The charts mark those years with ▾; a jump at a mark deserves caution.'],
      ['One count per year.', 'In-patient cases are the admissions of the year where a table prints them, and the patients treated during the year where it does not; a year can add tables of both kinds. Point at a year to see which.'],
      ['The Belgian Congo is different.', 'Its reports give broad groups of diseases only, so it has a page of its own but is absent from the comparisons of single diseases.']
    ];
    main.replaceChildren(A.el('div', {class: 'wrap'},
      A.el('h1', {}, 'About the data'),
      A.el('p', {class: 'lede'}, 'Where the numbers come from, and what to keep in mind when reading them.'),
      A.el('section', {class: 'panel prose'}, A.el('h2', {}, 'What this is'),
        p('Colonial medical departments published a report every year. Each report printed tables of the diseases treated in its hospitals and dispensaries, disease by disease: the in-patients admitted, treated and dying, and the out-patients treated. Most tables are of government hospitals; in some years the reports also print mission and voluntary hospitals, prisons or clinics, and the atlas adds them where they are printed.'),
        p('This atlas brings those tables together for eleven territories, from 1887 to 1967: about 1.4 million printed figures. Every printed disease name has been matched to one code of ICD10h, the historical version of the International Classification of Diseases, so that a disease can be followed across territories and years whatever a report called it.')),
      A.el('section', {class: 'panel'}, A.el('h2', {}, 'Seven things to know'),
        A.el('ul', {class: 'know'}, know.map(([b, t]) => A.el('li', {}, A.el('b', {}, b), t)))),
      A.el('section', {class: 'panel'}, A.el('h2', {}, 'The detail'), A.el('p', {class: 'sub'}, 'Open a line to read more.'),
        fold('Years and tables covered', 'which years each territory has', async () => {
          const box = A.el('div', {}); C.strip(box, {href: (T, y) => A.url('place.html', {p: T.key, y})});
          return [A.el('p', {class: 'caption'}, 'Dark: in-patient figures by disease. Pale: only other tables (out-patients, deaths, or in- and out-patients together).'), box,
            A.table([{label: 'Territory', render: T => A.el('a', {href: A.url('place.html', {p: T.key, y: ''})}, A.placeLabel(T))}, {label: 'Reports', render: T => T.first + '–' + T.last}, {label: 'Years with in-patient figures', num: true, render: T => T.years.length}, {label: 'Lists of diseases used', render: T => T.lists.join('; ')}], S.territories)];
        }),
        fold('How diseases are grouped', 'the groups behind the colours', async () => [
          p('The standard groups follow HistCat, the grouping that comes with ICD10h and that studies of European causes of death use, with its single group of infectious diseases divided so that malaria, sleeping sickness, leprosy, venereal disease and yaws, worm infections and the childhood infections can each be seen. The grouping is a draft and may change.'),
          p('HistCat files the Z codes of ICD-10 (chapter XXI, which covers examinations, antenatal and postnatal care, vaccinations, healthy babies, operations, malingering and other contacts with health services) with the external causes. Since 16 November 2026 the standard groups give them a group of their own, “Examinations, antenatal care and other services”, so that “Injuries and poisoning” holds injuries and poisonings only. The HistCat groups under “More options” keep them where HistCat puts them. The group follows the code and the choice “What the lines name” follows the printed words, so lines with a Z code fall in each of its three classes.'),
          p('Since 17 November 2026 the standard groups also divide HistCat’s group “Other” by ICD-10 chapter: skin diseases (chapter XII), diseases of the eye and ear (VII and VIII), diseases of the bones, joints and muscles (XIII) and nutritional and endocrine diseases (IV) each have a group of their own. “Other” keeps the diseases of the blood, the mental disorders and a few symptoms.'),
          A.table([{label: 'Group', render: g => A.el('span', {}, A.el('i', {class: 'swatch', style: 'background:' + g.colour + ';margin-right:8px'}), g.label)}, {key: 'key', label: 'Name in the dataset'}], S.groups),
          A.el('p', {class: 'caption'}, 'The same figures can be regrouped by HistCat, ICD-10 chapters, Kippen’s groups, Preston’s groups, or the items of a historical list: see ', A.el('a', {href: 'classifications.html'}, 'Codes, groupings and lists'), ', or “More options” on a place’s page.')]),
        fold('Lines that could not be classified', 'a small remainder', async () => {
          const meta = await A.get('meta.json');
          return [p('A few printed lines name no disease that can be classified. They are kept and shown as “Not classified”.'),
            A.table([{label: 'Territory', render: r => name(r.territory)}, {key: 'line_figures', label: 'Printed figures', num: true}, {key: 'uncoded_figures', label: 'Not classified', num: true}, {label: 'Share', num: true, render: r => A.pct(r.uncoded_share * (r.uncoded_share <= 1 ? 100 : 1))}], meta.quality.filter(r => r.line_figures))];
        }),
        fold('Lines that name no illness', 'childbirth, examinations, vaccinations', async () => {
          const rows = await A.get('illness.json');
          return [p('Every printed name was read to say what its line names: an illness or injury; persons without illness, or a service given to them; or neither. The third class holds the lines that do not say: operations with no illness named, lines that put illness and normal childbirth together, re-attendances, and lines with no name. The Belgian Congo’s classes of obstetrics hold deliveries and their complications together, so they fall in the third class.'),
            p('Each name was read twice, independently, on 16 November 2026. A third reading settled the names on which the two differed, and a further reader, who did not see the result, checked a selection of 680 names, drawn at random within each class, with every name of the class without illness and the names with the most cases. The table gives the kinds, with the cases counted under each in all territories and years.'),
            A.table([{key: 'kind', label: 'What the line names'}, {key: 'class', label: 'Class'}, {key: 'names', label: 'Printed names', num: true}, {key: 'in', label: 'In-patient cases', num: true}, {key: 'out', label: 'Out-patient cases', num: true}, {key: 'both', label: 'In- and out-patients together', num: true}], rows)];
        }),
        fold('Checking the printed arithmetic', 'do the columns add up', async () => {
          const meta = await A.get('meta.json');
          return [p('Where a report prints patients in hospital at the start of the year, patients admitted and patients treated, the first two should add up to the third. The table counts the figures where they do and where they do not. No printed figure is changed. The check has caught one slip so far: in Nyasaland’s tables of 1934 to 1938 the typed headings of deaths and patients treated were exchanged, and they were put back in the order the reports print (10 November 2026).'),
            A.table([{label: 'Territory', render: r => name(r.territory)}, {key: 'inpatient_pass', label: 'Add up', num: true}, {key: 'inpatient_fail', label: 'Do not add up', num: true}, {label: 'Share that fails', num: true, render: r => A.pct(r.inpatient_fail / Math.max(1, r.inpatient_pass + r.inpatient_fail) * 100)}], meta.quality.filter(r => r.inpatient_pass + r.inpatient_fail))];
        }),
        fold('Tables printed twice', 'left out unless you ask', async () => {
          const meta = await A.get('meta.json');
          return [p('Some tables were printed in two reports, or typed twice from two copies. The atlas counts each once. “More options” can bring the second copies back.'),
            A.table([{label: 'Territory', render: r => name(r.territory)}, {key: 'repeat_lines', label: 'Figures in repeated tables', num: true}], meta.quality.filter(r => r.repeat_lines))];
        }),
        fold('Tables without a printed year', 'found in the reports, not yet on the charts', async () => {
          const rows = await A.get('report_year_assignments.json');
          return [p('Some pages print no year. Their years were found in the reports themselves on 9 November 2026 and enter the charts at the next rebuild of the dataset.'),
            A.table([{label: 'Territory', render: r => name(r.territory)}, {key: 'sheet', label: 'Sheet'}, {key: 'proposed_year', label: 'Report year', render: r => String(r.proposed_year)}, {key: 'figures', label: 'Figures', num: true, render: r => +r.figures}, {key: 'basis', label: 'Evidence'}], rows)];
        }),
        fold('How each printed figure is counted once', 'totals, parts and overlapping columns', async () => {
          const meta = await A.get('meta.json');
          return [p('Reports often print a total beside its parts: all hospitals and each hospital, both sexes and each sex, the year and its months. The atlas takes the printed total where there is one and adds the parts where there is not, and never adds a total to its parts. A total over every kind of hospital, such as Tanganyika’s “Territorial” beside its government and mission hospitals, replaces them all. A year printed again in a later report, or the same patients printed in a second table, is counted once (see “Tables printed twice”). Each table is counted in its own measure, so that a year adds a region that prints admissions to one that prints only the patients treated. Men and women are counted together, by the printed total for both sexes where there is one; where a report prints them apart, “More options” can show men or women alone, for the years that print them.'),
            p('Corrected on 12 November 2026: until then the atlas counted Tanganyika’s figures of 1952 to 1967 twice, and those of Nigeria 1920–1922, Uganda 1928–1929, the Belgian Congo 1940 and Tanganyika 1924 (in- and out-patients together) two or three times; Nigeria 1958–1959, Sierra Leone 1907–1909 and Nyasaland 1912 had lost tables printed in another measure. Shares of cases were hardly affected; numbers of cases were.'),
            p('Audited the same day. Three independent checks of every table against its own printed totals found more. The atlas left out rows printed with their own figures and no disease lines under them: Sierra Leone’s dispensary and hospital returns of 1905–1926 and 1941, Tanganyika 1946–1949, and single rows elsewhere. It also left out Nyasaland’s rural dispensaries of 1935–1938 and its 1952 out-patients, printed by class only. It counted twice totals read in as disease lines (Nigeria 1960, Uganda 1949, six Nyasaland returns), blocks typed twice (Nigeria 1911, the Gold Coast 1935, Northern Rhodesia 1931) and earlier years printed again (Zanzibar 1946–1949). All are now counted once. Still open: the Belgian Congo’s four tables of 1951, whose coverage the transcription does not state, and some undated figures.'),
            p('Corrected for release v1.1, 16 and 17 November 2026. The Belgian Congo’s French tables print thousands with a point, and 51 of their figures (in 1936, 1938 and undated tables) had been read as decimals, “11.116” as eleven and a fraction. Five totals of Nigeria and Tanganyika had the same fault; one of them, malaria among Tanganyika’s out-patients of 1962, is counted on the atlas. All 56 are now read as thousands. With that reading 16 of the 19 Congo tables add up to their printed totals, and the other three come within 1, 2 and 60 of them, as printed.'),
            A.table([{label: 'Territory', render: r => name(r.territory)}, {key: 'rule', label: 'Rule'}, {key: 'scopes', label: 'Times applied', num: true}, {key: 'figures', label: 'Figures', num: true}, {key: 'note', label: 'What it does'}], meta.counting_rules.filter(r => r.scopes))];
        }),
        fold('The columns of the dataset', 'for those who will use the files', async () => {
          const rows = d3.csvParse(await (await fetch('data/codebook.csv')).text()), cols = rows.columns;
          return [p('The dataset itself is kept in the project folder and cannot be downloaded here. Each chart offers the numbers on screen as a CSV file.'), A.table(cols.map(c => ({key: c, label: c})), rows)];
        }))));
  });
}());
