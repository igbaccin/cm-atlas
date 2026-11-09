(function () {
  'use strict';
  const A=window.Atlas;
  const WORLD='https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
  const IDS={894:'zambia',72:'bechuanaland',800:'uganda',180:'congo',288:'gold_coast',454:'malawi',694:'sierra_leone',404:'kenya',566:'nigeria'};
  const AFRICA=new Set([12,24,204,72,854,108,120,132,140,148,174,178,180,262,818,226,232,748,231,266,270,288,324,624,384,404,426,430,434,450,454,466,478,480,504,508,516,562,566,646,678,686,690,694,706,710,728,729,834,768,788,800,894,716,732]);
  let geography,aggregateKey='',annual=[],playing=false,timer;
  function stop(){playing=false;clearTimeout(timer);const b=A.$('#map-play');b.textContent='Play';b.setAttribute('aria-pressed','false');}
  function playNext(){clearTimeout(timer);if(!playing)return;if(+A.state.year>=1967){stop();return;}timer=setTimeout(()=>A.change({year:A.year(+A.state.year+1)}),700);}
  async function geometry(){
    if(geography)return geography;
    if(!window.topojson)throw new Error('The pinned TopoJSON library could not load. Connect to the internet and reload.');
    const response=await fetch(WORLD);if(!response.ok)throw new Error('World boundaries: HTTP '+response.status);
    const topology=await response.json(),countries=topojson.feature(topology,topology.objects.countries).features.filter(f=>AFRICA.has(+f.id));
    const territories=[];
    countries.forEach(f=>{
      if(IDS[+f.id])territories.push({...f,territory:IDS[+f.id]});
      if(+f.id===834){
        const polygons=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
        const islands=[],mainland=[];
        polygons.forEach(p=>{const centroid=d3.geoCentroid({type:'Polygon',coordinates:p});(centroid[0]>38.8&&centroid[1]>-6.6?islands:mainland).push(p);});
        if(!islands.length||!mainland.length)throw new Error('The supplied Tanzania geometry could not be split into Tanganyika and Zanzibar.');
        territories.push({type:'Feature',territory:'tanganyika',geometry:{type:'MultiPolygon',coordinates:mainland}}, {type:'Feature',territory:'zanzibar',geometry:{type:'MultiPolygon',coordinates:islands}});
      }
    });
    if(territories.length!==11)throw new Error('Expected eleven mapped territories.');
    geography={countries,territories};return geography;
  }
  function annualRow(t,year,byYear){
    const record=byYear.get(t+'|'+year);
    if(t==='congo')return {territory:t,year,value:null,n:null,years:0,status:'Groups only · no disease lines',source:A.sourceText(t,year),lists:A.listAt(t,year).join('; ')};
    return record?{...record,years:record.value==null?0:1,status:record.value==null?'Selected denominator unavailable':'Available',source:A.sourceText(t,year),lists:A.listAt(t,year).join('; ')}:
      {territory:t,year,value:null,n:null,years:0,status:A.meta.coverage.some(r=>r.territory===t&&r.year===year&&r.stream===A.state.stream&&r.status!=='none')?'No numeric figure for this indicator and selection':'No return for this year and stream',source:A.sourceText(t,year),lists:A.listAt(t,year).join('; ')};
  }
  function decadeRow(t,decade,byYear){
    const values=d3.range(decade,decade+10).map(y=>annualRow(t,y,byYear)),present=values.filter(r=>r.value!=null);
    const sourced=t==='congo'?values.filter(r=>r.source):present;
    return {territory:t,year:present.length?present[present.length-1].year:decade,decade:A.year(decade)+'s',value:present.length?d3.mean(present,r=>r.value):null,raw:present.length?d3.mean(present,r=>r.raw):null,n:present.length?d3.sum(present,r=>r.n):null,years:present.length,available_years:present.map(r=>A.year(r.year)).join('; '),combined:present.some(r=>r.combined),label:[...new Set(present.map(r=>r.label))].join('; ')||A.metricLabel(),status:t==='congo'?'Groups only · no disease lines':present.length?'Mean of available annual values':'No available annual indicator',lists:[...new Set(sourced.map(r=>r.lists))].join('; '),source:sourced.map(r=>A.year(r.year)+'\n'+r.source).join('\n\n')};
  }
  function tooltip(r){
    return A.territoryName(r.territory)+', '+(r.decade||A.year(r.year))+'\n'+r.status+'\n'+(r.label||A.metricLabel())+'\n'+A.scaleLabel()+': '+A.fmt(r.value)+'\n'+(r.decade?'Mean annual printed figure: ':'Printed figure: ')+A.fmt(r.raw)+'\nPrinted lines: '+A.fmt(r.n)+'\nAvailable years: '+r.years+(r.available_years?' ('+r.available_years+')':'')+'\nList: '+(r.lists||'Not identified')+(r.combined?'\nIncludes a combined source item.':'')+'\n'+r.source;
  }
  function territoryLink(r){
    const values={territories:r.territory,year:A.year(r.year),from:A.year(Math.min(+A.state.from,r.year)),to:A.year(Math.max(+A.state.to,r.year))};
    if(r.decade){values.from=r.decade.slice(0,4);values.to=A.year(Math.min(1967,+values.from+9));}
    return A.link('territory.html',values);
  }
  function draw(node,geo,rows,colour,id,small){
    const width=small?320:1050,height=small?350:620;
    const collection={type:'FeatureCollection',features:geo.countries};
    const projection=d3.geoMercator().fitExtent([[15,15],[width-15,height-15]],collection),path=d3.geoPath(projection);
    const svg=d3.create('svg').attr('viewBox',[0,0,width,height]).attr('role','img').attr('aria-label',small?id:'Africa, '+A.year(A.state.year)+', '+A.metricLabel());
    const pattern=svg.append('defs').append('pattern').attr('id',id).attr('patternUnits','userSpaceOnUse').attr('width',5).attr('height',5);
    pattern.append('rect').attr('width',5).attr('height',5).attr('fill','#e7eeea');pattern.append('path').attr('d','M-1,1L1,-1M0,5L5,0M4,6L6,4').attr('stroke','#96a49e').attr('stroke-width',1);
    svg.append('g').selectAll('path').data(geo.countries).join('path').attr('d',path).attr('fill','#e3e5e0').attr('stroke','#fffefa').attr('stroke-width',.25);
    const lookup=new Map(rows.map(r=>[r.territory,r]));
    geo.territories.forEach(f=>{
      const r=lookup.get(f.territory);
      const link=svg.append('a').attr('href',territoryLink(r)).attr('aria-label',tooltip(r));
      link.append('path').datum(f).attr('d',path).attr('class','map-territory').attr('tabindex',0).attr('fill',r.value==null?'url(#'+id+')':colour(r.value)).append('title').text(tooltip(r));
      // A small outline ring makes the real Zanzibar polygons reachable at
      // continent scale. The polygons themselves retain their true geometry.
      if(f.territory==='zanzibar'){
        const point=projection(d3.geoCentroid(f));link.append('circle').attr('cx',point[0]).attr('cy',point[1]).attr('r',small?5:7).attr('fill','none').attr('stroke','#526b64').attr('stroke-width',.8).attr('pointer-events','all').append('title').text(tooltip(r));
      }
    });
    node.append(svg.node());
  }
  A.start(async function(token,current){
    clearTimeout(timer);
    A.indicatorControls(A.$('#indicator-controls'));A.$('#map-indicator').textContent=A.metricLabel();
    const mode=A.$('#map-mode');mode.value=A.state.map_mode;mode.onchange=()=>{stop();A.change({map_mode:mode.value});};
    const slider=A.$('#map-year');slider.value=A.state.year;slider.oninput=()=>{stop();A.change({year:slider.value});};A.$('#map-year-label').textContent=A.year(A.state.year);
    A.$('#year-player').hidden=A.state.map_mode==='decades';
    const play=A.$('#map-play');play.textContent=playing?'Pause':'Play';play.setAttribute('aria-pressed',String(playing));play.onclick=()=>{if(playing)stop();else{playing=true;play.textContent='Pause';play.setAttribute('aria-pressed','true');if(+A.state.year===1967)A.change({year:'1887'});else playNext();}};
    const key=JSON.stringify([A.state.stream,A.state.population,A.state.measure,A.state.ruler,A.state.scale,A.state.repeats,A.state.metric,A.state.metric_group,A.state.metric_code,A.state.combined]);
    if(key!==aggregateKey){
      stop();const values=[];A.$('#map-note').textContent='Reading compact figures, one territory at a time…';
      for(const t of A.meta.territories.map(r=>r.key)){
        if(t==='congo')continue;
        const data=await A.loadTerritory(t);if(!current())return;values.push(...A.metricSeries(t,data,true));A.releaseTerritory();
      }
      annual=values;aggregateKey=key;
    }
    const geo=await geometry();if(!current())return;
    const maximum=d3.max(annual,r=>r.value)||0,magnitude=maximum>0?Math.pow(10,Math.floor(Math.log10(maximum))):1,upper=maximum>0?Math.ceil(maximum/magnitude)*magnitude:1;
    const colours=d3.schemeBuGn[6],colour=d3.scaleQuantize().domain([0,upper]).range(colours);
    const legend=A.$('#map-legend');legend.replaceChildren();const labels=colours.map((c,i)=>{const edge=colour.invertExtent(c);return {colour:c,label:'['+d3.format('.5~g')(edge[0])+', '+d3.format('.5~g')(edge[1])+(i===colours.length-1?']':')')};});A.legend(legend,labels);
    const hatch=A.el('p',{class:'caption'});hatch.append(A.el('i',{class:'swatch map-hatch'}),document.createTextNode(' Hatched: no available selected figure, unavailable denominator, or Congo (groups only). A printed zero uses the first colour.'));legend.append(hatch);
    const byYear=new Map(annual.map(r=>[r.territory+'|'+r.year,r])),node=A.$('#map-chart');node.replaceChildren();const rows=[];
    if(A.state.map_mode==='decades'){
      const grid=A.el('div',{class:'decade-maps'});
      for(const decade of d3.range(1890,1970,10)){
        const values=A.meta.territories.map(t=>decadeRow(t.key,decade,byYear));rows.push(...values);
        const article=A.el('article');article.append(A.el('h3',{},A.year(decade)+'s'));draw(article,geo,values,colour,'map-hatch-'+decade,true);grid.append(article);
      }node.append(grid);
    }else{rows.push(...A.meta.territories.map(t=>annualRow(t.key,+A.state.year,byYear)));draw(node,geo,rows,colour,'map-hatch-year',false);}
    A.$('#map-note').textContent='Colour bins: '+A.scaleLabel()+'. Range calculated from every available annual value, 1887–1967. Congo always shows groups only. '+(annual.some(r=>r.combined)?'Some selected values include a combined source item; their tooltips identify this.':'');
    const table=A.$('#map-table');table.replaceChildren();A.table(table,[{key:'territory',label:'Territory',render:(td,r)=>{const a=A.el('a',{href:territoryLink(r)},A.territoryName(r.territory));a.title=tooltip(r);td.append(a);}},{key:'period',label:'Year / decade',render:(td,r)=>td.textContent=r.decade||A.year(r.year)},{key:'value',label:A.scaleLabel(),numeric:true},{key:'n',label:'Printed lines',numeric:true},{key:'years',label:'Available years',numeric:true},{key:'lists',label:'List in force'},{key:'status',label:'Availability'}],rows);
    const bar=A.$('#map-export');bar.replaceChildren();A.exportButton(bar,rows.map(r=>({...r,territory_name:A.territoryName(r.territory),indicator:A.metricLabel(),stream:A.state.stream,population:A.state.population,measure:A.state.measure,ruler:A.state.ruler,scale:A.state.scale,smoothing:'0'})),'atlas-map-'+A.state.map_mode);
    playNext();
  });
  window.addEventListener('pagehide',stop);
}());
