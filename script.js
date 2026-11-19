'use strict';
// Toutes les sommes sont stockées en centimes pour éviter les erreurs d'arrondi.
const KEY = 'budgetcoloc-v3';
const MEMBERS = ['Valérie', 'Amandine', 'Yassine', 'Maya', 'Jihad'];
const $ = id => document.getElementById(id);
const money = cents => (cents / 100).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});
const today = () => new Date().toLocaleDateString('fr-FR');
const fresh = () => ({charges:[], debts:[], operations:[]});
const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
function load(){try {const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.charges)&&Array.isArray(x.debts)&&Array.isArray(x.operations))return x;}catch(e){console.warn('Sauvegarde illisible',e);}return fresh();}
let data=load();
function save(){localStorage.setItem(KEY,JSON.stringify(data));render();}
function cents(value){const n=Number(value);if(!Number.isFinite(n)||n<=0||Math.round(n*100)<=0)throw Error('Montant invalide');return Math.round(n*100);}
function split(amount,participants){const base=Math.floor(amount/participants.length),rest=amount%participants.length;return participants.map((name,i)=>({name,amount:base+(i<rest?1:0)}));}
function addDebts(label,amount,payer,participants){for(const share of split(amount,participants)){if(share.name!==payer && share.amount>0)data.debts.push({id:uid(),label,from:share.name,to:payer,amount:share.amount,paid:false,date:today()});}}
function operation(kind,label,amount){data.operations.push({id:uid(),kind,label,amount,date:today()});}
function el(tag,content,className){const n=document.createElement(tag);if(content!==undefined)n.textContent=String(content);if(className)n.className=className;return n;}
function cell(row,text){row.append(el('td',text));}
function render(){
  const inTotal=data.operations.filter(x=>x.kind==='deposit').reduce((s,x)=>s+x.amount,0);
  const outTotal=data.operations.filter(x=>x.kind==='withdrawal').reduce((s,x)=>s+x.amount,0);
  $('balance').textContent=money(inTotal-outTotal);
  $('balance').style.color=inTotal-outTotal<0?'#b91c1c':'';
  $('totalDebt').textContent=money(data.debts.filter(x=>!x.paid).reduce((s,x)=>s+x.amount,0));
  $('chargeCount').textContent=data.charges.length;
  $('charges').replaceChildren();
  for(const c of data.charges){const box=el('div',undefined,'charge');box.append(el('strong',`${c.name} — ${money(c.amount)}`),el('div',`Responsable : ${c.owner} · Échéance : le ${c.day} du mois`,'muted'));
    const b=el('button','Verser et payer ce mois');b.type='button';b.addEventListener('click',()=>payCharge(c.id));box.append(b);$('charges').append(box);}
  if(!data.charges.length)$('charges').append(el('p','Aucune charge mensuelle.','muted'));
  const totals=Object.fromEntries(MEMBERS.map(n=>[n,{owes:0,receives:0}]));
  for(const d of data.debts.filter(x=>!x.paid)){totals[d.from].owes+=d.amount;totals[d.to].receives+=d.amount;}
  $('summary').replaceChildren();for(const m of MEMBERS){const tr=el('tr');cell(tr,m);cell(tr,money(totals[m].owes));cell(tr,money(totals[m].receives));$('summary').append(tr);}
  $('debts').replaceChildren();for(const d of data.debts.slice().reverse()){const tr=el('tr');cell(tr,d.label);cell(tr,d.from);cell(tr,d.to);cell(tr,money(d.amount));const st=el('td');st.append(el('span',d.paid?'Remboursé':'À rembourser',`tag ${d.paid?'paid':''}`));tr.append(st);const action=el('td');if(!d.paid){const b=el('button','Marquer remboursé');b.addEventListener('click',()=>{if(confirm(`Confirmer le remboursement de ${money(d.amount)} par ${d.from} à ${d.to} ?`)){d.paid=true;operation('settlement',`${d.from} → ${d.to} (${d.label})`,d.amount);save();}});action.append(b);}else action.textContent='✓';tr.append(action);$('debts').append(tr);}
  if(!data.debts.length){const tr=el('tr');const td=el('td','Aucune dette enregistrée.');td.colSpan=6;tr.append(td);$('debts').append(tr);}
  $('history').replaceChildren();for(const op of data.operations.slice().reverse()){const symbol=op.kind==='deposit'?'↗':op.kind==='withdrawal'?'↘':'✓';$('history').append(el('div',`${symbol} ${op.date} — ${op.label} : ${money(op.amount)}`,'history-row'));}if(!data.operations.length)$('history').append(el('p','Aucune opération.','muted'));
}
function payCharge(id){const c=data.charges.find(x=>x.id===id);if(!c)return;const period=new Date().toISOString().slice(0,7);if(data.operations.some(o=>o.chargeId===id&&o.period===period&&o.kind==='withdrawal')){alert('Cette charge a déjà été payée pour le mois en cours.');return;}
  if(!confirm(`${c.owner} avance ${money(c.amount)} sur le compte commun, puis la facture « ${c.name} » est prélevée. Confirmer ?`))return;
  const deposit={id:uid(),kind:'deposit',label:`Versement de ${c.owner} pour ${c.name}`,amount:c.amount,date:today(),chargeId:id,period};
  const withdrawal={id:uid(),kind:'withdrawal',label:`Prélèvement ${c.name}`,amount:c.amount,date:today(),chargeId:id,period};
  data.operations.push(deposit,withdrawal);addDebts(`${c.name} (${period})`,c.amount,c.owner,MEMBERS);save();
}
for(const id of ['chargeOwner','expensePayer']){for(const m of MEMBERS){const o=el('option',m);o.value=m;$(id).append(o);}}
for(const m of MEMBERS){const label=el('label');const checkbox=el('input');checkbox.type='checkbox';checkbox.value=m;checkbox.checked=true;checkbox.name='participant';label.append(checkbox,document.createTextNode(m));$('participants').append(label);}
$('chargeForm').addEventListener('submit',e=>{e.preventDefault();try{const name=$('chargeName').value.trim(),amount=cents($('chargeAmount').value),day=Number($('chargeDay').value);if(!name||!Number.isInteger(day)||day<1||day>28)throw Error('Informations invalides');data.charges.push({id:uid(),name,amount,owner:$('chargeOwner').value,day});save();e.target.reset();}catch(err){alert(err.message);}});
$('expenseForm').addEventListener('submit',e=>{e.preventDefault();try{const name=$('expenseName').value.trim(),amount=cents($('expenseAmount').value),payer=$('expensePayer').value,participants=[...document.querySelectorAll('input[name="participant"]:checked')].map(x=>x.value);if(!name||!participants.length)throw Error('Choisissez une description et au moins un participant.');if(!confirm(`Enregistrer ${money(amount)} payés par ${payer}, partagés entre ${participants.join(', ')} ?`))return;addDebts(name,amount,payer,participants);operation('personal',`${name} — payé par ${payer}`,amount);save();e.target.reset();}catch(err){alert(err.message);}});
$('reset').addEventListener('click',()=>{if(confirm('Effacer toutes les données de cette version ?')){data=fresh();save();}});
$('demo').addEventListener('click',()=>{if(!confirm('Remplacer les données actuelles par les exemples ?'))return;data=fresh();const id=uid(),period=new Date().toISOString().slice(0,7);data.charges.push({id,name:'Électricité',amount:10000,owner:'Valérie',day:5});data.operations.push({id:uid(),kind:'deposit',label:'Versement de Valérie pour Électricité',amount:10000,date:today(),chargeId:id,period},{id:uid(),kind:'withdrawal',label:'Prélèvement Électricité',amount:10000,date:today(),chargeId:id,period});addDebts(`Électricité (${period})`,10000,'Valérie',MEMBERS);addDebts('Courses',7500,'Maya',MEMBERS);operation('personal','Courses — payées par Maya',7500);save();});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='budgetcoloc-sauvegarde.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();
