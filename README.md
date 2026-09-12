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
3. Crie o usuário do administrador em **Authentication > Users > Add user**:
   - Email: o email que você quer usar no painel
   - Senha: a senha do painel
   - Marque **Auto Confirm User** para já ficar ativo.
4. (Recomendado) Em **Authentication > Providers > Email**, ative
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

## Segurança

- A senha do admin não fica mais no código: o login é feito pelo Supabase Auth.
- O site público nunca exibe link do painel; a URL secreta + `noindex` dificultam
  a descoberta.
- As políticas RLS garantem que visitantes anônimos só conseguem **ler** o
  cardápio e **criar** pedidos — todas as outras operações exigem login.
