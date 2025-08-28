# Nexus Docs

Visualizador de documentação (Next.js + Tailwind) para HTMLs gerados do backend. Renderiza arquivos HTML sanitizados, melhora a leitura (tipografia, tabelas, blocos de código) e oferece navegação por seções com persistência do estado da sidebar.

## Sumário
- Visão Geral
- Principais Recursos
- Stack
- Requisitos
- Como Rodar
- Scripts Disponíveis
- Estrutura de Pastas
- Como adicionar novos documentos
- Sanitização e Formatação
- Estilos (code blocks, tabelas, tipografia)
- Deploy
- Troubleshooting
- Roadmap
- Contribuição

## Visão Geral
A aplicação carrega arquivos HTML exportados da documentação do backend em src/docs/backend/config e os exibe em uma UI limpa. Antes de exibir, o HTML é sanitizado (remoção de estilos/scripts/atributos ruidosos), caracteres privados (PUA) são filtrados, e trechos com quebras de linha são convertidos em blocos de código reais.

## Principais Recursos
- Navegação lateral colapsável com persistência em localStorage.
- Tabs superiores para troca rápida entre documentos.
- Sanitização robusta do HTML:
  - Remove style/script/link e atributos class/style/id/data-*.
  - Remove caracteres da Private Use Area (como “”) e suas entidades numéricas/hexadecimais.
- Conversão de <p> com <br> em <pre><code> com mesclagem de blocos adjacentes.
- Tipografia e tabelas otimizadas para leitura.
- Respeita prefers-reduced-motion.

## Stack
- Next.js (App Router)
- Tailwind CSS (v4, @import "tailwindcss")
- Tipografia: Geist/Geist Mono (via next/font)
- Node.js 18.18+ (recomendado 20+)

## Requisitos
- Node.js >= 18.18 (ou 20+)
- npm, pnpm, yarn ou bun

## Como Rodar
```bash
# instalar dependências
npm i

# ambiente de desenvolvimento
npm run dev

# build de produção
npm run build

# servir build de produção
npm start
```

Acesse http://localhost:3000.

## Scripts Disponíveis
- dev: inicia o servidor de desenvolvimento
- build: compila o projeto
- start: executa a aplicação compilada
- lint (se configurado): verificação estática

## Estrutura de Pastas
```
src/
  app/
    layout.tsx
    page.tsx          # carrega, sanitiza e renderiza o HTML do doc
    globals.css       # estilos globais e da tipografia/blocks
  docs/
    backend/
      config/
        src_config_helmet.html
        src_config_database.html
        src_config_env.html
        src_config_admin_routes.html
        src_config_admin_routes.ts.html
        Middleware_authMiddleware.html
```

## Como adicionar novos documentos
1) Exporte o documento como HTML e salve em src/docs/backend/config.
2) Edite src/app/page.tsx e adicione uma entrada no objeto DOCS:
```ts
const DOCS = {
  // ...existing code...
  novoDoc: {
    title: "caminho/ou/título.ts",
    file: "src/docs/backend/config/arquivo_exportado.html",
  },
} as const;
```
3) O item aparecerá automaticamente na sidebar e nas abas.

Observações
- O leitor acessa documentos via query string: /?doc=helmet (a chave do DOCS).
- Nenhuma variável de ambiente é necessária para exibir os HTMLs.

## Sanitização e Formatação
A sanitização acontece em sanitizeAndExtract (src/app/page.tsx):
- Remove:
  - <style>, <script>, <link>
  - atributos class, style, id e data-*
- Remove caracteres da Private Use Area:
  - Entidades decimais/hex nas faixas PUA (BMP, Planos 15/16)
  - Caracteres já decodificados (ex.: “”)
- Converte parágrafos com <br> em blocos <pre><code>
- Mescla blocos de código adjacentes

Heurística de code blocks
- Um <p> vira <pre><code> quando contiver ao menos um <br> e não for um container de tabelas/links principais.
- <span> e marcações leves são limpas para preservar o texto bruto.
- Entidades HTML (&lt;, &gt;, &amp;) são mantidas.

## Estilos
Arquivo: src/app/globals.css
- Inline code: leve destaque de fundo/borda.
- Blocos de código: fundo sutil no <pre> (apenas um “box” por trecho).
- Tabelas: linhas e cabeçalho com contraste leve.
- Tipografia: largura ideal (~72ch), animação suave de entrada.

## Deploy
Vercel (recomendado)
- Faça o import do repositório e use as configurações padrão de Next.js.

Self-host
```bash
npm run build
npm start
# ou sirva .next/standalone conforme sua infraestrutura
```

## Troubleshooting
- Caracteres estranhos (ex.: “”)
  - Já filtrados pelo sanitizador. Se aparecerem, verifique se o HTML fonte contém entidades em faixas fora da PUA.
- “Uma caixa por linha” em blocos de código
  - O CSS remove fundo/borda do <code> dentro de <pre>. Se customizar estilos, mantenha .prose-style pre code { background: transparent; border: 0; }.
- HTML quebrado
  - O projeto extrai apenas o <body>. Se o documento não tiver <body>, todo o conteúdo é processado como fallback.

## Roadmap
- Detecção mais precisa de trechos de código (linguagens, syntax highlight opcional).
- ÍNDICE (TOC) por headings no documento ativo.
- Suporte opcional a i18n de UI e/ou tradução on-the-fly do conteúdo (desativado por padrão).

## Contribuição
- Faça um fork e abra um PR com uma descrição objetiva.
- Mantenha mudanças pequenas e com escopo claro.
- Para novos documentos, inclua apenas HTMLs sanitizáveis (sem JS embutido).

---
Nexus Docs — documentação backend com leitura confortável e segura.
