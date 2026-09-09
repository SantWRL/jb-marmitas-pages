export function formatPrice(value) {
  const numericValue = Number(value);
  return (Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function getEffectivePrice(product) {
  return product.promo_price && product.promo_price > 0
    ? product.promo_price
    : product.price;
}

// Converte linhas do Supabase (snake_case) para o formato usado no carrinho
export function toCartItem(product) {
  return {
    id: product.id,
    name: product.name,
    price: Number(getEffectivePrice(product)),
    qty: 0
  };
}
