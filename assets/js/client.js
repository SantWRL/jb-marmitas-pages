import { getProducts, formatPrice } from './db.js';
import { addItem, removeItem, calculateTotal, formatWhatsAppMessage } from './cart.js';

const WHATSAPP_NUMBER = "558999195466";
let currentCategory = "pratos";
let cart = {};

function renderMenu() {
  const container = document.getElementById('menu-container');
  if (!container) return;
  container.innerHTML = '';

  const products = getProducts().filter(p => p.category === currentCategory);

  if (products.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">Nenhum item nesta categoria.</p>`;
    return;
  }

  products.forEach(product => {
    const qty = cart[product.id] ? cart[product.id].qty : 0;
    const card = document.createElement('article');
    card.className = `product-card ${product.outOfStock ? 'out-of-stock' : ''}`;

    card.innerHTML = `
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="price-box">
          ${product.promoPrice ? `
            <span class="product-price">${formatPrice(product.promoPrice)}</span>
            <span class="original-price">${formatPrice(product.price)}</span>
            <span class="tag-promo">PROMO</span>
          ` : `
            <span class="product-price">${formatPrice(product.price)}</span>
          `}
          ${product.outOfStock ? `<span class="tag-esgotado">ESGOTADO</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-qty btn-minus" data-id="${product.id}" ${product.outOfStock ? 'disabled' : ''}>-</button>
          <span class="qty-display">${qty}</span>
          <button class="btn-qty btn-plus" data-id="${product.id}" ${product.outOfStock ? 'disabled' : ''}>+</button>
          <button class="btn-order" data-id="${product.id}" ${product.outOfStock ? 'disabled' : ''}>Pedir</button>
        </div>
      </div>
      <img class="product-image" src="${product.image}" alt="${product.name}" />
    `;

    container.appendChild(card);
  });

  bindEvents();
  updateCartBar();
}

function bindEvents() {
  document.querySelectorAll('.btn-order').forEach(btn => {
    btn.onclick = () => {
      const product = getProducts().find(p => p.id === btn.dataset.id);
      cart = addItem(cart, product);
      renderMenu();
    };
  });

  document.querySelectorAll('.btn-plus').forEach(btn => {
    btn.onclick = () => {
      const product = getProducts().find(p => p.id === btn.dataset.id);
      cart = addItem(cart, product);
      renderMenu();
    };
  });

  document.querySelectorAll('.btn-minus').forEach(btn => {
    btn.onclick = () => {
      cart = removeItem(cart, btn.dataset.id);
      renderMenu();
    };
  });
}

function updateCartBar() {
  const totalQty = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = calculateTotal(cart);

  const cartBtn = document.getElementById("cart-btn");
  if (!cartBtn) return;

  document.getElementById("cart-count").innerText = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
  document.getElementById("cart-total").innerText = formatPrice(totalPrice);

  if (totalQty > 0) {
    cartBtn.classList.add("active");
  } else {
    cartBtn.classList.remove("active");
  }
}

function openOrderModal() {
  const modal = document.getElementById('order-modal');
  const summary = document.getElementById('order-summary');
  const quantity = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  summary.textContent = `${quantity} item${quantity !== 1 ? 's' : ''} no pedido • ${formatPrice(calculateTotal(cart))}`;
  modal.hidden = false;
  document.getElementById('customer-name').focus();
}

function closeOrderModal() {
  document.getElementById('order-modal').hidden = true;
}

document.querySelectorAll('[data-close-order]').forEach(element => {
  element.onclick = closeOrderModal;
});

document.getElementById('payment-method').onchange = (event) => {
  const payment = event.target.value;
  document.getElementById('pix-note').hidden = payment !== 'pix';
  document.getElementById('card-note').hidden = payment !== 'cartao';
  document.getElementById('cash-change-field').hidden = payment !== 'dinheiro';
  document.getElementById('cash-change').required = payment === 'dinheiro';
};

document.getElementById('order-form').onsubmit = (event) => {
  event.preventDefault();
  const payment = document.getElementById('payment-method').value;
  const change = document.getElementById('cash-change').value;
  let paymentDetails = '';

  if (payment === 'pix') paymentDetails = 'Pix: 558999195466. Vou enviar o comprovante nesta conversa.';
  if (payment === 'cartao') paymentDetails = 'Cartão. Favor confirmar a cobrança pelo WhatsApp.';
  if (payment === 'dinheiro') paymentDetails = `Dinheiro. Troco para: ${change}`;

  const name = document.getElementById('customer-name').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  const url = formatWhatsAppMessage(cart, name, address, WHATSAPP_NUMBER, paymentDetails);
  closeOrderModal();
  window.open(url, '_blank');
};

document.querySelectorAll('.category-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.category;
    renderMenu();
  };
});

document.getElementById('cart-btn').onclick = () => {
  if (Object.keys(cart).length === 0) return;
  openOrderModal();
};

renderMenu();