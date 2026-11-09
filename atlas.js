/* Atlas shared state and rendering helpers. Classic ES2020; no build step. */
(function () {
  'use strict';
  const A = window.Atlas = {};
  A.$ = (q, root = document) => root.querySelector(q);
  A.el = function (tag, attrs = {}, text = '') { const n = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v)); if (text !== '') n.textContent = text; return n; };
  A.fmt = n => n == null || !Number.isFinite(+n) ? '—' : new Intl.NumberFormat('en-GB', {maximumFractionDigits: 2}).format(+n);
  A.fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  A.get = async function (file, csv = false) { const r = await fetch('data/' + file); if (!r.ok) throw new Error(file + ': HTTP ' + r.status); return csv ? d3.csvParse(await r.text()) : r.json(); };
  A.defaultState = {territories:'', from:'1887', to:'1967', year:'1936', stream:'in-patients', population:'all', measure:'admitted during year', ruler:'group_african', scale:'count', log:'0', seams:'1', repeats:'1', uncoded:'1', smoothing:'0', indicator:'c:B54.000', step:'code', combined:'1', composition:'0', filter:'', sort:'value', descending:'1', search:'', metric:'all', metric_group:'', metric_code:'B54.000', map_mode:'year', rank_territory:'', rank_scope:'one'};
  A.read = function () {
    const p = new URLSearchParams(location.hash.slice(1)); const s = {...A.defaultState};
    Object.keys(s).forEach(k => { if(p.has(k)) s[k] = p.get(k); });
    if (!s.territories) s.territories = A.meta.territories.map(t => t.key).join(',');
    s.territories = s.territories.split(',').filter(t => A.meta.territories.some(x => x.key === t)).join(',') || A.meta.territories[0].key;
    ['from','to','year'].forEach(k => {s[k] = String(Math.max(1887,Math.min(1967,parseInt(s[k],10) || +A.defaultState[k])));});
    if (+s.from > +s.to) [s.from,s.to] = [s.to,s.from];
    return s;
  };
  A.link = (page, values = {}) => page + '#' + new URLSearchParams({...A.state, ...values}).toString();
  A.change = function (values) { const next = {...A.state,...values}; const hash = new URLSearchParams(next).toString(); if(location.hash.slice(1) === hash) return; location.hash = hash; };
  A.nav = function () { document.querySelectorAll('a[data-page]').forEach(a => a.href = A.link(a.dataset.page)); };
  A.selected = () => A.state.territories.split(',');
  A.territoryName = t => A.meta.territories.find(r => r.key === t)?.name || t;
  A.listLabel = k => A.meta.lists.find(r => r.key === k)?.label || k;
  A.listAt = function (t,y,s = A.state.stream) { const ls = A.meta.coverage.filter(r => r.territory === t && r.year === +y && r.stream === s).flatMap(r => r.lists); return [...new Set(ls)]; };
  A.sourceLens = (t,y) => { const keys = [...new Set(A.listAt(t,y).map(l => A.meta.source_lists.find(r => r.key === l)?.lens_key).filter(Boolean))]; return keys.length === 1 ? keys[0] : ''; };
  A.sources = (t,y) => A.meta.provenance.filter(r => r.territory === t && r.year === +y && r.stream === A.state.stream && (A.state.repeats==='0'||!r.source_repeat));
  A.sourceText = function (t,y) { return A.sources(t,y).map(r => r.source_file + ' / ' + r.sheet + (r.pages.length ? ' / pp. ' + r.pages.join(', ') : '') + ' / ' + r.table_title).join('\n'); };
  A.tooltip = (t,y,value,n,extra='') => A.territoryName(t) + ', ' + y + '\nFigure: ' + A.fmt(value) + '\nPrinted lines: ' + A.fmt(n) + '\nList: ' + (A.listAt(t,y).join('; ') || 'Not identified') + (extra ? '\n' + extra : '') + '\n' + A.sourceText(t,y);
  const cache = new Map();
  A.loadTerritory = async function (t) {
    if(cache.has(t)) return cache.get(t);
    cache.clear();
    const base = await A.get(t + '.json');
    if(base.parts) { base.cells=[];base.repeat_cells=[];base.summed_cells=[];base.names=[];for(const file of base.parts){const p=await A.get(file);['cells','repeat_cells','summed_cells','names'].forEach(k=>base[k]=base[k].concat(p[k]||[]));} }
    cache.set(t,base);if(cache.size>1)cache.delete(cache.keys().next().value);return base;
  };
  A.releaseTerritory = () => cache.clear();
  A.rows = function (data, measure = A.state.measure, from = +A.state.from, to = +A.state.to) {
    let cells = data.cells; if(A.state.repeats === '0') cells = cells.concat(data.repeat_cells || []);
    const si=data.streams.indexOf(A.state.stream),pi=data.populations.indexOf(A.state.population),mi=data.measures.indexOf(measure);
    if(si<0 || pi<0 || mi<0) return [];
    return cells.filter(r => r[1]===si && r[2]===pi && r[3]===mi && data.years[r[0]]>=from && data.years[r[0]]<=to && (A.state.uncoded==='1'||data.codes[r[4]]!=='UNCODED')).map(r=>({year:data.years[r[0]],code:data.codes[r[4]],value:r[5],n:r[6]}));
  };
  A.names = function (data,y,code) {const si=data.streams.indexOf(A.state.stream),pi=data.populations.indexOf(A.state.population),yi=data.years.indexOf(+y),ci=data.codes.indexOf(code);return [...new Set((data.names||[]).filter(r=>r[0]===yi&&r[1]===si&&r[2]===pi&&r[3]===ci&&(A.state.repeats==='0'||!r[5])).flatMap(r=>r[4]))].join('; ');};
  A.colour = function (key, ruler = A.state.ruler) {
    if(key==='UNCODED' || key==='Unknown / uncoded')return '#999999';
    if(A.codes[key])return A.meta.groups.group_african.find(r=>r.key===A.codes[key].group_african)?.colour||'#527771';
    const scheme=A.meta.groups[ruler]||A.meta.groups.group_african;const direct=scheme.find(r=>r.key===key);if(direct)return direct.colour;
    const counts=new Map();Object.values(A.codes).forEach(c=>{let match=false;if(ruler.startsWith('list')||ruler==='rg1901')match=key.split(' + ').includes(c.lists?.[ruler]?.item);else match=c.chapter===key||c.icd10_3char===key||c.title===key;if(match){const g=c.group_african;counts.set(g,(counts.get(g)||0)+1);}});
    const group=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0];return A.meta.groups.group_african.find(r=>r.key===group)?.colour || '#527771';
  };
  const mapCache=new Map();
  A.itemMapping = function (target,source) {
    const ck=target+'|'+source;if(mapCache.has(ck))return mapCache.get(ck);
    const parent=new Map(); const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x);};const join=(a,b)=>parent.set(find(b),find(a));
    const split=s=>String(s||'').split(/[;|,]/).map(x=>x.trim()).filter(Boolean);
    const sourceItems=new Map();
    Object.values(A.codes).forEach(c=>{const r=c.lists?.[target];if(!r?.item)return;find(r.item);const combined=split(r.combined);combined.forEach(i=>join(r.item,i));if(source){const s=c.lists?.[source];if(s?.item){const sk=split(s.combined);const key=(sk.length?sk.sort().join(';'):s.item);if(!sourceItems.has(key))sourceItems.set(key,[]);sourceItems.get(key).push(r.item);}}});
    sourceItems.forEach(items=>items.forEach(i=>join(items[0],i)));
    const components=new Map();parent.forEach((_,k)=>{const root=find(k);if(!components.has(root))components.set(root,[]);components.get(root).push(k);});
    const result=new Map();Object.entries(A.codes).forEach(([code,c])=>{const item=c.lists?.[target]?.item;if(!item)return;const items=components.get(find(item)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));result.set(code,{key:items.join(' + '),label:items.length>1?items.join(' + ')+' (combined)':item+' · '+c.lists[target].title,combined:items.length>1});});
    mapCache.set(ck,result);return result;
  };
  A.group = function (code,ruler,t,y,data) {
    if(data?.printed_groups?.[code])return {key:code,label:data.printed_groups[code],combined:false};
    if(code==='UNCODED')return {key:'UNCODED',label:'Unknown / uncoded',combined:false};
    const c=A.codes[code];if(!c)return {key:code,label:code,combined:false};
    if(ruler==='code')return {key:code,label:code+' · '+c.title,combined:false};
    if(ruler==='category')return {key:c.icd10_3char||'UNCODED',label:c.icd10_3char||'Unknown category',combined:false};
    if(ruler==='chapter')return {key:c.chapter||'UNCODED',label:c.chapter?c.chapter+' · '+c.chapter_title:'Unknown chapter',combined:false};
    if(A.lists[ruler])return A.itemMapping(ruler,A.sourceLens(t,y)).get(code)||{key:'UNCODED',label:'Unmapped item',combined:false};
    return {key:c[ruler]||'UNCODED',label:c[ruler]||'Unknown group',combined:false};
  };
  A.groupRows = function (t,data) {
    const groups=new Map();A.rows(data).forEach(r=>{const g=A.group(r.code,A.state.ruler,t,r.year,data);const key=r.year+'|'+g.key;let v=groups.get(key);if(!v){v={territory:t,year:r.year,group:g.key,label:g.label,value:0,n:0,combined:g.combined};groups.set(key,v);}v.value+=r.value;v.n+=r.n;});return [...groups.values()];
  };
  A.scaled = function (data,rows,from = +A.state.from,to = +A.state.to) {
    const totals=new Map();A.rows(data,A.state.measure,from,to).filter(r=>r.code!=='UNCODED').forEach(r=>totals.set(r.year,(totals.get(r.year)||0)+r.value));
    const admissions=new Map();A.rows(data,'admitted during year',from,to).filter(r=>r.code!=='UNCODED').forEach(r=>admissions.set(r.year,(admissions.get(r.year)||0)+r.value));
    return rows.map(r=>{const den=A.state.scale==='share'?totals.get(r.year):A.state.scale==='per1000'?admissions.get(r.year):1;return {...r,raw:r.value,value:den>0?r.value/den*(A.state.scale==='share'?100:A.state.scale==='per1000'?1000:1):null};});
  };
  A.smooth = function (rows, key = 'group') {
    if(A.state.smoothing!=='3')return rows;
    const m=new Map(rows.map(r=>[r.year+'|'+(r[key]||''),r]));return rows.map(r=>{const a=m.get((r.year-1)+'|'+(r[key]||'')),b=m.get((r.year+1)+'|'+(r[key]||''));return {...r,value:a?.value!=null&&r.value!=null&&b?.value!=null?(a.value+r.value+b.value)/3:null,smoothing_lines:a&&b?a.n+r.n+b.n:null};});
  };
  A.scaleLabel = () => A.state.scale==='share'?'Share of coded figures (%)':A.state.scale==='per1000'?'Per 1,000 coded admissions':'Printed figures';
  A.csv = function (rows,name) { if(!rows.length)return;const blob=new Blob(['\ufeff'+d3.csvFormat(rows)],{type:'text/csv;charset=utf-8'});const a=A.el('a',{href:URL.createObjectURL(blob),download:name+'.csv'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000); };
  A.exportButton = (node,rows,name) => {const b=A.el('button',{class:'download',type:'button'},'Export this view · CSV');b.disabled=!rows.length;b.addEventListener('click',()=>A.csv(rows,name));node.append(b);};
  A.table = function (node, columns, rows, sortable = false, onSort = null) {
    const wrap=A.el('div',{class:'table-wrap'}),table=A.el('table'),head=A.el('thead'),hr=A.el('tr');columns.forEach(c=>{const th=A.el('th',{scope:'col',class:c.numeric?'numeric':''});if(sortable){const b=A.el('button',{type:'button'},c.label);b.addEventListener('click',()=>onSort?.(c.key));th.append(b);}else th.textContent=c.label;hr.append(th);});head.append(hr);table.append(head);const body=A.el('tbody');rows.forEach(r=>{const tr=A.el('tr');columns.forEach(c=>{const td=A.el('td',{class:c.numeric?'numeric':''});if(c.render)c.render(td,r);else td.textContent=c.year||/(^|_)year$/.test(c.key)?A.year(r[c.key]):c.numeric?A.fmt(r[c.key]):r[c.key]??'';tr.append(td);});body.append(tr);});table.append(body);wrap.append(table);node.append(wrap);return table;
  };
  A.legend = function (node,items) {const n=A.el('div',{class:'legend'});items.forEach(r=>{const s=A.el('span');s.append(A.el('i',{class:'swatch',style:'background:'+r.colour}),document.createTextNode(r.label));n.append(s);});node.append(n);};
  A.empty = (node,message) => node.append(A.el('p',{class:'empty'},message));
  A.seamText = function (seam,groups = []) {const k=seam.closure.lens;const notes=A.meta.lens_approximations.filter(r=>r.list===k && r.report_as).filter(r=>!groups.length||r.codes.some(c=>groups.includes(c)||groups.includes(A.codes[c]?.[A.state.ruler])||groups.includes(A.codes[c]?.group_african)||groups.some(g=>g.split(' + ').includes(A.codes[c]?.lists?.[A.state.ruler]?.item)))).map(r=>r.item+': '+(r.report_as||r.items)+' '+r.note);return seam.old_list+' → '+seam.new_list+'\n'+seam.closure.reading+': '+seam.closure.reading_note+(notes.length?'\nCombined under lens:\n'+notes.join('\n'):'\nNo additional combined-item note for the displayed groups.');};
  A.coverageGrid = function (node,compact = false) {
    const years=d3.range(1887,1968),ts=A.meta.territories,width=compact?1100:1400,left=compact?190:235,row=compact?29:39,top=35,cell=(width-left-15)/years.length;
    const svg=d3.create('svg').attr('viewBox',[0,0,width,top+ts.length*row+45]).attr('role','img').attr('aria-label','Coverage by territory and year, 1887 to 1967');
    const defs=svg.append('defs');const pat=defs.append('pattern').attr('id','totals-hatch').attr('width',5).attr('height',5).attr('patternUnits','userSpaceOnUse');pat.append('rect').attr('width',5).attr('height',5).attr('fill','#dce4df');pat.append('path').attr('d','M0,5L5,0').attr('stroke','#6f8078').attr('stroke-width',1);
    const streamColour=s=>s==='in-patients'?'#206c72':s==='out-patients'?'#d0a344':s==='deaths'?'#8a6f91':'#6b92ad';
    const sourceLabels=A.meta.source_lists.map(r=>r.key);const listColour=d3.scaleOrdinal(sourceLabels,d3.schemeTableau10.concat(['#7b8b60','#a47a68','#708f9d']));
    ts.forEach((t,i)=>{const y=top+i*row;svg.append('text').attr('x',left-12).attr('y',y+12).attr('text-anchor','end').attr('font-size',compact?10:12).text(t.name);years.forEach((year,j)=>{const obs=A.meta.coverage.filter(r=>r.territory===t.key&&r.year===year&&r.status!=='none');const lines=obs.filter(r=>r.status==='lines'),totals=obs.filter(r=>r.status==='totals only');const x=left+j*cell;const g=svg.append('g').attr('class','grid-cell').attr('tabindex',0).attr('role','link').attr('aria-label',t.name+', '+year).on('click',()=>{location.href=A.link('territory.html',{territories:t.key,year:String(year)});}).on('keydown',e=>{if(e.key==='Enter')location.href=A.link('territory.html',{territories:t.key,year:String(year)});});g.append('rect').attr('x',x).attr('y',y).attr('width',cell-1).attr('height',compact?16:23).attr('fill','#ebece5');if(lines.length)lines.forEach((r,k)=>g.append('rect').attr('x',x).attr('y',y+k*(compact?16:23)/lines.length).attr('width',cell-1).attr('height',(compact?16:23)/lines.length).attr('fill',streamColour(r.stream)));else if(totals.length)g.append('rect').attr('x',x).attr('y',y).attr('width',cell-1).attr('height',compact?16:23).attr('fill','url(#totals-hatch)');const lists=[...new Set(obs.flatMap(r=>r.lists))];lists.forEach((l,k)=>g.append('rect').attr('class','list-band').attr('x',x+k*cell/lists.length).attr('y',y+(compact?18:26)).attr('width',cell/lists.length-0.3).attr('height',3).attr('fill',listColour(l)));g.append('title').text(t.name+', '+year+'\nStreams: '+(obs.map(r=>r.stream+' ('+r.status+')').join('; ')||'No return')+'\nLists: '+(lists.join('; ')||'none')+'\nCoded lines: '+A.fmt(d3.sum(obs,r=>r.coded_lines))+'\nPrinted lines: '+A.fmt(d3.sum(obs,r=>r.lines)));});A.meta.seams.filter(s=>s.territory===t.key&&s.first_year_new).forEach(s=>svg.append('line').attr('x1',left+(s.first_year_new-1887)*cell).attr('x2',left+(s.first_year_new-1887)*cell).attr('y1',y+(compact?17:25)).attr('y2',y+(compact?24:33)).attr('stroke','#263b3d').append('title').text(A.seamText(s)));});
    years.filter(y=>y%10===0||y===1887||y===1967).forEach(y=>svg.append('text').attr('x',left+(y-1887+.5)*cell).attr('y',top-12).attr('text-anchor','middle').text(y));node.append(svg.node());A.legend(node,[{label:'In-patients',colour:'#206c72'},{label:'Out-patients',colour:'#d0a344'},{label:'Deaths',colour:'#8a6f91'},{label:'Combined / other printed stream',colour:'#6b92ad'},{label:'Totals only (hatched)',colour:'#a5b5aa'},{label:'No return',colour:'#ebece5'}]);const l=A.el('details',{class:'notes'});l.append(A.el('summary',{},'List band colours'));A.legend(l,sourceLabels.map(s=>({label:s,colour:listColour(s)})));node.append(l);
  };
  // Years are identifiers, never quantities with thousands separators.
  A.year = value => value == null || value === '' || !Number.isFinite(+value) ? '—' : String(Math.trunc(+value));
  A.territoryPicker = function () {
    const details=A.el('details',{class:'control territories'});
    details.append(A.el('span',{},'Territories'),A.el('summary',{},A.selected().length===11?'All eleven territories':A.selected().length+' selected'));
    const options=A.el('div',{class:'territory-options'});
    A.meta.territories.forEach(t=>{
      const label=A.el('label'),input=A.el('input',{type:'checkbox',value:t.key});input.checked=A.selected().includes(t.key);
      input.onchange=()=>{const selected=[...options.querySelectorAll('input:checked')].map(n=>n.value);if(selected.length)A.change({territories:selected.join(',')});else input.checked=true;};
      label.append(input,document.createTextNode(' '+t.name));options.append(label);
    });
    details.append(options);return details;
  };
  A.territoryColour = t => ['#0072B2','#E69F00','#009E73','#CC79A7','#666666','#56B4E9','#D55E00','#66701B','#8C564B','#5C5D9A','#287D8E'][A.meta.territories.findIndex(r=>r.key===t)] || '#527771';
  A.indicatorControls = function (node) {
    node.replaceChildren();
    function select(key,label,options){const wrap=A.el('label',{},label+' '),input=A.el('select');options.forEach(([k,v])=>input.append(A.el('option',{value:k},v)));input.value=A.state[key];input.onchange=()=>A.change({[key]:input.value});wrap.append(input);node.append(wrap);return input;}
    select('metric','Indicator',[['all','All coded figures'],['group','One group / list item'],['code','One ICD10h code']]);
    const groups=new Map();Object.keys(A.codes).forEach(code=>{const g=A.group(code,A.state.ruler,'',0);groups.set(g.key,g.label);});
    if(A.lists[A.state.ruler]){
      groups.clear();Object.values(A.codes).forEach(c=>{const item=c.lists?.[A.state.ruler];if(item?.item)groups.set(item.item,item.item+' · '+item.title);});
    }
    groups.delete('UNCODED');const items=[...groups].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}));
    const group=select('metric_group','Group under the selected ruler',[['','Choose a group'],...items]);group.disabled=A.state.metric!=='group';
    const codeLabel=A.el('label',{},'Code '),code=A.el('input',{type:'search',list:'indicator-codes',value:A.state.metric_code,'aria-label':'ICD10h code'}),list=A.el('datalist',{id:'indicator-codes'});
    Object.entries(A.codes).forEach(([key,c])=>list.append(A.el('option',{value:key},c.title)));code.disabled=A.state.metric!=='code';code.onchange=()=>A.change({metric_code:code.value.trim()});codeLabel.append(code,list);node.append(codeLabel);
    node.append(A.el('span',{class:'caption'},A.metricLabel()));
  };
  A.metricLabel = () => A.state.metric==='all'?'All coded figures':A.state.metric==='group'?(A.state.metric_group||'Choose a group'):(A.state.metric_code+' · '+(A.codes[A.state.metric_code]?.title||'Code unavailable'));
  A.metricSeries = function (t,data,fullRange=false) {
    if(t==='congo')return [];
    const from=fullRange?1887:+A.state.from,to=fullRange?1967:+A.state.to;
    const raw=A.rows(data,A.state.measure,from,to),byYear=d3.group(raw.filter(r=>r.code!=='UNCODED'),r=>r.year),result=[];
    for(const [year,observed] of byYear){
      let matches=[],combined=false,label=A.metricLabel();
      if(A.state.metric==='all')matches=observed;
      else if(A.state.metric==='group'){
        matches=observed.filter(r=>{const g=A.group(r.code,A.state.ruler,t,year,data);const match=g.key===A.state.metric_group||(A.lists[A.state.ruler]&&g.key.split(' + ').includes(A.state.metric_group));if(match&&g.combined){combined=true;label=g.label;}return match;});
      }else{
        const members=new Set([A.state.metric_code]),source=A.sourceLens(t,year),holding=A.codes[A.state.metric_code]?.lists?.[source];
        if(A.state.combined==='1'&&holding?.item){
          const items=String(holding.combined||holding.item).split(/[;|,]/).map(s=>s.trim());
          Object.entries(A.codes).forEach(([code,c])=>{if(items.includes(c.lists?.[source]?.item))members.add(code);});
          combined=members.size>1;if(combined)label+=' · source item '+(holding.combined||holding.item);
        }
        matches=observed.filter(r=>members.has(r.code));
      }
      // Absence of the indicator is missing, even when other codes were printed.
      if(matches.length)result.push({territory:t,year,value:d3.sum(matches,r=>r.value),n:d3.sum(matches,r=>r.n),combined,label});
    }
    return A.scaled(data,result,from,to).sort((a,b)=>a.year-b.year);
  };
  A.seriesSource = r => A.state.smoothing==='3' && r.value!=null ? [r.year-1,r.year,r.year+1].map(y=>A.year(y)+'\n'+A.sourceText(r.territory,y)).join('\n\n') : A.sourceText(r.territory,r.year);
  A.seriesTooltip = r => A.tooltip(r.territory,r.year,r.raw,r.n,r.label+'\nDisplayed: '+A.fmt(r.value)+(r.combined?'\nCombined under the source list.':'')+(A.state.smoothing==='3'?'\nThree-year mean. Printed lines in window: '+A.fmt(r.smoothing_lines)+'\nWindow sources:\n'+A.seriesSource(r):''));
  A.viewRows = rows => rows.map(r=>({...r,territory_name:A.territoryName(r.territory),indicator:A.metricLabel(),stream:A.state.stream,population:A.state.population,measure:A.state.measure,ruler:A.state.ruler,scale:A.state.scale,smoothing:A.state.smoothing,list_in_force:A.listAt(r.territory,r.year).join('; '),source:A.seriesSource(r)}));

  A.controls = function () {
    const root=A.$('#controls');root.replaceChildren();const grid=A.el('div',{class:'controls-main'});root.append(grid);
    grid.append(A.territoryPicker());
    const years=A.el('label',{class:'control'},'Year range');const yr=A.el('span',{class:'year-inputs'});['from','to'].forEach((key,j)=>{if(j)yr.append(document.createTextNode('–'));const i=A.el('input',{type:'number',min:1887,max:1967,value:A.state[key],'aria-label':key==='from'?'First year':'Last year'});i.addEventListener('change',()=>A.change({[key]:i.value}));yr.append(i);});years.append(yr);grid.append(years);
    function select(key,label,options) {const l=A.el('label',{class:'control'},label),s=A.el('select',{'data-state':key});options.forEach(o=>s.append(A.el('option',{value:typeof o==='string'?o:o[0]},typeof o==='string'?o:o[1])));if(!options.some(o=>(typeof o==='string'?o:o[0])===A.state[key]))s.append(A.el('option',{value:A.state[key]},A.state[key]));s.value=A.state[key];s.addEventListener('change',()=>A.change({[key]:s.value}));l.append(s);return l;}
    grid.append(select('stream','Patient stream',A.meta.streams),select('population','Population as printed',A.meta.populations),select('measure','Measure as printed',A.meta.measures),select('ruler','Classification / ruler',[['group_african','African grouping (draft)'],['histcat','HistCat'],['group_kippen',"Kippen’s 32"],['group_preston',"Preston’s 12"],['chapter','ICD-10 chapter'],['code','ICD10h code'],...A.meta.lists.map(r=>[r.key,r.label])]));
    const sw=A.el('div',{class:'switches'});sw.append(select('scale','Scale',[['count','Count'],['share','Share of coded figures (%)'],['per1000','Per 1,000 coded admissions']]));[['log','Logarithmic axis'],['seams','Show list changes'],['repeats','Exclude repeated publications'],['uncoded','Show unknown / uncoded']].forEach(([key,text])=>{const l=A.el('label'),i=A.el('input',{type:'checkbox'});i.checked=A.state[key]==='1';i.addEventListener('change',()=>A.change({[key]:i.checked?'1':'0'}));l.append(i,document.createTextNode(text));sw.append(l);});sw.append(select('smoothing','Smoothing',[['0','None'],['3','Three-year mean']]));root.append(sw);
  };
  A.start = async function (render) {
    try {if(!window.d3||!window.Plot)throw new Error('The pinned chart libraries could not load. Connect to the internet and reload.');[A.meta,A.codes,A.lists]=await Promise.all(['meta.json','codes.json','lists.json'].map(f=>A.get(f)));A.state=A.read();let generation=0,queue=Promise.resolve();const update=()=>{const token=++generation;queue=queue.then(async()=>{if(token!==generation)return;A.state=A.read();history.replaceState(null,'',location.pathname+location.search+'#'+new URLSearchParams(A.state).toString());A.controls();A.nav();A.$('#status').textContent=A.state.repeats==='0'?'Repeated-publication overlay is included. These publications can describe the same patients.':'';try{await render(token,()=>token===generation);}catch(e){if(token===generation)A.$('#status').textContent='Unable to display this view: '+e.message;}});return queue;};window.addEventListener('hashchange',update);await update();}catch(e){A.$('#status').textContent=e.message;A.$('main').append(A.el('p',{class:'warning'},'Serve this folder with a plain web server. '+e.message));}
  };
}());
