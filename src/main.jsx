import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { fetchProducts, subscribeToProducts } from './lib/api.js';
import { addItem } from './lib/cart.js';
import { closedMessage, useBusinessHours } from './lib/hours.js';
import { supabaseConfigError } from './lib/supabase.js';
import { ConfigErrorScreen } from './lib/ConfigErrorScreen.jsx';
import Menu from './pages/menu.jsx';
import PrivacyPolicy from './pages/privacy.jsx';
import CartBar from './components/CartBar.jsx';
import ItemModal from './components/ItemModal.jsx';
import OrderModal from './components/OrderModal.jsx';
import CustomerAuth from './components/CustomerAuth.jsx';
import DefaultPage from './components/DefaultPage.jsx';
import Header from './components/Header.jsx';

// Reexportados para uso em testes e possíveis integrações.
export { CustomerAuth, OrderModal };

// Site público no estilo Aluroni: MenuNav + Header com foto de fundo,
// cardápio (busca, filtros, ordenador) e rodapé vermelho — com carrinho
// fixo, modal de detalhes, modal de pedido e login do cliente.
export function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Horário de funcionamento (11h às 14h): fora da janela, "Pedir" fica
  // desabilitado e nada entra no carrinho. O hook reavalia sozinho a cada
  // 30s, então a loja abre e fecha sem recarregar a página.
  const storeOpen = useBusinessHours();

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
      setError('');
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar o cardápio. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeToProducts(loadProducts);
    return () => unsubscribe();
  }, [loadProducts]);

  const addToCart = useCallback(
    (product) => {
      // Loja fechada = carrinho intocável (item nunca some do cardápio,
      // só o botão de pedir que não faz nada).
      if (!storeOpen || product.out_of_stock) return;
      setCart((current) => addItem(current, product));
    },
    [storeOpen]
  );

  const cartBar = useMemo(
    () => <CartBar cart={cart} onOpenOrderModal={() => setOrderModalOpen(true)} storeOpen={storeOpen} />,
    [cart, storeOpen]
  );

  if (supabaseConfigError) {
    return <ConfigErrorScreen />;
  }

  if (error) {
    return (
      <main className="menu-empty">
        <p className="auth-error" role="alert">{error}</p>
      </main>
    );
  }

  return (
    <BrowserRouter>
      {!storeOpen && (
        <div className="closed-banner" role="status">
          {closedMessage()}
        </div>
      )}
      <Routes>
        {/* Política de Privacidade (LGPD): própria página, sem carrinho. */}
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        {/* Menu dentro do DefaultPage: o rodapé (com os ícones sociais) só
            pode aparecer depois do cardápio, no fim da página. */}
        <Route
          path="*"
          element={
            <DefaultPage onAuthClick={() => setAuthOpen(true)}>
              <Header />
              <Menu
                products={products}
                loading={loading}
                onAdd={addToCart}
                onOpenDetails={setDetailItem}
              />
            </DefaultPage>
          }
        />
      </Routes>

      {cartBar}

      {detailItem && (
        <ItemModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAdd={addToCart}
        />
      )}

      {orderModalOpen && (
        <OrderModal
          cart={cart}
          onClose={() => setOrderModalOpen(false)}
          onDone={() => setCart({})}
        />
      )}

      {authOpen && (
        <CustomerAuth
          onClose={() => setAuthOpen(false)}
          onSignedIn={() => setAuthOpen(false)}
        />
      )}
    </BrowserRouter>
  );
}

// Monta a página apenas quando rodando no site (não em testes).
const rootNode = typeof document !== 'undefined' && document.getElementById('root');
if (rootNode) {
  createRoot(rootNode).render(supabaseConfigError ? <ConfigErrorScreen /> : <App />);
}
