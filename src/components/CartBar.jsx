import { calculateTotal, cartQuantity } from "../lib/cart.js";
import { formatPrice } from "../lib/format.js";

// Barra fixa do carrinho: mostra quantidade e total e abre o modal de pedido.
// Com a loja fechada (fora das 11h–14h), a barra mostra o aviso de fechado e
// não abre o checkout — o cliente pode navegar pelo cardápio à vontade.
export default function CartBar({ cart, onOpenOrderModal, storeOpen = true }) {
  const quantity = cartQuantity(cart);
  const total = calculateTotal(cart);
  const active = storeOpen && quantity > 0;

  return (
    <div className="cart-bar">
      <button
        type="button"
        className={`cart-button ${active ? "active" : ""}`}
        onClick={() => active && onOpenOrderModal()}
        aria-disabled={!active}
      >
        {storeOpen ? (
          <>
            <span>
              {quantity} {quantity === 1 ? "item" : "itens"}
            </span>
            <span>{formatPrice(total)}</span>
            <span className="cart-count">Enviar Pedido WhatsApp</span>
          </>
        ) : (
          <span className="cart-closed-msg">Fechado · aceitamos pedidos das 11h às 14h</span>
        )}
      </button>
    </div>
  );
}
