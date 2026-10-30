import test from 'node:test';import assert from 'node:assert/strict';
import {setLanguage,language,t,translatedText,translateStatic,orderText} from '../src/i18n.js';
import {createOrder,demoOrders,filterOrders} from '../src/domain.js';
const blocked={setItem(){throw new Error('QuotaExceededError');}};
test('blocked persistence never blocks any supported language',()=>{
 for(const [locale,expected] of [['en','New order'],['ja','新しい注文'],['pt-BR','Nova encomenda']]){assert.equal(setLanguage(locale,blocked),false);assert.equal(language,locale);assert.equal(t('Nova encomenda'),expected);}
});
test('language persistence succeeds when available',()=>{const calls=[];assert.equal(setLanguage('ja',{setItem:(...args)=>calls.push(args)}),true);assert.deepEqual(calls,[['forno-language','ja']]);});
test('static translations round-trip through all languages',()=>{
 let value='Nova encomenda';for(const [locale,expected] of [['en','New order'],['ja','新しい注文'],['pt-BR','Nova encomenda']]){setLanguage(locale,blocked);value=translatedText(value);assert.equal(value,expected);}
});
test('static repaint preserves form draft text and input values in all languages',()=>{
 const draft={reference:'Embalar separadamente.',notes:'Nova encomenda',quantity:'7',date:'2027-01-02'};
 const nodes=[{textContent:draft.notes,parentElement:{closest:()=>true}},{textContent:'Nova encomenda',parentElement:{closest:()=>false}}];
 const input={value:draft.reference,hasAttribute:attr=>attr==='placeholder',getAttribute:()=> 'Ex.: Mesa 05',setAttribute(){}};
 const oldDocument=globalThis.document,oldFilter=globalThis.NodeFilter;
 globalThis.NodeFilter={SHOW_TEXT:4};globalThis.document={documentElement:{},createTreeWalker(){let i=0;return {nextNode:()=>nodes[i++]??null};}};
 try{for(const locale of ['en','ja','pt-BR']){setLanguage(locale,blocked);translateStatic({querySelectorAll:()=>[input]});assert.equal(input.value,draft.reference);assert.equal(nodes[0].textContent,draft.notes);assert.deepEqual(draft,{reference:'Embalar separadamente.',notes:'Nova encomenda',quantity:'7',date:'2027-01-02'});}}finally{globalThis.document=oldDocument;globalThis.NodeFilter=oldFilter;}
});
test('created order reference and notes remain literal even when matching dictionary entries',()=>{
 const order=createOrder({reference:'Mesa 01 · exemplo',notes:'Embalar separadamente.',date:'2027-01-02',items:[{productId:'cookie',quantity:1}]},[],'2027-01-02');
 for(const locale of ['en','ja','pt-BR']){setLanguage(locale,blocked);assert.equal(orderText(order,'reference'),'Mesa 01 · exemplo');assert.equal(orderText(order,'notes'),'Embalar separadamente.');assert.equal(filterOrders([order],{query:'Table 01'},t).length,0);}
 setLanguage('ja',blocked);assert.equal(orderText(demoOrders('2027-01-02')[0],'notes'),'別々に包装。');
});
