import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../assets/css/style.css';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  signInAdmin,
  signOutAdmin,
  getSession,
  subscribeToOrders,
  subscribeToProducts
} from './lib/api.js';
import { formatPrice } from './lib/format.js';
import { supabaseConfigError } from './lib/supabase.js';
import { ConfigErrorScreen } from './lib/ConfigErrorScreen.jsx';

const PLACEHOLDER = 'assets/img/marmita-placeholder.svg';
const STATUS_OPTIONS = ['novo', 'aceito', 'entregue', 'cancelado'];
const STATUS_LABELS = { novo: 'Novo', aceito: 'Aceito', entregue: 'Entregue', cancelado: 'Cancelado' };

/* ---------------- Login ---------------- */

export function AdminLogin({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInAdmin(email, password);
      onSignedIn();
    } catch (err) {
      setError('Email ou senha incorretos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container">
      <section className="admin-login-card">
        <h2>Acesso restrito</h2>
        <p>Entre com sua conta de administrador para gerenciar o cardápio e os pedidos.</p>
        <form onSubmit={submit}>
          <label className="form-group">
            <span>Email do administrador</span>
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required />
          </label>
          <label className="form-group">
            <span>Senha</span>
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <p className="form-error" role="alert">{error}</p>
          <button type="submit" className="btn-submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar no painel'}</button>
        </form>
      </section>
    </main>
  );
}

/* ---------------- Formulário de novo produto ---------------- */

export function NewProductForm({ onCreated }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const submit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage('');
    try {
      const imageUrl = await uploadProductImage(imageFile);
      await createProduct({
        name: String(data.get('name') || '').trim(),
        description: String(data.get('description') || '').trim(),
        category: data.get('category'),
        price: Number(data.get('price')),
        image_url: imageUrl || PLACEHOLDER
      });
      form.reset();
      setImageFile(null);
      setMessage('Item cadastrado com sucesso!');
      onCreated();
    } catch (err) {
      console.error(err);
      setMessage('Erro ao cadastrar item: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-form-card">
      <h3>➕ Cadastrar Novo Item no Cardápio</h3>
      <form onSubmit={submit}>
        <div className="form-group"><label htmlFor="new-name">Nome do Item:</label><input id="new-name" name="name" placeholder="Ex: Marmita de Carne Assada" required /></div>
        <div className="form-group">
          <label htmlFor="new-category">Categoria:</label>
          <select id="new-category" name="category">
            <option value="pratos">Pratos do Dia</option>
            <option value="bebidas">Bebidas</option>
          </select>
        </div>
        <div className="form-group"><label htmlFor="new-desc">Descrição:</label><textarea id="new-desc" name="description" rows="2" placeholder="Ex: Arroz, feijão, purê e salada..." required /></div>
        <div className="form-group"><label htmlFor="new-price">Preço (R$):</label><input id="new-price" name="price" type="number" min="0.01" step="0.01" placeholder="20.00" required /></div>
        <div className="form-group">
          <label>Foto do Computador/Celular:</label>
          <input type="file" accept="image/*" onChange={event => setImageFile(event.target.files[0] || null)} />
        </div>
        <p className="form-error" role="alert">{message}</p>
        <button type="submit" className="btn-submit" disabled={busy}>{busy ? 'Enviando...' : 'Cadastrar Item'}</button>
      </form>
    </section>
  );
}

/* ---------------- Card de produto ---------------- */

export function ProductCard({ product, onChanged }) {
  const [busy, setBusy] = useState(false);

  const change = async updates => {
    setBusy(true);
    try {
      await updateProduct(product.id, updates);
      onChanged();
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Deseja realmente excluir "${product.name}"?`)) return;
    setBusy(true);
    try {
      await deleteProduct(product.id);
      onChanged();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`product-card ${product.out_of_stock ? 'out-of-stock' : ''}`}>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="price-box">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.promo_price && <span className="original-price">{formatPrice(product.promo_price)}</span>}
        </div>
        <div className="admin-controls">
          <label>
            <input
              type="checkbox"
              checked={product.out_of_stock}
              disabled={busy}
              onChange={event => change({ out_of_stock: event.target.checked })}
            />
            Marcar como Esgotado
          </label>
          <label>
            Preço Promo (R$):
            <input
              type="number"
              step="0.50"
              min="0"
              defaultValue={product.promo_price ?? ''}
              placeholder="15.00"
              disabled={busy}
              onBlur={event => {
                const value = parseFloat(event.target.value);
                const promo = Number.isFinite(value) && value > 0 ? value : null;
                if (promo !== product.promo_price) change({ promo_price: promo });
              }}
            />
          </label>
          <button className="btn-delete" onClick={remove} disabled={busy}>🗑️ Excluir Item</button>
        </div>
      </div>
      <img className="product-image" src={product.image_url || PLACEHOLDER} alt={product.name} loading="lazy" />
    </article>
  );
}

/* ---------------- Lista de pedidos ---------------- */

export function OrdersList({ orders, onChanged }) {
  if (orders.length === 0) {
    return <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum pedido recebido ainda.</p>;
  }

  const handleStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      onChanged();
    } catch (err) {
      alert('Erro ao atualizar pedido: ' + err.message);
    }
  };

  const handleDelete = async order => {
    if (!confirm(`Excluir o pedido de ${order.customer_name}?`)) return;
    try {
      await deleteOrder(order.id);
      onChanged();
    } catch (err) {
      alert('Erro ao excluir pedido: ' + err.message);
    }
  };

  return (
    <div className="orders-list">
      {orders.map(order => (
        <article className="order-card" key={order.id}>
          <div className="order-card-header">
            <strong>{order.customer_name}</strong>
            <span className={`order-status status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
          </div>
          <small>{new Date(order.created_at).toLocaleString('pt-BR')}</small>
          <ul className="order-items">
            {(order.items || []).map((item, index) => (
              <li key={index}>{item.qty}x {item.name} — {formatPrice(item.price * item.qty)}</li>
            ))}
          </ul>
          <p className="order-meta">
            {order.delivery_type === 'retirada'
              ? '🏠 Retirada no local'
              : `📍 ${order.address}${order.reference ? ` (ref.: ${order.reference})` : ''}`}
            {' • '}
            {order.cutlery ? '🍽️ Com talher' : 'Sem talher'}
            {' • '}
            {order.payment_method.toUpperCase()}
            {order.payment_details ? ` — ${order.payment_details}` : ''}
          </p>
          <div className="order-card-actions">
            <select value={order.status} onChange={event => handleStatus(order.id, event.target.value)}>
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
            </select>
            <strong>{formatPrice(order.total)}</strong>
            <button className="btn-delete" onClick={() => handleDelete(order)}>Excluir</button>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- App admin ---------------- */

export function AdminApp() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('pedidos');
  const [category, setCategory] = useState('pratos');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const [nextProducts, nextOrders] = await Promise.all([fetchProducts(), fetchOrders()]);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados: ' + err.message);
    }
  };

  useEffect(() => {
    getSession().then(current => {
      setSession(current);
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    loadAll();
    const unsubOrders = subscribeToOrders(loadAll);
    const unsubProducts = subscribeToProducts(loadAll);
    return () => { unsubOrders(); unsubProducts(); };
  }, [session]);

  if (supabaseConfigError) {
    return <ConfigErrorScreen />;
  }

  if (checking) {
    return <main className="container"><p style={{ padding: 40, textAlign: 'center' }}>Carregando...</p></main>;
  }

  if (!session) {
    return <AdminLogin onSignedIn={() => getSession().then(setSession)} />;
  }

  const visible = products.filter(item => item.category === category);
  const newOrders = orders.filter(order => order.status === 'novo').length;

  return (
    <>
      <header className="header-banner">
        <div className="hero-content">
          <span className="hashtag">PAINEL ADMINISTRATIVO</span>
          <h1>JB Marmitas</h1>
          <div className="hero-actions">
            <a className="hero-button hero-button-secondary" href="./index.html">⬅ Ver site</a>
            <button className="hero-button hero-button-primary" onClick={() => signOutAdmin()}>Sair</button>
          </div>
        </div>
      </header>

      <main className="container">
        <nav className="categories-bar">
          <button className={`category-btn ${tab === 'pedidos' ? 'active' : ''}`} onClick={() => setTab('pedidos')}>
            🧾 Pedidos {newOrders > 0 ? `(${newOrders} novos)` : ''}
          </button>
          <button className={`category-btn ${tab === 'cardapio' ? 'active' : ''}`} onClick={() => setTab('cardapio')}>
            🍱 Cardápio
          </button>
        </nav>

        {error && <p className="auth-error">{error}</p>}

        {tab === 'pedidos' ? (
          <section>
            <div className="admin-toolbar"><p>Pedidos feitos pelo site aparecem aqui em tempo real.</p></div>
            <OrdersList orders={orders} onChanged={loadAll} />
          </section>
        ) : (
          <>
            <NewProductForm onCreated={loadAll} />
            <nav className="categories-bar">
              <button className={`category-btn ${category === 'pratos' ? 'active' : ''}`} onClick={() => setCategory('pratos')}>Gerenciar Pratos</button>
              <button className={`category-btn ${category === 'bebidas' ? 'active' : ''}`} onClick={() => setCategory('bebidas')}>Gerenciar Bebidas</button>
            </nav>
            <div id="admin-menu-container">
              {visible.map(product => <ProductCard key={product.id} product={product} onChanged={loadAll} />)}
            </div>
          </>
        )}
      </main>
    </>
  );
}

// Monta a página apenas quando rodando no site (não em testes).
const rootNode = typeof document !== 'undefined' && document.getElementById('root');
if (rootNode) {
  createRoot(rootNode).render(<AdminApp />);
}
