import { calculateTotal, addItem, removeItem, formatWhatsAppMessage } from '../assets/js/cart.js';
import { formatPrice, getEffectivePrice } from '../assets/js/db.js';
import { readFileSync } from 'node:fs';

describe('Suíte de Testes Automatizados - Marmitaria', () => {

  test('Deve calcular o valor total do carrinho corretamente', () => {
    const cart = {
      '1': { price: 22.00, qty: 2 },
      '2': { price: 15.00, qty: 1 }
    };
    expect(calculateTotal(cart)).toBe(59.00);
  });

  test('Deve aplicar o preço promocional quando disponível', () => {
    const product = { id: '1', price: 20.00, promoPrice: 15.00 };
    expect(getEffectivePrice(product)).toBe(15.00);
  });

  test('Não deve adicionar item ao carrinho se estiver esgotado', () => {
    const product = { id: '3', outOfStock: true, price: 10.00 };
    const cart = {};
    const updatedCart = addItem(cart, product);
    expect(updatedCart['3']).toBeUndefined();
  });

  test('Deve formatar o preço em BRL corretamente', () => {
    const formatted = formatPrice(19.90);
    expect(formatted.replace(/\s/g, ' ')).toContain('R$');
    expect(formatted).toContain('19,90');
  });

  test('Deve remover item do carrinho se a quantidade chegar a 0', () => {
    let cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    cart = removeItem(cart, '1');
    expect(cart['1']).toBeUndefined();
  });

  test('Deve gerar um pedido WhatsApp com o número e dados do cliente', () => {
    const cart = { '1': { name: 'Marmita', price: 20, qty: 1 } };
    const url = formatWhatsAppMessage(cart, 'Teresa', 'Rua Central', '558999195466');
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(url).toContain('https://wa.me/558999195466?text=');
    expect(message).toContain('*Cliente:* Teresa');
    expect(message).toContain('*Endereço:* Rua Central');
    expect(message).not.toContain('*PAGAMENTO VIA PIX:*');

    const pixUrl = formatWhatsAppMessage(cart, 'Teresa', 'Rua Central', '558999195466', 'Pix: 558999195466. Vou enviar o comprovante nesta conversa.');
    expect(decodeURIComponent(pixUrl.split('?text=')[1])).toContain('comprovante nesta conversa');

    const cardUrl = formatWhatsAppMessage(cart, 'Teresa', 'Rua Central', '558999195466', 'Cartão. Favor confirmar a cobrança pelo WhatsApp.');
    expect(decodeURIComponent(cardUrl.split('?text=')[1])).toContain('confirmar a cobrança pelo WhatsApp');

    const cashUrl = formatWhatsAppMessage(cart, 'Teresa', 'Rua Central', '558999195466', 'Dinheiro. Troco para: R$ 50,00');
    expect(decodeURIComponent(cashUrl.split('?text=')[1])).toContain('Troco para: R$ 50,00');

    const deliveryUrl = formatWhatsAppMessage(cart, 'Teresa', 'Rua Central', '558999195466', '', 'Próximo à praça', 'Sim');
    const deliveryMessage = decodeURIComponent(deliveryUrl.split('?text=')[1]);
    expect(deliveryMessage).toContain('*Ponto de referência:* Próximo à praça');
    expect(deliveryMessage).toContain('*Talher:* Sim');
  });

  test('Deve manter os links públicos essenciais no site', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    expect(html).toContain('https://wa.me/558999195466');
    expect(html).not.toContain('santwrl.github.io/SantWRL');
    expect(html).toContain('Pedir pelo WhatsApp');
    expect(html).toContain('assets/img/logo-jb-marmitas.jpeg');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="theme-color" content="#121212"');
    expect(html).toContain('Pedir agora');
    expect(html).toContain('Ver cardápio');
    expect(html).toContain('id="order-form"');
    expect(html).toContain('Endereço em Balsas - MA');
    expect(html).toContain('Ponto de referência');
    expect(html).toContain('Vai querer talher?');
    expect(html).toContain('Pix: 558999195466');
    expect(html).toContain('Vai precisar de troco para quanto?');
  });

});