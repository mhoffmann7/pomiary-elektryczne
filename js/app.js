const APP_VERSION='1.1.1';
/* =========================================================
   MAKIETA – aplikacja do protokołów z pomiarów instalacji
   Dane trzymane lokalnie w przeglądarce (bez serwera).
   ========================================================= */
const U0 = 230;
const WYKONAWCA = {
  osoba: 'mgr inż. Marcin Hoffmann',
  nip: '7773412352',
  upr: 'Eksploatacja E1/717/7587/25-A, Dozór D1/717/7588/25-A',
  miernik: 'Metrel MI 3125 SN21320680'
};
const IN_LIST = [6,10,13,16,20,25,32,40,50,63,80,100,125];
// gG – prąd wyłączenia dla 5 s (obwody rozdzielcze/WLZ). Wartości orientacyjne – do weryfikacji z tabelą producenta.
const GG_IA5 = {6:28,10:47,13:60,16:65,20:85,25:110,32:150,40:190,50:250,63:320,80:425,100:580,125:715};

const TYPY = {
  '1f':   {t:'1-fazowy', pairs:['L-PE','L-N','N-PE']},
  '3f':   {t:'3-fazowy', pairs:['L1-L2','L1-L3','L2-L3','L1-N','L2-N','L3-N','L1-PE','L2-PE','L3-PE','N-PE']},
  'wlz':  {t:'WLZ / kabel zasilający', pairs:['L1-L2','L1-L3','L2-L3','L1-N','L2-N','L3-N','L1-PE','L2-PE','L3-PE','N-PE']},
  'ogrz': {t:'Ogrzewanie elektryczne', pairs:['L-PE','L-N','N-PE']}
};

// metoda pomiaru izolacji: 'pary' – każda para osobno; 'zw' – przewody czynne zwarte, pomiar do PE
const IZO_ZW = {'1f':'L+N–PE', 'ogrz':'L+N–PE', '3f':'L1+L2+L3+N–PE', 'wlz':'L1+L2+L3+N–PE'};
function izoPairs(o){ return o.izoMet==='zw' ? [IZO_ZW[o.typ]] : TYPY[o.typ].pairs; }
const OGLEDZINY = [
  {k:'a', base:1, q:'Sposób ochrony przed porażeniem prądem elektrycznym.', n:'PN-HD 60364-4-41'},
  {k:'b', q:'Obecność przegród ogniochronnych i innych środków zapobiegających rozprzestrzenianiu się ognia oraz ochrona przed skutkami cieplnymi.', n:'PN-HD 60364-4-42; PN-HD 60364-5-52 rozdz. 527'},
  {k:'c', base:2, q:'Dobór przewodów z uwagi na obciążalność prądową i spadek napięcia.', n:'PN-IEC 60364-4-43; PN-IEC 60364-5-52 rozdz. 523 i 525'},
  {k:'d', q:'Dobór, nastawienie, selektywność i koordynacja urządzeń zabezpieczających i monitorujących.', n:'PN-HD 60364-5-53 rozdz. 536'},
  {k:'e', q:'Dobór, rozmieszczenie i montaż ograniczników przepięć (SPD), jeśli są wymagane.', n:'PN-HD 60364-5-53 rozdz. 534'},
  {k:'f', q:'Dobór, rozmieszczenie i montaż urządzeń do odłączania izolacyjnego i łączenia.', n:'PN-HD 60364-5-53 rozdz. 536'},
  {k:'g', q:'Dobór urządzeń i środków ochrony odpowiednio do wpływów zewnętrznych i narażeń mechanicznych.', n:'PN-HD 60364-4-42 rozdz. 422; PN-HD 60364-5-51 p. 512.2; PN-HD 60364-5-52 rozdz. 522'},
  {k:'h', base:3, q:'Prawidłowe oznaczenie przewodów ochronno-neutralnych PEN, ochronnych PE i neutralnych N.', n:'PN-IEC 60364-5-51 punkt 514.3'},
  {k:'i', base:4, q:'Obecność schematów, napisów ostrzegawczych lub innych podobnych informacji w szafie sterowniczej.', n:'PN-IEC 60364-5-51 punkt 514.5'},
  {k:'j', q:'Oznaczenie obwodów, zabezpieczeń nadprądowych, łączników, zacisków itp.', n:'PN-HD 60364-5-51 rozdz. 514'},
  {k:'k', base:5, q:'Poprawność połączenia przewodów.', n:'PN-IEC 60364-5-52 rozdział 526'},
  {k:'l', q:'Dobór i wykonanie uziemień, przewodów ochronnych i ich połączeń.', n:'PN-HD 60364-5-54'},
  {k:'m', base:6, q:'Dostępność urządzeń, umożliwiająca wygodną obsługę, identyfikację i konserwację.', n:'PN-IEC 60364-5-51 rozdział 513 i 514'},
  {k:'n', q:'Środki ochrony przed zakłóceniami elektromagnetycznymi.', n:'PN-HD 60364-4-44 rozdz. 444'},
  {k:'o', q:'Połączenie części przewodzących dostępnych z układem uziemiającym.', n:'PN-HD 60364-4-41 rozdz. 411'},
  {k:'p', q:'Dobór i montaż oprzewodowania.', n:'PN-HD 60364-5-52 rozdz. 521 i 522'},
  {k:'grz', heat:1, q:'Ogrzewanie elektryczne: montaż zgodnie z instrukcją producenta (ekran przewodu grzejnego połączony z PE, czujnik temperatury, regulator, RCD ≤ 30 mA).', n:'Instrukcja montażu producenta'}
];

const PRODUKTY = {
  'ELEKTRA VCD7':  {tolMin:-5, tolMax:10, isoMin:50, uIso:1000, wm:7,  src:'Instrukcja ELEKTRA VCD7/10/17 – etap IV'},
  'ELEKTRA VCD10': {tolMin:-5, tolMax:10, isoMin:50, uIso:1000, wm:10, src:'Instrukcja ELEKTRA VCD7/10/17 – etap IV'},
  'ELEKTRA VCD17': {tolMin:-5, tolMax:10, isoMin:50, uIso:1000, wm:17, src:'Instrukcja ELEKTRA VCD7/10/17 – etap IV'},
  'DEVI':          {tolMin:-5, tolMax:10, isoMin:50, uIso:1000, verify:1, src:'Progi do potwierdzenia w instrukcji DEVI (wymagany też nr z mufy)'},
  'Inny produkt':  {tolMin:-5, tolMax:10, isoMin:50, uIso:1000, custom:1, src:'Wpisz progi z instrukcji producenta'}
};
const ETAPY = [
  ['ulozenie','Po ułożeniu (przed wylewką)', true],
  ['wylewka','Po wykonaniu posadzki', true],
  ['uruch','Przy uruchomieniu (opcjonalnie)', false]
];

const STEPS = [
  {id:'dane', t:'Dane'},
  {id:'obwody', t:'Obwody'},
  {id:'ogl', t:'Oględziny'},
  {id:'cig', t:'Ciągłość PE'},
  {id:'izo', t:'Izolacja'},
  {id:'zs', t:'Pętla zwarcia'},
  {id:'rcd', t:'RCD'},
  {id:'uz', t:'Uziemienie'},
  {id:'grz', t:'Ogrzewanie', cond:p=>p.obwody.some(o=>o.typ==='ogrz'), free:true},
  {id:'orz', t:'Orzeczenie'},
  {id:'pdf', t:'Protokół'}
];

/* ---------------- stan ---------------- */
let S = {protocols:[], cur:null};
function initState(){
  if(!S.protocols) S.protocols=[];
  if(!S.wykonawcy || !S.wykonawcy.length){ S.wykonawcy=[Object.assign({id:'w1', firma:'', wzorc:'', izoMax:'>999'}, WYKONAWCA)]; S.wykDomyslny='w1'; }
}
function wykDef(){ return S.wykonawcy.find(w=>w.id===S.wykDomyslny) || S.wykonawcy[0] || {osoba:'',nip:'',upr:'',miernik:''}; }
function wykSnap(w){ return {id:w.id, osoba:w.osoba, firma:w.firma||'', nip:w.nip, upr:w.upr, miernik:w.miernik, wzorc:w.wzorc||'', izoMax:w.izoMax||'>999'}; }
function izoMax(p){ return (p&&W(p).izoMax)||'>999'; }
function W(p){ if(!p.wyk) p.wyk=wykSnap(wykDef()); return p.wyk; }
let view = {name:'home'};
function uid(){ return Math.random().toString(36).slice(2,9); }
function P(){ return S.protocols.find(p=>p.id===S.cur); }
/* --- trwały zapis: IndexedDB (mieści zdjęcia; localStorage ma limit ok. 5 MB) --- */
const DB_NAME='pomiary-elektryczne', DB_STORE='kv';
let _db=null, _saveTimer=null, _saveErrShown=false;
function idb(){
  if(_db) return Promise.resolve(_db);
  return new Promise((res,rej)=>{ const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(DB_STORE);
    r.onsuccess=()=>{ _db=r.result; res(_db); }; r.onerror=()=>rej(r.error); });
}
function idbGet(key){ return idb().then(db=>new Promise((res,rej)=>{ const t=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key); t.onsuccess=()=>res(t.result); t.onerror=()=>rej(t.error); })); }
function idbPut(key,val){ return idb().then(db=>new Promise((res,rej)=>{ const tx=db.transaction(DB_STORE,'readwrite'); tx.objectStore(DB_STORE).put(val,key); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); })); }
function save(){ if(!_saveTimer) _saveTimer=setTimeout(saveNow,200); } // zapis najpóźniej 0,2 s po zmianie (nie przesuwa się przy ciągłym wpisywaniu)
async function saveNow(){
  clearTimeout(_saveTimer); _saveTimer=null;
  try{ await idbPut('state', JSON.parse(JSON.stringify(S))); _saveErrShown=false; }
  catch(e){ if(!_saveErrShown){ _saveErrShown=true; toast('Nie udało się zapisać danych w telefonie: '+(e&&e.message||e)); } }
}
window.addEventListener('pagehide', ()=>{ if(_saveTimer) saveNow(); });
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden' && _saveTimer) saveNow(); });
async function loadState(){
  let st=null;
  try{ st=await idbGet('state'); }catch(e){}
  if(!st){ // przeniesienie danych z makiety (localStorage), jeśli są
    try{ const old=JSON.parse(localStorage.getItem('pomiary-makieta')); if(old&&old.protocols){ st=old; } }catch(e){}
  }
  if(st) S=st;
  initState();
  if(navigator.storage && navigator.storage.persist){ try{ await navigator.storage.persist(); }catch(e){} }
}

/* --- kopia zapasowa --- */
async function exportBackup(){
  await saveNow();
  const blob=new Blob([JSON.stringify({app:'pomiary-elektryczne', version:1, saved:new Date().toISOString(), state:S})],{type:'application/json'});
  const name='pomiary-kopia-'+new Date().toISOString().slice(0,10)+'.json';
  const r=await shareOrDownload(blob,name,'Kopia zapasowa – pomiary');
  if(r==='downloaded') toast('Zapisano kopię: '+name+' (folder Pobrane)');
}
function importBackup(f){
  if(!f) return; const rd=new FileReader();
  rd.onload=()=>{ let d; try{ d=JSON.parse(rd.result); }catch(e){ toast('To nie jest plik kopii zapasowej'); return; }
    const st=d&&d.state; if(!st||!Array.isArray(st.protocols)){ toast('Plik nie zawiera danych aplikacji'); return; }
    window.__importState=st;
    modal(`<h3>Przywrócić kopię?</h3><p class="small">Kopia z ${esc((d.saved||'').slice(0,10)||'nieznanej daty')}: ${st.protocols.length} protokołów, ${(st.wykonawcy||[]).length} wykonawców.</p>
      <div class="btns" style="margin-top:12px"><button class="btn grow" onclick="doImport('merge')">Dodaj do obecnych</button><button class="btn danger grow" onclick="doImport('replace')">Zastąp wszystko</button></div>
      <button class="btn ghost block" style="margin-top:8px" onclick="closeModal()">Anuluj</button>`);
  };
  rd.readAsText(f);
}
function doImport(mode){
  const st=window.__importState; closeModal(); if(!st) return;
  if(mode==='replace'){ S=st; }
  else { const ids=new Set(S.protocols.map(p=>p.id)); st.protocols.forEach(p=>{ if(ids.has(p.id)) p.id=uid(); S.protocols.push(p); });
    const wids=new Set((S.wykonawcy||[]).map(w=>w.id)); (st.wykonawcy||[]).forEach(w=>{ if(!wids.has(w.id)) S.wykonawcy.push(w); }); }
  initState(); saveNow(); view={name:'home'}; render(); toast('Przywrócono dane z kopii');
}

/* ---------------- liczby ---------------- */
function num(v){
  if(v===null||v===undefined||v==='') return null;
  const s = String(v).trim().replace(',','.').replace(/^>\s*/,'');
  const n = parseFloat(s);
  return isNaN(n)?null:n;
}
function fmt(n,d=2){ if(n===null||n===undefined||isNaN(n)) return '–'; return Number(n).toFixed(d).replace('.',','); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function filled(v){ return v!==null && v!==undefined && String(v).trim()!==''; }
function addYear(d){ if(!d) return ''; const x=new Date(d); x.setFullYear(x.getFullYear()+1); return x.toISOString().slice(0,10); }

/* ---------------- oceny ---------------- */
function iaFor(o){
  const z=o.zab||{}; const In=Number(z.In);
  if(!In) return null;
  const k={B:5,C:10,D:20}[z.char];
  if(k) return k*In;
  if(z.char==='gG') return GG_IA5[In]||null;
  return null;
}
function cigTryb(p){ return p.cigTryb||'zs'; }
function evCig(o,p){
  const lim=num(p.cigLimit)||1;
  const r=num(o.cig);
  if(r!==null) return r<=lim ? {s:'ok',t:'pozytywna'} : {s:'bad',t:'> '+fmt(lim)+' Ω'};
  if(cigTryb(p)==='zs'){
    if(!filled(o.zs)) return {s:'none',t:'po pomiarze Zs'};
    return evZs(o).s==='ok' ? {s:'ok',t:'potwierdzona pomiarem Zs'} : {s:'warn',t:'Zs niepotwierdzona'};
  }
  return {s:'none',t:'brak'};
}
function evWyr(w,p){
  const r=num(w.r); if(r===null) return {s:'none',t:'brak'};
  const lim=num(w.lim)??(num(p.cigLimit)||1);
  return r<=lim ? {s:'ok',t:'R ≤ '+fmt(lim)+' Ω'} : {s:'bad',t:'R > '+fmt(lim)+' Ω'};
}
// napięcie probiercze i wartość minimalna wg PN-HD 60364-6, tab. 6.1 i pkt 6.4.3.3
const IZO_U = {
  '500':  {u:500,  min:1,   t:'500 V',  d:'obwody do 500 V (standard)'},
  '250':  {u:250,  min:1,   t:'250 V',  d:'obniżone – ograniczniki przepięć / urządzenia, których nie można odłączyć'},
  '250s': {u:250,  min:0.5, t:'250 V SELV/PELV', d:'obwody SELV i PELV'},
  '1000': {u:1000, min:1,   t:'1000 V', d:'obwody powyżej 500 V'}
};
function izoU(o,p){ p=p||P(); return IZO_U[o.izoU] || IZO_U[p.izoU] || IZO_U['500']; }
function evIzoVals(pairs, vals, c){
  let n=0, bad=[];
  pairs.forEach(k=>{ const v=(vals||{})[k]; if(filled(v)){ n++; if(num(v)<c.min) bad.push(k);} });
  const mt=fmt(c.min,c.min<1?1:0)+' MΩ';
  if(n===0) return {s:'none',t:'brak'};
  if(bad.length) return {s:'bad',t:'< '+mt+': '+bad.join(', ')};
  if(n<pairs.length) return {s:'warn',t:n+'/'+pairs.length};
  return {s:'ok',t:'≥ '+mt};
}
function evIzoRaw(o,p){ return evIzoVals(izoPairs(o), o.izo, izoU(o,p)); }
/* --- pomiary grupowe (od strony zasilania, PN-HD 60364-6 pkt 6.4.3.3 i D.6.4.3.3) --- */
function izoGroups(p){ p=p||P(); p.izoGr=p.izoGr||[]; return p.izoGr; }
function izoGroupOf(o,p){ return izoGroups(p).find(g=>(g.obwody||[]).includes(o.id)); }
function gFaz(g,p){ p=p||P(); return (g.obwody||[]).some(id=>{ const o=p.obwody.find(x=>x.id===id); return o&&(o.typ==='3f'||o.typ==='wlz'); }) ? '3f' : '1f'; }
function izoPairsG(g,p){ const f=gFaz(g,p); return g.met==='zw' ? [f==='3f'?'L1+L2+L3+N–PE':'L+N–PE'] : TYPY[f].pairs; }
function evIzoG(g,p){ return evIzoVals(izoPairsG(g,p), g.izo, izoU(g,p)); }
function evIzo(o,p){
  p=p||P(); const own=evIzoRaw(o,p);
  if(own.s!=='none') return own;
  const g=izoGroupOf(o,p); if(!g) return own;
  const ge=evIzoG(g,p);
  if(ge.s==='ok') return {s:'ok', t:'pomiar grupowy „'+g.nazwa+'”'};
  if(ge.s==='bad') return {s:'warn', t:'grupa poniżej wymagań – zmierz osobno'};
  return {s:'none', t:'w grupie „'+g.nazwa+'”'};
}
function izoDone(o,p){
  if(izoPairs(o).every(k=>filled((o.izo||{})[k]))) return true;
  const g=izoGroupOf(o,p); return !!(g && evIzoG(g,p).s==='ok' && evIzoRaw(o,p).s==='none');
}
function evZs(o){
  const zs=num(o.zs), ia=iaFor(o);
  if(zs===null) return {s:'none',t:'brak'};
  if(!ia) return {s:'warn',t:'brak danych zabezp.'};
  const za=U0/ia;
  return zs<=za ? {s:'ok',t:'Zs ≤ Za'} : {s:'bad',t:'Zs > Za'};
}
/* --- RCD: kryteria wg PN-EN 61008-1 / 61009-1 (AC, A) i PN-EN 62423 (F, B) --- */
const RCD_WAVE = {AC:'sin', A:'puls', F:'puls', B:'dc', 'B+':'dc'};
const WAVE_OK  = {AC:['sin'], A:['sin','puls'], F:['sin','puls'], B:['sin','puls','dc'], 'B+':['sin','puls','dc']};
const WAVE_T   = {sin:'sinusoidalny', puls:'pulsujący (jednopołówkowy)', dc:'stały wygładzony'};
const WAVE_TI  = {sin:'sinusoidalnym', puls:'pulsującym (jednopołówkowym)', dc:'stałym wygładzonym'};
const CHAR_T   = {G:'bezzwłoczny', KV:'krótkozwłoczny (KV/G)', S:'selektywny (S)'};
function rcdCrit(r){
  const idn=num(r.idn)||30, ch=r.char||'G', S=ch==='S';
  const wave = (r.wave && (WAVE_OK[r.typ]||[]).includes(r.wave)) ? r.wave : (RCD_WAVE[r.typ]||'sin');
  const t1 = S?[130,500] : ch==='KV'?[10,300] : [0,300];
  const t5 = S?[50,150]  : ch==='KV'?[10,40]  : [0,40];
  let ia=null;
  if(!S){ ia = wave==='sin'?[0.5,1.0] : wave==='puls'?(idn<=10?[0.35,2.0]:[0.35,1.4]) : [0.5,2.0]; }
  const mult = wave==='sin'?1 : wave==='puls'?(idn<=10?2:1.4) : 2;      // mnożnik prądu testu w MI 3125
  const half = wave==='puls'?0.35:0.5;                                     // prąd testu „½ IΔn” w MI 3125
  const x5 = !((wave==='sin'&&idn>=1000) || (wave!=='sin'&&idn>=300));    // 5×IΔn niedostępne w MI 3125
  const ucLim = num(r.ucLim)||50;
  return {S, ch, wave, t1, t5, ia, mult, half, x5, ucLim, idn};
}
function rcdCritText(r){
  const c=rcdCrit(r); const rng=(a)=>a[0]?`${a[0]}–${a[1]} ms`:`≤ ${a[1]} ms`;
  return `Typ ${r.typ}, ${CHAR_T[c.ch]}, test prądem ${WAVE_TI[c.wave]}: t(1×IΔn) ${rng(c.t1)}`+(c.x5?`, t(5×IΔn) ${rng(c.t5)}`:', 5×IΔn – niedostępne')+
    (c.ia?`, Ia ${fmt(c.ia[0]*c.idn,1)}–${fmt(c.ia[1]*c.idn,1)} mA (${fmt(c.ia[0])}–${fmt(c.ia[1],1)} IΔn)`:', Ia – nie mierzy się (RCD selektywny)')+`, Uc ≤ ${c.ucLim} V`;
}
function rcdFields(r){ const c=rcdCrit(r); return ['t1a','t1b'].concat(c.x5?['t5a','t5b']:[]).concat(c.S?[]:['ia','iab']).concat(['uc']); }
function evRcd(r){
  const c=rcdCrit(r); const f=rcdFields(r);
  if(!['t1a','t1b','t5a','t5b','ia','iab','uc'].some(k=>filled(r[k])) && !r.test && !r.half) return {s:'none',t:'brak'};
  const errs=[];
  if(r.wave && !(WAVE_OK[r.typ]||[]).includes(r.wave)) errs.push('przebieg testu nieodpowiedni dla typu '+r.typ);
  const tchk=(k,lim,l)=>{ if(!filled(r[k])) return; const t=num(r[k]); if(t>lim[1]) errs.push(`${l} > ${lim[1]} ms`); else if(lim[0] && t<lim[0]) errs.push(`${l} < ${lim[0]} ms`); };
  tchk('t1a',c.t1,'t(1×IΔn)'); tchk('t1b',c.t1,'t(1×IΔn)');
  if(c.x5){ tchk('t5a',c.t5,'t(5×IΔn)'); tchk('t5b',c.t5,'t(5×IΔn)'); }
  if(c.ia){ const lo=c.ia[0]*c.idn, hi=c.ia[1]*c.idn; ['ia','iab'].forEach(k=>{ if(filled(r[k])){ const v=num(r[k]); if(v<lo||v>hi) errs.push(`Ia poza ${fmt(lo,1)}–${fmt(hi,1)} mA`); } }); }
  if(filled(r.uc) && num(r.uc)>c.ucLim) errs.push(`Uc > ${c.ucLim} V`);
  if(r.half==='nie') errs.push('zadziałał przy ½ IΔn');
  if(r.test==='nie') errs.push('przycisk TEST nie działa');
  if(errs.length) return {s:'bad',t:[...new Set(errs)].join('; ')};
  if(!f.every(k=>filled(r[k])) || !r.test || !r.half) return {s:'warn',t:'niekompletny'};
  return {s:'ok',t:'pozytywna'};
}
function evUz(u){
  const r=num(u.r); if(r===null) return {s:'none',t:'brak'};
  const lim=num(u.lim); if(lim===null) return {s:'warn',t:'brak wartości wymaganej'};
  return r<=lim?{s:'ok',t:'R ≤ '+fmt(lim)+' Ω'}:{s:'bad',t:'R > '+fmt(lim)+' Ω'};
}
function grzParams(o){
  const g=o.grz||{}; const pr=PRODUKTY[g.prod]||PRODUKTY['Inny produkt'];
  const c = pr.custom ? {tolMin:num(g.tolMin)??-5, tolMax:num(g.tolMax)??10, isoMin:num(g.isoMin)??50} : pr;
  let moc=num(g.moc);
  if(moc===null && pr.wm && num(g.dl)) moc=pr.wm*num(g.dl);
  let rn=num(g.rTab);
  if(rn===null && moc) rn=U0*U0/moc;
  return {pr, tolMin:c.tolMin, tolMax:c.tolMax, isoMin:c.isoMin, uIso:pr.uIso, moc, rn};
}
function evEtap(o,key){
  const e=((o.grz||{}).etapy||{})[key]||{}; const g=grzParams(o);
  if(!filled(e.r)&&!filled(e.iso)) return {s:'none',t:'brak'};
  const errs=[];
  if(filled(e.r)){
    if(!g.rn) errs.push('brak R znamionowej');
    else { const d=(num(e.r)-g.rn)/g.rn*100; if(d<g.tolMin||d>g.tolMax) errs.push('R poza '+g.tolMin+'/+'+g.tolMax+'%'); }
  }
  if(filled(e.iso) && num(e.iso)<g.isoMin) errs.push('izolacja < '+g.isoMin+' MΩ');
  if(errs.length) return {s:'bad',t:errs.join('; ')};
  if(!filled(e.r)||!filled(e.iso)) return {s:'warn',t:'niekompletny'};
  if(!e.t30) return {s:'warn',t:'potwierdź pomiar ≥ 30 s'};
  return {s:'ok',t:'zgodny z instrukcją'};
}
function badge(e){ return `<span class="badge b-${e.s==='none'?'none':e.s}">${e.s==='ok'?'✓ ':e.s==='bad'?'✗ ':''}${esc(e.t)}</span>`; }

/* ---------------- kompletność kroków ---------------- */
function oglItems(p){
  return OGLEDZINY.filter(i=> i.heat ? p.obwody.some(o=>o.typ==='ogrz') : (p.oglPelny || i.base));
}
function stepStatus(id,p){
  const ob=p.obwody;
  switch(id){
    case 'dane': { const m=['adres','data','uklad','rodzaj'].filter(k=>!filled(p[k])).length; return {done:m===0, missing:m, unit:'pól'}; }
    case 'obwody': return {done:ob.length>0, missing:ob.length?0:1, unit:'obwodów'};
    case 'ogl': { const m=oglItems(p).filter(i=>!(p.ogl[i.k]||{}).v).length; return {done:m===0, missing:m, unit:'punktów'}; }
    case 'cig': { const wyr=p.wyr||[]; let m=wyr.filter(w=>!filled(w.r)).length + ((wyr.length||p.wyrNd)?0:1);
      if(cigTryb(p)==='all') m+=ob.filter(o=>!filled(o.cig)).length;
      return {done:m===0, missing:m, unit:'pomiarów'}; }
    case 'izo': { const m=ob.filter(o=>!izoDone(o,p)).length + izoGroups(p).filter(g=>{ const e=evIzoG(g,p).s; return e==='none'||e==='warn'; }).length; return {done:ob.length>0&&m===0, missing:m, unit:'pomiarów'}; }
    case 'zs': { const m=ob.filter(o=>!filled(o.zs)).length; return {done:ob.length>0&&m===0, missing:m, unit:'obwodów'}; }
    case 'rcd': { const m=p.rcd.filter(r=>evRcd(r).s==='none'||evRcd(r).s==='warn').length; return {done:m===0, missing:m, unit:'wyłączników'}; }
    case 'uz': { if(p.uzNd) return {done:true,missing:0}; const m=p.uz.length?p.uz.filter(u=>!filled(u.r)).length:1; return {done:m===0, missing:m, unit:'pomiarów'}; }
    case 'grz': { let m=0; ob.filter(o=>o.typ==='ogrz').forEach(o=>ETAPY.filter(e=>e[2]).forEach(([k])=>{ const e=((o.grz||{}).etapy||{})[k]||{}; if(!filled(e.r)||!filled(e.iso)) m++; })); return {done:m===0, missing:m, unit:'etapów pomiarów'}; }
    case 'orz': return {done:!!p.orzeczenie, missing:p.orzeczenie?0:1, unit:''};
    case 'pdf': return {done:false, missing:0};
  }
  return {done:false,missing:0};
}
function visibleSteps(p){ return STEPS.filter(s=>!s.cond||s.cond(p)); }

/* ---------------- dane przykładowe ---------------- */
function nextNumber(today){
  const mm=today.slice(5,7), yy=today.slice(0,4); let max=0;
  S.protocols.forEach(p=>{ const m=String(p.nr||'').match(/^(\d+)\/(\d{1,2})\/(\d{4})/); if(m && +m[2]===+mm && m[3]===yy) max=Math.max(max,+m[1]); });
  return (max+1)+'/'+mm+'/'+yy;
}
function newProtocol(){
  const today=new Date().toISOString().slice(0,10);
  return {id:uid(), nr:nextNumber(today), adres:'', uzytkownik:'', data:today, uklad:'TN-C-S', rodzaj:'', pogoda:'',
    obwody:[], rcd:[], uz:[], uzNd:false, ogl:{}, oglPelny:false, cigLimit:'1', izoU:'500', cigTryb:'zs', wyr:[], wyrNd:false, photos:[],
    skipped:[], uwagi:'', orzeczenie:'', nastepne:addYear(today), step:'dane', created:Date.now(), wyk:wykSnap(wykDef())};
}
function sampleProtocol(){
  const p=newProtocol();
  Object.assign(p,{nr:'7/11/2026', adres:'Domek 1B, ul. Rumiankowa (przykład)', uzytkownik:'Jan Kowalski', uklad:'TN-C-S', rodzaj:'Odbiorcze (powykonawcze)', pogoda:'Pochmurna', step:'izo'});
  const r1=uid(), r2=uid();
  p.rcd=[
    {id:r1, sym:'Q1', typ:'A', char:'G', In:'40', idn:'30', t1a:'19', t1b:'21', t5a:'12', t5b:'14', ia:'21', iab:'22', uc:'1,2', half:'tak', test:'tak'},
    {id:r2, sym:'Q2', typ:'A', In:'25', idn:'30'}
  ];
  const mk=(sym,nazwa,typ,ch,In,rcd,extra)=>Object.assign({id:uid(), rozdz:'RD Domek 1B', sym, nazwa, typ, zab:{char:ch,In:String(In)}, rcd, izo:{}, cig:'', zs:'', photos:[], opis:''},extra||{});
  p.obwody=[
    mk('WLZ','Zasilanie z ZK – YKY 5×10','wlz','gG',32,'',{izo:{'L1-L2':'>999','L1-L3':'>999','L2-L3':'>999','L1-N':'>999','L2-N':'>999','L3-N':'>999','L1-PE':'>999','L2-PE':'>999','L3-PE':'>999','N-PE':'>999'}}),
    mk('F1','Oświetlenie','1f','B',10,r1,{izo:{'L-PE':'>999','L-N':'>999','N-PE':'>999'}}),
    mk('F2','Gniazda – pokój dzienny','1f','B',16,r1,{izo:{'L-PE':'520','L-N':'>999','N-PE':'610'}}),
    mk('F3','Gniazda – kuchnia','1f','B',16,r1),
    mk('F4','Łazienka','1f','B',16,r1),
    mk('F5','Płyta indukcyjna','3f','B',16,r1),
    mk('F6','Ogrzewanie podłogowe – łazienka','ogrz','B',10,r2,{cig:'0,11', grz:{prod:'ELEKTRA VCD10', dl:'45', moc:'', rTab:'', etapy:{ulozenie:{data:'2026-10-14', r:'118,2', iso:'>999', t30:true}}}})
  ];
  p.wyr=[{id:uid(),nazwa:'GSW – rura wodociągowa',r:'0,03',lim:''},{id:uid(),nazwa:'Łazienka – miejscowe połączenie wyrównawcze',r:'0,05',lim:''}];
  p.ogl={}; OGLEDZINY.filter(i=>i.base).forEach(i=>p.ogl[i.k]={v:'tak'});
  p.ogl['grz']={v:'tak'};
  return p;
}

/* ---------------- render główny ---------------- */
function render(){
  const app=document.getElementById('app');
  if(view.name==='home'){ app.innerHTML=renderHome(); return; }
  if(view.name==='wyklist'){ app.innerHTML=renderWykList(); return; }
  if(view.name==='wykform'){ app.innerHTML=renderWykForm(); return; }
  const p=P(); if(!p){ view={name:'home'}; return render(); }
  if(view.name==='obwod'){ app.innerHTML=renderObwodForm(p); return; }
  if(view.name==='rcdform'){ app.innerHTML=renderRcdForm(p); return; }
  app.innerHTML = renderWizard(p);
  const cur=document.querySelector('.chip.cur'); if(cur) cur.scrollIntoView({inline:'center',block:'nearest'});
}
function topbar(title,sub,back){
  return `<header class="top">${back?`<button class="iconbtn" aria-label="Wstecz" onclick="${back}">${ico('back')}</button>`:''}
  <h1>${esc(title)}${sub?`<small>${esc(sub)}</small>`:''}</h1></header>`;
}
function ico(n){
  const p={
    back:'<path d="M15 18l-6-6 6-6"/>',
    cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    chev:'<path d="M9 6l6 6-6 6"/>',
    print:'<path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z"/>',
    share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    img:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>'
  }[n]||'';
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* ---------------- ekran startowy ---------------- */
function renderHome(){
  const list=S.protocols.slice().sort((a,b)=>b.created-a.created).map(p=>{
    const st=visibleSteps(p).filter(s=>s.id!=='pdf'); const d=st.filter(s=>stepStatus(s.id,p).done).length;
    return `<button class="card listitem" style="border:1px solid var(--line);margin-bottom:10px" onclick="openProt('${p.id}')">
      <div class="grow"><div style="font-weight:700">${esc(p.adres||'(bez adresu)')}</div>
      <div class="small muted">Protokół ${esc(p.nr||'–')} · ${esc(p.data||'')} · ${p.obwody.length} obwodów</div>
      <div class="progress" style="margin-top:8px"><i style="width:${Math.round(d/st.length*100)}%"></i></div>
      <div class="small muted" style="margin-top:4px">Ukończono ${d} z ${st.length} kroków</div></div></button>
      <div class="btns" style="margin:-6px 0 12px;justify-content:flex-end"><button class="btn ghost sm" onclick="protActions('${p.id}')">Więcej…</button></div>`;
  }).join('');
  return topbar('Pomiary elektryczne','protokoły z pomiarów instalacji') + `<main>
    <div class="btns" style="margin-bottom:12px">
      <button class="btn pri grow" onclick="createProt()">${ico('plus')} Nowy protokół</button>
    </div>
    ${list || `<div class="card muted">Brak protokołów. Utwórz nowy albo otwórz <button class="btn ghost sm" style="padding:0 4px;min-height:28px" onclick="createSample()">protokół przykładowy</button>.</div>`}
    <div class="groupt row"><span class="grow">Wykonawcy (${S.wykonawcy.length})</span><button class="btn ghost sm" onclick="openWykList('home')">Zarządzaj</button></div>
    <div class="card">${wykKv(wykDef())}<p class="small muted" style="margin:8px 0 0">Domyślny dla nowych protokołów.</p></div>
    <div class="groupt">Dane i kopia zapasowa</div>
    <div class="card"><p class="small muted" style="margin:0 0 8px">Protokoły i zdjęcia są zapisane w tym telefonie. Rób regularnie kopię zapasową – np. na Dysk Google lub Synology.</p>
    <div class="btns"><button class="btn grow" onclick="exportBackup()">Zapisz kopię</button><label class="btn grow">Przywróć z kopii<input type="file" accept="application/json,.json" style="display:none" onchange="importBackup(this.files[0]);this.value=''"></label></div>
    ${S.protocols.length?'':'<button class="btn ghost sm" style="margin-top:6px" onclick="createSample()">Otwórz protokół przykładowy</button>'}</div>
    <p class="small muted" style="text-align:center">Wersja ${APP_VERSION}</p>
  </main>`;
}
function protActions(id){
  const p=S.protocols.find(x=>x.id===id); if(!p) return;
  modal(`<h3>${esc(p.adres||'(bez adresu)')}</h3><p class="small muted" style="margin-top:0">Protokół ${esc(p.nr||'–')} · ${esc(p.data||'')}</p>
   <button class="btn block" style="margin-bottom:8px" onclick="closeModal();openProt('${id}')">Otwórz</button>
   <button class="btn block" style="margin-bottom:8px" onclick="closeModal();copyProt('${id}')">Kopiuj jako nowy (te same obwody, bez wyników)</button>
   <button class="btn danger block" style="margin-bottom:8px" onclick="askDelProt('${id}')">Usuń protokół</button>
   <button class="btn ghost block" onclick="closeModal()">Anuluj</button>`);
}
function copyProt(id){
  const src=S.protocols.find(x=>x.id===id); const c=JSON.parse(JSON.stringify(src)); const today=new Date().toISOString().slice(0,10);
  Object.assign(c,{id:uid(), nr:nextNumber(today), data:today, nastepne:addYear(today), created:Date.now(), step:'dane', skipped:[], uwagi:'', orzeczenie:'', photos:[], ogl:{}, rodzaj:'Okresowe', pogoda:'', wyk:wykSnap(wykDef())});
  (c.izoGr||[]).forEach(g=>g.izo={});
  c.obwody.forEach(o=>{ o.izo={}; o.cig=''; o.zs=''; o.photos=[]; if(o.grz){ o.grz.etapy={}; o.grz.photos=[]; } });
  c.rcd.forEach(r=>['t1a','t1b','t5a','t5b','ia','iab','uc','half','test'].forEach(k=>delete r[k]));
  c.uz.forEach(u=>u.r=''); (c.wyr||[]).forEach(w=>w.r='');
  S.protocols.push(c); S.cur=c.id; save(); view={name:'wizard'}; render(); toast('Utworzono kopię protokołu');
}
function askDelProt(id){ const p=S.protocols.find(x=>x.id===id); closeModal(); confirmBox('Usunąć protokół '+(p&&p.nr?p.nr+' ':'')+'wraz ze zdjęciami? Tej operacji nie można cofnąć.',`delProt('${id}')`); }
function delProt(id){ S.protocols=S.protocols.filter(p=>p.id!==id); if(S.cur===id) S.cur=null; save(); render(); toast('Usunięto protokół'); }
function createProt(){ const p=newProtocol(); S.protocols.push(p); S.cur=p.id; save(); view={name:'wizard'}; render(); }
function createSample(){ const p=sampleProtocol(); S.protocols.push(p); S.cur=p.id; save(); view={name:'wizard'}; render(); }
function openProt(id){ S.cur=id; save(); view={name:'wizard'}; render(); }
function goHome(){ view={name:'home'}; render(); }

/* ---------------- wykonawcy ---------------- */
function wykKv(w){ return `<dl class="kv"><dt>Wykonał</dt><dd>${esc(w.osoba||'–')}${w.firma?'<br><span class="muted">'+esc(w.firma)+'</span>':''}</dd><dt>NIP</dt><dd>${esc(w.nip||'–')}</dd><dt>Uprawnienia</dt><dd>${esc(w.upr||'–')}</dd><dt>Przyrząd</dt><dd>${esc(w.miernik||'–')}${w.wzorc?'<br><span class="muted small">wzorcowanie ważne do '+esc(w.wzorc)+'</span>':''}</dd></dl>`; }
function wzorcWarn(w,data){ return (w.wzorc && data && w.wzorc<data) ? `<div class="badbox" style="margin-top:8px">Świadectwo wzorcowania przyrządu straciło ważność (${esc(w.wzorc)}) przed datą pomiarów.</div>` : ''; }
function wykChanged(p){ const src=S.wykonawcy.find(w=>w.id===W(p).id); if(!src) return false; return JSON.stringify(wykSnap(src))!==JSON.stringify(W(p)); }
function pickWyk(id){ const w=S.wykonawcy.find(x=>x.id===id); if(!w) return; P().wyk=wykSnap(w); save(); render(); }
function openWykList(back){ view={name:'wyklist', back}; render(); window.scrollTo(0,0); }
function wykBack(){ if(view.back==='wizard' && P()){ view={name:'wizard'}; } else view={name:'home'}; render(); }
function renderWykList(){
  const items=S.wykonawcy.map(w=>`<button class="listitem" onclick="editWyk('${w.id}')"><span class="grow"><span style="display:block;font-weight:600">${esc(w.osoba||'(bez nazwy)')}</span>
    <span class="small muted">${esc(w.firma||'')}${w.firma?' · ':''}${esc(w.miernik||'brak przyrządu')}</span></span>${w.id===S.wykDomyslny?'<span class="badge b-ok">domyślny</span>':''}${ico('chev')}</button>`).join('');
  return topbar('Wykonawcy','osoby wykonujące pomiary','wykBack()')+`<main>
   <p class="lead">Zapisz osoby (np. Ty i pracownik) z ich uprawnieniami i przyrządem. W protokole wybierasz, kto wykonał pomiary.</p>
   <div class="card" style="padding:4px 10px">${items}</div>
   <button class="btn pri block" onclick="addWyk()">${ico('plus')} Dodaj wykonawcę</button></main>`;
}
function addWyk(){ const w={id:uid(), osoba:'', firma:'', nip:'', upr:'', miernik:'', wzorc:''}; S.wykonawcy.push(w); save(); editWyk(w.id); }
function editWyk(id){ view={name:'wykform', id, back:view.back}; render(); window.scrollTo(0,0); }
function setWyk(id,k,v){ const w=S.wykonawcy.find(x=>x.id===id); w[k]=v; save(); }
function renderWykForm(){
  const w=S.wykonawcy.find(x=>x.id===view.id); if(!w){ view={name:'wyklist',back:view.back}; return renderWykList(); }
  const f=(k,l,ph='',type='text')=>`<label class="f"><span>${l}</span><input type="${type}" value="${esc(w[k]||'')}" placeholder="${ph}" oninput="setWyk('${w.id}','${k}',this.value)"></label>`;
  const isDef=w.id===S.wykDomyslny;
  return topbar(w.osoba||'Nowy wykonawca','Dane wykonawcy',`view={name:'wyklist',back:'${view.back}'};render()`)+`<main><div class="card">
   ${f('osoba','Imię i nazwisko (z tytułem)','np. mgr inż. Jan Kowalski')}
   ${f('firma','Firma (opcjonalnie)')}
   ${f('nip','NIP')}
   <label class="f"><span>Nr uprawnień</span><textarea oninput="setWyk('${w.id}','upr',this.value)" placeholder="np. Eksploatacja E1/…, Dozór D1/…">${esc(w.upr||'')}</textarea></label>
   ${f('miernik','Przyrząd pomiarowy (model i nr seryjny)','np. Metrel MI 3125 SN…')}
   ${f('wzorc','Świadectwo wzorcowania ważne do (opcjonalnie)','','date')}
   ${f('izoMax','Wynik izolacji „poza zakresem” – tak jak pokazuje miernik','np. >999 lub >199,9')}</div>
   ${isDef?'<div class="info">To jest domyślny wykonawca dla nowych protokołów.</div>':`<button class="btn block" onclick="S.wykDomyslny='${w.id}';save();render()">Ustaw jako domyślnego</button><div style="height:8px"></div>`}
   <div class="btns"><button class="btn danger grow" onclick="delWyk('${w.id}')">Usuń</button><button class="btn pri grow" onclick="view={name:'wyklist',back:'${view.back}'};render()">Gotowe</button></div></main>`;
}
function delWyk(id){
  if(S.wykonawcy.length<=1){ toast('Musi pozostać co najmniej jeden wykonawca'); return; }
  confirmBox('Usunąć wykonawcę z listy? Wystawione protokoły zachowają jego dane.',`doDelWyk('${id}')`);
}
function doDelWyk(id){ S.wykonawcy=S.wykonawcy.filter(w=>w.id!==id); if(S.wykDomyslny===id) S.wykDomyslny=S.wykonawcy[0].id; save(); view={name:'wyklist',back:view.back}; render(); }

/* ---------------- kreator ---------------- */
function renderStepper(p){
  return visibleSteps(p).map((s,i)=>{
    const st=stepStatus(s.id,p); const cls = s.id===p.step?'cur': st.done?'done': p.skipped.includes(s.id)?'skip':'';
    const mark = st.done&&s.id!==p.step ? '✓' : p.skipped.includes(s.id)&&s.id!==p.step ? '!' : (i+1);
    return `<button class="chip ${cls}" onclick="gotoStep('${s.id}')"><span class="n">${mark}</span>${s.t}</button>`;
  }).join('');
}
function refreshStepper(){ const el=document.getElementById('stepper'); if(el) el.innerHTML=renderStepper(P()); }
function renderWizard(p){
  const steps=visibleSteps(p); if(!steps.find(s=>s.id===p.step)) p.step='dane';
  const idx=steps.findIndex(s=>s.id===p.step);
  const body = ({dane:vDane, obwody:vObwody, ogl:vOgl, cig:vCig, izo:vIzo, zs:vZs, rcd:vRcd, uz:vUz, grz:vGrz, orz:vOrz, pdf:vPdf})[p.step](p);
  const prev = idx>0 ? `<button class="btn" onclick="stepBy(-1)">Wstecz</button>` : `<button class="btn" onclick="goHome()">Lista</button>`;
  const next = idx<steps.length-1 ? `<button class="btn pri" onclick="stepBy(1)">Dalej: ${steps[idx+1].t}</button>` : `<button class="btn pri" onclick="goHome()">Zakończ</button>`;
  return topbar(p.adres||'Nowy protokół', `Krok ${idx+1}/${steps.length}: ${steps[idx].t}`, 'goHome()') +
    `<nav class="stepper" id="stepper" aria-label="Kroki">${renderStepper(p)}</nav><main>${body}</main>
     <div class="bottombar noprint"><div class="in">${prev}${next}</div></div>`;
}
function stepBy(d){
  const p=P(); const steps=visibleSteps(p); const i=steps.findIndex(s=>s.id===p.step);
  const t=steps[i+d]; if(t) gotoStep(t.id);
}
function gotoStep(id){
  const p=P(); const steps=visibleSteps(p);
  const ti=steps.findIndex(s=>s.id===id), ci=steps.findIndex(s=>s.id===p.step);
  if(ti>ci){
    // miękka blokada: sprawdź wszystkie wcześniejsze kroki (poza swobodnymi)
    const open=steps.slice(0,ti).filter(s=>!s.free && s.id!=='pdf' && !stepStatus(s.id,p).done && !p.skipped.includes(s.id));
    if(open.length){
      const lines=open.map(s=>{const st=stepStatus(s.id,p); return `<li><b>${s.t}</b>${st.missing?` – brakuje ${st.missing} ${st.unit}`:''}</li>`;}).join('');
      return modal(`<h3>Poprzednie kroki nie są zakończone</h3>
        <ul style="padding-left:20px;margin:6px 0 10px">${lines}</ul>
        <p class="small muted">Wg PN-HD 60364-6 (6.4.2.1 i 6.4.3.1) oględziny poprzedzają próby, a próby wykonuje się kolejno. Możesz przejść dalej – pominięcie zostanie odnotowane i pokazane przy orzeczeniu.</p>
        <div class="btns" style="margin-top:12px"><button class="btn grow" onclick="closeModal();gotoStepForce('${open[0].id}')">Uzupełnij: ${open[0].t}</button>
        <button class="btn pri grow" onclick="closeModal();skipAndGo('${id}',${JSON.stringify(open.map(s=>s.id)).replace(/"/g,'&quot;')})">Przejdź mimo to</button></div>`);
    }
  }
  gotoStepForce(id);
}
function skipAndGo(id,ids){ const p=P(); ids.forEach(x=>{ if(!p.skipped.includes(x)) p.skipped.push(x); }); gotoStepForce(id); }
function gotoStepForce(id){ const p=P(); p.step=id; save(); render(); window.scrollTo(0,0); }

/* --- generyczne settery --- */
function setP(k,v){ P()[k]=v; save(); refreshStepper(); }
function obById(id){ return P().obwody.find(o=>o.id===id); }
function deepSet(o,path,v){ const a=path.split('.'); let x=o; for(let i=0;i<a.length-1;i++){ x[a[i]]=x[a[i]]||{}; x=x[a[i]]; } x[a[a.length-1]]=v; }
function setOb(id,path,v,evk){ deepSet(obById(id),path,v); save(); refreshStepper(); if(evk) refreshEv(evk,id); }
function setRcd(id,k,v){ const r=P().rcd.find(x=>x.id===id); r[k]=v; save(); refreshStepper(); const el=document.getElementById('ev-rcd-'+id); if(el) el.innerHTML=badge(evRcd(r)); }
function setUz(id,k,v){ const u=P().uz.find(x=>x.id===id); u[k]=v; save(); refreshStepper(); const el=document.getElementById('ev-uz-'+id); if(el) el.innerHTML=badge(evUz(u)); }
function refreshEv(k,id){
  const o=obById(id), p=P(); const el=document.getElementById('ev-'+k+'-'+id); if(!el) return;
  if(k==='cig') el.innerHTML=badge(evCig(o,p));
  if(k==='izo') el.innerHTML=badge(evIzo(o));
  if(k==='zs'){ el.innerHTML=badge(evZs(o)); const isc=document.getElementById('isc-'+id); if(isc){ const z=num(o.zs); isc.textContent= z? fmt(U0/z,0)+' A':'–'; } }
  if(k==='grz'){ ETAPY.forEach(([ek])=>{ const e2=document.getElementById('ev-grz-'+ek+'-'+id); if(e2) e2.innerHTML=badge(evEtap(o,ek)); }); const pn=document.getElementById('grzpar-'+id); if(pn) pn.innerHTML=grzParamsHtml(o); const dd=document.getElementById('grzdiff-'+id); if(dd) dd.innerHTML=grzDiffHtml(o); }
}
function measInput(val, oninput, label, ocrCb){
  return `<div class="inwrap"><input class="num" inputmode="decimal" value="${esc(val||'')}" aria-label="${esc(label)}" oninput="${oninput}">
   <button class="cam" aria-label="Odczyt ze zdjęcia ekranu miernika: ${esc(label)}" onclick="${ocrCb}">${ico('cam')}</button></div>`;
}

/* ---------------- krok: dane ---------------- */
function vDane(p){
  const f=(k,l,ph='')=>`<label class="f"><span>${l}</span><input type="text" value="${esc(p[k])}" placeholder="${ph}" oninput="setP('${k}',this.value)"></label>`;
  const sel=(k,l,opts)=>`<label class="f"><span>${l}</span><select onchange="setP('${k}',this.value)"><option value="">– wybierz –</option>${opts.map(o=>`<option ${p[k]===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
  return `<h2>Dane protokołu</h2><p class="lead">Podstawowe informacje do nagłówka protokołu.</p>
  <div class="card">${f('nr','Numer protokołu','np. 7/11/2026')}${f('adres','Adres / obiekt')}${f('uzytkownik','Użytkownik obiektu')}
  <label class="f"><span>Data pomiarów</span><input type="date" value="${esc(p.data)}" onchange="setP('data',this.value);if(!P().nastepneEdited)setP('nastepne',addYear(this.value))"></label>
  ${sel('uklad','Układ sieci',['TN-C-S','TN-S','TN-C','TT','IT'])}
  ${sel('rodzaj','Rodzaj pomiarów',['Odbiorcze (powykonawcze)','Okresowe','Po modernizacji / rozbudowie'])}
  ${f('pogoda','Pogoda','np. słonecznie, sucho')}</div>
  <div class="card"><h3>Wykonawca i przyrząd</h3>
  <label class="f"><span>Pomiary wykonał</span><select onchange="pickWyk(this.value)">${S.wykonawcy.map(w=>`<option value="${w.id}" ${W(p).id===w.id?'selected':''}>${esc(w.osoba||'(bez nazwy)')}${w.firma?' – '+esc(w.firma):''}</option>`).join('')}</select></label>
  ${wykKv(W(p))}${wzorcWarn(W(p),p.data)}
  <div class="btns" style="margin-top:8px"><button class="btn sm" onclick="openWykList('wizard')">Edytuj listę wykonawców</button>${wykChanged(p)?`<button class="btn sm" onclick="pickWyk('${W(p).id}');toast('Zaktualizowano dane w protokole')">Pobierz aktualne dane</button>`:''}</div>
  <p class="small muted" style="margin:8px 0 0">Dane wykonawcy są kopiowane do protokołu – późniejsza zmiana na liście nie zmienia już wystawionych protokołów.</p></div>`;
}

/* ---------------- krok: obwody ---------------- */
function vObwody(p){
  const groups={}; p.obwody.forEach(o=>{ (groups[o.rozdz||'Rozdzielnica']=groups[o.rozdz||'Rozdzielnica']||[]).push(o); });
  const g=Object.entries(groups).map(([name,obs])=>`<div class="groupt row"><span class="grow">${esc(name)}</span>
    <button class="btn ghost sm" onclick="copyRozdz('${esc(name).replace(/'/g,"\\'")}')">${ico('copy')} Kopiuj</button></div>
    <div class="card" style="padding:4px 10px">${obs.map(o=>{ const r=p.rcd.find(x=>x.id===o.rcd);
      return `<button class="listitem" onclick="editOb('${o.id}')"><span class="sym">${esc(o.sym)}</span>
      <span class="grow"><span style="display:block;font-weight:500">${esc(o.nazwa||'(bez nazwy)')}</span>
      <span class="small muted">${TYPY[o.typ].t} · ${esc((o.zab||{}).char||'')}${esc((o.zab||{}).In||'')}${r?' · RCD '+esc(r.sym)+' '+esc(r.idn)+' mA':''}</span></span>
      ${o.typ==='ogrz'?'<span class="badge b-warn">ogrzewanie</span>':''}${(o.photos||[]).length?`<span class="badge b-none">${ico('img')}${o.photos.length}</span>`:''}${ico('chev')}</button>`; }).join('')}</div>`).join('');
  const rcds = p.rcd.map(r=>`<button class="listitem" onclick="editRcd('${r.id}')"><span class="sym">${esc(r.sym)}</span><span class="grow">Typ ${esc(r.typ)} · ${esc(r.In)} A · IΔn ${esc(r.idn)} mA
     <span class="small muted" style="display:block">${p.obwody.filter(o=>o.rcd===r.id).map(o=>o.sym).join(', ')||'brak przypisanych obwodów'}</span></span>${ico('chev')}</button>`).join('');
  return `<h2>Obwody i zabezpieczenia</h2><p class="lead">Lista obwodów wpisywana raz – każdy kolejny krok pokazuje ją ponownie, z polami właściwymi dla danego pomiaru.</p>
   ${g || '<div class="card muted">Brak obwodów.</div>'}
   <button class="btn pri block" onclick="addOb()">${ico('plus')} Dodaj obwód</button>
   <div class="groupt">Wyłączniki różnicowoprądowe (RCD)</div>
   <div class="card" style="padding:4px 10px">${rcds||'<p class="muted small" style="padding:8px 0">Brak RCD.</p>'}</div>
   <button class="btn block" onclick="addRcd()">${ico('plus')} Dodaj RCD</button>`;
}
function addOb(){ const p=P(); const last=p.obwody[p.obwody.length-1]; const o={id:uid(), rozdz:last?last.rozdz:'RG', sym:'F'+(p.obwody.length+1), nazwa:'', typ:'1f', zab:{char:'B',In:'16'}, rcd:last?last.rcd:'', izo:{}, cig:'', zs:'', photos:[], opis:''}; p.obwody.push(o); save(); editOb(o.id); }
function editOb(id){ view={name:'obwod', id}; render(); window.scrollTo(0,0); }
function copyRozdz(name){
  window.__copyFrom=name;
  modal(`<h3>Kopiuj rozdzielnicę</h3><p class="small muted">Obwody, zabezpieczenia i RCD zostaną skopiowane bez wyników pomiarów – np. dla kolejnego identycznego domku.</p>
   <label class="f"><span>Nazwa nowej rozdzielnicy</span><input type="text" id="newrozdz" value="${esc(name)} (kopia)"></label>
   <div class="btns"><button class="btn grow" onclick="closeModal()">Anuluj</button><button class="btn pri grow" onclick="doCopyRozdz()">Kopiuj</button></div>`);
}
function doCopyRozdz(){
  const name=window.__copyFrom; const nn=document.getElementById('newrozdz').value.trim(); closeModal(); if(!nn) return;
  const p=P(); p.obwody.filter(o=>o.rozdz===name).forEach(o=>{ const c=JSON.parse(JSON.stringify(o)); c.id=uid(); c.rozdz=nn; c.izo={}; c.cig=''; c.zs=''; c.photos=[]; if(c.grz) c.grz.etapy={}; p.obwody.push(c); });
  save(); render(); toast('Skopiowano obwody do „'+nn+'”');
}
function renderObwodForm(p){
  const o=obById(view.id); if(!o){ view={name:'wizard'}; return renderWizard(p); }
  const opt=(arr,cur)=>arr.map(a=>`<option value="${a[0]}" ${String(cur)===String(a[0])?'selected':''}>${a[1]}</option>`).join('');
  return topbar(o.sym+' '+(o.nazwa||''),'Edycja obwodu','backToWizard()')+`<main>
   <div class="card">
    <label class="f"><span>Rozdzielnica</span><input type="text" value="${esc(o.rozdz)}" oninput="setOb('${o.id}','rozdz',this.value)"></label>
    <div class="row"><label class="f" style="width:110px"><span>Symbol</span><input type="text" value="${esc(o.sym)}" oninput="setOb('${o.id}','sym',this.value)"></label>
    <label class="f grow"><span>Nazwa / miejsce</span><input type="text" value="${esc(o.nazwa)}" oninput="setOb('${o.id}','nazwa',this.value)"></label></div>
    <label class="f"><span>Rodzaj obwodu</span><select onchange="setOb('${o.id}','typ',this.value);render()">${opt(Object.entries(TYPY).map(([k,v])=>[k,v.t]),o.typ)}</select></label>
    <div class="row"><label class="f grow"><span>Zabezpieczenie</span><select onchange="setOb('${o.id}','zab.char',this.value)">${opt([['B','B (wył. nadprądowy)'],['C','C'],['D','D'],['gG','gG (wkładka)']],(o.zab||{}).char)}</select></label>
    <label class="f" style="width:120px"><span>In [A]</span><select onchange="setOb('${o.id}','zab.In',this.value)">${opt(IN_LIST.map(n=>[n,n+' A']),(o.zab||{}).In)}</select></label></div>
    <label class="f"><span>Za wyłącznikiem RCD</span><select onchange="setOb('${o.id}','rcd',this.value)"><option value="">– brak –</option>${opt(p.rcd.map(r=>[r.id,r.sym+' ('+r.typ+', '+r.idn+' mA)']),o.rcd)}</select></label>
    <label class="f"><span>Opis (opcjonalnie)</span><textarea oninput="setOb('${o.id}','opis',this.value)">${esc(o.opis)}</textarea></label>
   </div>
   ${o.typ==='ogrz'?`<div class="info">Obwód ogrzewania przechodzi wszystkie standardowe pomiary (ciągłość PE, izolacja, pętla zwarcia, RCD). Dodatkowo w kroku <b>Ogrzewanie</b> wypełnisz kartę przewodu grzejnego wg instrukcji producenta.</div>`:''}
   <div class="card"><h3>Zdjęcia obwodu</h3>${photosHtml(o.photos,`addPhotoOb('${o.id}')`)}</div>
   <div class="btns"><button class="btn grow" onclick="dupOb('${o.id}')">${ico('copy')} Duplikuj</button><button class="btn danger grow" onclick="delOb('${o.id}')">Usuń</button></div>
   <div style="height:10px"></div><button class="btn pri block" onclick="backToWizard()">Gotowe</button></main>`;
}
function backToWizard(){ view={name:'wizard'}; render(); }
function dupOb(id){ const p=P(); const o=obById(id); const c=JSON.parse(JSON.stringify(o)); c.id=uid(); c.sym=o.sym+"'"; c.izo={}; c.cig=''; c.zs=''; c.photos=[]; if(c.grz) c.grz.etapy={}; p.obwody.splice(p.obwody.indexOf(o)+1,0,c); save(); editOb(c.id); toast('Zduplikowano obwód'); }
function delOb(id){ confirmBox('Usunąć obwód wraz z wynikami?',`doDelOb('${id}')`); }
function doDelOb(id){ const p=P(); p.obwody=p.obwody.filter(o=>o.id!==id); izoGroups(p).forEach(g=>g.obwody=(g.obwody||[]).filter(x=>x!==id)); save(); backToWizard(); }
function addRcd(){ const p=P(); const r={id:uid(), sym:'Q'+(p.rcd.length+1), typ:'A', char:'G', In:'40', idn:'30'}; p.rcd.push(r); save(); editRcd(r.id); }
function editRcd(id){ view={name:'rcdform', id}; render(); window.scrollTo(0,0); }
function renderRcdForm(p){
  const r=p.rcd.find(x=>x.id===view.id); if(!r){ view={name:'wizard'}; return renderWizard(p); }
  const opt=(arr,cur)=>arr.map(a=>`<option ${String(cur)===String(a)?'selected':''}>${a}</option>`).join('');
  const optKV=(arr,cur)=>arr.map(([k,v])=>`<option value="${k}" ${String(cur)===String(k)?'selected':''}>${v}</option>`).join('');
  const c=rcdCrit(r); const autoW=RCD_WAVE[r.typ];
  return topbar('RCD '+r.sym,'Edycja wyłącznika','backToWizard()')+`<main><div class="card">
   <label class="f"><span>Symbol</span><input type="text" value="${esc(r.sym)}" oninput="setRcd('${r.id}','sym',this.value)"></label>
   <div class="row"><label class="f grow"><span>Typ</span><select onchange="setRcd('${r.id}','typ',this.value);setRcd('${r.id}','wave','');render()">${opt(['AC','A','F','B','B+'],r.typ)}</select></label>
   <label class="f grow"><span>In [A]</span><select onchange="setRcd('${r.id}','In',this.value)">${opt([16,25,40,63,80,100,125],r.In)}</select></label>
   <label class="f grow"><span>IΔn [mA]</span><select onchange="setRcd('${r.id}','idn',this.value);render()">${opt([10,30,100,300,500,1000],r.idn)}</select></label></div>
   <label class="f"><span>Charakterystyka czasowa</span><select onchange="setRcd('${r.id}','char',this.value);render()">${optKV([['G','bezzwłoczny (ogólny)'],['KV','krótkozwłoczny – oznaczenie G / KV (min. 10 ms)'],['S','selektywny – oznaczenie S']],r.char||'G')}</select></label>
   <label class="f"><span>Przebieg prądu testu ustawiony w mierniku</span><select onchange="setRcd('${r.id}','wave',this.value);render()">
     ${(WAVE_OK[r.typ]||['sin']).map(w=>`<option value="${w}" ${c.wave===w?'selected':''}>${WAVE_T[w]}${w===autoW?' (zalecany)':''}</option>`).join('')}</select></label>
   <label class="f"><span>Dopuszczalne napięcie dotykowe U<sub>L</sub></span><div class="seg"><button class="${c.ucLim===50?'on':''}" onclick="setRcd('${r.id}','ucLim','50');render()">50 V</button><button class="${c.ucLim===25?'on':''}" onclick="setRcd('${r.id}','ucLim','25');render()">25 V</button></div></label>
   <p class="small muted" style="margin:-4px 0 0">25 V tylko tam, gdzie wymaga tego część 7 normy (np. pomieszczenia dla zwierząt hodowlanych).</p></div>
   <div class="info"><b>Kryteria dla tego wyłącznika:</b><br>${esc(rcdCritText(r))}.
   ${c.wave!=='sin'?'<br>Miernik sam dobiera prąd testu do typu wyłącznika – wpisujesz wyniki tak, jak pokazuje ekran.':''}
   ${c.S?'<br>MI 3125 przed pomiarem czasu odczekuje 30 s i pomija pomiar Ia.':''}</div>
   <p class="small muted">Przypisz obwody do tego RCD w edycji obwodu.</p>
   <div class="btns"><button class="btn danger grow" onclick="delRcd('${r.id}')">Usuń RCD</button><button class="btn pri grow" onclick="backToWizard()">Gotowe</button></div></main>`;
}
function delRcd(id){ confirmBox('Usunąć wyłącznik RCD?',`doDelRcd('${id}')`); }
function doDelRcd(id){ const p=P(); p.rcd=p.rcd.filter(r=>r.id!==id); p.obwody.forEach(o=>{ if(o.rcd===id) o.rcd=''; }); save(); backToWizard(); }

/* ---------------- krok: oględziny ---------------- */
function vOgl(p){
  const items=oglItems(p);
  const st=stepStatus('ogl',p);
  const cards=items.map((it,i)=>{
    const a=p.ogl[it.k]||{};
    const segb=(v,l)=>`<button class="${a.v===v?'on-'+v:''}" aria-pressed="${a.v===v}" onclick="setOgl('${it.k}','v','${v}')">${l}</button>`;
    return `<div class="card ogl-item"><div class="q"><span class="lp">${i+1}</span>${esc(it.q)}</div><div class="norm">${esc(it.n)}</div>
      <div class="row"><div class="seg grow">${segb('tak','Tak')}${segb('nie','Nie')}${segb('nd','N/d')}</div>
      <button class="cam" aria-label="Dodaj zdjęcie do punktu ${i+1}" onclick="addPhotoOgl('${it.k}')">${ico('img')}</button></div>
      ${a.v==='nie'?`<label class="f" style="margin:10px 0 0"><span>Opis usterki (trafi do „Uwag i wniosków”)</span><textarea oninput="setOgl('${it.k}','uwaga',this.value,true)">${esc(a.uwaga)}</textarea></label>`:''}
      ${(a.photos||[]).length?`<div class="thumbs">${a.photos.map(pid=>thumb(pid)).join('')}</div>`:''}</div>`;
  }).join('');
  return `<h2>Oględziny instalacji</h2><p class="lead">Wykonywane przed próbami (PN-HD 60364-6, pkt 6.4.2). Przy każdym punkcie: Tak / Nie / Nie dotyczy, opcjonalnie zdjęcie.</p>
   <div class="card"><div class="row"><span class="grow small">Zakres listy</span></div>
   <div class="seg" style="margin-top:6px"><button class="${!p.oglPelny?'on':''}" onclick="setP('oglPelny',false);render()">Podstawowy (6)</button><button class="${p.oglPelny?'on':''}" onclick="setP('oglPelny',true);render()">Pełny wg 6.4.2.3 (16)</button></div>
   <p class="small muted" style="margin:8px 0 0">Podstawowy = punkty z Twojego dotychczasowego protokołu. ${p.obwody.some(o=>o.typ==='ogrz')?'Dodano punkt dla ogrzewania elektrycznego.':''}</p></div>
   ${cards}
   ${st.missing?`<button class="btn block" onclick="oglRestTak()">Zaznacz pozostałe (${st.missing}) jako „Tak”</button>`:'<div class="info">Wszystkie punkty oględzin ocenione.</div>'}`;
}
function setOgl(k,f,v,noRender){ const p=P(); p.ogl[k]=p.ogl[k]||{}; p.ogl[k][f]=v; save(); if(noRender) refreshStepper(); else render(); }
function oglRestTak(){ const p=P(); oglItems(p).forEach(i=>{ if(!(p.ogl[i.k]||{}).v){ p.ogl[i.k]=p.ogl[i.k]||{}; p.ogl[i.k].v='tak'; } }); save(); render(); }

/* ---------------- krok: ciągłość ---------------- */
const WYR_PRESETS = ['GSW – rura wodociągowa','GSW – rura gazowa','GSW – instalacja c.o.','GSW – uziom fundamentowy / otok','GSW – konstrukcja stalowa','Łazienka – miejscowe połączenie wyrównawcze','Kuchnia – zlew / rury','Kotłownia – kocioł / rury'];
function vCig(p){
  const tryb=cigTryb(p); p.wyr=p.wyr||[];
  const obRows=p.obwody.map(o=>`<div class="card"><div class="row" style="margin-bottom:8px"><span class="sym">${esc(o.sym)}</span><span class="grow">${esc(o.nazwa)}<span class="small muted" style="display:block">${o.typ==='ogrz'?'PE + ekran (oplot) przewodu grzejnego':esc(o.rozdz)}</span></span><span id="ev-cig-${o.id}">${badge(evCig(o,p))}</span></div>
    <div class="cell"><label class="small muted">R przewodu ochronnego [Ω]${tryb==='zs'?' – opcjonalnie':''}</label>${measInput(o.cig,`setOb('${o.id}','cig',this.value,'cig')`,o.sym+' ciągłość PE',`ocr('${o.id}','cig','Ω')`)}</div></div>`).join('');
  const heat=p.obwody.filter(o=>o.typ==='ogrz');
  const wyrRows=p.wyr.map(w=>`<div class="card"><div class="row" style="margin-bottom:8px"><input type="text" class="grow" value="${esc(w.nazwa)}" aria-label="Nazwa połączenia" oninput="setWyr('${w.id}','nazwa',this.value)"><span id="ev-wyr-${w.id}">${badge(evWyr(w,p))}</span></div>
     <div class="meas c2"><div class="cell"><label>R zmierzona [Ω]</label>${measInput(w.r,`setWyr('${w.id}','r',this.value)`,w.nazwa+' R',`ocrWyr('${w.id}')`)}</div>
     <div class="cell"><label>R wymagana max [Ω]</label><input class="num" inputmode="decimal" placeholder="${esc(p.cigLimit||'1')}" value="${esc(w.lim||'')}" oninput="setWyr('${w.id}','lim',this.value)" aria-label="R wymagana"></div></div>
     <button class="btn ghost sm" onclick="delWyr('${w.id}')">Usuń</button></div>`).join('');
  return `<h2>Ciągłość przewodów ochronnych i połączeń wyrównawczych</h2><p class="lead">PN-HD 60364-6, pkt 6.4.3.2.</p>
   <div class="card"><span class="small">Zakres pomiaru ciągłości w tym protokole</span>
    <div class="seg" style="margin-top:6px"><button class="${tryb==='zs'?'on':''}" onclick="setP('cigTryb','zs');render()">Połączenia wyrównawcze<br><span class="small">obwody przez Zs + RCD</span></button><button class="${tryb==='all'?'on':''}" onclick="setP('cigTryb','all');render()">Wszystkie obwody<br><span class="small">+ połączenia wyrównawcze</span></button></div>
    <p class="small muted" style="margin:8px 0 0">${tryb==='zs'
      ? 'Ciągłość PE w obwodach potwierdza pomiar impedancji pętli zwarcia i badanie RCD – w protokole przy obwodach pojawi się „potwierdzona pomiarem Zs”. Mierzysz połączenia wyrównawcze.'
      : 'Pomiar ciągłości PE dla każdego obwodu przed pomiarem pętli zwarcia (pkt 6.4.3.7.3) oraz połączeń wyrównawczych.'}</p></div>
   <div class="card row"><span class="grow small">Domyślny próg oceny<br><span class="muted">norma nie podaje jednej wartości – ustawiasz sam</span></span>
   <input class="num" style="width:90px" inputmode="decimal" value="${esc(p.cigLimit)}" oninput="setP('cigLimit',this.value);P().obwody.forEach(o=>refreshEv('cig',o.id));(P().wyr||[]).forEach(w=>{const e=document.getElementById('ev-wyr-'+w.id);if(e)e.innerHTML=badge(evWyr(w,P()))})" aria-label="Próg ciągłości w omach"><span>Ω</span></div>

   <div class="groupt">Połączenia wyrównawcze (główne i miejscowe)</div>
   <label class="card toggle"><input type="checkbox" ${p.wyrNd?'checked':''} onchange="setP('wyrNd',this.checked);render()"> Nie dotyczy / brak połączeń do pomiaru</label>
   ${p.wyrNd?'':wyrRows+`<div class="card"><div class="small muted" style="margin-bottom:6px">Dodaj szybko:</div><div class="btns">${WYR_PRESETS.map(n=>`<button class="btn sm" onclick="addWyr('${n}')">${esc(n)}</button>`).join('')}</div>
     <button class="btn block" style="margin-top:8px" onclick="addWyr('')">${ico('plus')} Inne połączenie</button>
     <p class="small muted" style="margin:8px 0 0">Miejscowe połączenia wyrównawcze: R ≤ U<sub>L</sub>/I<sub>a</sub> (PN-HD 60364-4-41, 415.2.2) – wpisz wartość wymaganą przy pomiarze.</p></div>`}

   ${tryb==='zs'
     ? `${heat.length?`<div class="warnbox">Obwód ogrzewania ${heat.map(o=>esc(o.sym)).join(', ')}: pomiar Zs w puszce regulatora nie obejmuje połączenia ekranu przewodu grzejnego z PE – zalecany osobny pomiar ciągłości (pole poniżej).</div>`:''}
        <details class="card"${heat.length?' open':''}><summary style="cursor:pointer;font-weight:600;min-height:28px">Obwody – pomiar opcjonalny (${p.obwody.length})</summary><div style="margin-top:10px">${obRows||'<p class="muted small">Brak obwodów.</p>'}</div></details>`
     : `<div class="groupt">Obwody</div>${obRows||'<div class="card muted">Najpierw dodaj obwody.</div>'}`}`;
}
function addWyr(n){ const p=P(); p.wyr=p.wyr||[]; p.wyr.push({id:uid(), nazwa:n||'Połączenie wyrównawcze '+(p.wyr.length+1), r:'', lim:''}); save(); render(); }
function setWyr(id,k,v){ const p=P(); const w=p.wyr.find(x=>x.id===id); w[k]=v; save(); refreshStepper(); const e=document.getElementById('ev-wyr-'+id); if(e) e.innerHTML=badge(evWyr(w,p)); }
function delWyr(id){ const p=P(); p.wyr=p.wyr.filter(w=>w.id!==id); save(); render(); }
function ocrWyr(id){ ocrDialog('Ω', v=>{ setWyr(id,'r',v); render(); }); }
function vIzo(p){
  const ord=[...p.obwody].sort((a,b)=>(a.typ==='wlz'?0:1)-(b.typ==='wlz'?0:1));
  const rows=ord.map(o=>{
    const pairs=izoPairs(o); const zw=o.izoMet==='zw';
    const g=izoGroupOf(o,p), own=evIzoRaw(o,p), gBad=g&&evIzoG(g,p).s==='bad';
    const inner=`
     ${o.typ==='ogrz'?'<div class="warnbox">Odłącz regulator (elektronika). Izolację samego przewodu grzejnego (1000 V) wpisujesz w karcie w kroku „Ogrzewanie”.</div>':''}
     <label class="f" style="margin-bottom:8px"><span>Napięcie probiercze</span><select onchange="setOb('${o.id}','izoU',this.value);render()"><option value="" ${!o.izoU?'selected':''}>jak w protokole (${izoU({},p).t}, ≥ ${fmt(izoU({},p).min,izoU({},p).min<1?1:0)} MΩ)</option>${Object.entries(IZO_U).map(([k,c])=>`<option value="${k}" ${o.izoU===k?'selected':''}>${c.t} – ${c.d} (≥ ${fmt(c.min,c.min<1?1:0)} MΩ)</option>`).join('')}</select></label>
     <div class="seg" style="margin-bottom:8px"><button class="${!zw?'on':''}" onclick="setIzoMet('${o.id}','pary')">Każda para (${TYPY[o.typ].pairs.length})</button><button class="${zw?'on':''}" onclick="setIzoMet('${o.id}','zw')">${IZO_ZW[o.typ]}</button></div>
     <div class="meas${zw?' c2':''}">${pairs.map(k=>`<div class="cell"><label>${k} [MΩ]</label><input class="num" inputmode="decimal" value="${esc((o.izo||{})[k]||'')}" aria-label="${o.sym} ${k}" oninput="setOb('${o.id}','izo.${k}',this.value,'izo')"></div>`).join('')}</div>
     <div class="btns" style="margin-top:8px"><button class="btn sm" onclick="izoAllMax('${o.id}')">Wszystkie „poza zakresem” (${esc(izoMax(p))})</button><button class="btn sm ghost" onclick="ocr('${o.id}','izo','MΩ')">${ico('cam')} Ze zdjęcia</button></div>`;
    const head=`<div class="row" style="margin-bottom:8px"><span class="sym">${esc(o.sym)}</span><span class="grow">${esc(o.nazwa)}<span class="small muted" style="display:block">${TYPY[o.typ].t}</span></span><span id="ev-izo-${o.id}">${badge(evIzo(o,p))}</span></div>`;
    if(g) return `<div class="card">${head}
      ${gBad?`<div class="warnbox">Wynik pomiaru grupowego „${esc(g.nazwa)}” poniżej wymagań – zmierz ten obwód osobno albo podziel grupę na mniejsze.</div>`:`<p class="small muted" style="margin:0 0 6px">Objęty pomiarem grupowym „${esc(g.nazwa)}” – pomiar osobny nie jest wymagany.</p>`}
      <details${(gBad||own.s!=='none')?' open':''}><summary class="small" style="cursor:pointer;min-height:32px;color:var(--pri);font-weight:600">Zmierz osobno</summary><div style="margin-top:8px">${inner}</div></details></div>`;
    return `<div class="card">${head}${inner}</div>`;
  }).join('');
  const groups=izoGroups(p).map(g=>vIzoGroup(g,p)).join('');
  return `<h2>Rezystancja izolacji</h2><p class="lead">Najpierw WLZ (kabel zasilający), potem obwody – osobno albo grupowo od strony zasilania.</p>
   <div class="card"><div class="small" style="margin-bottom:6px">Napięcie probiercze – domyślne dla protokołu</div>
   <div class="seg">${['250','500','1000'].map(k=>`<button class="${(p.izoU||'500')===k?'on':''}" onclick="setP('izoU','${k}');render()">${IZO_U[k].u} V</button>`).join('')}</div>
   <p class="small muted" style="margin:8px 0 0">${esc(izoU({},p).d)}; wymagane ≥ ${fmt(izoU({},p).min,0)} MΩ. Dla pojedynczego obwodu możesz ustawić inne napięcie (np. 250 V przy gniazdach z ogranicznikiem przepięć albo obwód SELV/PELV ≥ 0,5 MΩ).</p></div>
   <div class="info">Wg PN-HD 60364-6 (tab. 6.1, pkt 6.4.3.3): 500 V → ≥ 1 MΩ; 250 V obniżone ze względu na SPD → nadal ≥ 1 MΩ; SELV/PELV 250 V → ≥ 0,5 MΩ; obwody &gt; 500 V: 1000 V → ≥ 1 MΩ. </div>
   <div class="card row"><span class="grow small">Wynik „poza zakresem” Twojego miernika<br><span class="muted">wpisywany przyciskiem przy obwodzie; ustawienie z danych przyrządu</span></span>
   <input type="text" style="width:110px" value="${esc(izoMax(p))}" aria-label="Wynik poza zakresem" onchange="W(P()).izoMax=this.value.trim()||'>999';save();render()"></div>
   <div class="card"><div class="small" style="margin-bottom:6px">Metoda dla wszystkich obwodów naraz</div>
   <div class="btns"><button class="btn sm grow" onclick="setIzoMetAll('pary')">Każda para</button><button class="btn sm grow" onclick="setIzoMetAll('zw')">Przewody czynne zwarte – PE</button></div>
   <p class="small muted" style="margin:8px 0 0">Pomiar między zwartymi przewodami czynnymi (L+N) a PE – np. przy pomiarach okresowych, gdy nie można odłączyć odbiorników (PN-HD 60364-6, 6.4.3.3).${p.rodzaj&&p.rodzaj!=='Okresowe'?' <b>Ten protokół nie jest okresowy</b> – przy odbiorczych mierzy się zwykle każdą parę.':''}</p></div>
   <div class="groupt">Pomiary grupowe – od strony zasilania</div>
   <div class="info">Pomiar dla rozdzielnicy lub grupy obwodów z przyłączonymi wszystkimi obwodami odbiorczymi (odbiorniki odłączone, łączniki załączone). Gdy wynik grupy spełnia wymagania, spełnia je każdy obwód z osobna (PN-HD 60364-6, pkt 6.4.3.3 i D.6.4.3.3). Przy wyniku negatywnym podziel grupę lub zmierz obwody osobno.</div>
   ${groups}<button class="btn block" style="margin-bottom:6px" onclick="addIzoGroup()">${ico('plus')} Pomiar grupowy</button>
   <div class="groupt">Obwody</div>${rows}`;
}
function vIzoGroup(g,p){
  const pairs=izoPairsG(g,p), zw=g.met==='zw', f=gFaz(g,p);
  const rozdz=[...new Set(p.obwody.map(o=>o.rozdz||'Rozdzielnica'))];
  const chips=p.obwody.map(o=>{ const on=(g.obwody||[]).includes(o.id); const other=!on && izoGroupOf(o,p);
    return `<button class="btn sm" style="${on?'background:var(--pri);color:#fff;border-color:var(--pri)':''}${other?';opacity:.45':''}" aria-pressed="${on}" onclick="toggleG('${g.id}','${o.id}')">${esc(o.sym)}</button>`; }).join('');
  return `<div class="card" style="border:2px solid var(--pri-soft)">
    <div class="row" style="margin-bottom:8px"><input type="text" class="grow" value="${esc(g.nazwa)}" aria-label="Nazwa pomiaru grupowego" oninput="setG('${g.id}','nazwa',this.value)"><span id="ev-izog-${g.id}">${badge(evIzoG(g,p))}</span></div>
    <div class="small muted" style="margin-bottom:4px">Obejmuje obwody (${(g.obwody||[]).length}):</div>
    <div class="btns" style="margin-bottom:6px">${chips}</div>
    <div class="btns" style="margin-bottom:10px">${rozdz.map(r=>`<button class="btn ghost sm" onclick="gAllRozdz('${g.id}','${esc(r).replace(/'/g,"\\'")}')">Wszystkie: ${esc(r)}</button>`).join('')}</div>
    <label class="f" style="margin-bottom:8px"><span>Napięcie probiercze</span><select onchange="setG('${g.id}','izoU',this.value);render()"><option value="" ${!g.izoU?'selected':''}>jak w protokole (${izoU({},p).t})</option>${Object.entries(IZO_U).map(([k,c])=>`<option value="${k}" ${g.izoU===k?'selected':''}>${c.t} – ${c.d} (≥ ${fmt(c.min,c.min<1?1:0)} MΩ)</option>`).join('')}</select></label>
    <div class="seg" style="margin-bottom:8px"><button class="${!zw?'on':''}" onclick="setG('${g.id}','met','pary');render()">Każda para (${TYPY[f].pairs.length})</button><button class="${zw?'on':''}" onclick="setG('${g.id}','met','zw');render()">${f==='3f'?'L1+L2+L3+N–PE':'L+N–PE'}</button></div>
    <div class="meas${zw?' c2':''}">${pairs.map(k=>`<div class="cell"><label>${k} [MΩ]</label><input class="num" inputmode="decimal" value="${esc((g.izo||{})[k]||'')}" aria-label="${esc(g.nazwa)} ${k}" oninput="setG('${g.id}','izo.${k}',this.value,true)"></div>`).join('')}</div>
    <div class="btns" style="margin-top:8px"><button class="btn sm" onclick="gAllMax('${g.id}')">Wszystkie „poza zakresem” (${esc(izoMax(p))})</button><button class="btn sm ghost" onclick="ocrG('${g.id}')">${ico('cam')} Ze zdjęcia</button><button class="btn sm danger" onclick="confirmBox('Usunąć pomiar grupowy?','delG(\\'${g.id}\\')')">Usuń</button></div></div>`;
}
function gById(id){ return izoGroups().find(g=>g.id===id); }
function addIzoGroup(){ const p=P(); const free=p.obwody.filter(o=>o.typ!=='wlz' && !izoGroupOf(o,p)); const r=(free[0]||{}).rozdz||'RG';
  izoGroups(p).push({id:uid(), nazwa:r, obwody:free.filter(o=>(o.rozdz||'RG')===r).map(o=>o.id), met:'zw', izoU:'', izo:{}}); save(); render(); }
function setG(id,path,v,live){ deepSet(gById(id),path,v); save(); refreshStepper();
  if(live){ const p=P(), g=gById(id); const e=document.getElementById('ev-izog-'+id); if(e) e.innerHTML=badge(evIzoG(g,p)); (g.obwody||[]).forEach(oid=>{ const el=document.getElementById('ev-izo-'+oid); const o=obById(oid); if(el&&o) el.innerHTML=badge(evIzo(o,p)); }); } }
function toggleG(id,oid){ const p=P(), g=gById(id); g.obwody=g.obwody||[];
  if(g.obwody.includes(oid)) g.obwody=g.obwody.filter(x=>x!==oid);
  else { izoGroups(p).forEach(x=>{ x.obwody=(x.obwody||[]).filter(y=>y!==oid); }); g.obwody.push(oid); }
  save(); render(); }
function gAllRozdz(id,r){ const p=P(), g=gById(id); const ids=p.obwody.filter(o=>(o.rozdz||'Rozdzielnica')===r && o.typ!=='wlz').map(o=>o.id);
  izoGroups(p).forEach(x=>{ if(x!==g) x.obwody=(x.obwody||[]).filter(y=>!ids.includes(y)); });
  g.obwody=[...new Set([...(g.obwody||[]),...ids])]; save(); render(); }
function gAllMax(id){ const p=P(), g=gById(id); const mx=izoMax(p); g.izo=g.izo||{}; izoPairsG(g,p).forEach(k=>g.izo[k]=mx); save(); render(); }
function ocrG(id){ ocrDialog('MΩ', v=>{ const p=P(), g=gById(id); g.izo=g.izo||{}; izoPairsG(g,p).forEach(k=>{ if(!filled(g.izo[k])) g.izo[k]=v; }); save(); render(); }); }
function delG(id){ const p=P(); p.izoGr=izoGroups(p).filter(g=>g.id!==id); save(); render(); }
function setIzoMet(id,m){ obById(id).izoMet=m; save(); render(); }
function setIzoMetAll(m){ P().obwody.forEach(o=>o.izoMet=m); save(); render(); toast(m==='zw'?'Wszystkie obwody: przewody czynne zwarte – PE':'Wszystkie obwody: każda para osobno'); }
function izoAllMax(id){ const o=obById(id); const mx=izoMax(P()); izoPairs(o).forEach(k=>{ o.izo=o.izo||{}; o.izo[k]=mx; }); save(); render(); }

/* ---------------- krok: pętla zwarcia ---------------- */
function vZs(p){
  const rows=p.obwody.map(o=>{ const ia=iaFor(o); const za=ia?U0/ia:null; const z=num(o.zs);
    return `<div class="card"><div class="row" style="margin-bottom:8px"><span class="sym">${esc(o.sym)}</span><span class="grow">${esc(o.nazwa)}<span class="small muted" style="display:block">${esc((o.zab||{}).char)}${esc((o.zab||{}).In)} · Ia = ${ia?fmt(ia,0)+' A':'–'} · Za = ${za?fmt(za)+' Ω':'–'}</span></span><span id="ev-zs-${o.id}">${badge(evZs(o))}</span></div>
     ${o.typ==='ogrz'?'<div class="info">Pomiar L-PE w puszce regulatora (koniec obwodu), w trybie bez wyzwalania RCD.</div>':''}
     <div class="meas c2"><div class="cell"><label>Zs zmierzona [Ω]</label>${measInput(o.zs,`setOb('${o.id}','zs',this.value,'zs')`,o.sym+' Zs',`ocr('${o.id}','zs','Ω')`)}</div>
     <div class="cell"><label>Ik = U₀/Zs</label><div style="min-height:44px;display:flex;align-items:center;font-weight:600" id="isc-${o.id}">${z?fmt(U0/z,0)+' A':'–'}</div></div></div></div>`; }).join('');
  return `<h2>Impedancja pętli zwarcia</h2><p class="lead">Skuteczność samoczynnego wyłączenia zasilania (PN-HD 60364-4-41).</p>
   <div class="info">U₀ = 230 V. Warunek: <b>Zs ≤ Za = U₀ / Ia</b>. Ia: B = 5×In, C = 10×In, D = 20×In (t ≤ 0,4 s); gG – tabela dla 5 s (wartości orientacyjne, do weryfikacji). Aplikacja liczy Za sama – bez ręcznych przeliczeń.</div>${rows}`;
}

/* ---------------- krok: RCD ---------------- */
function vRcd(p){
  const warns=p.obwody.filter(o=>o.typ==='ogrz').map(o=>{ const r=p.rcd.find(x=>x.id===o.rcd);
    if(!r) return `<div class="badbox">Obwód ogrzewania <b>${esc(o.sym)}</b> nie jest przypisany do RCD – instrukcja producenta wymaga RCD o IΔn ≤ 30 mA.</div>`;
    if(num(r.idn)>30) return `<div class="badbox">Obwód ogrzewania <b>${esc(o.sym)}</b> jest za RCD ${esc(r.sym)} o IΔn ${esc(r.idn)} mA – wymagane ≤ 30 mA.</div>`;
    return `<div class="info">Obwód ogrzewania <b>${esc(o.sym)}</b> za RCD ${esc(r.sym)} (${esc(r.idn)} mA) – wymaganie producenta spełnione.</div>`; }).join('');
  const rows=p.rcd.map(r=>{ const c=rcdCrit(r);
    const inp=(k,l)=>`<div class="cell"><label>${l}</label>${measInput(r[k],`setRcd('${r.id}','${k}',this.value)`,r.sym+' '+l,`ocrRcd('${r.id}','${k}')`)}</div>`;
    const seg=(k,l)=>`<div class="cell"><label>${l}</label><div class="seg"><button class="${r[k]==='tak'?'on-tak':''}" onclick="setRcd('${r.id}','${k}','tak');render()">${k==='half'?'Brak':'Tak'}</button><button class="${r[k]==='nie'?'on-nie':''}" onclick="setRcd('${r.id}','${k}','nie');render()">${k==='half'?'Zadziałał':'Nie'}</button></div></div>`;
    return `<div class="card"><div class="row" style="margin-bottom:8px"><span class="sym">${esc(r.sym)}</span><span class="grow">Typ ${esc(r.typ)}${c.ch!=='G'?' '+esc(c.ch):''} · ${esc(r.In)} A · IΔn ${esc(r.idn)} mA<span class="small muted" style="display:block">obwody: ${p.obwody.filter(o=>o.rcd===r.id).map(o=>o.sym).join(', ')||'–'}</span></span><span id="ev-rcd-${r.id}">${badge(evRcd(r))}</span></div>
      <div class="small muted" style="margin-bottom:8px">${esc(rcdCritText(r))}. <button class="btn ghost sm" style="min-height:28px;padding:0 4px" onclick="editRcd('${r.id}')">Zmień</button></div>
      <div class="meas c2">${inp('t1a','t 1×IΔn 0° [ms]')}${inp('t1b','t 1×IΔn 180° [ms]')}
      ${c.x5?inp('t5a','t 5×IΔn 0° [ms]')+inp('t5b','t 5×IΔn 180° [ms]'):''}
      ${inp('uc','Uc [V]')}</div>
      ${c.S?'<p class="small muted">Prąd zadziałania (narastający prąd) – nie mierzy się dla RCD selektywnych.</p>':`<div class="small" style="font-weight:600;margin:10px 0 4px">Prąd zadziałania – test narastającym prądem</div><div class="meas c2">${inp('ia','Ia 0° [mA]')}${inp('iab','Ia 180° [mA]')}</div>`}
      ${c.x5?'':'<p class="small muted">Test 5×IΔn niedostępny w MI 3125 dla tego typu i prądu – nie jest wymagany w ocenie.</p>'}
      <div class="meas c2" style="margin-top:8px">${seg('half','½ IΔn')}${seg('test','Przycisk TEST')}</div></div>`; }).join('');
  return `<h2>Wyłączniki różnicowoprądowe RCD</h2><p class="lead">Wyniki autotestu MI 3125. Kryteria dobierają się do typu, charakterystyki i przebiegu prądu testu każdego wyłącznika.</p>
   <details class="card"><summary style="cursor:pointer;font-weight:600;min-height:28px">Zestawienie kryteriów (PN-EN 61008/61009, PN-EN 62423)</summary>
   <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
    <tr><th style="text-align:left;border-bottom:1px solid var(--line);padding:4px">Prąd zadziałania Ia</th><th style="text-align:left;border-bottom:1px solid var(--line);padding:4px"></th></tr>
    <tr><td style="padding:4px">AC, A, F, B – test sinusoidalny</td><td style="padding:4px">0,5–1,0 IΔn</td></tr>
    <tr><td style="padding:4px">A, F, B – test pulsujący</td><td style="padding:4px">0,35–1,4 IΔn<br><span class="muted">IΔn = 10 mA: 0,35–2,0 IΔn</span></td></tr>
    <tr><td style="padding:4px">B, B+ – test prądem stałym</td><td style="padding:4px">0,5–2,0 IΔn</td></tr>
    <tr><th style="text-align:left;border-bottom:1px solid var(--line);padding:8px 4px 4px">Czas wyłączenia</th><th style="text-align:left;border-bottom:1px solid var(--line);padding:8px 4px 4px">1× / 2× / 5× IΔn</th></tr>
    <tr><td style="padding:4px">Bezzwłoczny</td><td style="padding:4px">≤ 300 / ≤ 150 / ≤ 40 ms</td></tr>
    <tr><td style="padding:4px">Krótkozwłoczny (KV/G)</td><td style="padding:4px">jak bezzwłoczny, min. 10 ms</td></tr>
    <tr><td style="padding:4px">Selektywny (S)</td><td style="padding:4px">130–500 / 60–200 / 50–150 ms</td></tr>
    <tr><td style="padding:4px">½ IΔn (wszystkie)</td><td style="padding:4px">brak zadziałania</td></tr>
   </table>
   <p class="small muted" style="margin:8px 0 0">Dla testu pulsującego miernik podaje prąd ×1,4 (IΔn = 10 mA: ×2), dla prądu stałego ×2 – czasy ocenia się według tych samych granic. Typ AC nie może być badany prądem pulsującym ani stałym; typ A/F – prądem stałym.</p></details>
   ${warns}${rows||'<div class="card muted">Brak RCD – dodaj je w kroku „Obwody”.</div>'}`;
}
function vUz(p){
  const rows=p.uz.map(u=>`<div class="card"><div class="row" style="margin-bottom:8px"><input type="text" class="grow" value="${esc(u.sym)}" aria-label="Nazwa uziomu" oninput="setUz('${u.id}','sym',this.value)"><span id="ev-uz-${u.id}">${badge(evUz(u))}</span></div>
     <label class="f"><span>Metoda pomiaru</span><select onchange="setUz('${u.id}','met',this.value)">${['Techniczna (3-przewodowa)','Techniczna (4-przewodowa)','Cęgowa (dwucęgowa)','Pętla zwarcia L-PE'].map(m=>`<option ${u.met===m?'selected':''}>${m}</option>`).join('')}</select></label>
     <div class="meas c2"><div class="cell"><label>R zmierzona [Ω]</label>${measInput(u.r,`setUz('${u.id}','r',this.value)`,'R uziemienia',`ocrUz('${u.id}')`)}</div>
     <div class="cell"><label>R wymagana max [Ω]</label><input class="num" inputmode="decimal" value="${esc(u.lim||'')}" oninput="setUz('${u.id}','lim',this.value)" aria-label="R wymagana"></div></div>
     ${p.uklad==='TT'?'<p class="small muted">Układ TT: R<sub>A</sub> × IΔn ≤ 50 V → dla 30 mA: ≤ 1667 Ω.</p>':''}</div>`).join('');
  return `<h2>Rezystancja uziemienia</h2><p class="lead">Uziom instalacji / szyna wyrównawcza.</p>
   <label class="card toggle"><input type="checkbox" ${p.uzNd?'checked':''} onchange="setP('uzNd',this.checked);render()"> Nie dotyczy w tym protokole</label>
   ${p.uzNd?'':rows+`<button class="btn block" onclick="addUz()">${ico('plus')} Dodaj pomiar uziemienia</button>`}`;
}
function addUz(){ const p=P(); p.uz.push({id:uid(), sym:'Uziom '+(p.uz.length+1), met:'Techniczna (3-przewodowa)', r:'', lim:''}); save(); render(); }

/* ---------------- krok: ogrzewanie ---------------- */
function grzParamsHtml(o){
  const g=grzParams(o);
  return `<dl class="kv"><dt>Moc</dt><dd>${g.moc?fmt(g.moc,0)+' W':'–'}</dd><dt>R znamionowa</dt><dd>${g.rn?fmt(g.rn,1)+' Ω':'–'} ${num((o.grz||{}).rTab)===null&&g.rn?'<span class="muted small">(z U²/P)</span>':''}</dd>
   <dt>Dopuszczalne R</dt><dd>${g.rn?fmt(g.rn*(1+g.tolMin/100),1)+' – '+fmt(g.rn*(1+g.tolMax/100),1)+' Ω':'–'} (${g.tolMin}% / +${g.tolMax}%)</dd>
   <dt>Izolacja</dt><dd>≥ ${g.isoMin} MΩ przy ${g.uIso} V, min. 30 s</dd></dl><p class="small muted" style="margin:6px 0 0">${esc(g.pr.src)}</p>`;
}
function grzDiffHtml(o){
  const e=((o.grz||{}).etapy)||{}; const a=num((e.ulozenie||{}).r), b=num((e.wylewka||{}).r);
  if(a===null||b===null) return '';
  const d=(b-a)/a*100;
  return Math.abs(d)>2 ? `<div class="warnbox">Rezystancja po wylewce różni się od pomiaru po ułożeniu o ${fmt(d,1)}% – sprawdź, czy przewód nie został uszkodzony.</div>`
                       : `<div class="info">Po wylewce R zmieniła się o ${fmt(d,1)}% – wyniki zgodne.</div>`;
}
function vGrz(p){
  const obs=p.obwody.filter(o=>o.typ==='ogrz');
  const cards=obs.map(o=>{ o.grz=o.grz||{prod:'ELEKTRA VCD10',etapy:{}}; const g=o.grz; const pr=PRODUKTY[g.prod]||{};
    const etapy=ETAPY.map(([k,l,req])=>{ const e=(g.etapy||{})[k]||{};
      return `<div class="card" style="background:#fafbfc"><div class="row" style="margin-bottom:8px"><b class="grow">${l}</b><span id="ev-grz-${k}-${o.id}">${badge(evEtap(o,k))}</span></div>
       <label class="f"><span>Data pomiaru</span><input type="date" value="${esc(e.data||'')}" onchange="setOb('${o.id}','grz.etapy.${k}.data',this.value)"></label>
       <div class="meas c2"><div class="cell"><label>R żyły grzejnej [Ω]</label>${measInput(e.r,`setOb('${o.id}','grz.etapy.${k}.r',this.value,'grz')`,'R żyły '+l,`ocr('${o.id}','grz.etapy.${k}.r','Ω')`)}</div>
       <div class="cell"><label>R izolacji [MΩ]</label>${measInput(e.iso,`setOb('${o.id}','grz.etapy.${k}.iso',this.value,'grz')`,'R izolacji '+l,`ocr('${o.id}','grz.etapy.${k}.iso','MΩ')`)}</div></div>
       <label class="toggle small"><input type="checkbox" ${e.t30?'checked':''} onchange="setOb('${o.id}','grz.etapy.${k}.t30',this.checked,'grz')"> Pomiar izolacji ${pr.uIso||1000} V trwał co najmniej 30 s</label></div>`; }).join('');
    return `<div class="groupt">${esc(o.sym)} – ${esc(o.nazwa)}</div><div class="card">
      <label class="f"><span>Produkt</span><select onchange="setOb('${o.id}','grz.prod',this.value);render()">${Object.keys(PRODUKTY).map(k=>`<option ${g.prod===k?'selected':''}>${k}</option>`).join('')}</select></label>
      ${pr.verify?'<div class="warnbox">Progi DEVI do potwierdzenia z instrukcją – na razie przyjęto wartości jak dla ELEKTRA. Wpisz też numer z mufy.</div>':''}
      ${pr.custom?`<div class="meas"><div class="cell"><label>Tol. min [%]</label><input class="num" value="${esc(g.tolMin??'-5')}" oninput="setOb('${o.id}','grz.tolMin',this.value,'grz')"></div><div class="cell"><label>Tol. max [%]</label><input class="num" value="${esc(g.tolMax??'10')}" oninput="setOb('${o.id}','grz.tolMax',this.value,'grz')"></div><div class="cell"><label>Izol. min [MΩ]</label><input class="num" value="${esc(g.isoMin??'50')}" oninput="setOb('${o.id}','grz.isoMin',this.value,'grz')"></div></div><div style="height:8px"></div>`:''}
      <div class="meas"><div class="cell"><label>Długość [m]</label><input class="num" inputmode="decimal" value="${esc(g.dl||'')}" oninput="setOb('${o.id}','grz.dl',this.value,'grz')"></div>
      <div class="cell"><label>Moc [W]</label><input class="num" inputmode="decimal" placeholder="${pr.wm&&num(g.dl)?fmt(pr.wm*num(g.dl),0):''}" value="${esc(g.moc||'')}" oninput="setOb('${o.id}','grz.moc',this.value,'grz')"></div>
      <div class="cell"><label>R z tabliczki [Ω]</label><input class="num" inputmode="decimal" value="${esc(g.rTab||'')}" oninput="setOb('${o.id}','grz.rTab',this.value,'grz')"></div></div>
      ${g.prod==='DEVI'?`<label class="f" style="margin-top:8px"><span>Numer z mufy</span><input type="text" value="${esc(g.mufa||'')}" oninput="setOb('${o.id}','grz.mufa',this.value)"></label>`:''}
      <div style="margin-top:10px" id="grzpar-${o.id}">${grzParamsHtml(o)}</div></div>
      ${etapy}<div id="grzdiff-${o.id}">${grzDiffHtml(o)}</div>
      <div class="card"><h3>Tabliczka znamionowa i szkic ułożenia</h3><p class="small muted" style="margin:0 0 6px">Zdjęcie tabliczki oraz szkic lub zdjęcie ułożenia przewodu i czujnika temperatury.</p>${photosHtml((g.photos||[]),`addPhotoGrz('${o.id}')`)}</div>`; }).join('');
  return `<h2>Karta przewodu grzejnego</h2><p class="lead">Pomiary wymagane przez producenta. Można je wypełniać na budowie, tygodnie przed protokołem – ten krok nie jest blokowany.</p>${cards}`;
}

/* ---------------- krok: orzeczenie ---------------- */
function collectFindings(p){
  const out=[];
  oglItems(p).forEach((it,i)=>{ const a=p.ogl[it.k]||{}; if(a.v==='nie') out.push(`Oględziny p. ${i+1}: ${it.q.replace(/\.$/,'')} – NIE SPEŁNIA${a.uwaga?': '+a.uwaga:''}.`); });
  p.obwody.forEach(o=>{
    if(filled(o.cig) && evCig(o,p).s==='bad') out.push(`${o.sym} ${o.nazwa}: ciągłość PE ${o.cig} Ω – ocena negatywna.`);
    if(evIzoRaw(o,p).s==='bad') out.push(`${o.sym} ${o.nazwa}: rezystancja izolacji ${evIzoRaw(o,p).t}.`);
    if(evZs(o).s==='bad'){ const ia=iaFor(o); out.push(`${o.sym} ${o.nazwa}: Zs = ${o.zs} Ω > Za = ${fmt(U0/ia)} Ω – brak skutecznej ochrony przez samoczynne wyłączenie.`); }
    if(o.typ==='ogrz') ETAPY.forEach(([k,l])=>{ if(evEtap(o,k).s==='bad') out.push(`${o.sym} przewód grzejny (${l.toLowerCase()}): ${evEtap(o,k).t}.`); });
  });
  p.rcd.forEach(r=>{ if(evRcd(r).s==='bad') out.push(`RCD ${r.sym}: ${evRcd(r).t}.`); });
  izoGroups(p).forEach(g=>{ if(evIzoG(g,p).s==='bad') out.push(`Pomiar grupowy izolacji „${g.nazwa}”: ${evIzoG(g,p).t}.`); });
  (p.wyr||[]).forEach(w=>{ if(!p.wyrNd && evWyr(w,p).s==='bad') out.push(`${w.nazwa}: ${evWyr(w,p).t}.`); });
  p.uz.forEach(u=>{ if(!p.uzNd && evUz(u).s==='bad') out.push(`${u.sym}: ${evUz(u).t}.`); });
  p.obwody.filter(o=>o.typ==='ogrz').forEach(o=>{ const r=p.rcd.find(x=>x.id===o.rcd); if(!r||num(r.idn)>30) out.push(`${o.sym}: obwód ogrzewania bez RCD ≤ 30 mA (wymaganie producenta).`); });
  return out;
}
function vOrz(p){
  const f=collectFindings(p);
  const skipped=visibleSteps(p).filter(s=>!s.free&&s.id!=='pdf'&&s.id!=='orz'&&!stepStatus(s.id,p).done);
  const sugg = f.length? 'nie nadaje się' : 'nadaje się';
  return `<h2>Uwagi, wnioski i orzeczenie</h2><p class="lead">Aplikacja zbiera wyniki negatywne i niekompletne kroki – decyzja należy do Ciebie.</p>
   ${skipped.length?`<div class="warnbox"><b>Niekompletne kroki:</b> ${skipped.map(s=>s.t+' ('+stepStatus(s.id,p).missing+' '+stepStatus(s.id,p).unit+')').join(', ')}</div>`:''}
   <div class="card"><h3>Wyniki negatywne (${f.length})</h3>${f.length?`<ul style="margin:0;padding-left:18px">${f.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>`:'<p class="small muted" style="margin:0">Brak wyników negatywnych.</p>'}</div>
   <div class="card"><label class="f"><span>Uwagi i wnioski</span><textarea id="uwagi" style="min-height:120px" oninput="setP('uwagi',this.value)">${esc(p.uwagi)}</textarea></label>
   <button class="btn sm" onclick="insertFindings()">Wstaw automatyczne uwagi</button>
   <button class="btn sm" onclick="insertStd()">Wstaw zalecenia standardowe</button></div>
   <div class="card"><h3>Orzeczenie</h3><p class="small muted" style="margin:0 0 8px">Sugestia na podstawie wyników: instalacja <b>${sugg}</b> do eksploatacji.</p>
   <div class="seg"><button class="${p.orzeczenie==='nadaje'?'on-tak':''}" onclick="setP('orzeczenie','nadaje');render()">Nadaje się</button><button class="${p.orzeczenie==='nie'?'on-nie':''}" onclick="setP('orzeczenie','nie');render()">Nie nadaje się</button></div>
   <label class="f" style="margin-top:12px"><span>Data następnego badania</span><input type="date" value="${esc(p.nastepne)}" onchange="setP('nastepne',this.value);setP('nastepneEdited',true)"></label></div>`;
}
function insertFindings(){ const p=P(); const f=collectFindings(p); p.uwagi=(p.uwagi?p.uwagi+'\n':'')+(f.length?f.map(x=>'– '+x).join('\n'):'Nie stwierdzono nieprawidłowości.'); save(); render(); }
function insertStd(){ const p=P(); p.uwagi=(p.uwagi?p.uwagi+'\n':'')+'Zaleca się testowanie wyłączników RCD co miesiąc przyciskiem TEST oraz wykonywanie pomiarów okresowych w terminie wskazanym w protokole.'; save(); render(); }

/* ---------------- krok: protokół ---------------- */
function vPdf(p){
  return `<h2>Protokół</h2><p class="lead">Podgląd dokumentu. PDF i Word mają ten sam układ.</p>
   <div class="noprint" style="margin-bottom:12px">
    <button class="btn pri block" style="margin-bottom:8px" onclick="exportPdf('share')">${ico('share')} Udostępnij PDF</button>
    <div class="btns"><button class="btn grow" onclick="exportPdf('download')">${ico('doc')} Pobierz PDF</button>
    <button class="btn grow" onclick="exportDocx()">${ico('doc')} Word (.docx)</button>
    <button class="btn grow" onclick="doPrint()">${ico('print')} Drukuj</button></div>
    <p class="small muted" style="margin:8px 0 0">„Udostępnij” otwiera menu telefonu (Gmail, WhatsApp, Dysk, Synology…) z gotowym plikiem PDF.</p></div>
   <div id="preview">${protocolHtml(p)}</div>`;
}
function busy(on,txt){ let el=document.getElementById('busy'); if(on){ if(!el){ el=document.createElement('div'); el.id='busy'; el.className='toast'; document.body.appendChild(el); } el.textContent=txt||'Przygotowuję plik…'; } else if(el) el.remove(); }
async function exportPdf(mode){
  const p=P(); busy(true,'Przygotowuję PDF…');
  try{ await saveNow(); const blob=await buildPdfBlob(p); busy(false); const name=protocolFileName(p,'pdf');
    if(mode==='download'){ downloadBlob(blob,name); toast('Zapisano '+name+' (folder Pobrane)'); }
    else { const r=await shareOrDownload(blob,name,'Protokół '+(p.nr||'')); if(r==='downloaded') toast('Udostępnianie niedostępne – zapisano plik w folderze Pobrane'); }
  }catch(e){ busy(false); toast('Błąd tworzenia PDF: '+(e&&e.message||e)); console.error(e); }
}
async function exportDocx(){
  const p=P(); busy(true,'Przygotowuję plik Word…');
  try{ await saveNow(); const blob=await buildDocxBlob(p); busy(false); const name=protocolFileName(p,'docx');
    const r=await shareOrDownload(blob,name,'Protokół '+(p.nr||'')); if(r==='downloaded') toast('Zapisano '+name+' (folder Pobrane)');
  }catch(e){ busy(false); toast('Błąd tworzenia pliku Word: '+(e&&e.message||e)); console.error(e); }
}
function doPrint(){ window.print(); }

/* ---------------- zdjęcia ---------------- */
// Zdjęcie: zwykłe pole pliku (bez atrybutu capture – podgląd na claude.ai blokuje bezpośredni dostęp do aparatu;
// Android i tak proponuje „Aparat” w oknie wyboru). Pole jest stale w dokumencie, bo część przeglądarek ignoruje kliknięcie w odłączony element.
function readPhoto(f,cb){
  if(!f) return; const img=new Image();
  img.onload=()=>{ const s=Math.min(1,1280/Math.max(img.width,img.height)); const c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(img.src); cb(c.toDataURL('image/jpeg',0.72)); };
  img.onerror=()=>toast('Nie udało się odczytać zdjęcia');
  img.src=URL.createObjectURL(f);
}
function pickPhoto(cb){
  let inp=document.getElementById('photo-input');
  if(!inp){ inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.id='photo-input'; inp.style.cssText='position:fixed;left:-1000px;top:0;opacity:0'; document.body.appendChild(inp); }
  inp.value=''; inp.onchange=()=>readPhoto(inp.files[0],cb);
  inp.click();
}
function storePhoto(data,opis){ const p=P(); const ph={id:uid(), data, opis:opis||''}; p.photos.push(ph); save(); return ph.id; }
function thumb(pid){ const ph=P().photos.find(x=>x.id===pid); return ph?`<img src="${ph.data}" alt="Zdjęcie ${photoNum(P(),pid)}">`:''; }
function photosHtml(ids,addFn){
  return `<div class="thumbs">${(ids||[]).map(pid=>thumb(pid)).join('')}</div>
  <button class="btn sm" style="margin-top:8px" onclick="${addFn}">${ico('cam')} Dodaj zdjęcie</button>`;
}
function addPhotoOb(id){ pickPhoto(d=>{ const o=obById(id); const opis=o.sym+' '+o.nazwa; o.photos=o.photos||[]; o.photos.push(storePhoto(d,opis)); save(); render(); }); }
function addPhotoOgl(k){ pickPhoto(d=>{ const p=P(); const it=OGLEDZINY.find(i=>i.k===k); const opis='Oględziny: '+it.q.replace(/\.$/,''); p.ogl[k]=p.ogl[k]||{}; (p.ogl[k].photos=p.ogl[k].photos||[]).push(storePhoto(d,opis)); save(); render(); }); }
function addPhotoGrz(id){ pickPhoto(d=>{ const o=obById(id); const opis=o.sym+' – tabliczka / ułożenie przewodu'; o.grz=o.grz||{}; (o.grz.photos=o.grz.photos||[]).push(storePhoto(d,opis)); save(); render(); }); }

/* ---------------- zdjęcie ekranu miernika ---------------- */
function ocrDialog(unit, apply){
  window.__ocrApply=apply;
  modal(`<h3>Zdjęcie ekranu miernika</h3>
   <p class="small muted" style="margin-top:0">Zrób zdjęcie wyświetlacza i przepisz wynik – zdjęcie pomaga odczytać wartość, nie jest zapisywane. Automatyczne rozpoznawanie dodam po testach na zdjęciach Twojego miernika.</p>
   <label class="btn pri block" style="margin-bottom:10px">${ico('cam')} Zrób / wybierz zdjęcie<input type="file" accept="image/*" style="display:none" onchange="ocrGot(this.files[0])"></label>
   <div id="ocr-img"></div>
   <label class="f"><span>Wartość [${unit}]</span><input id="ocrval" class="num" inputmode="decimal" placeholder="wpisz wynik"></label>
   <div class="btns"><button class="btn grow" onclick="closeModal()">Anuluj</button><button class="btn pri grow" onclick="const v=document.getElementById('ocrval').value; if(!v.trim()){toast('Brak wartości');return;} window.__ocrApply(v);closeModal()">Zatwierdź</button></div>`);
}
function ocrGot(f){
  readPhoto(f, d=>{
    const box=document.getElementById('ocr-img'); if(!box) return;
    box.innerHTML=`<img src="${d}" alt="Zdjęcie ekranu miernika" style="width:100%;max-height:260px;object-fit:contain;background:#000;border-radius:10px;margin-bottom:8px">`;
    const inp=document.getElementById('ocrval'); inp.focus();
  });
}
function ocr(id,path,unit){
  ocrDialog(unit, v=>{
    if(path==='izo'){ const o=obById(id); izoPairs(o).forEach(k=>{ o.izo=o.izo||{}; if(!filled(o.izo[k])) o.izo[k]=v; }); save(); render(); toast('Wpisano do pustych pól tego obwodu'); return; }
    setOb(id,path,v); render();
  });
}
function ocrRcd(id,k){ ocrDialog(k==='uc'?'V':(k==='ia'||k==='iab')?'mA':'ms', v=>{ setRcd(id,k,v); render(); }); }
function ocrUz(id){ ocrDialog('Ω', v=>{ setUz(id,'r',v); render(); }); }

/* ---------------- modal / toast ---------------- */
function modal(html){ document.getElementById('modal-root').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; }
function confirmBox(q,action){ modal(`<h3>${esc(q)}</h3><div class="btns" style="margin-top:12px"><button class="btn grow" onclick="closeModal()">Anuluj</button><button class="btn danger grow" onclick="closeModal();${action}">Usuń</button></div>`); }
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }
function toast(t){ const d=document.createElement('div'); d.className='toast'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }

(async()=>{ await loadState(); render(); })();
