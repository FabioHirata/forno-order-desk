export const CAPACITY = 36;
export const STATUSES = ['Recebido', 'Em preparo', 'Pronto', 'Entregue', 'Cancelado'];
export const CATALOG = Object.freeze([
  { id: 'focaccia', name: 'Focaccia de alecrim', detail: 'Assada no dia · unidade', price: 850, glyph: '◒' },
  { id: 'cookie', name: 'Cookie de chocolate', detail: 'Caixa com 4 · unidade', price: 600, glyph: '✳' },
  { id: 'sourdough', name: 'Pão de fermentação natural', detail: '500 g · unidade', price: 950, glyph: '◓' }
]);
export const money = (value,locale='pt-BR') => new Intl.NumberFormat(locale, {style: 'currency', currency: 'JPY', maximumFractionDigits: 0}).format(value);
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function addDays(day, count) { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate()+count); return localDate(date); }
export function validDate(day) { return /^\d{4}-\d{2}-\d{2}$/.test(day) && localDate(new Date(`${day}T12:00:00`)) === day; }
export function units(order) { return order.items.reduce((sum, item) => sum + item.quantity, 0); }
export function total(order) { return order.items.reduce((sum, item) => sum + CATALOG.find(p => p.id === item.productId).price * item.quantity, 0); }
// Delivered orders still consumed today's capacity. Only cancellations release it.
export function usedCapacity(orders, date) { return orders.filter(o => o.date === date && o.status !== 'Cancelado').reduce((sum, order) => sum + units(order), 0); }
export function validateOrder(input, orders, today = localDate()) {
  if (!validDate(input.date) || input.date < today) throw new Error('Escolha uma data válida, a partir de hoje.');
  if (typeof input.reference !== 'string' || !input.reference.trim() || input.reference.trim().length > 40) throw new Error('Use uma referência de 1 a 40 caracteres.');
  if (typeof input.notes !== 'string' || input.notes.length > 240) throw new Error('As observações podem ter até 240 caracteres.');
  if (!Array.isArray(input.items) || !input.items.length) throw new Error('Adicione pelo menos um produto.');
  const seen = new Set();
  for (const item of input.items) {
    if (!CATALOG.some(p => p.id === item.productId) || seen.has(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > CAPACITY) throw new Error('Confira os produtos e as quantidades inteiras.');
    seen.add(item.productId);
  }
  if (usedCapacity(orders, input.date) + units(input) > CAPACITY) throw new Error(`Capacidade excedida: restam ${Math.max(0, CAPACITY-usedCapacity(orders,input.date))} unidades nesta data.`);
  return {...input, reference: input.reference.trim(), notes: input.notes.trim()};
}
export function createOrder(input, orders, today = localDate()) {
  const valid = validateOrder(input, orders, today);
  const id = Math.max(1000, ...orders.map(o => Number(o.id))) + 1;
  return {...valid, id, status: 'Recebido'};
}
export function changeStatus(orders, id, status) {
  if (!STATUSES.includes(status)) throw new Error('Status inválido.');
  const order = orders.find(o => o.id === id);
  if (!order) throw new Error('Pedido não encontrado.');
  if (order.status === 'Cancelado' && status !== 'Cancelado' && usedCapacity(orders,order.date)+units(order)>CAPACITY) throw new Error('Sem capacidade para reativar este pedido.');
  return orders.map(o => o.id === id ? {...o,status} : o);
}
export function demoOrders(today = localDate()) { return [
  {demo:true,id:1001,reference:'Mesa 01 · exemplo',date:today,items:[{productId:'focaccia',quantity:4},{productId:'cookie',quantity:2}],notes:'Embalar separadamente.',status:'Em preparo'},
  {demo:true,id:1002,reference:'Mesa 02 · exemplo',date:today,items:[{productId:'sourdough',quantity:3}],notes:'',status:'Pronto'},
  {demo:true,id:1003,reference:'Mesa 03 · exemplo',date:today,items:[{productId:'cookie',quantity:8}],notes:'Retirada no balcão.',status:'Recebido'},
  {demo:true,id:1004,reference:'Mesa 04 · exemplo',date:addDays(today,1),items:[{productId:'focaccia',quantity:12}],notes:'',status:'Recebido'}
]; }
export function filterOrders(orders, {date='',status='',query=''} = {}, translate=value=>value) { const term = query.trim().toLocaleLowerCase('pt-BR'); return orders.filter(o => (!date || o.date===date) && (!status || o.status===status) && (!term || `${o.demo===true?translate(o.reference):o.reference} ${o.reference} ${o.id}`.toLocaleLowerCase('pt-BR').includes(term))); }
export function csvCell(value) { let text=String(value); if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text="'"+text; return `"${text.replaceAll('"','""')}"`; }
export function exportCSV(orders,translate=value=>value) { const rows=[['Pedido','Referência fictícia','Entrega','Status','Unidades','Total JPY','Observações'].map(translate),...orders.map(o=>[o.id,o.reference,o.date,translate(o.status),units(o),total(o),o.notes])];return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'); }
export function readSaved(raw) {
  const parsed=JSON.parse(raw);
  if (parsed.version!==1 || !Array.isArray(parsed.orders) || parsed.orders.length>1000) throw new Error('Dados incompatíveis.');
  const ids=new Set();
  for (const order of parsed.orders) {
    if (!Number.isSafeInteger(order.id) || order.id<1001 || ids.has(order.id) || !STATUSES.includes(order.status)) throw new Error('Pedido inválido.');
    validateOrder(order,[], '0000-01-01'); ids.add(order.id);
  }
  for (const order of parsed.orders) if (usedCapacity(parsed.orders,order.date)>CAPACITY) throw new Error('Capacidade inválida.');
  return parsed.orders;
}
