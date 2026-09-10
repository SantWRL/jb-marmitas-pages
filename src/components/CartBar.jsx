import { calculateTotal, cartQuantity } from "../lib/cart.js";
import { formatPrice } from "../lib/format.js";

// Barra fixa do carrinho: mostra quantidade e total e abre o modal de pedido.
export default function CartBar({ cart, onOpenOrderModal }) {
  const quantity = cartQuantity(cart);
  const total = calculateTotal(cart);
  const active = quantity > 0;

  return (
    <div className="cart-bar">
      <button
        type="button"
        className={`cart-button ${active ? "active" : ""}`}
        onClick={() => active && onOpenOrderModal()}
      >
        <span>
          {quantity} {quantity === 1 ? "item" : "itens"}
        </span>
        <span>{formatPrice(total)}</span>
        <span className="cart-count">Enviar Pedido WhatsApp</span>
      </button>
    </div>
  );
}
