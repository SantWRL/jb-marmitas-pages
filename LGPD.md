# Relatório de Conformidade — LGPD (Lei nº 13.709/2018)

**Site:** JB Marmitas (`jb-marmitas-pages`) · **Data da análise:** 13/09/2026

## Resumo

O site coleta dados pessoais no checkout (nome, WhatsApp e endereço de entrega),
envia o resumo do pedido ao WhatsApp da marmitaria e grava o pedido no Supabase.
Este relatório descreve o que foi verificado e o que foi ajustado para reduzir o
risco de sanções da LGPD (advertência, multa de até 2% do faturamento limitada a
R$ 50 milhões por infração, entre outras).

## O que foi encontrado e corrigido

| # | Item | Situação antes | Ação |
|---|------|----------------|------|
| 1 | Consentimento do titular (art. 7º, I e 8º) | Ausente — dados iam para o banco e para o WhatsApp sem autorização registrada | Checkbox obrigatório no checkout (etapa Pagamento), com data/hora gravada em `orders.lgpd_consent_at` como prova de consentimento |
| 2 | Política de Privacidade (art. 9º) | Inexistente | Página `/privacidade.html` (e rota `/privacidade`) com controlador, dados tratados, bases legais, compartilhamento (WhatsApp/Meta, Supabase, Vercel), prazo de guarda, direitos do art. 18, segurança, crianças/adolescentes e decisões automatizadas |
| 3 | Acesso ao titular (art. 18) | Sem canal previsto | Canal de atendimento (WhatsApp e Instagram) indicado na política como canal do titular e do Encarregado (DPO) |
| 4 | Eliminação dos dados (art. 18, VI) | Já existia exclusão de pedidos no painel | Reforçado: a política orienta como pedir exclusão e o painel orienta o admin a excluir quando o cliente pedir |
| 5 | Uso responsável dos dados pelo admin | Sem orientação | Nota LGPD fixa no painel: dados servem apenas para atender o pedido, sem compartilhamento ou divulgação |
| 6 | Segurança (art. 46) | RLS permitia que QUALQUER conta autenticada lesse e apagasse pedidos e cardápio | Políticas RLS travadas via função `is_admin()` (SECURITY DEFINER) para a conta admin específica |
| 7 | Boletim de segurança no site | Sem headers | Vercel publica HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e CSP |
| 8 | Rastreamento (cookies/analytics) | Não existia (verificado) | Nada a fazer — o site não usa cookies de publicidade nem rastreadores; dispensa banner de cookies |
| 9 | Dados de clientes expostos publicamente | Nunca expostos (RLS) | Mantido e coberto por teste: `orders` só aceita INSERT público; leitura/edição/exclusão só para o admin |

## O que continua sendo responsabilidade do responsável (fora do código)

1. **Registrar o administrador** no Supabase (ver seção abaixo).
2. **Verdade na política**: se o negócio passar a usar os dados para outro fim
   (ex.: marketing no WhatsApp), atualize `src/pages/privacy.jsx` e colete um
   consentimento específico para isso.
3. **Atendimento ao titular**: responda pedidos de acesso/correção/exclusão no
   WhatsApp em prazo razoável (LGPD sugere 15 dias para acesso, art. 19).
4. **Compartilhamento com a Meta**: o envio pelo WhatsApp transfere dados à
   Meta (WhatsApp/Meta Platforms). Está declarado na política publicada.
5. **Prazo de guarda**: exclua pedidos antigos que não sejam mais necessários
   (o painel permite excluir individualmente).

## Como registrar o administrador (2 minutos)

O painel exige conta Supabase. Agora, com o RLS travado, **somente** a conta
cujo email está em `is_admin()` (arquivo `supabase/schema.sql`) gerencia o site.

1. Abra o **Supabase Dashboard > Authentication > Users > Add user**.
2. Email: `admin@jbmarmitas.com.br` *(ou altere o email na função `is_admin()`
   em `supabase/schema.sql` e reexecute o SQL)*.
3. Senha forte (guarde no gerenciador de senhas), marque **Auto Confirm User**.
4. Entre em `https://jb-marmitas-pages.vercel.app/painel-jb-2026.html`.

Alternativa por SQL: use `supabase/registrar-admin.sql` (requer SMTP configurado
no Supabase para o convite por email).

Depois de criar a conta, reexecute o `supabase/schema.sql` no SQL Editor para
aplicar as políticas novas (inclui `lgpd_consent_at` e `is_admin()`).

## Cobertura por testes (npm test)

A suíte agora trava a conformidade LGPD automaticamente:

- Checkout exige checkbox de consentimento e grava `lgpd_consent_at`;
- Política de privacidade existe, é pública e tem as seções obrigatórias;
- Rodapé exibe o link da política;
- Painel admin contém a nota de uso responsável dos dados;
- Nenhuma política de SELECT público em `orders` (dados de cliente);
- `vercel.json` publica os headers de segurança e mantém o painel fora dos
  buscadores;
- Nenhum rastreador (gtag/fbq/hotjar/clarity) em nenhum ponto do app.
