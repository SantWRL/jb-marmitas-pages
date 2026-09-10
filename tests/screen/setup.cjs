// Configuração compartilhada dos testes de tela.
// Roda com babel (CJS) dentro do projeto "screen" do Jest.

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Cardápio de exemplo (formato snake_case, igual às linhas do Supabase).
export const sampleProducts = [
  {
    id: 'p1',
    name: 'Marmita Comercial de Bife',
    description: 'Arroz, feijão tropeiro, bife e salada.',
    category: 'pratos',
    price: 22,
    promo_price: null,
    out_of_stock: false,
    best_seller: true,
    image_url: 'assets/img/marmita-placeholder.svg'
  },
  {
    id: 'p2',
    name: 'Marmita Fit de Frango',
    description: 'Arroz integral, frango grelhado e legumes.',
    category: 'pratos',
    price: 19.9,
    promo_price: 16.9,
    out_of_stock: false,
    best_seller: false,
    image_url: 'assets/img/marmita-placeholder.svg'
  },
  {
    id: 'p3',
    name: 'Suco de Laranja 500ml',
    description: 'Suco natural sem açúcar.',
    category: 'bebidas',
    price: 7,
    promo_price: null,
    out_of_stock: true,
    best_seller: false,
    image_url: 'assets/img/marmita-placeholder.svg'
  }
];

export const sampleOrders = [
  {
    id: 'o1',
    created_at: '2026-09-09T12:00:00Z',
    status: 'novo',
    customer_name: 'Teresa',
    delivery_type: 'entrega',
    address: 'Rua Central, 10',
    reference: 'Próximo à praça',
    cutlery: true,
    payment_method: 'pix',
    payment_details: 'Pix: 558999195466',
    total: 44,
    items: [{ id: 'p1', name: 'Marmita Comercial de Bife', price: 22, qty: 2 }]
  }
];
