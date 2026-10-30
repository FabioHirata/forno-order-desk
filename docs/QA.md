# Verificação — 30/10/2026

## Automatizada (Node.js)

`npm run check`: **21 testes passaram**, zero falhas. Verificações de sintaxe de app/domínio, inteiros JPY, quantidades, produtos duplicados, datas impossíveis/passadas, limite diário, cancelamento/reativação, status, filtros, CSV seguro, esquema persistido e integridade da localização. `npm run build` concluído.

## Navegador real (Chromium via CUA)

Executados com observação do DOM/árvore acessível após cada ação e assertions nos resultados principais:

- Tela inicial e quatro pedidos demonstrativos em PT; visual desktop inspecionado.
- Troca PT → EN → JA → PT, incluindo persistência por reload e catálogo/valores/datas/rótulos localizados.
- EN: tentativa de 20 unidades com apenas 19 disponíveis rejeitada; mensagem correta.
- EN: pedido de 2 focaccias criado por ¥1.700; total em aberto e capacidade atualizados.
- Reload mantém o pedido; alteração para pronto confirmada; busca isola um pedido.
- Cancelar a restauração mantém os dados; confirmar restauração retorna a quatro exemplos.
- JA: excesso de capacidade rejeitado com mensagem japonesa.
- PT: pedido sem produtos rejeitado com mensagem portuguesa.
- Screenshot completo em `desktop-pt.png`.

O roteiro reproduzível está em `tests/ui.cua.js`. As etapas foram executadas via CUA; não é um teste incluído no runner Node nem um relatório de cobertura integral de navegador.

## Não verificado / limites

- O Chromium deste ambiente bloqueia DevTools por política da organização. A tentativa de emulação móvel foi interrompida; **não há validação visual em viewport móvel**. CSS responsivo foi implementado e revisado, mas não equivale a um teste real de celular.
- Sem auditoria WCAG completa, leitor de tela real, matriz de navegadores ou concorrência entre abas.
- Serialização/segurança/localização de CSV testadas no domínio; download não foi aberto em Excel/Sheets.
- Layout desktop observado a aproximadamente 1165 px de largura; imagem é um registro, não alegação de compatibilidade universal.

## Revisão de regressão posterior

Corrigido: troca de idioma agora é aplicada em memória mesmo quando localStorage falha, com aviso localizado; não recarrega a página e preserva formulário/filtros. Textos livres de pedidos criados não são traduzidos; somente fixtures marcadas `demo: true` são localizadas. Cinco testes adicionais cobrem storage bloqueado, persistência, ida/volta PT/EN/JA, preservação de texto/valores no repintar estático com DOM simulado e texto livre coincidente com o dicionário. Esses testes passaram em Node; a revisão posterior não foi novamente exercitada no navegador real.
