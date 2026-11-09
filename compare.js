(function () {
  'use strict';
  const A=window.Atlas;
  function seams(t){return A.state.seams==='1'?A.meta.seams.filter(s=>s.territory===t&&s.first_year_new>=+A.state.from&&s.first_year_new<=+A.state.to&&(!s.patient_types||s.patient_types.includes(A.state.stream))):[];}
  function axes(svg,x,y,height,left){
    svg.append('g').attr('transform','translate(0,'+(height-45)+')').call(d3.axisBottom(x).ticks(14).tickFormat(A.year));
    svg.append('g').attr('transform','translate('+left+',0)').call(d3.axisLeft(y).ticks(6,'~s')).call(g=>g.select('.domain').remove());
  }
  function seriesChart(node,series){
    node.replaceChildren();const visible=series.filter(r=>r.value!=null&&(A.state.log!=='1'||r.value>0));
    if(!visible.length){A.empty(node,'No numeric indicator values on the selected scale. Missing figures are not treated as zero.');return;}
    const width=1240,height=500,left=85,right=35,top=35,log=A.state.log==='1';
    const x=d3.scaleLinear().domain([+A.state.from-.5,+A.state.to+.5]).range([left,width-right]);
    const extent=d3.extent(visible,r=>r.value);let low=log?extent[0]:Math.min(0,extent[0]),high=extent[1];if(low===high){low=log?low/2:low;high=high>0?high*1.1:1;}
    const y=(log?d3.scaleLog().domain([low,high]):d3.scaleLinear().domain([low,high]).nice()).range([height-45,top]);
    const svg=d3.create('svg').attr('viewBox',[0,0,width,height]).attr('role','img').attr('aria-label','Selected indicator over years, one line per territory; missing annual figures break the lines');axes(svg,x,y,height,left);
    svg.append('text').attr('x',left).attr('y',18).text(A.scaleLabel());
    for(const t of A.selected()){
      const rows=visible.filter(r=>r.territory===t).sort((a,b)=>a.year-b.year),colour=A.territoryColour(t);
      rows.forEach((r,i)=>{
        const next=rows[i+1];
        if(next&&next.year===r.year+1)svg.append('line').attr('x1',x(r.year)).attr('x2',x(next.year)).attr('y1',y(r.value)).attr('y2',y(next.value)).attr('stroke',colour).attr('stroke-width',2).attr('opacity',(r.combined||next.combined) ? 0.35 : 1);
        svg.append('circle').attr('cx',x(r.year)).attr('cy',y(r.value)).attr('r',3.2).attr('fill',colour).attr('opacity',r.combined ? 0.35 : 1).attr('tabindex',0).append('title').text(A.seriesTooltip(r));
      });
      seams(t).forEach(s=>{
        const point=rows.find(r=>r.year===s.first_year_new)||rows.find(r=>r.year===s.last_year_old);
        const xx=x(point?point.year:s.first_year_new),yy=point?y(point.value):height-58;
        svg.append('line').attr('x1',xx).attr('x2',xx).attr('y1',yy-8).attr('y2',yy+8).attr('stroke',colour).attr('stroke-width',2).attr('tabindex',0).append('title').text(A.territoryName(t)+'\n'+A.year(s.first_year_new)+': '+A.seamText(s)+(point?'\nTick anchored to observed indicator year '+A.year(point.year):'\nNo selected indicator at either side; tick shown above the year axis.'));
      });
    }
    node.append(svg.node());
  }
  function rankChart(node,ranked,territory){
    node.replaceChildren();if(!ranked.length){A.empty(node,'No groups can be ranked for this selection.');return;}
    const groups=[...new Set(ranked.map(r=>r.group))],width=1480,height=Math.max(540,groups.length*16+100),left=315,right=315,top=50;
    const x=d3.scaleLinear().domain([+A.state.from-.5,+A.state.to+.5]).range([left,width-right]),y=d3.scaleLinear().domain([1,10]).range([top,height-55]);
    const svg=d3.create('svg').attr('viewBox',[0,0,width,height]).attr('role','img').attr('aria-label','Ranks of the ten leading observed groups by year; labels at each group’s first and last visible point');
    svg.append('g').attr('transform','translate(0,'+(height-40)+')').call(d3.axisBottom(x).ticks(12).tickFormat(A.year));svg.append('g').attr('transform','translate('+left+',0)').call(d3.axisLeft(y).tickValues(d3.range(1,11)).tickFormat(d=>String(d)));
    if(territory)seams(territory).forEach(s=>svg.append('line').attr('class','seam').attr('x1',x(s.first_year_new-.5)).attr('x2',x(s.first_year_new-.5)).attr('y1',top-12).attr('y2',height-55).append('title').text(A.seamText(s,groups)));
    const endpoints=[];
    groups.forEach(group=>{
      const rows=ranked.filter(r=>r.group===group).sort((a,b)=>a.year-b.year),colour=A.colour(group);
      rows.forEach((r,i)=>{
        const next=rows[i+1];if(next&&next.year===r.year+1)svg.append('line').attr('x1',x(r.year)).attr('x2',x(next.year)).attr('y1',y(r.rank)).attr('y2',y(next.rank)).attr('stroke',colour).attr('stroke-width',2).attr('opacity',(r.combined||next.combined) ? 0.35 : 0.8);
        svg.append('circle').attr('cx',x(r.year)).attr('cy',y(r.rank)).attr('r',3).attr('fill',colour).attr('opacity',r.combined ? 0.35 : 1).attr('tabindex',0).append('title').text(rankTip(r));
      });endpoints.push({first:rows[0],last:rows[rows.length-1],colour});
    });
    ['first','last'].forEach(side=>{
      const ordered=endpoints.slice().sort((a,b)=>a[side].rank-b[side].rank||a[side].year-b[side].year||a[side].label.localeCompare(b[side].label));
      ordered.forEach((entry,i)=>{
        const r=entry[side],yy=top+i*(height-top-60)/Math.max(1,ordered.length-1),xx=side==='first'?left-15:width-right+15;
        svg.append('path').attr('d','M'+x(r.year)+','+y(r.rank)+'L'+xx+','+yy).attr('fill','none').attr('stroke',entry.colour).attr('stroke-width',.7).attr('opacity',.45);
        const name=r.label.length>43?r.label.slice(0,41)+'…':r.label;
        svg.append('text').attr('class','rank-label').attr('x',xx+(side==='first'?-4:4)).attr('y',yy+3).attr('text-anchor',side==='first'?'end':'start').text(name+' · '+A.year(r.year)).append('title').text(rankTip(r));
      });
    });node.append(svg.node());
  }
  function rankTip(r){return r.territory_name+', '+A.year(r.year)+'\n'+r.label+'\nRank: '+r.rank+'\nPrinted figure: '+A.fmt(r.raw)+'\n'+A.scaleLabel()+': '+A.fmt(r.value)+'\nPrinted lines: '+A.fmt(r.n)+'\nList: '+r.list_in_force+(r.combined?'\nCombined under the source list.':'')+'\nContributing territories: '+r.contributors+'\n'+r.source;}
  function leadingGroups(rows){
    const order=A.meta.groups[A.state.ruler]?.map(r=>r.key)||[];
    const ranked=[];for(const [year,values] of d3.group(rows.filter(r=>r.value!=null),r=>r.year)){
      values.sort((a,b)=>b.value-a.value||(order.indexOf(a.group)<0?999:order.indexOf(a.group))-(order.indexOf(b.group)<0?999:order.indexOf(b.group))||a.group.localeCompare(b.group,undefined,{numeric:true}));
      values.slice(0,10).forEach((r,i)=>ranked.push({...r,year,rank:i+1}));
    }return ranked.sort((a,b)=>a.year-b.year||a.rank-b.rank);
  }
  A.start(async function(token,current){
    A.indicatorControls(A.$('#indicator-controls'));A.$('#compare-indicator').textContent=A.metricLabel();
    const territories=A.selected().filter(t=>t!=='congo'),rankTerritory=territories.includes(A.state.rank_territory)?A.state.rank_territory:territories[0];
    const together=A.state.rank_scope==='together'&&A.state.scale==='count';
    const scope=A.$('#rank-scope');scope.value=together?'together':'one';scope.querySelector('option[value="together"]').disabled=A.state.scale!=='count';scope.onchange=()=>A.change({rank_scope:scope.value});
    const selector=A.$('#rank-territory');selector.replaceChildren(...territories.map(t=>A.el('option',{value:t},A.territoryName(t))));selector.value=rankTerritory||'';selector.disabled=together||!territories.length;selector.onchange=()=>A.change({rank_territory:selector.value});
    A.$('#compare-note').textContent=(A.selected().includes('congo')?'Belgian Congo prints groups only and is excluded from coded-indicator comparisons. ':'')+'Each territory keeps its colour when the selection changes. Shares divide by that territory’s coded figures; per 1,000 divides by its coded admissions for the selected stream and population. An unavailable denominator is a gap.';
    A.$('#rank-note').textContent=together?'Counts sum available printed figures across the selected coding territories. Coverage can change by year; the tooltip and table name the contributing territories. Congo’s unclassified printed groups cannot be pooled under this ruler.':(A.state.scale!=='count'?'Shares and per 1,000 use one territory at a time: their denominators differ, so adding them would not represent a shared population. ':'')+'Ranks for '+(rankTerritory?A.territoryName(rankTerritory):'no selected coding territory')+'.';
    const series=[],groups=[];
    for(const t of territories){
      const data=await A.loadTerritory(t);if(!current())return;
      const metric=A.metricSeries(t,data),smoothed=A.smooth(metric,'territory');
      if(A.state.smoothing==='3')smoothed.forEach(r=>{if(r.value!=null){const windowRows=metric.filter(v=>Math.abs(v.year-r.year)<=1);r.combined=windowRows.some(v=>v.combined);r.label=[...new Set(windowRows.map(v=>v.label))].join('; ');}});
      series.push(...smoothed);
      if(together||t===rankTerritory){
        const rows=A.scaled(data,A.groupRows(t,data));
        rows.forEach(r=>groups.push({...r,territory_name:A.territoryName(t),list_in_force:A.listAt(t,r.year).join('; '),source:A.sourceText(t,r.year),contributors:A.territoryName(t)}));
      }
      A.releaseTerritory();
    }
    if(!current())return;
    let rankInput=groups;
    if(together){
      const summed=new Map();groups.forEach(r=>{
        const key=r.year+'|'+r.group;let v=summed.get(key);
        if(!v){v={year:r.year,territory:'selected',territory_name:'Selected territories together',group:r.group,label:r.label,value:0,raw:0,n:0,combined:false,lists:new Set(),sources:new Set(),territories:new Set()};summed.set(key,v);}
        v.value+=r.value;v.raw+=r.raw;v.n+=r.n;v.combined=v.combined||r.combined;v.lists.add(r.list_in_force);v.sources.add(r.territory_name+'\n'+r.source);v.territories.add(r.territory_name);
      });rankInput=[...summed.values()].map(r=>({year:r.year,territory:r.territory,territory_name:r.territory_name,group:r.group,label:r.label,value:r.value,raw:r.raw,n:r.n,combined:r.combined,list_in_force:[...r.lists].join('; '),source:[...r.sources].join('\n\n'),contributors:[...r.territories].join('; ')}));
    }
    const ranked=leadingGroups(rankInput);seriesChart(A.$('#compare-chart'),series);rankChart(A.$('#rank-chart'),ranked,together?null:rankTerritory);
    const legend=A.$('#compare-legend');legend.replaceChildren();A.legend(legend,territories.map(t=>({label:A.territoryName(t),colour:A.territoryColour(t)})));
    const exported=A.viewRows(series),seriesTable=A.$('#compare-table');seriesTable.replaceChildren();
    A.table(seriesTable,[{key:'territory_name',label:'Territory'},{key:'year',label:'Year',year:true},{key:'label',label:'Indicator / combined item',render:(td,r)=>{td.textContent=r.label;td.title=A.tooltip(r.territory,r.year,r.raw,r.n);}},{key:'value',label:A.scaleLabel(),numeric:true},{key:'raw',label:'Annual printed figure',numeric:true},{key:'n',label:'Printed lines',numeric:true},{key:'list_in_force',label:'List in force'},{key:'source',label:'Printed source',render:(td,r)=>{const details=A.el('details');details.append(A.el('summary',{},'Report / table / pages'),A.el('p',{},r.source));td.append(details);}}],exported);
    const rankTable=A.$('#rank-table');rankTable.replaceChildren();A.table(rankTable,[{key:'territory_name',label:'Territory / scope'},{key:'year',label:'Year',year:true},{key:'rank',label:'Rank',numeric:true},{key:'label',label:'Group / item',render:(td,r)=>{td.textContent=r.label;td.title=rankTip(r);}},{key:'value',label:A.scaleLabel(),numeric:true},{key:'raw',label:'Annual printed figure',numeric:true},{key:'n',label:'Printed lines',numeric:true},{key:'contributors',label:'Contributing territories'},{key:'list_in_force',label:'List in force'}],ranked);
    const exportNode=A.$('#compare-export');exportNode.replaceChildren();A.exportButton(exportNode,exported,'atlas-compare-territory-series');const rankExport=A.$('#rank-export');rankExport.replaceChildren();A.exportButton(rankExport,ranked.map(r=>({...r,stream:A.state.stream,population:A.state.population,measure:A.state.measure,ruler:A.state.ruler,scale:A.state.scale,smoothing:'0'})),'atlas-compare-ranks');
  });
}());
