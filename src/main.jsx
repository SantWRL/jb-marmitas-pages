import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../assets/css/style.css';
import { supabase, supabaseConfigError } from './lib/supabase.js';
import { ConfigErrorScreen } from './lib/ConfigErrorScreen.jsx';
import { fetchProducts, createOrder, getSession, subscribeToProducts } from './lib/api.js';
import {
  calculateTotal,
  cartQuantity,
  addItem,
  removeItem,
  formatWhatsAppMessage,
  PHONE
} from './lib/cart.js';
import { formatPrice, getEffectivePrice } from './lib/format.js';

const PLACEHOLDER = 'assets/img/marmita-placeholder.svg';

/* ---------------- Autenticação do cliente (Supabase) ---------------- */

export function CustomerAuth({ onClose, onSignedIn }) {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '' });

  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tab === 'register') {
        if (form.password !== form.confirmation) {
          setError('As senhas não conferem.');
          return;
        }
        if (!form.name) {
          setError('Informe seu nome completo.');
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } }
        });
        if (error) throw error;
        alert('Conta criada! Confirme pelo email que enviamos (se pedido) e faça login.');
        setTab('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) throw error;
        onSignedIn(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-modal" role="presentation" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">&times;</button>
        <h2 id="auth-title">Sua conta JB</h2>
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Login</button>
          <button type="button" className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Cadastro</button>
        </div>
        <form onSubmit={submit}>
          {tab === 'register' && (
            <label className="auth-field">Nome completo<br />
              <input name="name" value={form.name} onChange={update} required />
            </label>
          )}
          <label className="auth-field">Email
            <input name="email" type="email" value={form.email} onChange={update} required />
          </label>
          <label className="auth-field">Senha
            <input name="password" type="password" value={form.password} onChange={update} minLength="6" required />
          </label>
          {tab === 'register' && (
            <label className="auth-field">Confirmar senha<br />
              <input name="confirmation" type="password" value={form.confirmation} onChange={update} minLength="6" required />
            </label>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button className="submit-auth" type="submit" disabled={busy}>
            {busy ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ---------------- Modal de pedido ---------------- */

export function OrderModal({ cart, onClose, onDone }) {
  const [delivery, setDelivery] = useState('');
  const [payment, setPayment] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', reference: '', cutlery: '', change: '' });
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    const isRetirada = delivery === 'retirada';
    const details =
      payment === 'pix' ? 'Pix: 558999195466. Vou enviar o comprovante nesta conversa.' :
      payment === 'cartao' ? 'Cartão. Favor confirmar a cobrança pelo WhatsApp.' :
      `Dinheiro. Troco para: ${form.change}`;

    const items = Object.values(cart).map(item => ({
      id: item.id, name: item.name, price: item.price, qty: item.qty
    }));

    try {
      // salva o pedido no Supabase para o admin acompanhar
      await createOrder({
        customer_name: form.name,
        customer_email: null,
        delivery_type: delivery,
        address: isRetirada ? null : form.address,
        reference: isRetirada ? null : form.reference,
        cutlery: form.cutlery === 'sim',
        payment_method: payment,
        payment_details: details,
        total: calculateTotal(cart),
        items
      });
    } catch (err) {
      console.error('Falha ao salvar pedido:', err);
      // segue para o WhatsApp mesmo se o banco falhar
    }

    const url = formatWhatsAppMessage(
      cart,
      form.name,
      isRetirada ? '' : form.address,
      PHONE,
      details,
      isRetirada ? '' : form.reference,
      form.cutlery === 'sim' ? 'Sim' : 'Não',
      delivery
    );
    onDone();
    window.open(url, '_blank');
  };

  return (
    <div className="order-modal">
      <section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">&times;</button>
        <span className="hashtag">FINALIZE SEU PEDIDO</span>
        <h2 id="order-title">Dados para entrega</h2>
        <p className="order-summary">
          {cartQuantity(cart)} {cartQuantity(cart) === 1 ? 'item' : 'itens'} no pedido • {formatPrice(calculateTotal(cart))}
        </p>
        <form onSubmit={submit}>
          <label className="order-field">Como vai receber seu pedido?
            <select value={delivery} onChange={event => setDelivery(event.target.value)} required>
              <option value="">Selecione uma opção</option>
              <option value="entrega">Quero entrega</option>
              <option value="retirada">Vou retirar no local</option>
            </select>
          </label>
          <label className="order-field">Seu nome<br /><input name="name" value={form.name} onChange={update} required /></label>
          {delivery !== 'retirada' && (
            <>
              <label className="order-field">Endereço em Balsas - MA<br />
                <input name="address" value={form.address} onChange={update} placeholder="Rua, número e bairro" required={delivery === 'entrega'} />
              </label>
              <label className="order-field">Ponto de referência<br />
                <input name="reference" value={form.reference} onChange={update} placeholder="Ex.: próximo à praça" required={delivery === 'entrega'} />
              </label>
            </>
          )}
          {delivery === 'retirada' && (
            <div className="payment-note"><strong>Retirada no local</strong><span>Combine o horário de retirada pelo WhatsApp.</span></div>
          )}
          <label className="order-field">Vai querer talher?
            <select value={form.cutlery} onChange={event => setForm({ ...form, cutlery: event.target.value })} required>
              <option value="">Selecione uma opção</option>
              <option value="sim">Sim, quero talher</option>
              <option value="nao">Não preciso de talher</option>
            </select>
          </label>
          <label className="order-field">Forma de pagamento
            <select value={payment} onChange={event => setPayment(event.target.value)} required>
              <option value="">Selecione uma opção</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </label>
          {payment === 'pix' && <div className="payment-note"><strong>Pix: 558999195466</strong><span>Envie o comprovante nesta conversa depois do pagamento.</span></div>}
          {payment === 'cartao' && <div className="payment-note">Ao escolher cartão, confirme a forma de pagamento pelo WhatsApp.</div>}
          {payment === 'dinheiro' && (
            <label className="order-field">Vai precisar de troco para quanto?
              <input value={form.change} onChange={update} name="change" inputMode="decimal" placeholder="Ex.: R$ 50,00" required />
            </label>
          )}
          <button className="submit-order" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar pedido pelo WhatsApp'}</button>
        </form>
      </section>
    </div>
  );
}

/* ---------------- App ---------------- */

export function App() {
  const [category, setCategory] = useState('pratos');
  const [cart, setCart] = useState({});
  const [auth, setAuth] = useState(false);
  const [order, setOrder] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState(null);

  const loadProducts = async () => {
    try {
      setProducts(await fetchProducts());
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('Não foi possível carregar o cardápio. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // cardápio atualiza sozinho quando o admin muda algo
    const unsubscribe = subscribeToProducts(loadProducts);
    return unsubscribe;
  }, []);

  useEffect(() => {
    getSession().then(setUser);
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const visible = products.filter(item => item.category === category);
  const quantity = cartQuantity(cart);

  return (
    <>
      <header className="header-banner">
        <div className="hero-content">
          <span className="hashtag">#MARMITADEVERDADE</span>
          <h1>A MARMITA MAIS RECHEADA DA REGIÃO</h1>
          <p>Comida caseira de verdade, feita no dia e pronta para chegar quentinha.</p>
          <div className="hero-actions">
            <a className="hero-button hero-button-primary" href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">Pedir agora</a>
            <a className="hero-button hero-button-secondary" href="#cardapio">Ver cardápio</a>
          </div>
        </div>
      </header>

      <section className="company-info">
        <img className="company-logo" src="assets/img/logo-jb-marmitas.jpeg" alt="Logo JB Marmitas" />
        <p className="store-kicker">MARMITARIA CASEIRA EM BALSAS - MA</p>
        <h2>JB Marmitas</h2>
        <p>Marmitas caseiras feitas no dia. Segunda a sábado, das 11h às 14h30.</p>
        <div className="top-actions">
          <span className="status-badge"><span className="status-dot" /> Aberto para pedidos</span>
          {user ? (
            <>
              <span className="status-badge">Olá, {(user.user_metadata?.name || user.email).split(' ')[0]}</span>
              <button className="nav-link-btn" onClick={() => supabase.auth.signOut()}>Sair</button>
            </>
          ) : (
            <button className="nav-link-btn" onClick={() => setAuth(true)}>Entrar / cadastrar</button>
          )}
        </div>
        <div className="contact-actions">
          <a className="contact-link whatsapp-link" href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">Pedir pelo WhatsApp</a>
        </div>
        {loadError && <p className="auth-error">{loadError}</p>}
      </section>

      <nav id="cardapio" className="categories-bar">
        {[['pratos', 'Pratos do Dia'], ['bebidas', 'Bebidas']].map(([value, label]) => (
          <button key={value} className={`category-btn ${category === value ? 'active' : ''}`} onClick={() => setCategory(value)}>{label}</button>
        ))}
      </nav>

      <main className="container">
        <div className="menu-heading"><span>ESCOLHA SEU FAVORITO</span><h2>Nosso cardápio</h2></div>
        <div id="menu-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Carregando cardápio...</p>
          ) : visible.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum item nesta categoria.</p>
          ) : (
            visible.map(product => (
              <article className={`product-card ${product.out_of_stock ? 'out-of-stock' : ''}`} key={product.id}>
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="price-box">
                    {product.promo_price ? (
                      <>
                        <span className="product-price">{formatPrice(product.promo_price)}</span>
                        <span className="original-price">{formatPrice(product.price)}</span>
                        <span className="tag-promo">PROMO</span>
                      </>
                    ) : (
                      <span className="product-price">{formatPrice(product.price)}</span>
                    )}
                    {product.out_of_stock && <span className="tag-esgotado">ESGOTADO</span>}
                  </div>
                  <div className="product-actions">
                    <button className="btn-qty btn-minus" disabled={product.out_of_stock} onClick={() => setCart(removeItem(cart, product.id))}>-</button>
                    <span className="qty-display">{cart[product.id]?.qty || 0}</span>
                    <button className="btn-qty btn-plus" disabled={product.out_of_stock} onClick={() => setCart(addItem(cart, product))}>+</button>
                    <button className="btn-order" disabled={product.out_of_stock} onClick={() => setCart(addItem(cart, product))}>Pedir</button>
                  </div>
                </div>
                <img className="product-image" src={product.image_url || PLACEHOLDER} alt={product.name} loading="lazy" />
              </article>
            ))
          )}
        </div>

        <section className="service-info" aria-label="Informações de atendimento">
          <div className="service-info-item">
            <span className="service-icon" aria-hidden="true">⌚</span>
            <div><strong>Atendimento</strong><p>Segunda a sábado, das 11h às 14h30</p></div>
          </div>
          <div className="service-info-item">
            <span className="service-icon" aria-hidden="true">⌖</span>
            <div><strong>Entrega em Balsas</strong><p>Consulte bairros e taxa pelo WhatsApp</p></div>
          </div>
          <div className="service-info-item">
            <span className="service-icon" aria-hidden="true">$</span>
            <div><strong>Pagamento fácil</strong><p>Pix, cartão e dinheiro</p><span className="pix-key">Pix: 558999195466</span><small>Envie o comprovante pelo WhatsApp</small></div>
          </div>
        </section>
      </main>

      <section className="diferenciais">
        <div className="diferenciais-container">
          <span className="hashtag">#COMIDADEVERDADE</span>
          <h2>POR QUE O NOSSO SABOR É DIFERENTE?</h2>
          <div className="cards-diferenciais">
            {[
              ['01', 'SABOR CASEIRO', 'Temperos naturais e preparo cuidadoso para lembrar a comida feita em casa.'],
              ['02', 'MUITO RECHEIO', 'Porções generosas e bem servidas para matar sua fome de verdade.'],
              ['03', 'ENTREGA RÁPIDA', 'Sua marmita chega quentinha, pronta para você aproveitar cada garfada.']
            ].map(([num, title, text]) => (
              <article className="card-diferencial" key={num}>
                <div className="icone-box">{num}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="cart-bar">
        <button className={`cart-button ${quantity ? 'active' : ''}`} onClick={() => quantity && setOrder(true)}>
          <span className="cart-count">{quantity} {quantity === 1 ? 'item' : 'itens'}</span>
          <span>Enviar Pedido WhatsApp</span>
          <span>{formatPrice(calculateTotal(cart))}</span>
        </button>
      </div>

      {auth && <CustomerAuth onClose={() => setAuth(false)} onSignedIn={() => setAuth(false)} />}
      {order && <OrderModal cart={cart} onClose={() => setOrder(false)} onDone={() => { setCart({}); setOrder(false); }} />}
    </>
  );
}

// Monta a página apenas quando rodando no site (não em testes).
const rootNode = typeof document !== 'undefined' && document.getElementById('root');
if (rootNode) {
  createRoot(rootNode).render(supabaseConfigError ? <ConfigErrorScreen /> : <App />);
}
