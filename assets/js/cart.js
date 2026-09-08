import { getEffectivePrice, formatPrice } from './db.js';

export function calculateTotal(cart) {
  return Object.values(cart).reduce((total, item) => total + (item.price * item.qty), 0);
}

export function addItem(cart, product) {
  if (product.outOfStock) return cart;
  
  const updatedCart = { ...cart };
  const price = getEffectivePrice(product);

  if (!updatedCart[product.id]) {
    updatedCart[product.id] = { name: product.name, price, qty: 0 };
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

export function formatWhatsAppMessage(cart, clientName, clientAddress, phone) {
  let message = "*NOVO PEDIDO DE MARMITA*\n\n";
  const total = calculateTotal(cart);

  for (const id in cart) {
    const item = cart[id];
    message += `• ${item.qty}x ${item.name} - ${formatPrice(item.qty * item.price)}\n`;
  }

  message += `\n*TOTAL:* ${formatPrice(total)}`;
  if (clientName) message += `\n\n*Cliente:* ${clientName}`;
  if (clientAddress) message += `\n*Endereço:* ${clientAddress}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}