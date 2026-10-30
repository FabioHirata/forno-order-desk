import {t,language,translateStatic,count,capacityText,errorText,orderLabel,statusLabel,added,quantityLabel,setLanguage,orderText} from './i18n.js';
import { CATALOG,CAPACITY,STATUSES,money as baseMoney,localDate,demoOrders,units,total,usedCapacity,createOrder,changeStatus,filterOrders,exportCSV,readSaved } from './domain.js';
const $ = selector => document.querySelector(selector);
const money=value=>baseMoney(value,language);
const KEY='forno-order-desk-v1';
let orders;
let storageAvailable=true;
function notify(message) { $('#notice').textContent=errorText(message); }
try { const saved=localStorage.getItem(KEY); orders=saved ? readSaved(saved) : demoOrders(); } catch { orders=demoOrders(); notify('Não foi possível carregar os dados locais. O exemplo foi aberto; salve um novo pedido ou restaure para substituir dados inválidos.'); }
function save() { try { localStorage.setItem(KEY, JSON.stringify({version:1,orders})); storageAvailable=true; } catch { storageAvailable=false; notify('Armazenamento indisponível. As alterações duram apenas enquanto esta página estiver aberta. Exporte o CSV para guardar uma cópia.'); } }
function node(tag, className, content) { const element=document.createElement(tag); if(className) element.className=className; if(content!==undefined) element.textContent=t(content); return element; }
const today=localDate();
$('#delivery-date').min=today; $('#delivery-date').value=today;
for(const status of STATUSES) $('#status-filter').append(new Option(t(status),status));
for(const product of CATALOG) {
  const row=node('div','product'); row.append(node('span','product-icon',product.glyph));
  row.firstChild.setAttribute('aria-hidden','true');
  const info=node('div','product-info'); const label=node('label',null,product.name); label.htmlFor=`qty-${product.id}`; info.append(label,node('small',null,`${t(product.detail)} · ${money(product.price)}`));
  const input=node('input'); input.type='number';input.min='0';input.max=String(CAPACITY);input.step='1';input.value='0';input.defaultValue='0';input.id=`qty-${product.id}`;input.setAttribute('aria-label',quantityLabel(product.name));
  row.append(info,input);$('#catalog').append(row);
}
function draft() { return {reference:$('#reference').value,date:$('#delivery-date').value,notes:$('#notes').value,items:CATALOG.map(p=>({productId:p.id,quantity:Number($(`#qty-${p.id}`).value)})).filter(item=>item.quantity!==0)}; }
function renderDraft() { const order=draft(); const valid=order.items.every(item=>Number.isInteger(item.quantity)&&item.quantity>0);$('#draft-total').textContent=valid?money(total(order)):'—';$('#draft-units').textContent=valid?count(units(order)):t('Confira as quantidades');$('#date-capacity').textContent=capacityText(Math.max(0,CAPACITY-usedCapacity(orders,order.date))); }
function selectedOrders() {return filterOrders(orders,{query:$('#search').value,date:$('#date-filter').value,status:$('#status-filter').value},t);}
function render() {
  const open=orders.filter(o=>!['Entregue','Cancelado'].includes(o.status));
  $('#metric-open').textContent=open.length;$('#metric-value').textContent=money(open.reduce((sum,o)=>sum+total(o),0));
  const used=usedCapacity(orders,localDate());$('#metric-capacity').textContent=`${used} / ${CAPACITY}`;$('#capacity-bar').style.width=`${used/CAPACITY*100}%`;
  const visible=selectedOrders().slice().sort((a,b)=>a.date.localeCompare(b.date)||b.id-a.id);$('#order-count').textContent=visible.length;$('#export').disabled=!visible.length;
  const list=$('#order-list');list.replaceChildren();
  if(!visible.length) {const empty=node('div','empty');empty.append(node('strong',null,'Balcão tranquilo por aqui.'),node('span',null,'Ajuste os filtros ou adicione uma encomenda.'));list.append(empty);}
  for(const order of visible) {
    const card=node('article','order-card');card.setAttribute('aria-label',orderLabel(order.id));
    const left=node('div');const id=node('div','order-id',`#${order.id}`);const date=new Date(`${order.date}T12:00:00`).toLocaleDateString(language,{day:'2-digit',month:'short'});id.append(node('span','date-chip',date));const reference=node('h3');reference.textContent=orderText(order,'reference');left.append(id,reference);
    const items=node('ul');for(const item of order.items) items.append(node('li',null,`${item.quantity} × ${t(CATALOG.find(p=>p.id===item.productId).name)}`));left.append(items);if(order.notes){const notes=node('p','notes');notes.textContent=orderText(order,'notes');left.append(notes);}
    const right=node('div','order-right');const select=node('select');select.setAttribute('aria-label',statusLabel(order.id));for(const status of STATUSES)select.append(new Option(t(status),status));select.dataset.orderId=order.id;select.value=order.status;select.dataset.status=order.status;
    select.addEventListener('change',()=>{try{orders=changeStatus(orders,order.id,select.value);save();render();const replacement=document.querySelector(`[data-order-id="${order.id}"]`);replacement?.focus();if(storageAvailable)notify(`${orderLabel(order.id)}: ${t(orders.find(o=>o.id===order.id).status)}.`);}catch(error){select.value=order.status;notify(error.message);}});
    right.append(select,node('strong',null,money(total(order))),node('small',null,count(units(order))));card.append(left,right);list.append(card);
  }
  renderDraft();
}
$('#order-form').addEventListener('input',()=>{renderDraft();$('#form-error').textContent='';});
$('#order-form').addEventListener('submit',event=>{event.preventDefault();try{const order=createOrder(draft(),orders);orders=[...orders,order];save();$('#order-form').reset();$('#delivery-date').value=localDate();render();$('#reference').focus();if(storageAvailable)notify(added(order.id));}catch(error){$('#form-error').dataset.message=error.message;$('#form-error').textContent=errorText(error.message);}});
for(const id of ['search','date-filter','status-filter']) $(`#${id}`).addEventListener('input',render);
$('#clear-filters').addEventListener('click',()=>{for(const id of ['search','date-filter','status-filter'])$(`#${id}`).value='';render();});
$('#export').addEventListener('click',()=>{const blob=new Blob([exportCSV(selectedOrders(),t)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=node('a');link.href=url;link.download=`forno-pedidos-${localDate()}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('CSV dos pedidos filtrados exportado. Valores em ienes inteiros.');});
$('#reset').addEventListener('click',()=>$('#reset-dialog').showModal());$('#cancel-reset').addEventListener('click',()=>$('#reset-dialog').close());
$('#confirm-reset').addEventListener('click',()=>{orders=demoOrders();save();$('#reset-dialog').close();for(const id of ['search','date-filter','status-filter'])$(`#${id}`).value='';$('#order-form').reset();$('#delivery-date').value=localDate();$('#form-error').textContent='';render();if(storageAvailable)notify('Exemplo restaurado. Seus testes anteriores foram substituídos.');});
render();

translateStatic();
$('#language').value=language;
$('#language').addEventListener('change',event=>{
  const persisted=setLanguage(event.target.value);
  translateStatic();
  for(const product of CATALOG){
    const input=$(`#qty-${product.id}`);
    input.setAttribute('aria-label',quantityLabel(product.name));
    const row=input.closest('.product');
    row.querySelector('label').textContent=t(product.name);
    row.querySelector('small').textContent=`${t(product.detail)} · ${money(product.price)}`;
  }
  // Repaint only calculated output and the board. Form values and filters stay intact.
  render();
  if($('#form-error').textContent)$('#form-error').textContent=errorText($('#form-error').dataset.message);
  notify(persisted?'':'Idioma alterado apenas nesta sessão: não foi possível salvar a preferência.');
});
