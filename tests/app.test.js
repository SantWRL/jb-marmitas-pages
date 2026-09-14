import { calculateTotal, addItem, removeItem, cartQuantity, formatWhatsAppMessage, formatCustomerPhone, formatOrderNumber, buildMapsLink, PHONE } from '../src/lib/cart.js';
import { formatPrice, getEffectivePrice } from '../src/lib/format.js';
import { readFileSync, existsSync } from 'node:fs';

const product = overrides => ({
  id: '1',
  name: 'Marmita Comercial',
  price: 22,
  promo_price: null,
  out_of_stock: false,
  ...overrides
});

describe('Carrinho', () => {
  test('Deve calcular o valor total do carrinho corretamente', () => {
    const cart = {
      '1': { price: 22.0, qty: 2 },
      '2': { price: 15.0, qty: 1 }
    };
    expect(calculateTotal(cart)).toBe(59.0);
  });

  test('Deve contar a quantidade total de itens', () => {
    const cart = { '1': { price: 22, qty: 3 }, '2': { price: 7, qty: 1 } };
    expect(cartQuantity(cart)).toBe(4);
  });

  test('Deve aplicar o preço promocional quando disponível', () => {
    expect(getEffectivePrice(product({ promo_price: 15 }))).toBe(15);
    expect(getEffectivePrice(product({ promo_price: null }))).toBe(22);
  });

  test('Não deve adicionar item ao carrinho se estiver esgotado', () => {
    const cart = addItem({}, product({ id: '3', out_of_stock: true, price: 10 }));
    expect(cart['3']).toBeUndefined();
  });

  test('Deve remover item do carrinho se a quantidade chegar a 0', () => {
    let cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    cart = removeItem(cart, '1');
    expect(cart['1']).toBeUndefined();
  });

  test('addItem deve usar o preço promocional no carrinho', () => {
    const cart = addItem({}, product({ price: 22, promo_price: 18 }));
    expect(cart['1'].price).toBe(18);
  });

  test('Deve formatar o preço em BRL corretamente', () => {
    const formatted = formatPrice(19.9);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('19,90');
  });
});

describe('Mensagem de WhatsApp', () => {
  const build = (overrides = {}) =>
    formatWhatsAppMessage({
      cart: { '1': { name: 'Marmita', price: 20, qty: 1 } },
      orderNumber: 224,
      customerName: 'Teresa',
      customerPhone: '(89) 99919-5466',
      deliveryType: 'entrega',
      street: 'Rua Castro Alves',
      number: '327',
      district: 'Junco',
      ...overrides
    });

  const decode = url =>
    // Node usa espaço não separável (\u00A0) em toLocaleString pt-BR:
    // normalizamos para comparar com espaços comuns.
    decodeURIComponent(url.split('?text=')[1]).replace(/\u00A0/g, ' ');

  test('Deve gerar um pedido WhatsApp com o número e dados do cliente', () => {
    const url = build();
    const message = decode(url);

    expect(url).toContain(`https://wa.me/${PHONE}?text=`);
    expect(message).toContain('#### NOVO PEDIDO ####');
    expect(message).toContain('Nº pedido: 224');
    expect(message).toContain('👤 Teresa');
    expect(message).toContain('📞 (89) 99919-5466');
    expect(message).toContain('Bairro: Junco');
  });

  test('Deve incluir o link do Google Maps com rua, número e bairro', () => {
    const message = decode(build());

    expect(message).toContain('Link do endereço:');
    expect(message).toContain('https://maps.google.com/?q=');
    expect(message).toContain('q=Rua%20Castro%20Alves%2C%20327%2C%20Junco%2C%20Balsas%20MA');
  });

  test('Deve cobrar a taxa de entrega no valor final', () => {
    const message = decode(build());

    expect(message).toContain('SUBTOTAL: R$ 20,00');
    expect(message).toContain('ENTREGA: R$ 7,00');
    expect(message).toContain('*VALOR FINAL: R$ 27,00*');
  });

  test('Deve mostrar prazo de 30 a 40 min e forma de pagamento', () => {
    const message = decode(build({ paymentMethod: 'cartao', paymentDetails: 'Cartão de crédito' }));

    expect(message).toContain('*Cartão de crédito*: R$ 27,00');
    expect(message).toContain('🕐 Prazo para entrega: 30 a 40 min');
  });

  test('Deve estampar "feito em" com data e hora sem vírgula', () => {
    const message = decode(build({ orderDate: new Date(2026, 8, 7, 22, 52) }));

    expect(message).toContain('feito em 07/09/2026 22:52');
  });

  test('Deve mostrar retirada no local e omitir endereço e prazo', () => {
    const message = decode(
      build({ deliveryType: 'retirada', street: '', number: '', district: '' })
    );

    expect(message).toContain('🏠 Retirada no local');
    expect(message).not.toContain('Endereço de entrega');
    expect(message).not.toContain('Link do endereço:');
    expect(message).not.toContain('Prazo para entrega');
  });

  test('Retirada fica isenta da taxa: valor final = subtotal', () => {
    const message = decode(
      build({ deliveryType: 'retirada', street: '', number: '', district: '' })
    );

    expect(message).toContain('ENTREGA: R$ 0,00');
    expect(message).toContain('*VALOR FINAL: R$ 20,00*');
  });

  test('formatCustomerPhone normaliza celular com ou sem DDD do Brasil', () => {
    expect(formatCustomerPhone('(89) 99919-5466')).toBe('5589999195466');
    expect(formatCustomerPhone('5589999195466')).toBe('5589999195466');
    expect(formatCustomerPhone('123')).toBe('');
  });

  test('formatOrderNumber completa com zeros: 7 -> 007', () => {
    expect(formatOrderNumber(224)).toBe('224');
    expect(formatOrderNumber(7)).toBe('007');
    expect(formatOrderNumber(undefined)).toBe('');
  });

  test('buildMapsLink monta endereço completo com cidade padrão', () => {
    expect(buildMapsLink({ street: 'Rua Castro Alves', number: '327', district: 'Junco' })).toBe(
      `https://maps.google.com/?q=${encodeURIComponent('Rua Castro Alves, 327, Junco, Balsas MA')}`
    );
    expect(buildMapsLink({})).toBe('');
  });
});

describe('Páginas', () => {
  test('index.html monta o app React e não expõe o painel admin', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    expect(html).toContain('/src/main.jsx');
    expect(html).not.toContain('adm.html');
    expect(html).not.toContain('painel');
    expect(html).toContain('property="og:title"');

    const appSource = readFileSync(new URL('../src/lib/cart.js', import.meta.url), 'utf8');
    expect(appSource).toContain("'5599999042932'");
  });

  test('painel admin existe, é secreto e protegido contra indexação', () => {
    expect(existsSync(new URL('../painel-jb-2026.html', import.meta.url))).toBe(true);

    const html = readFileSync(new URL('../painel-jb-2026.html', import.meta.url), 'utf8');
    expect(html).toContain('/src/admin-main.jsx');
    expect(html).toContain('noindex, nofollow');
  });

  test('schema do Supabase existe com tabelas e políticas', () => {
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

    expect(sql).toContain('create table if not exists public.products');
    expect(sql).toContain('create table if not exists public.orders');
    expect(sql).toContain('enable row level security');
    expect(sql).toContain("bucket_id = 'produtos'");
  });

  test('Anon não pode atualizar nem apagar pedidos (RLS)', () => {
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

    expect(sql).not.toMatch(/for\s+update[\s\S]{0,80}to\s+anon/i);
    expect(sql).not.toMatch(/for\s+delete[\s\S]{0,80}to\s+anon/i);
    expect(sql).not.toMatch(/for\s+all[\s\S]{0,80}to\s+anon/i);
    expect(sql).not.toMatch(/for\s+update[\s\S]{0,80}to\s+public/i);
    expect(sql).not.toMatch(/for\s+delete[\s\S]{0,80}to\s+public/i);
    expect(sql).not.toMatch(/for\s+all[\s\S]{0,80}to\s+public/i);
  });

  test('schema trava pedidos fora das 11h-14h no servidor (trigger UTC)', () => {
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

    // Trigger BEFORE INSERT usa o relógio do servidor (now()), não o do cliente.
    expect(sql).toContain('create trigger orders_hours_guard');
    expect(sql).toContain('enforce_order_hours');
    expect(sql).toMatch(/before insert on public\.orders/i);
    expect(sql).toContain("now() at time zone 'UTC'");
    // Balsas é UTC-3: janela local 11h-14h = 14h-17h UTC (between 14 and 16).
    expect(sql).toMatch(/between\s+14\s+and\s+16/);
  });

  test('Chaves secretas Supabase não vazam no código versionado', () => {
    for (const rel of ['/src/lib/supabase.js', '/src/lib/api.js']) {
      const source = readFileSync(new URL(`../src${rel.slice(4)}`, import.meta.url), 'utf8');
      expect(source).not.toMatch(/service_role|SUPABASE_SECRE?T|PRIVATE[_-]KEY/);
    }
    expect(readFileSync(new URL('../.env.example', import.meta.url), 'utf8')).not.toMatch(/ey[A-Za-z0-9_-]{20,}/);
    expect(readFileSync(new URL('../.gitignore', import.meta.url), 'utf8')).toContain('.env');
  });

  test('Código do app não usa eval, innerHTML nem document.write (XSS)', () => {
    const sources = [
      '/src/main.jsx',
      '/src/admin-main.jsx',
      '/src/lib/cart.js',
      '/src/lib/api.js',
      '/src/components/OrderModal.jsx',
      '/src/components/ItemModal.jsx',
      '/src/components/CustomerAuth.jsx'
    ];
    for (const rel of sources) {
      const source = readFileSync(new URL(`..${rel}`, import.meta.url), 'utf8');
      expect(source).not.toMatch(/\beval\s*\(/);
      expect(source).not.toMatch(/innerHTML\s*=/);
      expect(source).not.toMatch(/document\.write\s*\(/);
    }
  });
});

describe('LGPD (Lei 13.709/2018)', () => {
  // Base = pasta jb-marmitas-pages/ (mesma convenção dos testes de tela)
  const readSource = rel => readFileSync(new URL(`..${rel}`, import.meta.url), 'utf8');

  test('checkout coleta consentimento com checkbox (art. 8º) antes de enviar', () => {
    const modal = readSource('/src/components/OrderModal.jsx');

    // Checkbox obrigatório no último passo, com validação que bloqueia o envio
    expect(modal).toContain('type="checkbox"');
    expect(modal).toContain('Autorizo o uso dos meus dados');
    expect(modal).toContain('lgpdConsent');
    // Sem consentimento, nada é gravado nem enviado ao WhatsApp
    expect(modal).toContain('if (!lgpdConsent)');
    // O consentimento é registrado junto ao pedido (prova de consentimento)
    expect(modal).toContain('lgpd_consent_at');
    // A política de privacidade está a um clique do consentimento
    expect(modal).toContain('privacidade.html');
  });

  test('política de privacidade existe, é pública e completa', () => {
    const page = readSource('/src/pages/privacy.jsx');

    // Conteúdo mínimo esperado em uma política LGPD
    for (const termo of [
      'Quem trata seus dados',
      'Quais dados coletamos',
      'bases legais',
      'Com quem seus dados são compartilhados',
      'Por quanto tempo guardamos',
      'Seus direitos (art. 18 da LGPD)',
      'Segurança',
      'wa.me'
    ]) {
      expect(page).toContain(termo);
    }

    // Página HTML servida no deploy + entrada do Vite
    expect(existsSync(new URL('../privacidade.html', import.meta.url))).toBe(true);
    const html = readFileSync(new URL('../privacidade.html', import.meta.url), 'utf8');
    expect(html).toContain('/src/privacy-main.jsx');
    expect(html).not.toContain('noindex');

    const vite = readSource('/vite.config.js');
    expect(vite).toContain('privacidade.html');
  });

  test('link de privacidade visível no rodapé do site', () => {
    const footer = readSource('/src/components/Footer/Footer.jsx');
    expect(footer).toContain('privacidade.html');
    expect(footer).toContain('Política de Privacidade');
  });

  test('painel admin orienta sobre o uso responsável dos dados (LGPD)', () => {
    const admin = readSource('/src/admin-main.jsx');
    expect(admin).toContain('admin-lgpd-note');
    expect(admin).toContain('LGPD');
    expect(admin).toContain('privacidade.html');
  });

  test('nenhum dado de cliente é exposto publicamente (só o cardápio é público)', () => {
    const sql = readSource('/supabase/schema.sql');

    // Todas as políticas da tabela "orders" (dados pessoais do cliente).
    // O cardápio (products) pode ter SELECT público; pedidos, nunca.
    const ordersPolicies = [...sql.matchAll(/create policy "([^"]+)"\s+on public\.orders\s+for (\w+)([\s\S]*?);/g)]
      .map(match => ({ name: match[1], action: match[2], body: match[3] }));

    // A tabela precisa ter as políticas esperadas (insert público + admin)
    expect(ordersPolicies.map(p => p.action).sort()).toEqual(['delete', 'insert', 'select', 'update']);

    // INSERT pode ser anônimo (o cliente cria o próprio pedido);
    // SELECT/UPDATE/DELETE jamais podem ser públicos.
    const vazamentos = ordersPolicies.filter(
      p => p.action !== 'insert' && /\bto\s+(anon|public)\b/.test(p.body)
    );
    expect(vazamentos).toEqual([]);

    // Acesso administrativo travado na conta específica (is_admin)
    expect(sql).toContain('create or replace function public.is_admin()');
    expect(ordersPolicies.filter(p => p.action !== 'insert').every(p => p.body.includes('is_admin()'))).toBe(true);

    // Coluna de prova de consentimento existe no schema
    expect(sql).toContain('lgpd_consent_at');
  });

  test('vercel.json publica headers de segurança e mantém o painel fora dos buscadores', () => {
    const vercel = readSource('/vercel.json');

    for (const header of [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
      'X-Robots-Tag'
    ]) {
      expect(vercel).toContain(header);
    }
    // Painel: noindex no header HTTP (o metatag já cobre o resto)
    expect(vercel.indexOf('painel-jb-2026')).toBeGreaterThan(-1);
  });

  test('site não carrega rastreadores nem cookies de terceiros', () => {
    // Sem gtag/analytics/fbq em nenhum ponto do app
    for (const rel of [
      '/src/main.jsx',
      '/src/admin-main.jsx',
      '/src/pages/menu.jsx',
      '/src/components/OrderModal.jsx',
      '/src/components/Header.jsx',
      '/src/components/MenuNav.jsx'
    ]) {
      const source = readSource(rel);
      expect(source).not.toMatch(/\b(gtag|fbq|analytics\.js|hotjar|clarity)\b/);
    }
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).not.toMatch(/googletagmanager|google-analytics|facebook\.net/);
  });
});
