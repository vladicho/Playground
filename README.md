# Playground RAG

Interface privada para consultar a instância `biblioteca-matematica` do
Cloudflare AI Search.

## Arquitetura

- Cloudflare Worker com binding direto ao AI Search.
- Static Assets para a interface web.
- Respostas transmitidas por Server-Sent Events.
- Interface em português e espanhol, com idioma persistido no navegador.
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
- Caderno de estudos local para salvar respostas, pesquisar materiais, escrever
  anotações, acompanhar revisões e imprimir o conjunto em PDF.
- Revisão espaçada em 1, 3, 7, 14 e 30 dias, com níveis de domínio, pendências,
  sequência diária e progresso por livro e assunto.
- Modo Simulado com cinco questões fundamentadas, cronômetro de 20 minutos,
  correção local, nota e relatório de erros sem chamadas adicionais à IA.
- Plano semanal local com geração de metas a partir do caderno, calendário,
  cronômetro por sessão e acompanhamento de minutos e tarefas concluídas.
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

## D1 para usuários e cotas

O Worker aceita opcionalmente um binding D1 chamado `DB`. Sem o binding, o chat
continua funcionando sem persistência, como antes. Com o binding e a primeira
migração aplicada, ele registra usuários pseudonimizados e agrega solicitações,
sucessos e erros por dia.

```bash
npx wrangler d1 create playground-db
npx wrangler d1 migrations apply playground-db --remote
```

Depois da criação, adicione o `database_id` retornado ao `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "playground-db",
    "database_id": "<DATABASE_ID>",
    "migrations_dir": "./migrations"
  }
]
```

As variáveis opcionais `DAILY_USER_LIMIT` e `DAILY_GLOBAL_LIMIT` ativam os
limites diários. Se forem omitidas, o D1 apenas mede o uso.

## MathPlayground API

O mesmo repositório contém um segundo Worker, `mathplayground-api`, configurado
em `wrangler.api.jsonc` para o domínio `api.lugarerrado.com`. Ele reutiliza o
AI Search e o D1, sem acesso direto nem exposição do bucket R2.

Rotas públicas:

- `GET /` — identificação da API.
- `GET /v1/health` — disponibilidade.
- `GET /v1/openapi.json` — descrição OpenAPI.

Rotas protegidas por `Authorization: Bearer <chave>`:

- `POST /v1/chat` — conversa RAG, com opção de streaming.
- `POST /v1/search` — recuperação de trechos e fontes.
- `POST /v1/solve` — resolução matemática passo a passo.
- `POST /v1/quiz` — geração de quiz em português ou espanhol.
- `GET /v1/usage` — consumo e limites do dia.

A chave nunca deve ser adicionada ao repositório. Depois do primeiro deploy,
configure `MATHPLAYGROUND_API_KEY` como Secret no Worker `mathplayground-api`.
Os limites iniciais são 100 solicitações por chave e 500 solicitações globais
por dia UTC; podem ser ajustados em `wrangler.api.jsonc`.

Para criar/atualizar somente a API:

```bash
npm run check:api
npm run deploy:api
```
