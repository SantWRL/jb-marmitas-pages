// Testes de colisão entre telas e estilos.
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { App, OrderModal } from '../../src/main.jsx';
import { AdminLogin } from '../../src/admin-main.jsx';

const readRoot = rel => readFileSync(new URL(`../..${rel}`, import.meta.url), 'utf8');

const findDuplicateIds = root => {
  const ids = {};
  root.querySelectorAll('[id]').forEach(el => {
    ids[el.id] = (ids[el.id] || 0) + 1;
  });
  return Object.entries(ids)
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
};

describe('Colisões de IDs no DOM', () => {
  test('Site público não tem IDs duplicados', () => {
    const { container } = render(<App />);
    const dupes = findDuplicateIds(container);
    expect(dupes).toEqual([]);
  });

  test('Site + modal de pedido juntos não têm IDs duplicados', () => {
    const cart = { p1: { id: 'p1', name: 'Marmita', price: 22, qty: 1 } };
    const { container } = render(
      <>
        <App />
        <OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />
      </>
    );
    expect(findDuplicateIds(container)).toEqual([]);
  });

  test('Login do admin não tem IDs duplicados', () => {
    const { container } = render(<AdminLogin onSignedIn={() => {}} />);
    expect(findDuplicateIds(container)).toEqual([]);
  });

  test('Páginas HTML do projeto não disputam o mesmo script/entry', () => {
    const index = readRoot('/index.html');
    const admin = readRoot('/painel-jb-2026.html');

    expect(index).toContain('/src/main.jsx');
    expect(index).not.toContain('/src/admin-main.jsx');

    expect(admin).toContain('/src/admin-main.jsx');
    expect(admin).not.toContain('/src/main.jsx');
  });
});

describe('Colisões de CSS', () => {
  const cssText = readRoot('/assets/css/style.css');

  test('Nenhum seletor é definido duas vezes com propriedades conflitantes (fora de media queries)', () => {
    // Mini-parser: extrai regras de nível superior (ignora @media e at-rules)
    // e compara propriedades quando o mesmo seletor aparece de novo.
    // Colisão real = mesmo seletor definindo a mesma propriedade com valores
    // diferentes (ex.: .modal-close colorido duas vezes, bug que este teste pegou).
    const rulesBySelector = {};
    const clean = cssText.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
    const ruleRegex = /(^|\})\s*([^{}@]+)\{([^{}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(clean))) {
      const selectorText = match[2].trim();
      const props = {};
      for (const propMatch of match[3].matchAll(/([a-z-]+)\s*:\s*([^;]+);?/g)) {
        props[propMatch[1]] = propMatch[2].trim();
      }
      for (const raw of selectorText.split(',')) {
        const selector = raw.trim().replace(/\s+/g, ' ');
        if (!selector.startsWith('.')) continue;
        rulesBySelector[selector] = rulesBySelector[selector] || [];
        rulesBySelector[selector].push(props);
      }
    }

    const conflicts = [];
    for (const [selector, ruleList] of Object.entries(rulesBySelector)) {
      for (let i = 1; i < ruleList.length; i += 1) {
        const shared = Object.keys(ruleList[i]).filter(
          prop => prop in ruleList[0] && ruleList[i][prop] !== ruleList[0][prop]
        );
        if (shared.length) conflicts.push(`${selector}: ${shared.join(', ')}`);
      }
      if (ruleList.length > 2) conflicts.push(`${selector}: definido ${ruleList.length}x`);
    }

    expect(conflicts).toEqual([]);
  });

  test('Camadas de sobreposição têm z-index único e em ordem crescente', () => {
    const layers = {};
    for (const match of cssText.matchAll(/\.([a-z-]+)[^{]*\{[^}]*?z-index:\s*(\d+)/g)) {
      layers[match[1]] = Number(match[2]);
    }

    expect(layers['categories-bar']).toBeLessThan(layers['cart-bar']);
    expect(layers['cart-bar']).toBeLessThan(layers['order-modal']);
    expect(layers['order-modal']).toBeLessThan(layers['auth-modal']);

    const values = Object.values(layers);
    expect(values).toEqual([...new Set(values)]);
  });

  test('Elementos fixos do site (cart-bar) não vazam para o painel admin', () => {
    const source = readRoot('/src/admin-main.jsx');
    expect(source).not.toContain('cart-bar');
    expect(source).not.toContain('cart-button');
  });

  test('Modal de autenticação usa classe distinta do modal de pedido', () => {
    expect(cssText).toMatch(/\.auth-modal\s*\{[^}]*position:\s*fixed/);
    expect(cssText).toMatch(/\.order-modal\s*\{[^}]*position:\s*fixed/);
  });
});

describe('Isolamento entre telas', () => {
  test('Renderizar o painel depois do site não deixa elementos do site no DOM', () => {
    const first = render(<App />);
    first.unmount();

    const second = render(<AdminLogin onSignedIn={() => {}} />);
    expect(screen.queryByText('A marmita mais recheada da região')).not.toBeInTheDocument();
    expect(screen.getByText('Acesso restrito')).toBeInTheDocument();
    second.unmount();
  });

  test('Modal de pedido fecha sem deixar resíduos no DOM', () => {
    const cart = { p1: { id: 'p1', name: 'Marmita', price: 22, qty: 1 } };
    const { unmount } = render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);
    expect(screen.getByText('Dados para entrega')).toBeInTheDocument();
    unmount();
    expect(document.querySelector('.order-dialog')).toBeNull();
  });
});
