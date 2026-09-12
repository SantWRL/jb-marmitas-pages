import { formatPrice } from './format.js';

const PHONE = '5599999042932';

// Limite por item: protege contra cliques descontrolados (ex.: o usuário
// apertar "Pedir" mil vezes) e mantém a mensagem do WhatsApp em tamanho
// aceitável. 99 marmitas já é muito para uma marmitaria.
export const MAX_QTY_PER_ITEM = 99;

export function calculateTotal(cart) {
  return Object.values(cart).reduce((total, item) => total + item.price * item.qty, 0);
}

export function cartQuantity(cart) {
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

export function addItem(cart, product) {
  if (product.out_of_stock) return cart;

  const updatedCart = { ...cart };

  // promo_price pode vir null, undefined ou string do banco: Number() cobre
  // tudo e NaN nunca passa no check de promocional.
  const promo = Number(product.promo_price);
  const price = Number(promo > 0 ? promo : product.price);
  if (!Number.isFinite(price)) return cart;

  const current = updatedCart[product.id];
  if (current && current.qty >= MAX_QTY_PER_ITEM) return updatedCart;

  if (!current) {
    updatedCart[product.id] = { id: product.id, name: product.name, price, qty: 0 };
  }

  updatedCart[product.id].qty += 1;
  return updatedCart;
}

export function removeItem(cart, productId) {
  const updatedCart = { ...cart };

  if (updatedCart[productId]) {
    updatedCart[productId].qty -= 1;
    if (updatedCart[productId].qty <= 0) {
      delete updatedCart[productId];
    }
  }

  return updatedCart;
}

export function formatWhatsAppMessage(
  cart,
  clientName,
  clientAddress,
  phone,
  paymentDetails = '',
  reference = '',
  cutlery = '',
  deliveryType = ''
) {
  let message = '*NOVO PEDIDO DE MARMITA*\n\n';
  const total = calculateTotal(cart);

  for (const id in cart) {
    const item = cart[id];
    message += `• ${item.qty}x ${item.name} - ${formatPrice(item.qty * item.price)}\n`;
  }

  message += `\n*TOTAL:* ${formatPrice(total)}`;
  if (clientName) message += `\n\n*Cliente:* ${clientName}`;

  if (deliveryType === 'retirada') {
    message += `\n*Entrega:* Retirada no local`;
  } else {
    if (clientAddress) message += `\n*Endereço:* ${clientAddress}`;
    if (reference) message += `\n*Ponto de referência:* ${reference}`;
  }

  if (cutlery) message += `\n*Talher:* ${cutlery}`;
  if (paymentDetails) message += `\n\n*Pagamento:* ${paymentDetails}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export { PHONE };
