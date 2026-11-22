'use strict';
// Toutes les sommes sont stockées en centimes pour éviter les erreurs d'arrondi.
const REAL_KEY = 'budgetcoloc-v3'; // Les données manuelles existantes sont préservées.
const DEMO_KEY = 'budgetcoloc-demo-v2';
const MODE_KEY = 'budgetcoloc-active-mode';
const ALLOCATION_MODE_KEY = 'budgetcoloc-allocation-mode'; // Mode de répartition commun aux deux pages.
let demoMode = localStorage.getItem(MODE_KEY) === 'demo';
const KEY = demoMode ? DEMO_KEY : REAL_KEY;
const DEFAULT_MEMBERS = ['Valérie', 'Amandine', 'Yasmine', 'Maya', 'Jihad'];
const $ = id => document.getElementById(id);
const money = cents => (cents / 100).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});
const today = () => new Date().toLocaleDateString('fr-FR');
const fresh = () => ({members:[...DEFAULT_MEMBERS],charges:[], debts:[], operations:[],budget:{incomes:{},rents:{},personalCosts:{},target:0,variable:0,mode:'equal',envelopes:{}}});
const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
function load(){try {const x=JSON.parse(localStorage.getItem(demoMode ? DEMO_KEY : REAL_KEY));if(x&&Array.isArray(x.charges)&&Array.isArray(x.debts)&&Array.isArray(x.operations))return x;}catch(e){console.warn('Sauvegarde illisible',e);}return fresh();}
let data=load();
// Migration non destructive des données sauvegardées : Yassine devient Yasmine.
function migrateNames(){
 const old='Yassine', now='Yasmine';
 if(!Array.isArray(data.members))data.members=[...DEFAULT_MEMBERS];
 data.members=data.members.map(m=>m===old?now:m);
 for(const c of data.charges)if(c.owner===old)c.owner=now;
 for(const d of data.debts){if(d.from===old)d.from=now;if(d.to===old)d.to=now;}
 for(const op of data.operations){if(op.payer===old)op.payer=now;if(op.from===old)op.from=now;if(op.to===old)op.to=now;if(op.label)op.label=op.label.replaceAll(old,now);}
 if(data.budget)for(const key of ['incomes','rents','personalCosts'])if(data.budget[key]&&Object.hasOwn(data.budget[key],old)){data.budget[key][now]=data.budget[key][old];delete data.budget[key][old];}
 // Les modifications sont enregistrées uniquement si une migration est nécessaire.
 if(JSON.stringify(data)!==JSON.stringify(load()))localStorage.setItem(demoMode?DEMO_KEY:REAL_KEY,JSON.stringify(data));
}
migrateNames();
const MEMBERS=data.members;
const CATS=[{id:"fixes",name:"🏠 Charges fixes",color:"#8556d8"},{id:"courses",name:"🛒 Courses",color:"#ee86b4"},{id:"loisirs",name:"🎮 Loisirs",color:"#4db9a9"},{id:"equipement",name:"🛋️ Équipement",color:"#f4b64f"},{id:"imprevus",name:"🧰 Imprévus",color:"#74a9e9"}];
function budgetData(){if(!data.budget)data.budget={incomes:{},target:0,variable:0,mode:'equal',envelopes:{}};if(!data.budget.rents)data.budget.rents={};if(!data.budget.personalCosts)data.budget.personalCosts={};return data.budget;}
const monthKey=()=>new Date().toLocaleDateString("sv-SE").slice(0,7);

let selectedProfile=null;
const PROFILE_COLORS=['#ffb9c8','#c7b8ff','#a9e6df','#ffe2a7','#b9d7ff'];
const PROFILE_ICONS=['🌸','🎨','🚀','🌻','🎧'];
function save(){localStorage.setItem(demoMode ? DEMO_KEY : REAL_KEY,JSON.stringify(data));render();}
function cents(value){const n=Number(value);if(!Number.isFinite(n)||n<=0||Math.round(n*100)<=0)throw Error('Montant invalide');return Math.round(n*100);}
function split(amount,participants){const base=Math.floor(amount/participants.length),rest=amount%participants.length;return participants.map((name,i)=>({name,amount:base+(i<rest?1:0)}));}
function addDebts(label,amount,payer,participants){for(const share of split(amount,participants)){if(share.name!==payer && share.amount>0)data.debts.push({id:uid(),label,from:share.name,to:payer,amount:share.amount,paid:false,date:today()});}}
function operation(kind,label,amount,details={}){data.operations.push({id:uid(),kind,label,amount,date:today(),...details});}
function el(tag,content,className){const n=document.createElement(tag);if(content!==undefined)n.textContent=String(content);if(className)n.className=className;return n;}
function cell(row,text){row.append(el('td',text));}

function refreshMemberSelectors(){
 for(const id of ['chargeOwner','expensePayer']){
  const select=$(id);if(!select)continue;const previous=select.value;select.replaceChildren();
  for(const m of MEMBERS){const o=el('option',m);o.value=m;select.append(o);}
  if(MEMBERS.includes(previous))select.value=previous;
 }
 const root=$('participants');if(root){root.replaceChildren();for(const m of MEMBERS){const label=el('label'),checkbox=el('input');checkbox.type='checkbox';checkbox.value=m;checkbox.checked=true;checkbox.name='participant';label.append(checkbox,document.createTextNode(m));root.append(label);}}
}
// Répartir à nouveau les dettes NON REMBOURSÉES des charges mensuelles
// de la période courante, uniquement en mode démonstration.
// Les dépenses ponctuelles et les remboursements validés restent inchangés.
function redistributeDemoCurrentCharges(){
 if(!demoMode)return;
 const period=monthKey();
 for(const charge of data.charges){
  const label=`${charge.name} (${period})`;
  const matching=data.debts.filter(d=>d.label===label);
  if(!matching.length || matching.some(d=>d.paid))continue;
  // Ne toucher qu'aux charges identifiées par une avance réelle en mode démo.
  const advanced=data.operations.some(o=>o.kind==='deposit'&&o.chargeId===charge.id&&o.period===period);
  if(!advanced)continue;
  data.debts=data.debts.filter(d=>d.label!==label);
  for(const share of split(charge.amount,MEMBERS)){
   if(share.name!==charge.owner&&share.amount>0){
    data.debts.push({id:uid(),label,from:share.name,to:charge.owner,
      amount:share.amount,paid:false,date:today(),chargeId:charge.id,period});
   }
  }
 }
}
function addMember(){
 const input=$('newMemberName');if(!input)return;
 const name=input.value.trim().replace(/\s+/g,' ');
 if(!name||name.length>40){alert('Saisissez un prénom de 1 à 40 caractères.');return;}
 if(MEMBERS.some(m=>m.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'))){alert('Ce prénom existe déjà.');return;}
 // Les dettes existantes ne sont jamais recalculées : le nouveau membre
 // participe uniquement aux nouvelles dépenses et aux échéances futures.
 // En mode démo, renseigner ses capacités pour qu'il participe aussitôt
 // aux contributions prévues (le mode démo utilise la répartition proportionnelle).
 let newBudget=null;
 if(demoMode){
  const fields=[['revenu mensuel',1000],['loyer individuel',350],['autres frais personnels',150]];
  const values=[];
  for(const [label,example] of fields){
   const answer=prompt(`Mode démonstration : ${label} de ${name} (en €)`,String(example));
   if(answer===null)return; // Annulation : ne pas créer de colocataire incomplet.
   const n=Number(answer.trim().replace(',','.'));
   if(!Number.isFinite(n)||n<0||n>1000000){alert(`Montant invalide pour « ${label} ». Ajout annulé.`);return;}
   values.push(Math.round(n*100));
  }
  newBudget=values;
 }
 MEMBERS.push(name);
 redistributeDemoCurrentCharges();
 if(newBudget){
  const b=budgetData();
  b.incomes[name]=newBudget[0];b.rents[name]=newBudget[1];b.personalCosts[name]=newBudget[2];
 }
 input.value='';refreshMemberSelectors();save();
 if(!demoMode)alert(`« ${name} » a été ajouté. Pour calculer sa contribution aux charges fixes, renseignez ses revenus et frais personnels dans « Budget & Prévisions ». Les dettes antérieures restent inchangées.`);
}
function removeMember(name){
 if(MEMBERS.length<=1){alert('Il faut conserver au moins un colocataire.');return;}
 if(data.charges.some(c=>c.owner===name)||data.debts.some(d=>d.from===name||d.to===name)||data.operations.some(o=>o.payer===name||o.from===name||o.to===name||o.label?.includes(name))){
  alert('Ce colocataire figure dans des charges, dettes ou opérations. Réglez ou archivez ces données avant de le supprimer pour conserver un historique cohérent.');return;
 }
 if(!confirm(`Supprimer ${name} de la colocation ?`))return;
 MEMBERS.splice(MEMBERS.indexOf(name),1);
 const b=budgetData();for(const k of ['incomes','rents','personalCosts'])delete b[k][name];
 if(selectedProfile===name)selectedProfile=null;
 refreshMemberSelectors();save();
}
function renderMemberManager(){
 const root=$('memberList');if(!root)return;root.replaceChildren();
 for(const name of MEMBERS){const row=el('div',undefined,'member-manager-row');row.append(el('strong',name));const btn=el('button','Supprimer','secondary');btn.type='button';btn.addEventListener('click',()=>removeMember(name));row.append(btn);root.append(row);}
 const title=$('membersTitle');if(title)title.textContent=`👋 Les colocataires (${MEMBERS.length})`;
}
// Disponible actuel = capacité mensuelle après loyer/frais personnels - avances réellement
// effectuées + remboursements déjà reçus - remboursements déjà versés.
// Projeté = disponible actuel - dettes ouvertes à payer + créances ouvertes à recevoir.
// Les provisions sur le compte commun sont des avances, non des prélèvements supplémentaires.
function memberBalances(name){
 const b=budgetData();const initial=(b.incomes[name]||0)-(b.rents[name]||0)-(b.personalCosts[name]||0);
 const period=monthKey();let paid=0,received=0;
 for(const op of data.operations){
  if((op.month||op.period||monthFromFrenchDate(op.date))!==period)continue;
  if(op.kind==='personal'){
   const payer=op.payer||MEMBERS.find(m=>op.label?.endsWith(`payé par ${m}`));
   if(payer===name)paid+=op.amount;
  }else if(op.kind==='deposit'){
   const payer=op.payer||data.charges.find(c=>c.id===op.chargeId)?.owner;
   if(payer===name)paid+=op.amount;
  }else if(op.kind==='settlement'){
   const from=op.from||op.label?.split(' → ')[0];
   const to=op.to||op.label?.split(' → ')[1]?.split(' (')[0];
   if(from===name)paid+=op.amount;
   if(to===name)received+=op.amount;
  }
 }
 const owes=data.debts.filter(d=>!d.paid&&d.from===name).reduce((a,d)=>a+d.amount,0);
 const receivable=data.debts.filter(d=>!d.paid&&d.to===name).reduce((a,d)=>a+d.amount,0);
 const current=initial-paid+received;
 return {initial,current,projected:current-owes+receivable,owes,receivable};
}
function monthFromFrenchDate(date){const m=String(date||'').match(/^\d{2}\/(\d{2})\/(\d{4})$/);return m?`${m[2]}-${m[1]}`:null;}
// Contribution nette : dépenses/avances + remboursements payés - remboursements reçus.
// Les remboursements transfèrent la contribution déjà effectuée sans modifier
// la contribution théorique calculée dans Budget & Prévisions.
function memberOutgoingThisMonth(name){
 const period=monthKey();let contributed=0;
 for(const op of data.operations){
  if((op.month||op.period||monthFromFrenchDate(op.date))!==period)continue;
  if(op.kind==='personal'&&(op.payer||MEMBERS.find(m=>op.label?.endsWith(`payé par ${m}`)))===name)contributed+=op.amount;
  if(op.kind==='deposit'&&(op.payer||data.charges.find(c=>c.id===op.chargeId)?.owner)===name)contributed+=op.amount;
  if(op.kind==='settlement'){
   const from=op.from||op.label?.split(' → ')[0];
   const to=op.to||op.label?.split(' → ')[1]?.split(' (')[0];
   if(from===name)contributed+=op.amount;
   if(to===name)contributed-=op.amount;
  }
 }
 return contributed;
}
function renderMemberBalances(allocation){
 const root=$('memberBudgetBalances');if(!root)return;root.replaceChildren();
 const statuses=plannedContributionStatus();
 const table=el('table');table.className='budget-overview-table';const head=el('thead'),tr=el('tr');
 for(const h of ['Colocataire','Budget après frais perso.','Contribution prévue','Contribution nette effectuée','Reste à contribuer','Disponible actuel','Après remboursements']){tr.append(el('th',h));}
 head.append(tr);table.append(head);const body=el('tbody');
 MEMBERS.forEach((name,i)=>{
  const balance=statuses[i],paid=balance.advanced,expected=balance.planned,remaining=balance.remaining;
  const row=el('tr');for(const v of [name,money(balance.initial),money(expected),money(paid),money(remaining),money(balance.current),money(balance.projected)])cell(row,v);
  if(balance.current<0)row.className='balance-negative';body.append(row);
 });
 table.append(body);const scroller=el('div',undefined,'scroll');scroller.append(table);root.append(scroller);
 root.append(el('p','« Reste à contribuer » = contribution prévue − contribution nette (avances et dépenses + remboursements payés − remboursements reçus), minimum 0 €. La contribution nette peut dépasser la prévision ou devenir négative ; ce calcul ne mesure pas un solde bancaire. « Après remboursements » tient compte des dettes et créances ouvertes.','muted'));
}

function currentContributionAllocation(){
 const b=budgetData();
 const target=fixedBudgetTotal()+Object.values(b.envelopes||{}).reduce((a,v)=>a+v,0);
 const capacities=MEMBERS.map(m=>Math.max(0,(b.incomes[m]||0)-(b.rents[m]||0)-(b.personalCosts[m]||0)));
 return {target,capacities,allocation:allocateWithinCapacities(target,capacities,b.mode||'equal')};
}
function plannedContributionStatus(){
 const {allocation}=currentContributionAllocation();
 return MEMBERS.map((name,i)=>{
  const balance=memberBalances(name),planned=allocation[i],advanced=memberOutgoingThisMonth(name);
  return {name,...balance,planned,advanced,remaining:Math.max(0,planned-advanced)};
 });
}
function renderShoppingRecommendation(){
 const root=$('shoppingRecommendation'),input=$('nextShoppingAmount');
 if(!root||!input)return;
 root.replaceChildren();
 const value=Number(input.value);
 if(!Number.isFinite(value)||value<=0||value>1000000){root.append(el('p','Saisissez un montant strictement positif et réaliste.','muted'));return;}
 const amount=Math.round(value*100);
 const status=plannedContributionStatus();
 // La personne recommandée doit pouvoir payer ET avoir encore une contribution prévue à couvrir.
 // On privilégie le reste à contribuer, puis la disponibilité immédiate en cas d'égalité.
 const ranked=[...status].sort((a,b)=>b.remaining-a.remaining||b.current-a.current);
 if(!ranked.length){root.append(el('p','Ajoutez au moins un colocataire.','muted'));return;}
 const eligible=ranked.filter(x=>x.remaining>0&&x.current>=amount);
 if(!eligible.length){
  root.append(el('p',`⚠️ Aucun colocataire ayant encore une contribution prévue à couvrir ne peut avancer ${money(amount)} avec sa disponibilité actuelle. Il vaut mieux répartir l'achat, réduire son montant ou attendre un remboursement.`,'budget-alert'));
 }else{
  const best=eligible[0];
  root.append(el('p',`💜 ${best.name} est recommandé(e) pour avancer ${money(amount)} : ${money(best.remaining)} restent à contribuer sur ${money(best.planned)} prévus, et ${money(best.current)} sont actuellement disponibles.`));
  if(amount>best.remaining)root.append(el('p',`Cet achat dépasserait sa contribution encore prévue de ${money(amount-best.remaining)}. Le surplus serait une avance supplémentaire.`, 'muted'));
 }
 const table=el('table'),head=el('thead'),tr=el('tr');
 for(const title of ['Colocataire','Contribution prévue','Déjà avancé / versé','Reste à contribuer','Disponible actuel','Après cet achat'])tr.append(el('th',title));
 head.append(tr);table.append(head);const body=el('tbody');
 for(const x of ranked){const row=el('tr');for(const v of [x.name,money(x.planned),money(x.advanced),money(x.remaining),money(x.current),money(x.current-amount)])cell(row,v);if(x.current<amount)row.className='balance-negative';body.append(row);}
 table.append(body);const wrap=el('div',undefined,'scroll');wrap.append(table);root.append(wrap);
 root.append(el('p','La recommandation suit la répartition égalitaire ou proportionnelle sélectionnée dans Budget & Prévisions. Les remboursements futurs ne sont pas considérés comme de l’argent déjà disponible. Aucun paiement n’est créé automatiquement.','muted'));
}

function render(){
  if(!$('balance')){renderBudget();return;}
  const inTotal=data.operations.filter(x=>x.kind==='deposit').reduce((s,x)=>s+x.amount,0);
  const outTotal=data.operations.filter(x=>x.kind==='withdrawal').reduce((s,x)=>s+x.amount,0);
  $('balance').textContent=money(inTotal-outTotal);
  $('balance').style.color=inTotal-outTotal<0?'#b91c1c':'';
  $('totalDebt').textContent=money(data.debts.filter(x=>!x.paid).reduce((s,x)=>s+x.amount,0));
  $('chargeCount').textContent=data.charges.length;
  $('charges').replaceChildren();
  for(const c of data.charges){const box=el('div',undefined,'charge');box.append(el('strong',`${c.name} — ${money(c.amount)}`),el('div',`Responsable : ${c.owner} · Échéance : le ${c.day} du mois`,'muted'));
    const hasDeposit=data.operations.some(o=>o.kind==='deposit'&&o.chargeId===c.id&&o.period===monthKey());const isPaid=data.operations.some(o=>o.kind==='withdrawal'&&o.chargeId===c.id&&o.period===monthKey());box.append(el('small',isPaid?'✅ Prélevée':hasDeposit?'🕒 Provision déjà versée · prélèvement en attente':'⏳ Versement et prélèvement à effectuer','muted'));const b=el('button',isPaid?'Déjà prélevée':hasDeposit?'Enregistrer le prélèvement':'Verser et payer ce mois');b.disabled=isPaid;b.type='button';b.addEventListener('click',()=>payCharge(c.id));box.append(b);$('charges').append(box);}
  if(!data.charges.length)$('charges').append(el('p','Aucune charge mensuelle.','muted'));
  const totals=Object.fromEntries(MEMBERS.map(n=>[n,{owes:0,receives:0}]));
  for(const d of data.debts.filter(x=>!x.paid)){if(totals[d.from])totals[d.from].owes+=d.amount;if(totals[d.to])totals[d.to].receives+=d.amount;}
  renderProfiles(totals);renderMemberManager();
  // La synthèse budgétaire et la recommandation restent sur la page Budget.
  // Les cartes ci-dessus montrent seulement la progression des contributions.
  $('summary').replaceChildren();for(const m of MEMBERS){const tr=el('tr');cell(tr,m);cell(tr,money(totals[m].owes));cell(tr,money(totals[m].receives));$('summary').append(tr);}
  $('debts').replaceChildren();for(const d of data.debts.slice().reverse()){const tr=el('tr');cell(tr,d.label);cell(tr,d.from);cell(tr,d.to);cell(tr,money(d.amount));const st=el('td');st.append(el('span',d.paid?'Remboursé':'À rembourser',`tag ${d.paid?'paid':''}`));tr.append(st);const action=el('td');if(!d.paid){const b=el('button','Marquer remboursé');b.addEventListener('click',()=>{if(confirm(`Confirmer le remboursement de ${money(d.amount)} par ${d.from} à ${d.to} ?`)){d.paid=true;operation('settlement',`${d.from} → ${d.to} (${d.label})`,d.amount,{from:d.from,to:d.to,month:monthKey()});save();}});action.append(b);}else action.textContent='✓';tr.append(action);$('debts').append(tr);}
  if(!data.debts.length){const tr=el('tr');const td=el('td','Aucune dette enregistrée.');td.colSpan=6;tr.append(td);$('debts').append(tr);}
  $('history').replaceChildren();for(const op of data.operations.slice().reverse()){const symbol=op.kind==='deposit'?'↗':op.kind==='withdrawal'?'↘':'✓';$('history').append(el('div',`${symbol} ${op.date} — ${op.label} : ${money(op.amount)}`,'history-row'));}if(!data.operations.length)$('history').append(el('p','Aucune opération.','muted'));
}
function renderProfiles(totals){
  const root=$('profileCards');root.replaceChildren();
  const contributionStatuses=plannedContributionStatus();
  MEMBERS.forEach((name,i)=>{
    const card=el('button',undefined,'profile-card'+(selectedProfile===name?' active':''));card.type='button';
    card.style.setProperty('--profile-color',PROFILE_COLORS[i%PROFILE_COLORS.length]);
    const avatar=el('span',PROFILE_ICONS[i%PROFILE_ICONS.length],'profile-avatar');avatar.setAttribute('aria-hidden','true');
    const title=el('strong',name);const sub=el('span',`À payer : ${money(totals[name].owes)}`,'profile-sub');
    const status=contributionStatuses[i];
    const planned=status.planned, advanced=status.advanced;
    const ratio=planned>0?Math.max(0,Math.min(100,Math.round(advanced/planned*100))):0;
    const contribution=el('div',undefined,'profile-contribution');
    contribution.append(el('span','Contribution du mois','profile-contribution-label'));
    const track=el('div',undefined,'profile-contribution-track');
    track.setAttribute('role','progressbar');track.setAttribute('aria-label',`Contribution de ${name}`);
    track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(ratio));
    const fill=el('div',undefined,'profile-contribution-fill');fill.style.width=ratio+'%';track.append(fill);
    contribution.append(track);
    const caption=planned>0
      ?`${money(advanced)} nets / ${money(planned)} · ${ratio} %`
      :`Aucune contribution prévue · ${money(advanced)} nets`;
    contribution.append(el('span',caption,'profile-contribution-caption'));
    if(planned>0&&advanced>planned)contribution.append(el('span',`Avance supplémentaire : ${money(advanced-planned)}`,'profile-contribution-extra'));
    card.append(avatar,title,sub,contribution,el('span','Voir ma fiche →','profile-cta'));
    card.addEventListener('click',()=>{selectedProfile=name;render();$('profileDetail').scrollIntoView({behavior:'smooth',block:'start'});});root.append(card);
  });
  const detail=$('profileDetail');detail.hidden=!selectedProfile;if(!selectedProfile)return;
  const name=selectedProfile, idx=MEMBERS.indexOf(name), t=totals[name];
  $('profileHeading').replaceChildren();const heading=el('div',undefined,'profile-heading');
  const avatar=el('span',PROFILE_ICONS[idx%PROFILE_ICONS.length],'profile-avatar');avatar.style.background=PROFILE_COLORS[idx%PROFILE_COLORS.length];
  const texts=el('div');texts.append(el('span','FICHE PERSONNELLE','eyebrow purple'),el('h2',name));heading.append(avatar,texts);$('profileHeading').append(heading);
  $('profileStats').replaceChildren();const balances=memberBalances(name);for(const [label,value] of [['À rembourser',t.owes],['À recevoir',t.receives],['Disponible actuel',balances.current],['Après remboursements',balances.projected]]){
    const box=el('div',undefined,'mini-stat');box.append(el('span',label),el('strong',money(value)));$('profileStats').append(box);
  }
  function listRows(target,rows,empty,formatter){const box=$(target);box.replaceChildren();if(!rows.length){box.append(el('p',empty,'empty-state'));return;}rows.forEach(row=>box.append(formatter(row)));}
  const debts=data.debts.filter(d=>!d.paid);
  listRows('profileOwes',debts.filter(d=>d.from===name),'🎉 Aucune dette en attente !',d=>profileRow(d.label,`À ${d.to}`,money(d.amount)));
  listRows('profileReceives',debts.filter(d=>d.to===name),'Rien à recevoir pour le moment.',d=>profileRow(d.label,`De ${d.from}`,money(d.amount)));
  listRows('profileCharges',data.charges.filter(c=>c.owner===name),'Aucune charge mensuelle sous ma responsabilité.',c=>{
    const period=monthKey();
    const paid=data.operations.some(o=>o.kind==='withdrawal'&&o.chargeId===c.id&&o.period===period);
    return profileRow(c.name,`Responsable · le ${c.day} de chaque mois · ${paid?'Payée ce mois':'À payer ce mois'}`,money(c.amount));
  });
  listRows('profileSettlements',data.debts.filter(d=>d.paid&&(d.from===name||d.to===name)), 'Aucun remboursement validé.',d=>profileRow(d.label,`${d.from} → ${d.to} · remboursé`,money(d.amount)));
}
function profileRow(title,subtitle,amount){const row=el('div',undefined,'profile-row');const left=el('div');left.append(el('strong',title),el('small',subtitle));row.append(left,el('b',amount));return row;}
if($('closeProfile')) $('closeProfile').addEventListener('click',()=>{selectedProfile=null;render();$('profils').scrollIntoView({behavior:'smooth'});});
function payCharge(id){
 const c=data.charges.find(x=>x.id===id);if(!c)return;
 const period=monthKey();
 const hasWithdrawal=data.operations.some(o=>o.chargeId===id&&o.period===period&&o.kind==='withdrawal');
 if(hasWithdrawal){alert('Cette charge a déjà été payée pour le mois en cours.');return;}
 const hasDeposit=data.operations.some(o=>o.chargeId===id&&o.period===period&&o.kind==='deposit');
 const message=hasDeposit
  ? `Le versement de ${c.owner} pour ${c.name} est déjà sur le compte commun. Confirmer uniquement le prélèvement de ${money(c.amount)} ?`
  : `${c.owner} verse ${money(c.amount)} sur le compte commun, puis la facture « ${c.name} » est prélevée. Confirmer ?`;
 if(!confirm(message))return;
 if(!hasDeposit)data.operations.push({id:uid(),kind:'deposit',label:`Versement de ${c.owner} pour ${c.name}`,amount:c.amount,date:today(),chargeId:id,period,payer:c.owner,month:period});
 data.operations.push({id:uid(),kind:'withdrawal',label:`Prélèvement ${c.name}`,amount:c.amount,date:today(),chargeId:id,period,category:c.category||'fixes',month:period});
 // Les dettes naissent au versement de l'avance, pas au prélèvement.
 // Une démo déjà provisionnée possède donc ses dettes : ne pas les recréer.
 if(!hasDeposit && !data.debts.some(d=>d.chargeId===id&&d.period===period)){
  addDebts(`${c.name} (${period})`,c.amount,c.owner,MEMBERS);
 }
 save();
}
if($('chargeOwner')) {
refreshMemberSelectors();
$('chargeForm').addEventListener('submit',e=>{e.preventDefault();try{const name=$('chargeName').value.trim(),amount=cents($('chargeAmount').value),day=Number($('chargeDay').value);if(!name||!Number.isInteger(day)||day<1||day>28)throw Error('Informations invalides');data.charges.push({id:uid(),name,amount,owner:$('chargeOwner').value,category:$('chargeCategory').value,day});save();e.target.reset();}catch(err){alert(err.message);}});
$('expenseForm').addEventListener('submit',e=>{e.preventDefault();try{const name=$('expenseName').value.trim(),amount=cents($('expenseAmount').value),payer=$('expensePayer').value,participants=[...document.querySelectorAll('input[name="participant"]:checked')].map(x=>x.value);if(!name||!participants.length)throw Error('Choisissez une description et au moins un participant.');if(!confirm(`Enregistrer ${money(amount)} payés par ${payer}, partagés entre ${participants.join(', ')} ?`))return;addDebts(name,amount,payer,participants);operation('personal',`${name} — payé par ${payer}`,amount);const op=data.operations[data.operations.length-1];op.category=$('expenseCategory').value;op.month=monthKey();op.payer=payer;save();e.target.reset();}catch(err){alert(err.message);}});

}
// Budget : prévisions séparées des dettes. Les opérations réelles alimentent les graphiques.
function euroInput(id,value){const input=$(id);if(document.activeElement!==input)input.value=(value/100).toFixed(2);}
function fixedBudgetTotal(){return data.charges.filter(c=>(c.category||'fixes')==='fixes').reduce((sum,c)=>sum+c.amount,0);}
function computedBudget(){const b=budgetData();const income=MEMBERS.reduce((sum,m)=>sum+(b.incomes[m]||0),0);const fixed=fixedBudgetTotal();const personal=MEMBERS.reduce((sum,m)=>sum+(b.rents[m]||0)+(b.personalCosts[m]||0),0);return {income,fixed,personal,variable:Math.max(0,income-fixed-personal)};}
function initBudget(){
 const root=$('incomeInputs');MEMBERS.forEach((name,i)=>{const label=el('label',name);const input=el('input');input.id='income'+i;input.type='number';input.min='0';input.step='0.01';input.placeholder='0';label.append(input);root.append(label);});
 const personalRoot=$('personalChargeInputs');MEMBERS.forEach((name,i)=>{const row=el('div',undefined,'personal-budget-row');row.append(el('strong',name));for(const [prefix,title] of [['rent','🏠 Loyer individuel (€)'],['cost','Autres charges personnelles (€)']]){const label=el('label',title),input=el('input');input.id=prefix+i;input.type='number';input.min='0';input.step='0.01';input.placeholder='0';label.append(input);row.append(label);}personalRoot.append(row);});
 const env=$('envelopeInputs');CATS.filter(c=>c.id!=='fixes').forEach(c=>{const label=el('label',c.name);const input=el('input');input.id='env_'+c.id;input.type='number';input.min='0';input.step='0.01';input.value='0';label.append(input);env.append(label);});
 // Toute modification des revenus ou frais personnels est enregistrée automatiquement.
 // La page Gestion relit ces valeurs lorsqu'elle reprend le focus.
 let budgetSaveTimer;
 function persistVisibleBudgetInputs(){
  try{
   const b=budgetData();
   b.incomes=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('income'+i).value)]));
   b.rents=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('rent'+i).value)]));
   b.personalCosts=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('cost'+i).value)]));
   b.mode=$('budgetMode').value;
   save();
   $('envelopeNotice').textContent='Revenus et charges personnelles enregistrés automatiquement.';
  }catch(e){$('envelopeNotice').textContent=e.message;}
 }
 for(const prefix of ['income','rent','cost']){
  MEMBERS.forEach((m,i)=>{
   const input=$(prefix+i);
   input.addEventListener('input',()=>{
    clearTimeout(budgetSaveTimer);
    budgetSaveTimer=setTimeout(persistVisibleBudgetInputs,350);
   });
   input.addEventListener('change',()=>{
    clearTimeout(budgetSaveTimer);
    persistVisibleBudgetInputs();
   });
  });
 }
 // Ne pas sauvegarder à la fermeture : une page ancienne pourrait écraser les données récentes.

 $('budgetMode').addEventListener('change',()=>{
  const selected=$('budgetMode').value;
  // Enregistrer les valeurs visibles AVANT le recalcul pour ne pas utiliser d'anciennes données.
  const b=budgetData();
  b.incomes=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('income'+i).value)]));
  b.rents=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('rent'+i).value)]));
  b.personalCosts=Object.fromEntries(MEMBERS.map((m,i)=>[m,nonnegative($('cost'+i).value)]));
  b.envelopes=Object.fromEntries(CATS.filter(c=>c.id!=='fixes').map(c=>[c.id,nonnegative($('env_'+c.id).value)]));
  b.mode=selected;save();
  $('envelopeNotice').textContent='Mode '+(selected==='income'?'proportionnel':'égalitaire')+' enregistré : contributions recalculées sur les deux pages.';
 });
 $('saveBudget').addEventListener('click',()=>{clearTimeout(budgetSaveTimer);persistVisibleBudgetInputs();$('envelopeNotice').textContent='Paramètres enregistrés. Les contributions sont recalculées sur les deux pages.';});
 $('suggestBudget').addEventListener('click',()=>{const total=computedBudget().variable,weights={courses:50,loisirs:20,equipement:20,imprevus:10};let allocated=0;for(const c of CATS){if(c.id==='fixes')continue;const value=c.id==='imprevus'?total-allocated:Math.round(total*weights[c.id]/100);allocated+=value;$('env_'+c.id).value=(value/100).toFixed(2);} $('envelopeNotice').textContent='Proposition calculée après loyers, frais personnels et charges communes. Ajustez les montants, puis enregistrez.';});
 $('saveEnvelopes').addEventListener('click',()=>{try{const b=budgetData(),envelopes=Object.fromEntries(CATS.filter(c=>c.id!=='fixes').map(c=>[c.id,nonnegative($('env_'+c.id).value)]));const sum=Object.values(envelopes).reduce((a,v)=>a+v,0);if(sum>computedBudget().variable)throw Error('Les enveloppes dépassent le budget disponible après toutes les charges. Réduisez les montants.');b.envelopes=envelopes;save();$('envelopeNotice').textContent='Enveloppes enregistrées. Les dépenses réelles apparaissent ci-dessous.';}catch(e){alert(e.message);}});
}
function nonnegative(value){const n=Number(value);if(!Number.isFinite(n)||n<0||Math.round(n*100)<0)throw Error('Saisissez un montant positif ou nul.');return Math.round(n*100);}
function monthlySpend(){const totals=Object.fromEntries(CATS.map(c=>[c.id,0]));const period=monthKey();for(const op of data.operations){if(!['personal','withdrawal'].includes(op.kind))continue;const m=op.month||(op.date&&op.date.split('/').reverse().join('-').slice(0,7));if(m!==period)continue;totals[CATS.some(c=>c.id===op.category)?op.category:(op.kind==='withdrawal'?'fixes':'courses')]+=op.amount;}return totals;}
// Répartit sans jamais demander à une personne plus que sa capacité réelle.
// Les centimes restants sont redistribués aux personnes encore capables de contribuer.
function allocateWithinCapacities(target, capacities, mode){
 const paid=capacities.map(()=>0);let remaining=Math.min(Math.max(0,target),capacities.reduce((a,v)=>a+v,0));
 while(remaining>0){
  const eligible=capacities.map((cap,i)=>({i,room:cap-paid[i]})).filter(x=>x.room>0);
  if(!eligible.length)break;
  const weights=eligible.map(x=>mode==='income'?x.room:1);
  const weightTotal=weights.reduce((a,v)=>a+v,0);
  const planned=eligible.map((x,j)=>({i:x.i,amount:Math.min(x.room,Math.floor(remaining*weights[j]/weightTotal))}));
  let used=0;for(const x of planned){paid[x.i]+=x.amount;used+=x.amount;}
  remaining-=used;
  if(remaining===0)break;
  // Distribue les centimes restants ou redistribue après plafonnement.
  let moved=0;for(const x of eligible){if(remaining===0)break;if(paid[x.i]<capacities[x.i]){paid[x.i]++;remaining--;moved++;}}
  if(!used&&!moved)break;
 }
 return paid;
}
function renderBudget(){
 const b=budgetData();MEMBERS.forEach((m,i)=>{euroInput('income'+i,b.incomes[m]||0);euroInput('rent'+i,b.rents[m]||0);euroInput('cost'+i,b.personalCosts[m]||0);});if(document.activeElement!==$('budgetMode'))$('budgetMode').value=b.mode||'equal';CATS.filter(c=>c.id!=='fixes').forEach(c=>euroInput('env_'+c.id,b.envelopes[c.id]||0));
 const {income,fixed,personal,variable}=computedBudget();$('personalTotal').textContent=money(personal);$('fixedTotal').textContent=money(fixed);$('incomeTotal').textContent=money(income);$('availableBudget').textContent=money(income-fixed-personal);$('variableBudgetDisplay').textContent=money(variable);
 $('budgetWarning').textContent=income===0?'Renseignez les revenus disponibles puis enregistrez-les.':income<fixed+personal?'⚠️ Les charges dépassent les revenus disponibles : aucun budget variable ne peut être proposé.':'Le budget variable tient compte des loyers personnels, des autres frais individuels et des charges communes. Ce n’est pas une obligation de tout dépenser.';
 const breakdown=$('fixedBreakdown');breakdown.replaceChildren();for(const c of data.charges.filter(c=>(c.category||'fixes')==='fixes'))breakdown.append(profileRow(c.name,`Responsable : ${c.owner}`,money(c.amount)));if(!breakdown.children.length)breakdown.append(el('p','Aucune charge mensuelle enregistrée.','muted'));
 const {target,capacities,allocation}=currentContributionAllocation();
 const result=$('contributionResult');result.replaceChildren();
 const capacityTotal=capacities.reduce((a,v)=>a+v,0);
 result.append(el('p',`Montant prévu pour les charges communes et les enveloppes : ${money(target)}. Capacité totale après loyers et frais personnels : ${money(capacityTotal)}.`, 'muted'));
 if(target>capacityTotal)result.append(el('p',`⚠️ Budget irréalisable : il manque ${money(target-capacityTotal)}. Réduisez les enveloppes ou revoyez les charges. Aucun colocataire ne doit dépasser sa capacité.`, 'budget-alert'));
 if(target>0&&capacityTotal===0)result.append(el('p','Renseignez les revenus et charges personnelles pour calculer une répartition réaliste.','muted'));
 MEMBERS.forEach((m,i)=>{const cap=capacities[i],share=allocation[i];const row=profileRow(m,`Disponible après loyer et frais personnels : ${money(cap)} · Contribution ${b.mode==='income'?'proportionnelle aux capacités':'égalitaire ajustée aux capacités'}`,money(share));result.append(row);});
 if(target>capacityTotal)result.append(el('p',`Montant non financé : ${money(target-capacityTotal)}.`, 'budget-alert'));
 renderMemberBalances(allocation);renderShoppingRecommendation();
 const spent=monthlySpend(),total=Object.values(spent).reduce((a,v)=>a+v,0);const pie=$('expensePie');if(total===0){pie.style.background='#f0e9f8';pie.textContent='Aucune dépense ce mois';}else{let cursor=0;const parts=[];for(const c of CATS){const share=spent[c.id]/total*100;if(share>0){parts.push(`${c.color} ${cursor}% ${cursor+share}%`);cursor+=share;}}pie.style.background=`conic-gradient(${parts.join(',')})`;pie.textContent='';}const legend=$('pieLegend'),progress=$('envelopeProgress');legend.replaceChildren();progress.replaceChildren();for(const c of CATS){const line=el('div',undefined,'legend-row');const dot=el('span','', 'legend-dot');dot.style.background=c.color;line.append(dot,el('span',c.name),el('strong',money(spent[c.id])));legend.append(line);const cap=c.id==='fixes'?fixed:(b.envelopes[c.id]||0),used=spent[c.id],pct=cap>0?used/cap*100:0;const box=el('div',undefined,'budget-progress');box.append(el('strong',`${c.name} — ${money(used)} / ${cap?money(cap):'non défini'}`));const track=el('div',undefined,'progress-track'),fill=el('div',undefined,'progress-fill');fill.style.width=Math.min(100,pct)+'%';fill.style.background=pct>100?'#dc4e78':pct>=70?'#f0aa4d':'#55b8a6';track.append(fill);box.append(track);if(cap>0)box.append(el('small',`${Math.round(pct)} % utilisé · ${money(cap-used)} restant`));progress.append(box);}}

// Mode démonstration : jeu de données entièrement fictif, isolé des saisies manuelles.
function demoDataset(){
 const incomes=[920,1050,870,1120,980], rents=[330,370,310,390,350], costs=[155,175,140,190,160];
 const b={incomes:{},rents:{},personalCosts:{},mode:'income',envelopes:{courses:42000,loisirs:12000,equipement:9000,imprevus:9000}};
 DEFAULT_MEMBERS.forEach((m,i)=>{b.incomes[m]=incomes[i]*100;b.rents[m]=rents[i]*100;b.personalCosts[m]=costs[i]*100;});
 const charges=[['Électricité',95,'Valérie',10],['Internet fibre',32,'Yasmine',8],['Assurance habitation',24,'Amandine',5],['Eau',48,'Maya',12]].map(([name,amount,owner,day])=>({id:uid(),name,amount:amount*100,owner,day,category:'fixes'}));
 const example={members:[...DEFAULT_MEMBERS],charges,debts:[],operations:[],budget:b};
 const period=monthKey();
 // Les factures dont l'échéance est passée sont réglées dans la démonstration.
 // Les dettes sont dues dès l'avance, même avant le prélèvement de la facture.
 function debtsFor(label,amount,payer,participants){for(const share of split(amount,participants)){if(share.name!==payer)example.debts.push({id:uid(),label,from:share.name,to:payer,amount:share.amount,paid:false,date:today()});}}
 // Démonstration figée au 8 du mois : chaque responsable a viré sa provision le 5.
 // Le compte garde l'argent des factures prévues après le 8 (électricité le 10, eau le 12).
 const now=new Date();
 const demoDay=8;
 const demoDate=day=>`${String(day).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
 for(const charge of charges){
   example.operations.push({id:uid(),kind:'deposit',label:`Virement automatique de ${charge.owner} pour ${charge.name}`,amount:charge.amount,date:demoDate(5),chargeId:charge.id,period,payer:charge.owner,month:period});
   debtsFor(`${charge.name} (${period})`,charge.amount,charge.owner,MEMBERS);
   if(charge.day>demoDay)continue;
   example.operations.push({id:uid(),kind:'withdrawal',label:`Prélèvement ${charge.name}`,amount:charge.amount,date:demoDate(charge.day),chargeId:charge.id,period,category:'fixes',month:period});
 }
 for(const [label,amount,payer,category,participants] of [
  ['Courses de la semaine',8350,'Maya','courses',DEFAULT_MEMBERS],
  ['Soirée cinéma',4800,'Jihad','loisirs',DEFAULT_MEMBERS],
  ['Produits ménagers',2670,'Amandine','equipement',DEFAULT_MEMBERS],
  ['Courses complémentaires',3920,'Yasmine','courses',DEFAULT_MEMBERS]
 ]){debtsFor(label,amount,payer,participants);example.operations.push({id:uid(),kind:'personal',label:`${label} — payé par ${payer}`,amount,date:today(),category,month:period,payer});}
 return example;
}
function setDemoMode(enabled){
 if(enabled===demoMode)return;
 if(enabled&&!localStorage.getItem(DEMO_KEY))localStorage.setItem(DEMO_KEY,JSON.stringify(demoDataset()));
 if(!enabled){
  // Returning from demo must not silently restore old manual budget values.
  // Ask before deleting user-entered manual data; Cancel keeps it intact.
  const resetManual=confirm('Revenir en mode manuel avec un budget vide ?\n\nOK : effacer les anciennes données manuelles (revenus, loyers, charges, dépenses, enveloppes et contributions).\nAnnuler : conserver les données manuelles déjà enregistrées.');
  if(resetManual){
   localStorage.setItem(REAL_KEY,JSON.stringify(fresh()));
   localStorage.removeItem(ALLOCATION_MODE_KEY);
  }
 }
 demoMode=enabled;
 localStorage.setItem(MODE_KEY,enabled?'demo':'manual');
 window.location.reload();
}
function initModeControls(){
 const container=document.getElementById('modeControls');if(!container)return;
 const status=el('span',demoMode?'🎬 Démonstration au 8 du mois · virements effectués le 5':'✍️ Mode manuel actif · vos données','mode-status');
 const demo=el('button','🎬 Mode démonstration','secondary');demo.type='button';demo.disabled=demoMode;
 const manual=el('button','✍️ Mode manuel','secondary');manual.type='button';manual.disabled=!demoMode;
 demo.addEventListener('click',()=>setDemoMode(true));manual.addEventListener('click',()=>setDemoMode(false));
 container.append(status,demo,manual);
 if(demoMode){const restart=el('button','↻ Recharger les exemples','secondary');restart.type='button';restart.addEventListener('click',()=>{if(confirm('Recharger les données fictives de démonstration ? Les changements effectués en mode démo seront remplacés. Vos données manuelles resteront intactes.')){localStorage.setItem(DEMO_KEY,JSON.stringify(demoDataset()));window.location.reload();}});container.append(restart);}
}

if($('addMember'))$('addMember').addEventListener('click',addMember);
initModeControls();
if($('nextShoppingAmount'))$('nextShoppingAmount').addEventListener('input',renderShoppingRecommendation);
if($('incomeInputs')) initBudget();

if($('reset')) $('reset').addEventListener('click',()=>{if(confirm(demoMode?'Réinitialiser uniquement les données de démonstration ?':'Effacer toutes vos données manuelles, y compris les budgets ?')){data=fresh();save();}});
render();

window.addEventListener('storage',event=>{if(event.key===REAL_KEY||event.key===DEMO_KEY||event.key===MODE_KEY||event.key===ALLOCATION_MODE_KEY)refreshFromStorage();});
function refreshFromStorage(){
 const storedMode=localStorage.getItem(MODE_KEY)==='demo';
 if(storedMode!==demoMode){window.location.reload();return;}
 const freshData=load();
 if(JSON.stringify(freshData)!==JSON.stringify(data)){
   data=freshData;
   if(Array.isArray(data.members))MEMBERS.splice(0,MEMBERS.length,...data.members);
   render();
 }else{render();}
}
window.addEventListener('pageshow',refreshFromStorage);
window.addEventListener('focus',refreshFromStorage);
window.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFromStorage();});
