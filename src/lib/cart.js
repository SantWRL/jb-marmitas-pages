import { formatPrice } from './format.js';

const PHONE = '558999195466';

export function calculateTotal(cart) {
  return Object.values(cart).reduce((total, item) => total + item.price * item.qty, 0);
}

export function cartQuantity(cart) {
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

export function addItem(cart, product) {
  if (product.out_of_stock) return cart;

  const updatedCart = { ...cart };
  const price = Number(product.promo_price > 0 ? product.promo_price : product.price);

  if (!updatedCart[product.id]) {
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
