(function () {
  'use strict';
  const A=window.Atlas;let codebook,checks,assignments;
  A.start(async function (token,current) {
    if(!codebook)[codebook,checks]=await Promise.all([A.get('codebook.csv',true),A.get('checks.csv',true)]);if(!current())return;
    if(!assignments)assignments=await A.get('report_year_assignments.json');if(!current())return;
    const undated=A.$('#undated-table');undated.replaceChildren();A.table(undated,[{key:'territory',label:'Territory',render:(td,r)=>td.textContent=A.territoryName(r.territory)},{key:'source_file',label:'Workbook'},{key:'sheet',label:'Sheet'},{key:'proposed_year',label:'Report year (found in the report)',year:true},{key:'confidence',label:'Confidence'},{key:'figures',label:'Disease-line figures',numeric:true},{key:'basis',label:'Evidence',render:(td,r)=>{const d=A.el('details');d.append(A.el('summary',{},'Basis · found in the report'),A.el('p',{},r.basis));td.append(d);}}],assignments);
    const grid=A.$('#sources-coverage');grid.replaceChildren();A.coverageGrid(grid,true);
    const uncoded=A.$('#uncoded-table');uncoded.replaceChildren();const quality=A.meta.quality.map(r=>({...r,territory:A.territoryName(r.territory),share:r.uncoded_share==null?null:r.uncoded_share*100}));
    A.table(uncoded,[{key:'territory',label:'Territory'},{key:'uncoded_figures',label:'Uncoded figures',numeric:true},{key:'line_figures',label:'All printed line figures',numeric:true},{key:'share',label:'Uncoded (%)',numeric:true}],quality);
    const arithmetic=A.$('#arithmetic-table');arithmetic.replaceChildren();A.table(arithmetic,[{key:'territory',label:'Territory'},{key:'inpatient_pass',label:'Pass',numeric:true},{key:'inpatient_fail',label:'Fail',numeric:true},{key:'inpatient_unchecked',label:'Unchecked line figures',numeric:true}],quality);
    const repeats=A.$('#repeats-table');repeats.replaceChildren();A.table(repeats,[{key:'territory',label:'Territory'},{key:'repeat_rows',label:'Repeated rows (all kinds)',numeric:true},{key:'repeat_lines',label:'Repeated line figures',numeric:true}],quality);
    const rules=A.$('#counting-table');rules.replaceChildren();A.table(rules,[{key:'territory',label:'Territory'},{key:'rule',label:'Rule'},{key:'scopes',label:'Scopes',numeric:true},{key:'figures',label:'Source figures',numeric:true},{key:'note',label:'Reading'}],A.meta.counting_rules);
    const lenses=A.$('#lens-notes');lenses.replaceChildren();A.meta.lists.forEach(l=>{const details=A.el('details',{class:'notes'}),notes=A.meta.lens_approximations.filter(r=>r.list===l.key);details.append(A.el('summary',{},l.label+' · '+notes.length+' approximation / reporting notes'));A.table(details,[{key:'item',label:'Item'},{key:'report_as',label:'Report as'},{key:'items',label:'Items combined'},{key:'note',label:'Approximation / limitation'},{key:'codes',label:'Codes',render:(td,r)=>td.textContent=r.codes.join('; ')}],notes);lenses.append(details);});
    const cb=A.$('#codebook-table');cb.replaceChildren();A.table(cb,[{key:'variable',label:'Variable'},{key:'label',label:'Label'},{key:'type',label:'Type'},{key:'source',label:'Source'},{key:'note',label:'Note'}],codebook);
    const ck=A.$('#dataset-checks');ck.replaceChildren();const counts={};checks.forEach(r=>{const key=r.status||r.result||'recorded';counts[key]=(counts[key]||0)+1;});ck.append(A.el('p',{class:'caption'},'Dataset checks carried from N15: '+Object.entries(counts).map(([k,v])=>k+' '+A.fmt(v)).join('; ')+'.'));const detail=A.el('details',{class:'notes'});detail.append(A.el('summary',{},'Read the dataset checks'));A.table(detail,Object.keys(checks[0]||{}).map(k=>({key:k,label:k.replace(/_/g,' ')})),checks);ck.append(detail);
    const exports=A.$('#sources-export');exports.replaceChildren();A.exportButton(exports,quality,'atlas-source-quality');
    A.$('#built-at').textContent='Data built on the laptop · '+A.meta.built_at;
  });
}());
