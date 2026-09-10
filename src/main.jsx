import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { fetchProducts, subscribeToProducts } from './lib/api.js';
import { addItem } from './lib/cart.js';
import { supabaseConfigError } from './lib/supabase.js';
import { ConfigErrorScreen } from './lib/ConfigErrorScreen.jsx';
import Menu from './pages/menu.jsx';
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

  const addToCart = useCallback((product) => {
    setCart((current) => addItem(current, product));
  }, []);

  const cartBar = useMemo(
    () => <CartBar cart={cart} onOpenOrderModal={() => setOrderModalOpen(true)} />,
    [cart]
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
      <DefaultPage onAuthClick={() => setAuthOpen(true)}>
        <Header />

      {cartBar}

      <Menu
        products={products}
        loading={loading}
        onAdd={addToCart}
        onOpenDetails={setDetailItem}
      />

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
      </DefaultPage>
    </BrowserRouter>
  );
}

// Monta a página apenas quando rodando no site (não em testes).
const rootNode = typeof document !== 'undefined' && document.getElementById('root');
if (rootNode) {
  createRoot(rootNode).render(supabaseConfigError ? <ConfigErrorScreen /> : <App />);
}
