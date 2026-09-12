import { calculateTotal, addItem, removeItem, cartQuantity, formatWhatsAppMessage, PHONE } from '../src/lib/cart.js';
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
  test('Deve gerar um pedido WhatsApp com o número e dados do cliente', () => {
    const cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    const url = formatWhatsAppMessage(cart, 'JB', 'Rua Central', PHONE);
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(url).toContain(`https://wa.me/${PHONE}?text=`);
    expect(message).toContain('*Cliente:* JB');
    expect(message).toContain('*Endereço:* Rua Central');
  });

  test('Deve mostrar retirada no local e omitir endereço', () => {
    const cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    const url = formatWhatsAppMessage(cart, 'JB', '', PHONE, '', '', 'Sim', 'retirada');
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain('*Entrega:* Retirada no local');
    expect(message).not.toContain('*Endereço:*');
  });

  test('Deve incluir pagamento, referência e talher', () => {
    const cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    const url = formatWhatsAppMessage(cart, 'JB', 'Rua Central', PHONE, 'Pix: 5599999042932', 'Próximo à praça', 'Sim', 'entrega');
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain('*Pagamento:* Pix: 5599999042932');
    expect(message).toContain('*Ponto de referência:* Próximo à praça');
    expect(message).toContain('*Talher:* Sim');
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
