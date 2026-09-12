// Testes brutos de lógica: spam de cliques, corridas e casos limite.
import {
  addItem,
  removeItem,
  calculateTotal,
  cartQuantity,
  formatWhatsAppMessage,
  MAX_QTY_PER_ITEM,
  PHONE
} from '../src/lib/cart.js';
import { formatPrice, getEffectivePrice } from '../src/lib/format.js';

const product = overrides => ({
  id: '1',
  name: 'Marmita Comercial',
  price: 22,
  promo_price: null,
  out_of_stock: false,
  ...overrides
});

describe('Condição de corrida: spam de cliques no "Pedir"', () => {
  test('1000 cliques não passam do limite por item e o total fica consistente', () => {
    let cart = {};
    for (let i = 0; i < 1000; i += 1) {
      cart = addItem(cart, product());
    }

    expect(cartQuantity(cart)).toBe(MAX_QTY_PER_ITEM);
    expect(cart['1'].qty).toBe(MAX_QTY_PER_ITEM);
    // Total = qty x preço, sem arredondamento quebrado por soma repetida
    expect(calculateTotal(cart)).toBeCloseTo(MAX_QTY_PER_ITEM * 22, 2);
  });

  test('1000 cliques em item PROMO usam sempre o preço promocional', () => {
    let cart = {};
    for (let i = 0; i < 1000; i += 1) {
      cart = addItem(cart, product({ promo_price: 18 }));
    }

    expect(cart['1'].price).toBe(18);
    expect(calculateTotal(cart)).toBeCloseTo(MAX_QTY_PER_ITEM * 18, 2);
  });

  test('cliques depois de esgotar o item são ignorados (corrida com realtime)', () => {
    // Simula o cardápio atualizando no meio do spam: o produto virou esgotado
    let cart = {};
    for (let i = 0; i < 100; i += 1) {
      cart = addItem(cart, product({ out_of_stock: i >= 50 }));
    }

    expect(cart['1'].qty).toBe(50);
  });

  test('ciclo extremo: 1000 cliques alternando + e - nunca deixa lixo no carrinho', () => {
    let cart = {};
    for (let i = 0; i < 1000; i += 1) {
      cart = addItem(cart, product());
      cart = removeItem(cart, '1');
    }

    expect(cart['1']).toBeUndefined();
    expect(cartQuantity(cart)).toBe(0);
    expect(calculateTotal(cart)).toBe(0);
  });

  test('50 cliques de remoção num carrinho com 1 item não gera quantidade negativa', () => {
    let cart = { '1': { id: '1', name: 'Marmita', price: 22, qty: 1 } };
    for (let i = 0; i < 50; i += 1) {
      cart = removeItem(cart, '1');
    }

    expect(cart['1']).toBeUndefined();
  });
});

describe('Casos limite de preço (dados do banco)', () => {
  test('promo_price 0 ou null NUNCA zera o preço do item', () => {
    expect(getEffectivePrice(product({ promo_price: 0 }))).toBe(22);
    expect(getEffectivePrice(product({ promo_price: null }))).toBe(22);
    expect(getEffectivePrice(product({ promo_price: undefined }))).toBe(22);
  });

  test('addItem com promo_price 0 não vende a marmita por R$ 0,00', () => {
    const cart = addItem({}, product({ promo_price: 0 }));
    expect(cart['1'].price).toBe(22);
  });

  test('addItem com promo_price string do banco funciona (Supabase manda texto)', () => {
    const cart = addItem({}, product({ promo_price: '18.50' }));
    expect(cart['1'].price).toBe(18.5);
  });

  test('item sem preço definido não entra no carrinho', () => {
    const cart = addItem({}, product({ price: undefined, promo_price: null }));
    expect(cart['1']).toBeUndefined();
  });

  test('preço formatado em BRL mantém centavos', () => {
    expect(formatPrice(19.9)).toContain('19,90');
    expect(formatPrice(0.05)).toContain('0,05');
  });
});

describe('Mensagem do WhatsApp sob stress', () => {
  test('pedido com 99 itens continua sendo uma URL válida e legível', () => {
    let cart = {};
    for (let i = 0; i < 1000; i += 1) {
      cart = addItem(cart, product({ id: '1' }));
      cart = addItem(cart, product({ id: '2', name: 'Suco de Laranja', price: 7 }));
    }

    const url = formatWhatsAppMessage(cart, 'Cliente', 'Rua Central, 10', PHONE);
    expect(url).toContain(`https://wa.me/${PHONE}?text=`);

    const message = decodeURIComponent(url.split('?text=')[1]);
    expect(message).toContain(`99x Marmita Comercial`);
    expect(message).toContain('*TOTAL:*');
    // URL completa dentro do limite prático do WhatsApp (~4096 caracteres)
    expect(url.length).toBeLessThan(4096);
  });
});
