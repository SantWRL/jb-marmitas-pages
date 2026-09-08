import { getProducts, saveProducts, formatPrice } from './db.js';
import { isAdminAuthenticated, loginAdmin, logoutAdmin } from './admin-auth.js';

const loginSection = document.getElementById('admin-login');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const authenticated = isAdminAuthenticated();

function showAdminContent(isVisible) {
  loginSection.hidden = isVisible;
  adminContent.hidden = !isVisible;
}

showAdminContent(authenticated);

loginForm.onsubmit = (event) => {
  event.preventDefault();
  const password = document.getElementById('admin-password').value;

  if (!loginAdmin(password)) {
    loginError.textContent = 'Senha incorreta. Tente novamente.';
    return;
  }

  loginError.textContent = '';
  loginForm.reset();
  showAdminContent(true);
  window.location.reload();
};

document.getElementById('admin-logout').onclick = logoutAdmin;

if (authenticated) {
let currentCategory = "pratos";
let uploadedImageBase64 = "";

function renderAdminMenu() {
  const container = document.getElementById('admin-menu-container');
  if (!container) return;
  container.innerHTML = '';

  const products = getProducts().filter(p => p.category === currentCategory);

  products.forEach(product => {
    const card = document.createElement('article');
    card.className = `product-card ${product.outOfStock ? 'out-of-stock' : ''}`;

    card.innerHTML = `
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="price-box">
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
        <div class="admin-controls">
          <label>
            <input type="checkbox" class="chk-stock" data-id="${product.id}" ${product.outOfStock ? 'checked' : ''}>
            Marcar como Esgotado
          </label>
          <label>
            Preço Promo (R$): 
            <input type="number" step="0.50" class="input-promo" data-id="${product.id}" value="${product.promoPrice || ''}" placeholder="15.00">
          </label>
          <button class="btn-delete" data-id="${product.id}">🗑️ Excluir Item</button>
        </div>
      </div>
      <img class="product-image" src="${product.image}" alt="${product.name}" />
    `;

    container.appendChild(card);
  });

  bindAdminEvents();
}

function bindAdminEvents() {
  document.querySelectorAll('.chk-stock').forEach(chk => {
    chk.onchange = () => {
      const products = getProducts();
      const prod = products.find(p => p.id === chk.dataset.id);
      if (prod) {
        prod.outOfStock = chk.checked;
        saveProducts(products);
        renderAdminMenu();
      }
    };
  });

  document.querySelectorAll('.input-promo').forEach(input => {
    input.onchange = () => {
      const products = getProducts();
      const prod = products.find(p => p.id === input.dataset.id);
      if (prod) {
        const val = parseFloat(input.value);
        prod.promoPrice = (!isNaN(val) && val > 0) ? val : null;
        saveProducts(products);
        renderAdminMenu();
      }
    };
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = () => {
      if (confirm("Deseja realmente excluir este item?")) {
        let products = getProducts();
        products = products.filter(p => p.id !== btn.dataset.id);
        saveProducts(products);
        renderAdminMenu();
      }
    };
  });
}

document.getElementById('new-file').onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => uploadedImageBase64 = event.target.result;
    reader.readAsDataURL(file);
  }
};

document.getElementById('add-product-form').onsubmit = (e) => {
  e.preventDefault();
  const products = getProducts();

  const name = document.getElementById('new-name').value;
  const category = document.getElementById('new-category').value;
  const description = document.getElementById('new-desc').value;
  const price = parseFloat(document.getElementById('new-price').value);
  const urlImage = document.getElementById('new-image-url').value;

  if (!name.trim() || !description.trim() || !Number.isFinite(price) || price <= 0) {
    alert('Preencha nome, descrição e um preço maior que zero.');
    return;
  }

  let finalImage = "assets/img/marmita-placeholder.svg";
  if (uploadedImageBase64) finalImage = uploadedImageBase64;
  else if (urlImage) finalImage = urlImage;

  products.push({
    id: Date.now().toString(),
    category,
    name,
    description,
    price,
    promoPrice: null,
    outOfStock: false,
    image: finalImage
  });

  saveProducts(products);
  e.target.reset();
  uploadedImageBase64 = "";
  alert("Item cadastrado com sucesso!");
  renderAdminMenu();
};

document.querySelectorAll('.category-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.category;
    renderAdminMenu();
  };
});

renderAdminMenu();
}