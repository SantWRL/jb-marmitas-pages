import { PLACEHOLDER_IMAGE } from "../lib/categories.js";
import { formatPrice, getEffectivePrice } from "../lib/format.js";

// Modal de detalhes do item, aberto ao clicar na foto do card.
export default function ItemModal({ item, onClose, onAdd }) {
  const promo = Number(item.promo_price) > 0 && Number(item.promo_price) < Number(item.price);
  const effective = getEffectivePrice(item);

  return (
    <div className="detail-modal" onClick={onClose}>
      <div
        className="detail-dialog"
        role="dialog"
        aria-label={item.name}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
        <img
          className="detail-image"
          src={item.image_url || PLACEHOLDER_IMAGE}
          alt={item.name}
        />
        <div className="detail-body">
          <h2>{item.name}</h2>
          {Boolean(item.best_seller) && <span className="tag-best">MAIS PEDIDO</span>}
          {item.out_of_stock && <span className="tag-esgotado">ESGOTADO</span>}
          {promo && <span className="tag-promo">PROMO</span>}
          <p className="detail-description">{item.description}</p>
          <div className="detail-actions">
            <button
              type="button"
              className="btn-detail-add"
              disabled={item.out_of_stock}
              onClick={() => {
                onAdd(item);
                onClose();
              }}
            >
              Adicionar ao pedido · {formatPrice(effective)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
