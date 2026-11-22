/* =========================================================
   Protokół: wspólny model -> podgląd HTML, PDF (pdfmake), Word (docx)
   ========================================================= */

/* ---------- model ---------- */
function protocolModel(p){
  const w=W(p);
  const val=x=>filled(x)?String(x):'–';
  const ev=e=>e.s==='ok'?'pozytywna':e.s==='bad'?{text:'negatywna',neg:true}:e.s==='warn'?'niekompletna':'–';
  const ob1=p.obwody.filter(o=>o.typ==='1f'||o.typ==='ogrz'), ob3=p.obwody.filter(o=>o.typ==='3f'), wlz=p.obwody.filter(o=>o.typ==='wlz');
  const pairs3=TYPY['3f'].pairs;
  const B=[]; let n=0;
  const H=t=>B.push({t:'h', text:(++n)+'. '+t});
  const Pp=(text,o)=>B.push(Object.assign({t:'p', text}, o||{}));
  const T=(head,rows,o)=>B.push(Object.assign({t:'table', head, rows}, o||{}));
  const inGroup=o=>{ const g=izoGroupOf(o,p); return (g && evIzoRaw(o,p).s==='none') ? g : null; };
  const t3=list=>T(['Lp.','Symbol','Nazwa','U [V]',...pairs3,'Ocena'], list.map((o,i)=>{ const g=inGroup(o); return [String(i+1),o.sym,o.nazwa,g?String(izoU(g,p).u):String(izoU(o,p).u),
      ...(g?[{text:'pomiar grupowy: '+g.nazwa, colSpan:pairs3.length}]:o.izoMet==='zw'?[{text:IZO_ZW[o.typ]+': '+val((o.izo||{})[IZO_ZW[o.typ]]), colSpan:pairs3.length}]:pairs3.map(k=>val((o.izo||{})[k]))), ev(evIzo(o,p))]; }), {wide:true, nameCol:2});

  B.push({t:'title', text:'PROTOKÓŁ NR '+(p.nr||'…')});
  B.push({t:'sub', text:'z kontroli stanu technicznego i badań instalacji elektrycznej do 1 kV\nzgodnie z PN-HD 60364-6:2016 „Sprawdzanie”'});
  T(null,[
    ['Adres / obiekt',val(p.adres)],['Użytkownik obiektu',val(p.uzytkownik)],['Data pomiarów',val(p.data)],
    ['Układ sieci',val(p.uklad)],['Rodzaj pomiarów',val(p.rodzaj)],['Pogoda',val(p.pogoda)],
    ['Pomiary wykonał',(w.osoba||'–')+(w.firma?', '+w.firma:'')+(w.nip?', NIP: '+w.nip:'')],
    ['Nr uprawnień',val(w.upr)],
    ['Przyrząd pomiarowy',(w.miernik||'–')+(w.wzorc?' (świadectwo wzorcowania ważne do '+w.wzorc+')':'')]
  ],{kv:true});

  H('Oględziny instalacji');
  T(['Lp.','Czynności podlegające oględzinom','Wymagania wg norm','Ocena'], oglItems(p).map((it,i)=>{ const a=p.ogl[it.k]||{};
    const ph=(a.photos||[]).length?' (fot. '+a.photos.map(x=>photoNum(p,x)).join(', ')+')':'';
    return [String(i+1), it.q+(a.uwaga?'\nUwaga: '+a.uwaga:'')+ph, it.n, a.v==='tak'?'spełnia wymagania':a.v==='nie'?{text:'nie spełnia',neg:true}:a.v==='nd'?'nie dotyczy':'–']; }), {nameCol:1});

  H('Badanie ciągłości przewodów ochronnych i połączeń wyrównawczych');
  if(cigTryb(p)==='zs') Pp(`Ciągłość przewodów ochronnych w obwodach potwierdzono pomiarem impedancji pętli zwarcia i badaniem wyłączników RCD (pkt ${n+3} i ${n+4}). Pomiarowi poddano połączenia wyrównawcze.`);
  Pp('Połączenia wyrównawcze:',{bold:true});
  if(p.wyrNd||!(p.wyr||[]).length) Pp('Nie dotyczy.');
  else T(['Lp.','Połączenie','R [Ω]','R wym. [Ω]','Ocena'], p.wyr.map((x,i)=>[String(i+1),x.nazwa,val(x.r),val(x.lim||p.cigLimit),ev(evWyr(x,p))]), {nameCol:1});
  Pp('Obwody:',{bold:true});
  T(['Lp.','Rozdzielnica','Symbol','Nazwa obwodu','R [Ω]','Ocena'], p.obwody.map((o,i)=>{ const e=evCig(o,p); return [String(i+1),o.rozdz||'',o.sym,o.nazwa,val(o.cig), e.t==='potwierdzona pomiarem Zs'?'potwierdzona pomiarem Zs':ev(e)]; }), {nameCol:3});

  H('Badanie rezystancji izolacji kabla zasilającego');
  Pp('Napięcie probiercze DC wg kolumny U. Wartość dopuszczalna wg PN-HD 60364-6:2016 (tab. 6.1): ≥ 1 MΩ; dla obwodów SELV/PELV (250 V) ≥ 0,5 MΩ. Pomiar napięciem obniżonym do 250 V ze względu na ograniczniki przepięć – wymagane ≥ 1 MΩ (pkt 6.4.3.3). Wartości w [MΩ].',{small:true});
  if(wlz.length) t3(wlz); else Pp('Nie dotyczy.');

  H('Badanie rezystancji izolacji obwodów');
  const grs=izoGroups(p).filter(g=>(g.obwody||[]).length);
  if(grs.length){ Pp('Pomiary grupowe od strony zasilania (wszystkie obwody odbiorcze przyłączone, odbiorniki odłączone; PN-HD 60364-6, pkt 6.4.3.3) [MΩ]:',{bold:true});
    T(['Lp.','Pomiar grupowy','Obejmuje obwody','U [V]','Wyniki [MΩ]','Ocena'], grs.map((g,i)=>[String(i+1), g.nazwa, (g.obwody||[]).map(id=>(p.obwody.find(o=>o.id===id)||{}).sym).filter(Boolean).join(', '), String(izoU(g,p).u),
      izoPairsG(g,p).map(k=>k+': '+val((g.izo||{})[k])).join('\n'), ev(evIzoG(g,p))]), {nameCol:1}); }
  if(ob1.length){ Pp('Obwody jednofazowe [MΩ]:',{bold:true});
    T(['Lp.','Symbol','Nazwa','U [V]','L-PE','L-N','N-PE','Ocena'], ob1.map((o,i)=>{ const g=inGroup(o); return [String(i+1),o.sym,o.nazwa,g?String(izoU(g,p).u):String(izoU(o,p).u),
      ...(g?[{text:'pomiar grupowy: '+g.nazwa, colSpan:3}]:o.izoMet==='zw'?[{text:'L+N–PE: '+val((o.izo||{})['L+N–PE']),colSpan:3}]:['L-PE','L-N','N-PE'].map(k=>val((o.izo||{})[k]))), ev(evIzo(o,p))]; }), {nameCol:2}); }
  if(p.obwody.some(o=>o.izoMet==='zw')) Pp('L+N–PE – pomiar między zwartymi przewodami czynnymi a przewodem ochronnym (PN-HD 60364-6, pkt 6.4.3.3).',{small:true});
  if(ob3.length){ Pp('Obwody trójfazowe [MΩ]:',{bold:true}); t3(ob3); }
  if(!ob1.length&&!ob3.length) Pp('Brak obwodów.');

  H('Badanie impedancji pętli zwarcia');
  Pp('U₀ = 230 V; warunek Zs ≤ Za = U₀/Ia (PN-HD 60364-4-41).',{small:true});
  T(['Lp.','Symbol','Nazwa','Typ','In [A]','Ia [A]','Zs [Ω]','Za [Ω]','Ik [A]','Ocena'], p.obwody.map((o,i)=>{ const ia=iaFor(o), z=num(o.zs);
    return [String(i+1),o.sym,o.nazwa,(o.zab||{}).char||'',String((o.zab||{}).In||''),ia?fmt(ia,0):'–',val(o.zs),ia?fmt(U0/ia):'–',z?fmt(U0/z,0):'–',ev(evZs(o))]; }), {nameCol:2});

  H('Badanie wyłączników różnicowoprądowych RCD');
  if(p.rcd.length){
    T(['Lp.','Symbol','Typ','In [A]','IΔn [mA]','t 1×IΔn 0°/180° [ms]','t 5×IΔn 0°/180° [ms]','Ia 0°/180° [mA]','Uc [V]','TEST','Ocena'], p.rcd.map((r,i)=>[String(i+1),r.sym,r.typ+((r.char&&r.char!=='G')?' '+r.char:''),String(r.In||''),String(r.idn||''),
      val(r.t1a)+' / '+val(r.t1b), val(r.t5a)+' / '+val(r.t5b), val(r.ia)+' / '+val(r.iab), val(r.uc), r.test==='tak'?'działa':r.test==='nie'?{text:'nie działa',neg:true}:'–', ev(evRcd(r))]), {wide:true});
    Pp('Kryteria oceny (PN-EN 61008-1, PN-EN 61009-1, PN-EN 62423):\n'+p.rcd.map(r=>r.sym+' – '+rcdCritText(r)+'.').join('\n'),{small:true});
  } else Pp('Nie dotyczy.');

  H('Badanie rezystancji uziemienia');
  if(p.uzNd||!p.uz.length) Pp('Nie dotyczy.');
  else T(['Lp.','Symbol','Metoda','R [Ω]','R wym. [Ω]','Ocena'], p.uz.map((u,i)=>[String(i+1),u.sym,u.met||'',val(u.r),val(u.lim),ev(evUz(u))]), {nameCol:2});

  const grz=p.obwody.filter(o=>o.typ==='ogrz');
  if(grz.length){ H('Karta pomiarów przewodów grzejnych');
    grz.forEach(o=>{ const g=grzParams(o), gr=o.grz||{};
      Pp(`${o.sym} – ${o.nazwa}: ${gr.prod||''}${gr.dl?', '+gr.dl+' m':''}${g.moc?', '+fmt(g.moc,0)+' W':''}; R znamionowa ${g.rn?fmt(g.rn,1)+' Ω':'–'} (tolerancja ${g.tolMin}% / +${g.tolMax}%); izolacja ≥ ${g.isoMin} MΩ przy ${g.uIso} V, ≥ 30 s.${gr.mufa?' Nr mufy: '+gr.mufa+'.':''}${(gr.photos||[]).length?' (fot. '+gr.photos.map(x=>photoNum(p,x)).join(', ')+')':''}`);
      T(['Etap','Data','R żyły [Ω]','R izolacji [MΩ]','Ocena'], ETAPY.map(([k,l])=>{ const e=(gr.etapy||{})[k]||{}; return [l,val(e.data),val(e.r),val(e.iso),ev(evEtap(o,k))]; }), {nameCol:0});
    }); }

  H('Uwagi i wnioski'); Pp(p.uwagi||'–');
  H('Orzeczenie');
  B.push({t:'p', runs:[{text:'W myśl obowiązujących przepisów instalacja '},{text:p.orzeczenie==='nadaje'?'nadaje się':p.orzeczenie==='nie'?'nie nadaje się':'nadaje / nie nadaje się',bold:true},{text:' do eksploatacji.'}]});
  B.push({t:'p', runs:[{text:'Data następnego badania: '},{text:val(p.nastepne),bold:true}]});
  B.push({t:'sign', left:'Pomiary wykonał i sprawdził: '+(w.osoba||''), right:'Podpis: ....................................'});
  if(p.photos.length) B.push({t:'photos', items:p.photos.map((ph,i)=>({data:ph.data, caption:'Fot. '+(i+1)+(ph.opis?' – '+ph.opis:'')}))});
  return B;
}
function photoNum(p,pid){ return p.photos.findIndex(x=>x.id===pid)+1; }
function cellText(c){ return (c&&typeof c==='object')?c.text:String(c??''); }

/* ---------- HTML (podgląd) ---------- */
function htmlFromModel(B){
  const cell=(c,tag)=>{ if(c&&typeof c==='object'){ return `<${tag}${c.colSpan?` colspan="${c.colSpan}"`:''}${c.neg?' class="neg"':''}>${esc(c.text).replace(/\n/g,'<br>')}</${tag}>`; } return `<${tag}>${esc(c).replace(/\n/g,'<br>')}</${tag}>`; };
  return B.map(b=>{
    switch(b.t){
      case 'title': return `<h1>${esc(b.text)}</h1>`;
      case 'sub': return `<div class="sub">${esc(b.text).replace(/\n/g,'<br>')}</div>`;
      case 'h': return `<h2>${esc(b.text)}</h2>`;
      case 'p': return b.runs ? `<p>${b.runs.map(r=>r.bold?`<b>${esc(r.text)}</b>`:esc(r.text)).join('')}</p>`
                              : `<p style="white-space:pre-wrap${b.small?';font-size:9pt':''}">${b.bold?'<b>':''}${esc(b.text)}${b.bold?'</b>':''}</p>`;
      case 'table': return b.kv ? `<table>${b.rows.map(r=>`<tr><th style="width:34%;text-align:left">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table>`
                                : `<table><tr>${b.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${b.rows.map(r=>`<tr>${r.map(c=>cell(c,'td')).join('')}</tr>`).join('')}</table>`;
      case 'sign': return `<div class="sign"><span>${esc(b.left)}</span><span>${esc(b.right)}</span></div>`;
      case 'photos': return `<h2>Dokumentacja fotograficzna</h2>`+b.items.map(it=>`<div class="fot"><img src="${it.data}" alt="${esc(it.caption)}"><br>${esc(it.caption)}</div>`).join('');
    }
    return '';
  }).join('');
}
function protocolHtml(p){ return htmlFromModel(protocolModel(p)); }

/* ---------- ładowanie bibliotek na żądanie ---------- */
const _libs={};
function loadScript(src){
  if(_libs[src]) return _libs[src];
  _libs[src]=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>{ delete _libs[src]; rej(new Error('Nie udało się wczytać '+src)); }; document.head.appendChild(s); });
  return _libs[src];
}
async function ensurePdfmake(){ if(!window.pdfMake){ await loadScript('vendor/pdfmake.min.js'); } if(!window.pdfMake.vfs || !Object.keys(window.pdfMake.vfs).length){ await loadScript('vendor/vfs_fonts.js'); } }
async function ensureDocx(){ if(!window.docx) await loadScript('vendor/docx.min.js'); }

/* ---------- PDF ---------- */
function pdfDocDefinition(B,p){
  const content=[];
  const pc=c=>{ if(c&&typeof c==='object'){ const o={text:c.text}; if(c.neg){ o.color='#b3261e'; o.bold=true; } if(c.colSpan) o.colSpan=c.colSpan; return o; } return {text:String(c??'')}; };
  B.forEach(b=>{
    switch(b.t){
      case 'title': content.push({text:b.text, style:'title'}); break;
      case 'sub': content.push({text:b.text, style:'sub'}); break;
      case 'h': content.push({text:b.text, style:'h'}); break;
      case 'p': content.push(b.runs ? {text:b.runs.map(r=>({text:r.text, bold:!!r.bold})), margin:[0,2,0,4]}
                                    : {text:b.text, bold:!!b.bold, fontSize:b.small?8:9.5, margin:[0,2,0,4]}); break;
      case 'table': {
        if(b.kv){ content.push({table:{widths:[150,'*'], body:b.rows.map(r=>[{text:r[0],bold:true,fillColor:'#eeeeee'},{text:r[1]}])}, layout:'lightGrid', fontSize:9, margin:[0,0,0,6]}); break; }
        const cols=b.head.length;
        const body=[b.head.map(h=>({text:h, bold:true, fillColor:'#eeeeee'}))];
        b.rows.forEach(r=>{ const row=[]; r.forEach(c=>{ row.push(pc(c)); const cs=(c&&c.colSpan)||1; for(let i=1;i<cs;i++) row.push({}); }); body.push(row); });
        const widths=b.head.map((_,i)=> i===b.nameCol ? '*' : 'auto');
        if(b.nameCol===undefined) widths[widths.length-1]='*';
        content.push({table:{headerRows:1, widths, body, dontBreakRows:true}, layout:'lightGrid', fontSize: cols>11?6.5: cols>8?7.5:8.5, margin:[0,0,0,6]});
        break; }
      case 'sign': content.push({columns:[{text:b.left},{text:b.right, alignment:'right'}], margin:[0,30,0,0], fontSize:10}); break;
      case 'photos': {
        content.push({text:'Dokumentacja fotograficzna', style:'h', pageBreak:'before'});
        for(let i=0;i<b.items.length;i+=2){
          content.push({columns:b.items.slice(i,i+2).map(it=>({stack:[{image:it.data, fit:[240,200]},{text:it.caption, fontSize:8, margin:[0,2,0,0]}]})), columnGap:15, margin:[0,0,0,12]});
        }
        break; }
    }
  });
  return {
    pageSize:'A4', pageMargins:[36,40,36,48],
    info:{title:'Protokół '+(p.nr||''), author:(W(p).osoba||''), subject:'Protokół z pomiarów instalacji elektrycznej'},
    defaultStyle:{font:'Roboto', fontSize:9.5, lineHeight:1.15},
    styles:{ title:{fontSize:15,bold:true,alignment:'center',margin:[0,0,0,4]}, sub:{fontSize:9.5,alignment:'center',margin:[0,0,0,12]}, h:{fontSize:11.5,bold:true,margin:[0,12,0,5]} },
    footer:(cur,total)=>({columns:[{text:'Protokół '+(p.nr||''), fontSize:8, color:'#555'},{text:'Strona '+cur+' z '+total, alignment:'right', fontSize:8, color:'#555'}], margin:[36,14,36,0]}),
    content
  };
}
async function buildPdfBlob(p){
  await ensurePdfmake();
  const dd=pdfDocDefinition(protocolModel(p),p);
  return new Promise((res,rej)=>{ try{ pdfMake.createPdf(dd).getBlob(b=>res(b)); }catch(e){ rej(e); } });
}

/* ---------- Word (.docx) ---------- */
function dataUrlToBytes(d){ const b=atob(d.split(',')[1]); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; }
function imgSize(d){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res([i.naturalWidth,i.naturalHeight]); i.onerror=()=>res([4,3]); i.src=d; }); }
async function buildDocxBlob(p){
  await ensureDocx();
  const D=window.docx; const B=protocolModel(p);
  const FONT='Calibri';
  const run=(text,o)=>new D.TextRun(Object.assign({text:String(text??''), font:FONT}, o||{}));
  const multi=(text,o)=>String(text??'').split('\n').map((line,i)=>new D.TextRun(Object.assign({text:line, font:FONT, break:i?1:0}, o||{})));
  const border={style:D.BorderStyle.SINGLE, size:4, color:'444444'};
  const borders={top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border};
  const tcell=(c,o)=>{ const isObj=c&&typeof c==='object'; const txt=isObj?c.text:c;
    return new D.TableCell({ children:[new D.Paragraph({children:multi(txt,{size:o.size, bold:o.bold||(isObj&&c.neg), color:(isObj&&c.neg)?'B3261E':undefined})})],
      columnSpan:(isObj&&c.colSpan)||undefined, shading:o.head?{fill:'EEEEEE', type:D.ShadingType.CLEAR, color:'auto'}:undefined,
      margins:{top:30,bottom:30,left:60,right:60} }); };
  const tcellW=(c,o,width)=>{ const isObj=c&&typeof c==='object'; const txt=isObj?c.text:c;
    return new D.TableCell({ width, children:[new D.Paragraph({children:multi(txt,{size:o.size, bold:o.bold||(isObj&&c.neg), color:(isObj&&c.neg)?'B3261E':undefined})})],
      columnSpan:(isObj&&c.colSpan)||undefined, shading:o.head?{fill:'EEEEEE', type:D.ShadingType.CLEAR, color:'auto'}:undefined,
      margins:{top:30,bottom:30,left:50,right:50} }); };
  const children=[];
  for(const b of B){
    switch(b.t){
      case 'title': children.push(new D.Paragraph({alignment:D.AlignmentType.CENTER, spacing:{after:80}, children:[run(b.text,{bold:true,size:30})]})); break;
      case 'sub': children.push(new D.Paragraph({alignment:D.AlignmentType.CENTER, spacing:{after:240}, children:multi(b.text,{size:19})})); break;
      case 'h': children.push(new D.Paragraph({spacing:{before:240,after:100}, keepNext:true, children:[run(b.text,{bold:true,size:23})]})); break;
      case 'p': children.push(new D.Paragraph({spacing:{after:80}, children: b.runs ? b.runs.map(r=>run(r.text,{bold:!!r.bold, size:20})) : multi(b.text,{bold:!!b.bold, size:b.small?16:20})})); break;
      case 'table': {
        let rows;
        let colW=null; const TOTAL=10200;
        if(b.kv){ colW=[3300,6900]; }
        else { // szerokości kolumn proporcjonalne do długości tekstu (kolumna z nazwą dostaje resztę)
          const n=b.head.length, len=new Array(n).fill(0);
          const rowsX=b.rows.map(r=>{ const out=[]; r.forEach(c=>{ out.push(c); for(let i=1;i<((c&&c.colSpan)||1);i++) out.push(null); }); return out; });
          [b.head,...rowsX].forEach(r=>r.forEach((c,i)=>{ if(c===null||(c&&c.colSpan)) return; const t=cellText(c).split('\n').reduce((m,x)=>Math.max(m,x.length),0); len[i]=Math.max(len[i], Math.min(t, i===b.nameCol?60:24)); }));
          const wgt=len.map((l,i)=>Math.max(l+1, i===b.nameCol?18:4)); const sum=wgt.reduce((a,c)=>a+c,0);
          colW=wgt.map(x=>Math.round(TOTAL*x/sum));
        }
        const wOf=(ri,ci,span)=>{ let w=0; for(let k=0;k<(span||1);k++) w+=colW[ci+k]||0; return {size:w, type:D.WidthType.DXA}; };
        if(!b.kv){ const sz=b.head.length>11?13: b.head.length>8?15:17;
          const build=(r,o)=>{ let ci=0; return r.map(c=>{ const span=(c&&c.colSpan)||1; const cellEl=tcellW(c,o,wOf(0,ci,span)); ci+=span; return cellEl; }); };
          rows=[new D.TableRow({tableHeader:true, children:build(b.head,{bold:true,head:true,size:sz})}),
                ...b.rows.map(r=>new D.TableRow({cantSplit:true, children:build(r,{size:sz})}))]; }
        else rows=b.rows.map(r=>new D.TableRow({children:[tcellW(r[0],{bold:true,head:true,size:18},wOf(0,0,1)), tcellW(r[1],{size:18},wOf(0,1,1))]}));
        children.push(new D.Table({rows, columnWidths:colW, layout:D.TableLayoutType.FIXED, width:{size:TOTAL, type:D.WidthType.DXA}, borders}));
        children.push(new D.Paragraph({spacing:{after:80}, children:[]}));
        break; }
      case 'sign': children.push(new D.Paragraph({spacing:{before:600}, tabStops:[{type:D.TabStopType.RIGHT, position:9600}], children:[run(b.left,{size:20}), run('\t'+b.right,{size:20})]})); break;
      case 'photos': {
        children.push(new D.Paragraph({pageBreakBefore:true, spacing:{after:120}, children:[run('Dokumentacja fotograficzna',{bold:true,size:23})]}));
        for(const it of b.items){
          const [w0,h0]=await imgSize(it.data); const wpx=300, hpx=Math.round(wpx*h0/w0);
          children.push(new D.Paragraph({keepNext:true, children:[new D.ImageRun({type:'jpg', data:dataUrlToBytes(it.data), transformation:{width:wpx, height:hpx}})]}));
          children.push(new D.Paragraph({spacing:{after:200}, children:[run(it.caption,{size:16})]}));
        }
        break; }
    }
  }
  const doc=new D.Document({
    creator:W(p).osoba||'', title:'Protokół '+(p.nr||''),
    styles:{default:{document:{run:{font:FONT, size:20}}}},
    sections:[{ properties:{page:{size:{width:11906,height:16838}, margin:{top:900,bottom:900,left:850,right:850}}},
      footers:{default:new D.Footer({children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT, children:[run('Protokół '+(p.nr||'')+' – strona ',{size:16,color:'555555'}), new D.TextRun({children:[D.PageNumber.CURRENT], size:16, color:'555555', font:FONT})]})]})},
      children }]
  });
  return D.Packer.toBlob(doc);
}

/* ---------- zapis / udostępnianie ---------- */
function protocolFileName(p,ext){
  const base=('Protokol_'+(p.nr||'bez_numeru')+'_'+(p.adres||'')).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/_+/g,'_').replace(/_$/,'').slice(0,80);
  return base+'.'+ext;
}
function downloadBlob(blob,name){
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
async function shareOrDownload(blob,name,title){
  const file=new File([blob],name,{type:blob.type});
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title}); return 'shared'; }
  }catch(e){ if(e && e.name==='AbortError') return 'cancelled'; }
  downloadBlob(blob,name); return 'downloaded';
}
