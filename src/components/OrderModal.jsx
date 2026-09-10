import { useState } from "react";
import { formatWhatsAppMessage, PHONE } from "../lib/cart.js";
import { createOrder } from "../lib/api.js";
import { formatPrice } from "../lib/format.js";
import { calculateTotal, cartQuantity } from "../lib/cart.js";

const PAYMENT_OPTIONS = [
  ["pix", "Pix"],
  ["cartao", "Cartão na entrega"],
  ["dinheiro", "Dinheiro"]
];

// Modal de finalização: resumo do carrinho, dados de entrega e pagamento.
// Salva o pedido no Supabase e abre o WhatsApp com o resumo.
export default function OrderModal({ cart, onClose, onDone }) {
  const quantity = cartQuantity(cart);
  const total = calculateTotal(cart);
  const [deliveryType, setDeliveryType] = useState("entrega");
  const [cutlery, setCutlery] = useState("sim");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const customerName = String(data.get("customer_name") || "").trim();
    const address = String(data.get("address") || "").trim();
    const reference = String(data.get("reference") || "").trim();
    const paymentMethod = String(data.get("payment_method") || "pix");
    const wantsCutlery = cutlery === "sim";

    if (deliveryType === "entrega" && !address) {
      setError("Informe o endereço para entrega.");
      return;
    }

    setBusy(true);
    setError("");

    const paymentDetails = PAYMENT_OPTIONS.find(([value]) => value === paymentMethod)?.[1];

    try {
      await createOrder({
        customer_name: customerName,
        delivery_type: deliveryType,
        address: deliveryType === "entrega" ? address : null,
        reference: deliveryType === "entrega" ? reference : null,
        cutlery: wantsCutlery,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        total,
        items: Object.values(cart).map(({ id, name, price, qty }) => ({ id, name, price, qty }))
      });

      const whatsappUrl = formatWhatsAppMessage(
        cart,
        customerName,
        address,
        PHONE,
        paymentDetails,
        reference,
        wantsCutlery ? "Sim" : "Não",
        deliveryType
      );
      window.open(whatsappUrl, "_blank");

      onDone();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar o pedido: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="order-modal" onClick={onClose}>
      <div className="order-modal-backdrop" />
      <div
        className="order-dialog"
        role="dialog"
        aria-label="Dados para entrega"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
        <h2>Dados para entrega</h2>
        <p className="order-summary">
          {quantity} {quantity === 1 ? "item no pedido" : "itens no pedido"} · {formatPrice(total)}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="order-field">
            Como vai receber
            <select
              name="delivery_type"
              value={deliveryType}
              onChange={(event) => setDeliveryType(event.target.value)}
            >
              <option value="entrega">Entrega no endereço</option>
              <option value="retirada">Retirada no local</option>
            </select>
          </label>

          {deliveryType === "entrega" && (
            <>
              <label className="order-field">
                Endereço em Balsas
                <input name="address" type="text" required placeholder="Rua, número, bairro" />
              </label>
              <label className="order-field">
                Ponto de referência
                <input name="reference" type="text" placeholder="Ex.: ao lado da praça" />
              </label>
            </>
          )}

          <label className="order-field">
            Seu nome
            <input name="customer_name" type="text" required placeholder="Como podemos te chamar" />
          </label>

          <label className="order-field">
            Quer talher?
            <select name="cutlery" value={cutlery} onChange={(event) => setCutlery(event.target.value)}>
              <option value="sim">Sim, por favor</option>
              <option value="nao">Não precisa</option>
            </select>
          </label>

          <label className="order-field">
            Forma de pagamento
            <select name="payment_method" defaultValue="pix">
              {PAYMENT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <p className="payment-note">
            <strong>Pix (Copia e Cola)</strong>
            <span>558999195466</span>
            Confirme o pagamento no WhatsApp após enviar o pedido.
          </p>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="submit-order" disabled={busy || quantity === 0}>
            {busy ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}
