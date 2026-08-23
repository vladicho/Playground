# Playground RAG

Interface privada para consultar a instância `biblioteca-matematica` do
Cloudflare AI Search.

## Arquitetura

- Cloudflare Worker com binding direto ao AI Search.
- Static Assets para a interface web.
- Respostas transmitidas por Server-Sent Events.
- Modos de estudo: resumo, quiz, flashcards, mapa mental e roteiro de podcast
  com leitura em voz alta pelo dispositivo.
- Mapa mental gráfico com zoom e exportação em PNG.
- Fórmulas em LaTeX renderizadas localmente com MathML e botão para copiar.
- Exportação de respostas e materiais pelo diálogo Imprimir / Salvar PDF.
- Fontes recuperadas com similaridade e trechos expansíveis.
- Catálogo pesquisável com 256 títulos únicos, categorias estimadas e destaque
  para os cinco documentos atualmente indexados no RAG.
- Fila local de até 10 livros, persistida no navegador, com geração segura dos
  comandos `rclone copyto` para preparar o próximo lote em `rag-teste`.
- Nenhum token ou credencial é enviado ao navegador.
- O domínio deve ser protegido pelo Cloudflare Access antes de ser liberado.

## Desenvolvimento

```bash
npm install
npm run check
npm run dev
```

Para testar o AI Search localmente, habilite `remote: true` apenas na
configuração local do binding. A configuração de produção permanece sem esse
campo.

## Implantação

Conecte este repositório ao Workers Builds e use:

- Build command: `npm run check`
- Deploy command: `npm run deploy`

Configure o domínio `playground.lugarerrado.com` no Worker e proteja-o com
Cloudflare Access.
