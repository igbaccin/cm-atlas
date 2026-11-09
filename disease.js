(function () {
  'use strict';
  const A=window.Atlas;let thesaurus=null,searchTimer;
  function descriptor() {
    const indicator=A.state.indicator;
    if(indicator.startsWith('g:')) {const parts=indicator.split(':');return {kind:'group',field:parts[1],key:parts.slice(2).join(':'),title:parts.slice(2).join(':')};}
    const code=indicator.startsWith('c:')?indicator.slice(2):indicator;
    return {kind:'code',code,title:A.codes[code]?.title||code};
  }
  function memberSet(desc,step,t,year) {
    if(desc.kind==='group')return {codes:new Set(Object.keys(A.codes).filter(c=>A.codes[c][desc.field]===desc.key)),combined:false,label:desc.title};
    const code=A.codes[desc.code];if(!code)return {codes:new Set(),combined:false,label:'Code unavailable'};
    let codes=new Set([desc.code]),combined=false,label=desc.title;
    if(step==='category'){codes=new Set(Object.keys(A.codes).filter(c=>A.codes[c].icd10_3char===code.icd10_3char&&code.icd10_3char));label=code.icd10_3char;}
    else if(step==='group'){const field=['group_african','histcat','group_kippen','group_preston'].includes(A.state.ruler)?A.state.ruler:'group_african';codes=new Set(Object.keys(A.codes).filter(c=>A.codes[c][field]===code[field]));label=code[field];}
    else if(A.lists[step]){const map=A.itemMapping(step,A.sourceLens(t,year));const holding=map.get(desc.code);if(holding){codes=new Set([...map].filter(([,v])=>v.key===holding.key).map(([c])=>c));label=holding.label;combined=holding.combined;}}
    if(A.state.combined==='1'){
      const source=A.sourceLens(t,year),holding=code.lists?.[source];
      if(source&&holding?.item){const items=String(holding.combined||holding.item).split(/[;|,]/).map(s=>s.trim());const expanded=Object.keys(A.codes).filter(c=>{const r=A.codes[c].lists?.[source];return r&&items.includes(r.item);});if(expanded.some(c=>!codes.has(c))){expanded.forEach(c=>codes.add(c));combined=true;label+=' · source item '+(holding.combined||holding.item);}}
    }
    return {codes,combined,label};
  }
  function results(query) {
    const node=A.$('#search-results');node.replaceChildren();const q=A.fold(query);const rows=[];
    const groups=['group_african','histcat','group_kippen','group_preston'];
    groups.forEach(field=>(A.meta.groups[field]||[]).forEach(r=>{if(!q||A.fold(r.label).includes(q)){const members=Object.values(A.codes).filter(c=>c[field]===r.key);rows.push({id:'g:'+field+':'+r.key,title:r.label,subtitle:field.replace('group_','')+' group · '+[...new Set(members.flatMap(c=>c.territories||[]))].map(A.territoryName).join('; '),count:d3.sum(members,c=>c.n_figures||0)});}}));
    Object.entries(A.codes).forEach(([code,c])=>{if(!q||A.fold(code+' '+c.title).includes(q)){rows.push({id:'c:'+code,title:code+' · '+c.title,subtitle:(c.territories||[]).map(A.territoryName).join('; '),count:c.n_figures||0,standard:true});}});
    if(q)thesaurus.forEach(r=>{if(A.fold(r.name).includes(q))rows.push({id:'c:'+r.code,title:r.name+' · '+r.code,subtitle:(A.codes[r.code]?.title||'Unknown / uncoded')+' — '+Object.keys(r.territories).map(A.territoryName).join('; '),count:r.n_figures});});
    const shown=rows.slice(0,120);shown.forEach(r=>{const b=A.el('button',{type:'button',class:'result','aria-pressed':String(r.id===A.state.indicator)},r.title);b.append(A.el('small',{},r.subtitle+' · '+A.fmt(r.count)+' printed figures'));b.onclick=()=>A.change({indicator:r.id});node.append(b);});
    A.$('#search-count').textContent=rows.length+' matches'+(rows.length>shown.length?' · first 120 shown; narrow the search':'');if(!rows.length)A.empty(node,'No matching printed name, code or group.');
  }
  A.start(async function (token,current) {
    if(!thesaurus){let loaded=await A.get('thesaurus.json');if(loaded.parts){const all=[];for(const f of loaded.parts)all.push(...await A.get(f));loaded=all;}thesaurus=loaded;}
    if(!current())return;const desc=descriptor();A.$('#indicator-title').textContent=desc.title;A.$('#indicator-code').textContent=desc.kind==='code'?desc.code:'Cause group';
    const search=A.$('#disease-search');search.value=A.state.search;search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>A.change({search:search.value}),300);};results(A.state.search);
    const steps=[['code','ICD10h code'],['category','ICD-10 three-character category'],['group','Cause group under selected ruler'],...A.meta.lists.map(r=>[r.key,r.label])];
    const step=A.$('#disease-step');step.replaceChildren(...steps.map(([k,l])=>A.el('option',{value:k},l)));step.value=A.state.step;step.disabled=desc.kind==='group';step.onchange=()=>A.change({step:step.value});const ix=Math.max(0,steps.findIndex(r=>r[0]===A.state.step));
    A.$('#step-back').disabled=desc.kind==='group'||ix===0;A.$('#step-forward').disabled=desc.kind==='group'||ix===steps.length-1;A.$('#step-back').onclick=()=>A.change({step:steps[Math.max(0,ix-1)][0]});A.$('#step-forward').onclick=()=>A.change({step:steps[Math.min(steps.length-1,ix+1)][0]});
    const toggle=A.$('#combined-toggle');toggle.checked=A.state.combined==='1';toggle.onchange=()=>A.change({combined:toggle.checked?'1':'0'});
    const container=A.$('#disease-charts');container.replaceChildren();const exports=[];
    // Sequential loading avoids collecting every territory cube in the browser.
    for(const t of A.selected()) {
      const data=await A.loadTerritory(t);if(!current())return;
      const article=A.el('article'),h=A.el('h3',{},A.territoryName(t));article.append(h);container.append(article);
      if(t==='congo'){article.append(A.el('p',{class:'caption'},'The Belgian Congo prints group totals and no disease lines. See Territory for its printed groups.'));continue;}
      const raw=A.rows(data),years=[...new Set(raw.map(r=>r.year))],values=[];
      years.forEach(year=>{const member=memberSet(desc,A.state.step,t,year),observed=raw.filter(r=>r.year===year&&member.codes.has(r.code));if(observed.length)values.push({territory:t,year,value:d3.sum(observed,r=>r.value),n:d3.sum(observed,r=>r.n),combined:member.combined,label:member.label});});
      const series=A.smooth(A.scaled(data,values),'territory');
      if(!series.some(r=>r.value!=null)){A.empty(article,'No printed figures for this selection.');continue;}
      series.forEach(r=>exports.push({...r,stream:A.state.stream,population:A.state.population,measure:A.state.measure,scale:A.state.scale,list_in_force:A.listAt(t,r.year).join('; '),source:A.sourceText(t,r.year)}));
      // Add null markers solely as path breaks. They are never exported or
      // interpreted as zero and no line crosses a missing calendar year.
      const byyear=new Map(series.map(r=>[r.year,r]));const plotting=d3.range(+A.state.from,+A.state.to+1).map(year=>byyear.get(year)||{year,value:null});const visible=series.filter(r=>r.value!=null&&(A.state.log!=='1'||r.value>0));
      const normal=plotting.map(r=>({...r,value:r.combined?null:r.value})),combined=plotting.map(r=>({...r,value:r.combined?r.value:null}));
      const seamRows=A.state.seams==='1'?A.meta.seams.filter(s=>s.territory===t&&s.first_year_new>=+A.state.from&&s.first_year_new<=+A.state.to):[];
      const plot=Plot.plot({width:390,height:240,marginLeft:60,marginTop:16,x:{domain:[+A.state.from,+A.state.to],label:null,ticks:5,tickFormat:d3.format('d')},y:{type:A.state.log==='1'?'log':'linear',zero:A.state.log!=='1',label:A.scaleLabel(),grid:true},marks:[Plot.ruleX(seamRows,{x:'first_year_new',stroke:'#7c8882',strokeDasharray:'4,3',title:s=>A.seamText(s)}),Plot.lineY(normal,{x:'year',y:'value',stroke:'#206c72',strokeWidth:2}),Plot.lineY(combined,{x:'year',y:'value',stroke:'#206c72',strokeOpacity:.35,strokeWidth:3}),Plot.dot(visible,{x:'year',y:'value',r:3,fill:r=>r.combined?'#9ab8b5':'#206c72',title:r=>A.tooltip(t,r.year,r.raw,r.n,r.label+(r.combined?'\nCombined under source list':'')+'\nDisplayed: '+A.fmt(r.value))})]});
      article.append(plot);if(series.some(r=>r.combined))article.append(A.el('p',{class:'caption'},'Pale marks show a combined source item. The tooltip names that item.'));if(years.some(y=>!A.sourceLens(t,y)))article.append(A.el('p',{class:'caption'},'Some years use a local or unidentified list: the historical lens is unavailable for those source lists.'));
    }
    if(!current())return;const exportNode=A.$('#disease-export');exportNode.replaceChildren();A.exportButton(exportNode,exports,'atlas-disease-series');
  });
}());
