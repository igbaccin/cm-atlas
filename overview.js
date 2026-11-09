(function () {
  'use strict';
  const A=window.Atlas;
  A.start(async function () {
    const grid=A.$('#coverage');grid.replaceChildren();A.coverageGrid(grid);
    const holder=A.$('#territory-summary');holder.replaceChildren();
    const rows=A.meta.territories.map(t=>({territory:t.name,key:t.key,modern_name:t.modern_name,first_year:t.first_year,last_year:t.last_year,lists:t.lists.join('; '),coded_lines:t.coded_lines}));
    const bar=A.el('div',{class:'toolbar'});A.exportButton(bar,rows,'atlas-territory-coverage');holder.append(bar);
    A.table(holder,[{key:'territory',label:'Territory in the returns',render:(td,r)=>td.append(A.el('a',{href:A.link('territory.html',{territories:r.key})},r.territory))},{key:'modern_name',label:'Modern name'},{key:'first_year',label:'First year',numeric:true},{key:'last_year',label:'Last year',numeric:true},{key:'lists',label:'Lists observed'},{key:'coded_lines',label:'Coded printed figures',numeric:true}],rows);
    A.$('#overview-count').textContent=A.fmt(A.meta.coverage.filter(r=>r.status!=='none').length)+' observed territory–year–stream combinations';
  });
}());
