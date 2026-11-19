'use strict';
// Toutes les sommes sont stockées en centimes pour éviter les erreurs d'arrondi.
const KEY = 'budgetcoloc-v3'; // Même clé : conserve les données de la version précédente.
const MEMBERS = ['Valérie', 'Amandine', 'Yassine', 'Maya', 'Jihad'];
const $ = id => document.getElementById(id);
const money = cents => (cents / 100).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});
const today = () => new Date().toLocaleDateString('fr-FR');
const fresh = () => ({charges:[], debts:[], operations:[]});
const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
function load(){try {const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.charges)&&Array.isArray(x.debts)&&Array.isArray(x.operations))return x;}catch(e){console.warn('Sauvegarde illisible',e);}return fresh();}
let data=load();
let selectedProfile=null;
const PROFILE_COLORS=['#ffb9c8','#c7b8ff','#a9e6df','#ffe2a7','#b9d7ff'];
const PROFILE_ICONS=['🌸','🎨','🚀','🌻','🎧'];
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
  renderProfiles(totals);
  $('summary').replaceChildren();for(const m of MEMBERS){const tr=el('tr');cell(tr,m);cell(tr,money(totals[m].owes));cell(tr,money(totals[m].receives));$('summary').append(tr);}
  $('debts').replaceChildren();for(const d of data.debts.slice().reverse()){const tr=el('tr');cell(tr,d.label);cell(tr,d.from);cell(tr,d.to);cell(tr,money(d.amount));const st=el('td');st.append(el('span',d.paid?'Remboursé':'À rembourser',`tag ${d.paid?'paid':''}`));tr.append(st);const action=el('td');if(!d.paid){const b=el('button','Marquer remboursé');b.addEventListener('click',()=>{if(confirm(`Confirmer le remboursement de ${money(d.amount)} par ${d.from} à ${d.to} ?`)){d.paid=true;operation('settlement',`${d.from} → ${d.to} (${d.label})`,d.amount);save();}});action.append(b);}else action.textContent='✓';tr.append(action);$('debts').append(tr);}
  if(!data.debts.length){const tr=el('tr');const td=el('td','Aucune dette enregistrée.');td.colSpan=6;tr.append(td);$('debts').append(tr);}
  $('history').replaceChildren();for(const op of data.operations.slice().reverse()){const symbol=op.kind==='deposit'?'↗':op.kind==='withdrawal'?'↘':'✓';$('history').append(el('div',`${symbol} ${op.date} — ${op.label} : ${money(op.amount)}`,'history-row'));}if(!data.operations.length)$('history').append(el('p','Aucune opération.','muted'));
}
function renderProfiles(totals){
  const root=$('profileCards');root.replaceChildren();
  MEMBERS.forEach((name,i)=>{
    const card=el('button',undefined,'profile-card'+(selectedProfile===name?' active':''));card.type='button';
    card.style.setProperty('--profile-color',PROFILE_COLORS[i]);
    const avatar=el('span',PROFILE_ICONS[i],'profile-avatar');avatar.setAttribute('aria-hidden','true');
    const title=el('strong',name);const sub=el('span',`À payer : ${money(totals[name].owes)}`,'profile-sub');
    card.append(avatar,title,sub,el('span','Voir ma fiche →','profile-cta'));
    card.addEventListener('click',()=>{selectedProfile=name;render();$('profileDetail').scrollIntoView({behavior:'smooth',block:'start'});});root.append(card);
  });
  const detail=$('profileDetail');detail.hidden=!selectedProfile;if(!selectedProfile)return;
  const name=selectedProfile, idx=MEMBERS.indexOf(name), t=totals[name];
  $('profileHeading').replaceChildren();const heading=el('div',undefined,'profile-heading');
  const avatar=el('span',PROFILE_ICONS[idx],'profile-avatar');avatar.style.background=PROFILE_COLORS[idx];
  const texts=el('div');texts.append(el('span','FICHE PERSONNELLE','eyebrow purple'),el('h2',name));heading.append(avatar,texts);$('profileHeading').append(heading);
  $('profileStats').replaceChildren();for(const [label,value] of [['À rembourser',t.owes],['À recevoir',t.receives],['Solde net',t.receives-t.owes]]){
    const box=el('div',undefined,'mini-stat');box.append(el('span',label),el('strong',money(value)));$('profileStats').append(box);
  }
  function listRows(target,rows,empty,formatter){const box=$(target);box.replaceChildren();if(!rows.length){box.append(el('p',empty,'empty-state'));return;}rows.forEach(row=>box.append(formatter(row)));}
  const debts=data.debts.filter(d=>!d.paid);
  listRows('profileOwes',debts.filter(d=>d.from===name),'🎉 Aucune dette en attente !',d=>profileRow(d.label,`À ${d.to}`,money(d.amount)));
  listRows('profileReceives',debts.filter(d=>d.to===name),'Rien à recevoir pour le moment.',d=>profileRow(d.label,`De ${d.from}`,money(d.amount)));
  listRows('profileCharges',data.charges.filter(c=>c.owner===name),'Aucune charge mensuelle sous ma responsabilité.',c=>{
    const period=new Date().toISOString().slice(0,7);
    const paid=data.operations.some(o=>o.kind==='withdrawal'&&o.chargeId===c.id&&o.period===period);
    return profileRow(c.name,`Responsable · le ${c.day} de chaque mois · ${paid?'Payée ce mois':'À payer ce mois'}`,money(c.amount));
  });
  listRows('profileSettlements',data.debts.filter(d=>d.paid&&(d.from===name||d.to===name)), 'Aucun remboursement validé.',d=>profileRow(d.label,`${d.from} → ${d.to} · remboursé`,money(d.amount)));
}
function profileRow(title,subtitle,amount){const row=el('div',undefined,'profile-row');const left=el('div');left.append(el('strong',title),el('small',subtitle));row.append(left,el('b',amount));return row;}
$('closeProfile').addEventListener('click',()=>{selectedProfile=null;render();$('profils').scrollIntoView({behavior:'smooth'});});
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
render();
