/** Browser QA harness for the supported CUA REPL.
 * Pass a CUA Tab bound to the running Forno preview.
 * Destructive only to this demo's local test data; starts/ends with a confirmed reset.
 * No third-party dependencies, browser bypasses or external account actions.
 */
export async function testFornoUI(tab) {
  const p=tab.playwright;
  const assert=async(condition,message)=>{if(!await condition)throw Error(message);};
  await p.getByLabel('Language / Idioma / 言語').selectOption('en');await tab.getAXState();
  await p.locator('#reset').click();await tab.getAXState();await p.locator('#confirm-reset').click();await tab.getAXState();
  await p.getByLabel('Fictional reference').fill('QA Example');
  await p.getByLabel('Quantity of Rosemary focaccia').fill('20');
  await p.getByRole('button',{name:'Add order'}).click();await tab.getAXState();
  await assert(p.getByText('Capacity exceeded: 19 units remain on this date.').isVisible(),'Capacity validation');
  await p.getByLabel('Quantity of Rosemary focaccia').fill('2');
  await p.getByRole('button',{name:'Add order'}).click();await tab.getAXState();
  await assert(p.getByRole('heading',{name:'QA Example',exact:true}).isVisible(),'Creation');
  await tab.reload();await tab.getAXState();
  await assert(p.getByRole('heading',{name:'QA Example',exact:true}).isVisible(),'Persistence');
  await p.getByLabel('Status of order 1005').selectOption('Pronto');
  await p.getByLabel('Search by reference or number').fill('QA Example');await tab.getAXState();
  await assert(p.getByRole('heading',{name:'Order board 1'}).isVisible(),'Filter');
  await p.locator('#reset').click();await tab.getAXState();await p.locator('#cancel-reset').click();await tab.getAXState();
  await assert(p.getByRole('heading',{name:'QA Example',exact:true}).isVisible(),'Cancel reset');
  await p.locator('#reset').click();await tab.getAXState();await p.locator('#confirm-reset').click();await tab.getAXState();
  await p.getByLabel('Language / Idioma / 言語').selectOption('ja');await tab.getAXState();
  await p.getByLabel('架空の注文名').fill('テスト注文');await p.getByLabel('ローズマリーフォカッチャの数量').fill('20');
  await p.getByRole('button',{name:'注文を追加'}).click();await tab.getAXState();
  await assert(p.getByText('生産枠を超えています。この日の残りは19点です。').isVisible(),'Japanese validation');
  await p.getByLabel('Language / Idioma / 言語').selectOption('pt-BR');await tab.getAXState();
  await p.getByLabel('Referência fictícia').fill('Verificação final');await p.getByLabel('Quantidade de Focaccia de alecrim').fill('0');await p.getByRole('button',{name:'Adicionar encomenda'}).click();await tab.getAXState();
  await assert(p.getByText('Adicione pelo menos um produto.').isVisible(),'Portuguese empty order validation');
  await tab.reload();await tab.getAXState();return 'PASS';
}
