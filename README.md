# JB Marmitas

Cardápio digital para marmitaria com pedidos pelo WhatsApp, painel administrativo
secreto e dados (cardápio, pedidos e fotos) guardados no Supabase.

## Como funciona

- **Site público** (`index.html`): cardápio vem da tabela `products` do Supabase e
  atualiza sozinho quando o admin muda algo (realtime). O pedido é salvo na tabela
  `orders` **e** enviado pelo WhatsApp.
- **Painel admin** (`painel-jb-2026.html`): URL secreta, fora dos menus do site e
  com `noindex`. O acesso exige login Supabase (email/senha); ninguém vê ou usa o
  painel sem estar autenticado.
- **Fotos dos produtos**: enviadas para o bucket `produtos` do Supabase Storage.

## Configuração do Supabase (uma vez só)

1. Abra o **SQL Editor** no painel do Supabase.
2. Cole todo o conteúdo de `supabase/schema.sql` e execute (**Run**).
   Isso cria as tabelas `products` e `orders`, as políticas de segurança (RLS),
   o bucket de fotos `produtos` e os itens iniciais do cardápio.
3. **Já tinha o site rodando antes?** Reexecute o `schema.sql` mesmo assim:
   ele adiciona as colunas novas de pedidos (`customer_phone`, `district` e
   `order_number`) sem tocar nos dados existentes. Sem isso, o site funciona
   (há fallback no código), mas o painel não mostra o telefone/bairro nem o
   número do pedido.
4. **Usuário administrador** (se ainda não existe): crie em **Authentication > Users > Add user**:
   - Email: o email que você quer usar no painel — **use exatamente o mesmo email
     da função `is_admin()`** em `supabase/schema.sql`
     (padrão: `admin@jbmarmitas.com.br`)
   - Senha: a senha do painel (forte, guardada em gerenciador de senhas)
   - Marque **Auto Confirm User** para já ficar ativo.
   - Depois de criar, **reexecute o `schema.sql`** para aplicar as políticas
     RLS novas (`is_admin()`), a coluna `lgpd_consent_at` e a nota LGPD.
5. (Recomendado) Em **Authentication > Providers > Email**, ative
   **Confirm email** apenas se quiser exigir confirmação de email de clientes.

## Desenvolvimento

```bash
npm install
cp .env.example .env   # preencha com a URL e a publishable key do projeto
npm run dev
```

- `npm test` roda os testes (Jest): lógica, telas, corridas (spam de cliques,
  duplo envio) e integração CSS↔JSX.
- `npm run build` gera o site em `dist/` (exige as variáveis do Supabase no
  `.env` ou no ambiente).

## Deploy na Vercel

O site público fica em `https://jb-marmitas-pages.vercel.app/` e o painel em
`.../painel-jb-2026.html` (guarde esse endereço — não há link no site).

A cada push na branch `main`, a Vercel compila e publica sozinha. Configuração
feita uma vez só no projeto:

1. **Root Directory** = `jb-marmitas-pages` (o app não está na raiz do repo).
2. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

O arquivo `vercel.json` mantém o rewrite de SPA (qualquer rota cai no
`index.html`, exceto `/assets/*` e o painel) e cache imutável dos assets.

O GitHub Pages **não** é mais usado: o workflow `.github/workflows/ci.yml`
roda apenas testes e build (CI). Se o Pages ainda estiver ativo no GitHub,
desligue em **Settings > Pages > Source: None** para o site só existir na
Vercel.

## Horário de funcionamento

O site só aceita pedidos **das 11h às 14h** (horário de Balsas, UTC-3):

- Fora da janela, o hero mostra "Fechado · pedidos das 11h às 14h", uma faixa
  aparece no topo da página, o botão "Pedir" não adiciona ao carrinho e a barra
  do carrinho exibe o aviso no lugar do botão de envio.
- O checkout tem uma última trava: se o relógio bater 14h com o modal aberto,
  o pedido não é gravado no Supabase nem enviado ao WhatsApp.
- A checagem é pelo fuso da loja (UTC-3 fixo), não pelo fuso do visitante.
- **No servidor também**: um trigger no Supabase (`orders_hours_guard`) rejeita
  inserts fora da janela usando o relógio do servidor — nem relógio do celular
  errado nem site adulterado cadastram pedido fora do horário. Se trocar o
  horário no código, atualize o `between 14 and 16` (UTC) na função
  `enforce_order_hours()` em `supabase/schema.sql` e reexecute o SQL.
- Para mudar o horário, edite `OPEN_HOUR` e `CLOSE_HOUR` em `src/lib/hours.js`.

## LGPD e privacidade

- **Política de Privacidade**: `/privacidade.html` (link no rodapé do site).
- **Consentimento**: checkbox obrigatório no checkout; a data/hora fica gravada
  em `orders.lgpd_consent_at` (prova de consentimento).
- **Sem rastreadores**: o site não usa cookies de publicidade nem analytics —
  por isso não precisa de banner de cookies.
- **Nota no painel admin**: lembra o admin de usar os dados só para atender o
  pedido e excluir quando o cliente pedir.
- Relatório completo: [`LGPD.md`](./LGPD.md).

## Segurança

- A senha do admin não fica no código: o login é feito pelo Supabase Auth.
- O site público nunca exibe link do painel; a URL secreta + `noindex`
  (metatag **e** header HTTP `X-Robots-Tag`) dificultam a descoberta.
- As políticas RLS garantem que visitantes anônimos só conseguem **ler** o
  cardápio e **criar** pedidos — leitura/edição/exclusão só para o admin.
- **Somente a conta admin** gerencia o site: as políticas usam a função
  `is_admin()` (compara o email em `supabase/schema.sql`). Qualquer outra conta
  autenticada não lê pedidos nem altera o cardápio.
- Headers de segurança no deploy (HSTS, CSP, anti-clickjacking e afins) via
  `vercel.json`.
- `order_number` vem do contador local do navegador: o número exibido no
  WhatsApp e no painel é o mesmo que o cliente vê.
