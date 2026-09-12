// Testes de tela: spam de cliques na UI real, corrida de duplo envio,
// integração CSS↔JSX (toda classe usada existe) e layout mobile.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { App, OrderModal } from '../../src/main.jsx';
import { AdminLogin } from '../../src/admin-main.jsx';
import { sampleProducts } from './setup.cjs';

jest.mock('../../src/lib/api.js', () => ({
  fetchProducts: jest.fn(),
  fetchOrders: jest.fn(),
  createOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  deleteOrder: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  uploadProductImage: jest.fn(),
  signInAdmin: jest.fn(),
  signOutAdmin: jest.fn(),
  getSession: jest.fn(),
  subscribeToOrders: jest.fn(() => () => {}),
  subscribeToProducts: jest.fn(() => () => {})
}));

import { fetchProducts, createOrder, getSession } from '../../src/lib/api.js';

// Base = pasta jb-marmitas-pages/ (tests/screen/ sobe dois níveis)
const readApp = rel => readFileSync(new URL(`../..${rel}`, import.meta.url), 'utf8');
// Base = raiz do repo (sobe três níveis)
const readRoot = rel => readFileSync(new URL(`../../..${rel}`, import.meta.url), 'utf8');

// Normaliza espaços para os regex funcionarem em código multilinha
const readSource = rel => readApp(rel).replace(/\s+/g, ' ');

beforeAll(() => {
  window.open = jest.fn(() => ({}));
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchProducts.mockResolvedValue(sampleProducts);
  getSession.mockResolvedValue(null);
});

describe('Condição de corrida: spam de cliques na interface real', () => {
  test('1000 cliques em "Pedir" param no limite de 99 e a barra fica correta', async () => {
    render(<App />);
    const pedir = await screen.findAllByRole('button', { name: 'Pedir' });
    const button = pedir[0];

    for (let i = 0; i < 1000; i += 1) {
      fireEvent.click(button);
    }

    expect(screen.getByText('99 itens')).toBeInTheDocument();
    // 99 x R$ 22,00 (promo do sample p1 é null, preço cheio)
    expect(screen.getByText('R$ 2.178,00')).toBeInTheDocument();
  }, 60000);

  test('cliques em "Pedir" de item esgotado não mudam o carrinho', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Bebidas' }));

    const pedir = await screen.findAllByRole('button', { name: 'Pedir' });
    expect(pedir[0]).toBeDisabled();

    for (let i = 0; i < 50; i += 1) {
      fireEvent.click(pedir[0]);
    }
    expect(screen.getByText('0 itens')).toBeInTheDocument();
  });

  test('duplo envio do pedido cria UM pedido no Supabase, não dois', async () => {
    createOrder.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ id: 'novo' }), 50))
    );

    const cart = { p1: { id: 'p1', name: 'Marmita Comercial de Bife', price: 22, qty: 2 } };
    render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);

    // Etapa 1
    fireEvent.change(screen.getByLabelText(/Endereço em Balsas/i), {
      target: { value: 'Rua Central, 10' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Etapa 2
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'JB' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Etapa 3: spam de 20 cliques enquanto o envio está em voo
    const enviar = screen.getByRole('button', { name: /Enviar pedido pelo WhatsApp/i });
    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(enviar);
    }

    await waitFor(() => expect(createOrder).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(createOrder).toHaveBeenCalledTimes(1);
  });
});

describe('Integração CSS↔JSX: toda classe usada existe na folha de estilo', () => {
  const collectClassLiterals = jsxSource => {
    const found = new Set();
    // className="..." (literal puro) — cobre os componentes da loja.
    // Só tokens no formato de classe CSS passam (descarta lixo de
    // template literals como ${...}, operadores e aspas).
    for (const match of jsxSource.matchAll(/className="([^"]+)"/g)) {
      match[1]
        .split(/\s+/)
        .filter(token => /^[a-z][a-z0-9-]*$/.test(token))
        .forEach(cls => found.add(cls));
    }
    return found;
  };

  test('classes do modal de pedido existem no CSS', () => {
    const jsx = readSource('/src/components/OrderModal.jsx');
    const css = readSource('/assets/css/style.css') + readSource('/src/styles/global.css');

    const reallyMissing = [...collectClassLiterals(jsx)].filter(cls => !css.includes(`.${cls}`));
    expect(reallyMissing).toEqual([]);
  });

  test('classes dos modais e do carrinho existem no CSS', () => {
    const css =
      readSource('/assets/css/style.css') + readSource('/src/styles/global.css');

    for (const file of ['/src/components/ItemModal.jsx', '/src/components/CartBar.jsx']) {
      const missing = [...collectClassLiterals(readSource(file))].filter(
        cls => !css.includes(`.${cls}`)
      );
      expect({ file, missing }).toEqual({ file, missing: [] });
    }
  });

  test('todas as variáveis CSS usadas estão definidas em :root', () => {
    const css = readSource('/assets/css/style.css');
    const defined = new Set([...css.matchAll(/(--[a-z-]+)\s*:/g)].map(m => m[1]));

    const used = new Set();
    for (const match of css.matchAll(/var\((--[a-z-]+)\)/g)) used.add(match[1]);

    const undefinedVars = [...used].filter(name => !defined.has(name));
    expect(undefinedVars).toEqual([]);
  });

  test('z-index das camadas sobrepostas permanece único e ordenado', () => {
    const css = readSource('/assets/css/style.css');
    const layers = {};
    for (const match of css.matchAll(/\.([a-z-]+)[^{]*\{[^}]*?z-index:\s*(\d+)/g)) {
      layers[match[1]] = Number(match[2]);
    }

    // Detalhe do item abre por cima do cardápio; checkout por cima dele;
    // login do cliente fica no topo de tudo.
    expect(layers['categories-bar']).toBeLessThan(layers['cart-bar']);
    expect(layers['cart-bar']).toBeLessThan(layers['detail-modal']);
    expect(layers['detail-modal']).toBeLessThan(layers['order-modal']);
    expect(layers['order-modal']).toBeLessThan(layers['auth-modal']);

    const values = Object.values(layers);
    expect(values).toEqual([...new Set(values)]);
  });
});

describe('Regra de negócio: o site é só de marmita comum (sem "fit")', () => {
  test('nenhum produto do cardápio oficial é "fit"', () => {
    const sql = readApp('/supabase/schema.sql').toLowerCase();

    expect(sql).not.toContain('fit');
  });

  test('nenhum texto da interface usa "fit" (ex.: "Marmita Fit")', () => {
    const files = [
      '/src/main.jsx',
      '/src/admin-main.jsx',
      '/src/pages/menu.jsx',
      '/src/components/Items/Items.jsx',
      '/src/components/Items/Item.jsx',
      '/src/components/ItemModal.jsx',
      '/src/components/OrderModal.jsx',
      '/src/components/CartBar.jsx',
      '/src/components/Header.jsx',
      '/src/components/MenuNav.jsx',
      '/src/components/CustomerAuth.jsx'
    ];

    const offenders = files
      .map(file => ({ file, hit: /marmita\s*fit/i.exec(readSource(file)) }))
      .filter(({ hit }) => hit);

    expect(offenders).toEqual([]);
  });

  test('dados de teste oficiais não têm item "fit" (amostra de tela atualizada)', () => {
    render(<App />);
    return waitFor(() =>
      expect(screen.queryByText(/marmita\s*fit/i)).not.toBeInTheDocument()
    );
  });
});

describe('Deploy e estrutura do projeto', () => {
  test('workflow de deploy existe na raiz deste repo (único lugar que o GitHub lê)', () => {
    const wf = readApp('/.github/workflows/deploy.yml');

    expect(wf).toContain('npm test');
    expect(wf).toContain('path: dist');
    expect(wf).toContain('VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}');
  });

  test('restos do site antigo não sobraram em nenhuma raiz', () => {
    // Repo do app: nunca pode ter adm.html nem admin.js do site antigo
    expect(() => readApp('/adm.html')).toThrow();
    expect(() => readApp('/assets/js/admin.js')).toThrow();
    expect(() => readApp('/assets/js/client.js')).toThrow();
    // Pasta externa (wrapper): sem index.html/package.json do site antigo
    for (const rel of ['/index.html', '/adm.html', '/package.json']) {
      expect(() => readRoot(rel)).toThrow();
    }
  });

  test('placeholder de imagem aponta para caminho que existe no build', () => {
    expect(() => readApp('/assets/img/marmita-placeholder.svg')).not.toThrow();
    expect(() => readApp('/public/assets/img/marmita-placeholder.svg')).not.toThrow();
  });
});
