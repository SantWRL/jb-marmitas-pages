// Testes de tela da loja FECHADA (fora das 11h-14h).
// O setup global congela o horário como ABERTO; aqui __setStoreOpen(false)
// vira o relógio da loja e __resetStoreOpen() volta ao estado padrão.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App, OrderModal } from '../../src/main.jsx';
import { __setStoreOpen, __resetStoreOpen } from '../../src/lib/hours.js';
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

import { fetchProducts, createOrder } from '../../src/lib/api.js';

beforeAll(() => {
  window.open = jest.fn(() => null);
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchProducts.mockResolvedValue(sampleProducts);
  __resetStoreOpen();
});

afterAll(() => {
  __resetStoreOpen();
});

describe('Loja fechada (fora das 11h-14h)', () => {
  test('hero mostra o selo "Fechado" com o horário', async () => {
    __setStoreOpen(false);
    render(<App />);

    await waitFor(() => expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument());
    expect(screen.getByText(/Fechado · pedidos das 11h às 14h/)).toBeInTheDocument();
    expect(screen.queryByText(/Aberto agora/)).not.toBeInTheDocument();
  });

  test('faixa de fechado aparece no topo da página', async () => {
    __setStoreOpen(false);
    render(<App />);

    await waitFor(() => expect(screen.getByText('Marmita Comercial de Bife')).toBeInTheDocument());
    expect(
      screen.getByText(/Estamos fechados agora\. Aceitamos pedidos das 11h às 14h/)
    ).toBeInTheDocument();
  });

  test('botão "Pedir" não adiciona nada ao carrinho', async () => {
    __setStoreOpen(false);
    render(<App />);

    const pedir = await screen.findAllByRole('button', { name: 'Pedir' });
    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(pedir[0]);
    }

    // Fechado, a barra não mostra contagem nem botão de envio — só o aviso.
    expect(screen.getByText('Fechado · aceitamos pedidos das 11h às 14h')).toBeInTheDocument();
    expect(screen.queryByText('Enviar Pedido WhatsApp')).not.toBeInTheDocument();
  });

  test('barra do carrinho mostra aviso de fechado no lugar do botão de envio', async () => {
    __setStoreOpen(false);
    render(<App />);

    await waitFor(() => expect(screen.getByText(/Fechado · aceitamos pedidos/)).toBeInTheDocument());
    // E continua fechado mesmo com algo no carrinho (restou de antes):
    fireEvent.click(await screen.findByRole('button', { name: 'Bebidas' }));
    expect(screen.queryByText('Enviar Pedido WhatsApp')).not.toBeInTheDocument();
  });

  test('modal aberto de antes não envia pedido fora do horário', async () => {
    __setStoreOpen(false);
    const cart = { p1: { id: 'p1', name: 'Marmita Comercial de Bife', price: 22, qty: 2 } };
    render(<OrderModal cart={cart} onClose={() => {}} onDone={() => {}} />);

    // Preenche tudo como se o cliente tivesse começado dentro do horário:
    fireEvent.change(screen.getByLabelText(/^Rua$/), { target: { value: 'Rua Central' } });
    fireEvent.change(screen.getByLabelText(/^Número$/), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/^Bairro$/), { target: { value: 'Junco' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'JB' } });
    fireEvent.change(screen.getByLabelText(/Seu WhatsApp/i), {
      target: { value: '(99) 99999-9999' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByLabelText(/Autorizo o uso dos meus dados/i));

    fireEvent.click(screen.getByRole('button', { name: /Enviar pedido pelo WhatsApp/i }));

    // Guard de horário: erro visível e NENHUM pedido no Supabase/WhatsApp.
    expect(await screen.findByText(/Pedidos apenas das 11h às 14h/)).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });

  test('com a loja ABERTA, o selo verde aparece e o fluxo normal funciona', async () => {
    __resetStoreOpen();
    render(<App />);

    // Espera o cardápio carregar antes de clicar em "Pedir".
    await screen.findByText('Marmita Comercial de Bife');
    expect(screen.getByText(/Aberto agora · 11h às 14h/)).toBeInTheDocument();
    expect(screen.queryByText(/Estamos fechados agora/)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Pedir' })[0]);
    expect(screen.getByText('1 item')).toBeInTheDocument();
    expect(screen.getByText('Enviar Pedido WhatsApp')).toBeInTheDocument();
  });
});
