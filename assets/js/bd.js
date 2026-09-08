const DB_KEY = 'marmitaria_products';

export const initialProducts = [
  {
    id: "1",
    category: "pratos",
    name: "Marmita Comercial de Bife",
    description: "Arroz branco, feijão tropeiro, bife acebolado, batata frita e salada.",
    price: 22.00,
    promoPrice: null,
    outOfStock: false,
    image: "assets/img/marmita-placeholder.svg"
  },
  {
    id: "2",
    category: "pratos",
    name: "Marmita Frango Grelhado Fit",
    description: "Arroz integral, feijão preto, filé de frango grelhado e legumes no vapor.",
    price: 19.90,
    promoPrice: null,
    outOfStock: false,
    image: "assets/img/marmita-placeholder.svg"
  },
  {
    id: "3",
    category: "bebidas",
    name: "Suco Natural de Laranja 500ml",
    description: "Suco 100% natural, sem adição de açúcar.",
    price: 7.00,
    promoPrice: null,
    outOfStock: false,
    image: "assets/img/marmita-placeholder.svg"
  }
];

export function getProducts() {
  if (typeof localStorage === 'undefined') return initialProducts;

  try {
    const storedProducts = JSON.parse(localStorage.getItem(DB_KEY));
    return Array.isArray(storedProducts) ? storedProducts : initialProducts;
  } catch {
    localStorage.removeItem(DB_KEY);
    return initialProducts;
  }
}

export function saveProducts(products) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(products));
  }
}

export function formatPrice(value) {
  const numericValue = Number(value);
  return (Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function getEffectivePrice(product) {
  return product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
}