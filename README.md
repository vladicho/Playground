# Playground RAG

Interface privada para consultar a instância `biblioteca-matematica` do
Cloudflare AI Search.

## Arquitetura

- Cloudflare Worker com binding direto ao AI Search.
- Static Assets para a interface web.
- Respostas transmitidas por Server-Sent Events.
- Nenhum token ou credencial é enviado ao navegador.
- O domínio deve ser protegido pelo Cloudflare Access antes de ser liberado.

## Desenvolvimento

```bash
npm install
npm run check
npm run dev
```

O AI Search é um binding remoto. O desenvolvimento local utiliza a instância
real da conta Cloudflare.

## Implantação

Conecte este repositório ao Workers Builds e use:

- Build command: `npm run check`
- Deploy command: `npm run deploy`

Configure o domínio `playground.lugarerrado.com` no Worker e proteja-o com
Cloudflare Access.
