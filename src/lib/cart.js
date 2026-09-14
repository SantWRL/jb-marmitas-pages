import { formatPrice } from './format.js';

const PHONE = '5599999042932';

// Limite por item: protege contra cliques descontrolados (ex.: o usuário
// apertar "Pedir" mil vezes) e mantém a mensagem do WhatsApp em tamanho
// aceitável. 99 marmitas já é muito para uma marmitaria.
export const MAX_QTY_PER_ITEM = 99;

export function calculateTotal(cart) {
  return Object.values(cart).reduce((total, item) => total + item.price * item.qty, 0);
}

// Taxa fixa de entrega cobrada em todo pedido com entrega (retirada não
// paga). Usada no resumo do modal, no total salvo no Supabase e na
// mensagem do WhatsApp.
export const DELIVERY_FEE = 7;

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

// Cidade usada no link do Google Maps (o cliente só digita rua e bairro).
const CITY = 'Balsas MA';

// Link "como chegar" do Google Maps com o endereço do cliente.
// Cada campo vai numa parte própria da query (?q=rua, número, bairro, cidade)
// para o Google achar certo mesmo com endereços incompletos.
export function buildMapsLink({ street = '', number = '', district = '', reference = '' }) {
  const addressParts = [street.trim(), number.trim(), district.trim(), reference.trim()].filter(Boolean);
  if (!addressParts.length) return '';
  addressParts.push(CITY);
  return `https://maps.google.com/?q=${encodeURIComponent(addressParts.join(', '))}`;
}

// Converte "(89) 99919-5466" em "5589999195466" (formato wa.me).
export function formatCustomerPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

// Formata o número do pedido com 3 dígitos: 224 -> "224", 7 -> "007".
export function formatOrderNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  return String(Math.floor(num)).padStart(3, '0');
}

// Monta a mensagem final do WhatsApp no formato oficial do painel:
//
//   #### NOVO PEDIDO ####
//   #️⃣ Nº pedido: 007
//   feito em 07/09/2026 22:52
//   👤 Teresa geovana
//   📞 (89) 99919-5466
//   🛵 Endereço de entrega ...
//   📍 https://maps.google.com/?q=...
//   ------- ITENS DO PEDIDO -------
//   *1 x Marmita* ...
//   💵 1 x R$ 22,00 = R$ 22,00
//   -------------------------------
//   SUBTOTAL: R$ 22,00
//   ENTREGA: R$ 7,00
//   *VALOR FINAL: R$ 29,00*
//   PAGAMENTO: *Pix*: R$ 22,00
//   🕐 Prazo para entrega: 30 a 40 min
export function formatWhatsAppMessage({
  cart,
  orderNumber,
  orderDate,
  customerName,
  customerPhone,
  deliveryType = 'entrega',
  street = '',
  number = '',
  district = '',
  reference = '',
  complement = '',
  paymentMethod,
  paymentDetails = '',
  // Padrão: taxa fixa de entrega. Retirada passa deliveryFee: 0.
  deliveryFee = DELIVERY_FEE,
  deliveryTime = '30 a 40 min'
}) {
  const total = calculateTotal(cart);
  // Retirada nunca paga taxa, mesmo se alguém passar deliveryFee por engano.
  const fee = deliveryType === 'retirada' ? 0 : deliveryFee;
  const when = orderDate || new Date();
  // "07/09/2026 22:52" — data e hora separadas porque o toLocaleString
  // completo interpõe uma vírgula entre elas.
  const dateLabel = `${when.toLocaleDateString('pt-BR')} ${when.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  const lines = [];
  lines.push('#### NOVO PEDIDO ####');
  if (orderNumber) lines.push(`#️⃣ Nº pedido: ${formatOrderNumber(orderNumber) || orderNumber}`);
  lines.push(`feito em ${dateLabel}`);

  if (customerName) lines.push(`👤 ${customerName}`);

  const phoneDigits = formatCustomerPhone(customerPhone);
  if (phoneDigits) {
    const local = phoneDigits.replace(/^55/, '');
    const ddd = local.slice(0, 2);
    const rest = local.length > 10 ? `${local.slice(2, 7)}-${local.slice(7)}` : `${local.slice(2, 6)}-${local.slice(6)}`;
    lines.push(`📞 (${ddd}) ${rest}`);
  }

  if (deliveryType === 'retirada') {
    lines.push('🏠 Retirada no local');
  } else {
    lines.push('🛵 Endereço de entrega');
    const streetLine = [street.trim(), number.trim()].filter(Boolean).join(', ');
    if (streetLine) lines.push(streetLine);
    if (complement.trim()) lines.push(`Complemento: ${complement.trim()}`);
    if (district.trim()) lines.push(`Bairro: ${district.trim()}`);
    if (reference.trim()) lines.push(`(${reference.trim()})`);
    const maps = buildMapsLink({ street, number, district, reference });
    if (maps) {
      lines.push('Link do endereço:');
      lines.push(maps);
    }
  }

  lines.push('------- ITENS DO PEDIDO -------');
  for (const item of Object.values(cart)) {
    lines.push(`*${item.qty} x ${item.name}*`);
    lines.push(`💵 ${item.qty} x ${formatPrice(item.price)} = ${formatPrice(item.qty * item.price)}`);
  }

  lines.push('-------------------------------');
  lines.push(`SUBTOTAL: ${formatPrice(total)}`);
  lines.push(`ENTREGA: ${formatPrice(fee)}`);
  lines.push(`*VALOR FINAL: ${formatPrice(total + fee)}*`);

  lines.push('PAGAMENTO');
  lines.push(`*${paymentDetails || paymentMethod || 'A combinar'}*: ${formatPrice(total + fee)}`);

  if (deliveryType !== 'retirada') {
    lines.push(`🕐 Prazo para entrega: ${deliveryTime}`);
  }

  const message = lines.join('\n');
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

export { PHONE };
