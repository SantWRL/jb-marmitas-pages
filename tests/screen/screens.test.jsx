// Testes de tela (jsdom): cada tela renderiza e responde às ações principais.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App, CustomerAuth, OrderModal } from '../../src/main.jsx';
import { AdminApp, AdminLogin, ProductCard } from '../../src/admin-main.jsx';
import { sampleProducts, sampleOrders } from './setup.cjs';

// ----- Mock da camada de API (src/lib/api.js) -----
// As funções são criadas dentro da factory e configuradas depois
// através do módulo mockado.
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

import {
  fetchProducts,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  createProduct,
  updateProduct,
  signInAdmin,
  getSession
} from '../../src/lib/api.js';

beforeAll(() => {
  // jsdom não navega: o WhatsApp abriria em branco
  window.open = jest.fn(() => null);
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchProducts.mockResolvedValue(sampleProducts);
  fetchOrders.mockResolvedValue([]);
  getSession.mockResolvedValue(null);
});

describe('Tela: Site público (cardápio)', () => {
  test('mostra os produtos da categoria ativa com preço e promo', async () => {
    render(<App />);

    await waitFor(() =>
      expect(screen.getAllByText(/Marmita Comercial de Bife/)[0]).toBeInTheDocument()
    );
    expect(screen.getByText('R$ 16,90')).toBeInTheDocument(); // promo do p2
    expect(screen.getByText('PROMO')).toBeInTheDocument();
  });

  test('item esgotado aparece desabilitado com selo ESGOTADO', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Bebidas' }));

    await waitFor(() => expect(screen.getByText('Suco de Laranja 500ml')).toBeInTheDocument());
    expect(screen.getByText('ESGOTADO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pedir' })).toBeDisabled();
  });

  test('clicar em Pedir atualiza a barra do carrinho com quantidade e total', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Pedir' })[0]).toBeEnabled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Pedir' })[0]);
    expect(screen.getByText('1 item')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Pedir' })[0]);
    expect(screen.getByText('2 itens')).toBeInTheDocument();
    expect(screen.getByText('R$ 44,00')).toBeInTheDocument();
  });

  test('abre o modal de pedido a partir do carrinho', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Pedir' })[0]).toBeEnabled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Pedir' })[0]);
    fireEvent.click(screen.getByText('Enviar Pedido WhatsApp'));

    expect(screen.getByText('Dados para entrega')).toBeInTheDocument();
  });

  test('busca filtra pelos itens de todas as categorias', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Buscar no cardápio'), { target: { value: 'bife' } });
    expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument();
    expect(screen.queryByText('Suco de Laranja 500ml')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar no cardápio'), { target: { value: 'inexistente' } });
    expect(screen.getByText('Nada encontrado para essa busca.')).toBeInTheDocument();
  });

  test('ordenar por menor preço usa o preço promocional', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument());

    fireEvent.keyDown(screen.getByLabelText('Ordenar cardápio'), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Menor preço' }));
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 });
      expect(titles[0]).toHaveTextContent('Marmita Fit de Frango');
    });
  }, 60000);

  test('foto abre o modal de detalhes e adiciona ao carrinho', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Marmita Comercial de Bife' }));
    expect(screen.getByRole('dialog', { name: 'Marmita Comercial de Bife' })).toBeInTheDocument();
    // o selo aparece no card (fundo) e dentro do modal
    expect(screen.getAllByText('MAIS PEDIDO').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar/ }));
    expect(screen.getByText('1 item')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Marmita Comercial de Bife' })).not.toBeInTheDocument();
  });

  test('abre o modal de login do cliente', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Sua conta JB')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument();
  });
});

describe('Tela: Modal de pedido', () => {
  const cart = { p1: { id: 'p1', name: 'Marmita Comercial de Bife', price: 22, qty: 2 } };

  // Preenche a etapa de entrega (rua, número e bairro obrigatórios)
  const preencherEntrega = () => {
    fireEvent.change(screen.getByLabelText(/^Rua$/), { target: { value: 'Rua Central' } });
    fireEvent.change(screen.getByLabelText(/^Número$/), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/^Bairro$/), { target: { value: 'Junco' } });
  };

  test('mostra resumo e campos de entrega na primeira etapa', () => {
    render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);
    expect(screen.getByText(/2 itens no pedido/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 44,00/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Como vai receber/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Rua$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Número$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Bairro$/)).toBeInTheDocument();
    // As etapas seguintes só aparecem depois de avançar
    expect(screen.queryByLabelText(/Seu nome/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Forma de pagamento')).not.toBeInTheDocument();
  });

  test('retirada esconde campos de endereço', () => {
    render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Como vai receber/i), {
      target: { value: 'retirada' }
    });

    expect(screen.queryByLabelText(/^Rua$/)).not.toBeInTheDocument();
    expect(screen.getByText('Retirada no local')).toBeInTheDocument();
  });

  test('avança pelas etapas: entrega, identificação e pagamento', () => {
    render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);

    // Etapa 1 — endereço obrigatório para habilitar "Continuar"
    const continuar = screen.getByRole('button', { name: 'Continuar' });
    expect(continuar).toBeDisabled();
    preencherEntrega();
    fireEvent.click(continuar);

    // Etapa 2 — identificação (nome e WhatsApp obrigatórios)
    expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Seu WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/talher/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'JB' } });
    fireEvent.change(screen.getByLabelText(/Seu WhatsApp/i), {
      target: { value: '(99) 99999-9999' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Etapa 3 — pagamento em cartões clicáveis + revisão
    expect(screen.getByText('Forma de pagamento')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Pix' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Cartão de crédito' })).not.toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Cartão de crédito' }));
    expect(screen.getByRole('radio', { name: 'Cartão de crédito' })).toBeChecked();
    expect(screen.getByText('Revise seu pedido')).toBeInTheDocument();
    expect(screen.getByText('← Voltar')).toBeInTheDocument();
  });

  test('submit no meio do formulário avança etapa em vez de abrir o WhatsApp', () => {
    // Regressão do bug antigo: Enter no formulário pulava tudo e abria o
    // WhatsApp sem o cliente escolher a forma de pagamento.
    const { container } = render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);
    preencherEntrega();

    fireEvent.submit(container.querySelector('form'));

    // Foi para a etapa 2 (identificação) e NÃO abriu o WhatsApp
    expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });

  test('envia o pedido: salva no Supabase e abre o WhatsApp', async () => {
    createOrder.mockResolvedValue({ id: 'novo' });
    const onDone = jest.fn();
    render(<OrderModal cart={cart} onClose={() => {}} onDone={onDone} />);

    // Etapa 1 — entrega
    preencherEntrega();
    fireEvent.change(screen.getByLabelText(/Ponto de referência/i), {
      target: { value: 'Ao lado da praça' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Etapa 2 — identificação
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'JB' } });
    fireEvent.change(screen.getByLabelText(/Seu WhatsApp/i), {
      target: { value: '(99) 99999-9999' }
    });
    fireEvent.change(screen.getByLabelText(/talher/i), { target: { value: 'sim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Etapa 3 — pagamento, consentimento LGPD e envio
    fireEvent.click(screen.getByRole('radio', { name: 'Pix' }));
    // LGPD: sem o consentimento, o botão de envio não conclui o pedido
    fireEvent.click(screen.getByRole('button', { name: /Enviar pedido pelo WhatsApp/i }));
    await waitFor(() => expect(screen.getByText(/Autorize o uso dos seus dados/)).toBeInTheDocument());
    expect(createOrder).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/Autorizo o uso dos meus dados/i));
    fireEvent.click(screen.getByRole('button', { name: /Enviar pedido pelo WhatsApp/i }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder.mock.calls[0][0]).toMatchObject({
      customer_name: 'JB',
      customer_phone: '(99) 99999-9999',
      delivery_type: 'entrega',
      district: 'Junco',
      payment_method: 'pix',
      total: 44
    });
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/5599999042932'),
      '_blank'
    );
    expect(onDone).toHaveBeenCalled();
  });
});

describe('Tela: Login do cliente (Supabase)', () => {
  test('é apenas login: mostra erro do Supabase com senha errada', async () => {
    // Login-only: só o admin acessa por enquanto, então não há cadastro.
    render(<CustomerAuth onClose={() => {}} onSignedIn={() => {}} />);

    expect(screen.queryByText('Cadastro')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirmar senha')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('Tela: Login do admin', () => {
  test('exige email e senha e chama signInAdmin', async () => {
    signInAdmin.mockResolvedValue({ user: { id: 'u1' } });
    render(<AdminLogin onSignedIn={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Email do administrador/i), {
      target: { value: 'admin@jb.com' }
    });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'segredo' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar no painel/i }));

    await waitFor(() => expect(signInAdmin).toHaveBeenCalledWith('admin@jb.com', 'segredo'));
  });
});

describe('Tela: Painel admin — Pedidos', () => {
  beforeEach(() => {
    // AdminApp só mostra o painel com sessão ativa
    getSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@jb.com' } });
  });

  test('lista pedidos com itens, endereço, pagamento e total', async () => {
    fetchOrders.mockResolvedValue(sampleOrders);
    render(<AdminApp />);

    await waitFor(() => expect(screen.getByText('JB')).toBeInTheDocument());
    expect(screen.getByText(/2x Marmita Comercial de Bife/)).toBeInTheDocument();
    expect(screen.getByText(/Rua Central, 10/)).toBeInTheDocument();
    // o texto "Novo" aparece no selo de status e na option do dropdown
    expect(screen.getAllByText('Novo').length).toBeGreaterThan(0); // CSS deixa em maiúsculas visualmente
    expect(screen.getByText('R$ 44,00')).toBeInTheDocument();
  });

  test('badge de pedidos novos aparece na aba', async () => {
    fetchOrders.mockResolvedValue(sampleOrders);
    render(<AdminApp />);

    await waitFor(() => expect(screen.getByText(/Pedidos \(1 novos\)/)).toBeInTheDocument());
  });

  test('mudar status do pedido chama updateOrderStatus', async () => {
    fetchOrders.mockResolvedValue(sampleOrders);
    render(<AdminApp />);

    await waitFor(() => expect(screen.getByText('JB')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('Novo'), { target: { value: 'entregue' } });

    await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith('o1', 'entregue'));
  });
});

describe('Tela: Painel admin — Cardápio', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@jb.com' } });
  });

  test('cadastrar produto chama createProduct com dados do formulário', async () => {
    render(<AdminApp />);

    // aguarda a sessão resolver e o painel aparecer
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Cardápio/ })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /Cardápio/ }));
    fireEvent.change(screen.getByLabelText('Nome do Item:'), {
      target: { value: 'Marmita Nova' }
    });
    fireEvent.change(screen.getByLabelText('Descrição:'), { target: { value: 'Arroz e carne' } });
    fireEvent.change(screen.getByLabelText('Preço (R$):'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Item' }));

    await waitFor(() => expect(createProduct).toHaveBeenCalled());
    expect(createProduct.mock.calls[0][0]).toMatchObject({
      name: 'Marmita Nova',
      category: 'pratos',
      price: 25
    });
  });

  test('ProductCard marca esgotado via updateProduct', async () => {
    const onChanged = jest.fn();
    render(<ProductCard product={sampleProducts[0]} onChanged={onChanged} />);

    fireEvent.click(screen.getByLabelText(/Marcar como Esgotado/i));
    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith('p1', { out_of_stock: true }));
  });
});
