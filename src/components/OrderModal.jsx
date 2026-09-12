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

const STEPS = ["Entrega", "Você", "Pagamento"];

// Modal de finalização em etapas: 1) Entrega  2) Você  3) Pagamento.
// Salva o pedido no Supabase e abre o WhatsApp com o resumo.
export default function OrderModal({ cart, onClose, onDone }) {
  const quantity = cartQuantity(cart);
  const total = calculateTotal(cart);
  const [step, setStep] = useState(0);
  const [deliveryType, setDeliveryType] = useState("entrega");
  const [cutlery, setCutlery] = useState("sim");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Dados guardados conforme o usuário avança pelas etapas.
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");

  const paymentDetails = PAYMENT_OPTIONS.find(([value]) => value === paymentMethod)?.[1];

  // Etapa 1 (Entrega) é válida se retirada ou endereço preenchido.
  const stepValid = step !== 0 || deliveryType === "retirada" || address.trim().length > 0;

  function goNext() {
    if (step === 0 && deliveryType === "entrega" && !address.trim()) {
      setError("Informe o endereço para entrega.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Trava de corrida: cliques repetidos no botão (ou Enter segurado)
    // não podem criar vários pedidos iguais no Supabase.
    if (busy) return;
    if (deliveryType === "entrega" && !address.trim()) {
      setStep(0);
      setError("Informe o endereço para entrega.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createOrder({
        customer_name: customerName,
        delivery_type: deliveryType,
        address: deliveryType === "entrega" ? address : null,
        reference: deliveryType === "entrega" ? reference : null,
        cutlery: cutlery === "sim",
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
        cutlery === "sim" ? "Sim" : "Não",
        deliveryType
      );

      // popup bloqueado não deixa o cliente sem o pedido: cai para abrir
      // na mesma aba, que sempre funciona.
      const win = window.open(whatsappUrl, "_blank");
      if (!win) window.location.assign(whatsappUrl);

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

        {/* Indicador de etapas */}
        <div className="order-steps" role="tablist" aria-label="Etapas do pedido">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={step === index}
              className={`order-step ${step === index ? "active" : ""} ${index < step ? "done" : ""}`}
              onClick={() => index < step && setStep(index)}
            >
              <span className="order-step-dot">{index < step ? "✓" : index + 1}</span>
              <span className="order-step-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="order-steps-bar">
          <div
            className="order-steps-bar-fill"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {step === 0 && (
            <div className="order-step-pane">
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
                    <input
                      name="address"
                      type="text"
                      required
                      placeholder="Rua, número, bairro"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                  <label className="order-field">
                    Ponto de referência
                    <input
                      name="reference"
                      type="text"
                      placeholder="Ex.: ao lado da praça"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="order-step-pane">
              <label className="order-field">
                Seu nome
                <input
                  name="customer_name"
                  type="text"
                  required
                  placeholder="Como podemos te chamar"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
              </label>

              <label className="order-field">
                Quer talher?
                <select name="cutlery" value={cutlery} onChange={(event) => setCutlery(event.target.value)}>
                  <option value="sim">Sim, por favor</option>
                  <option value="nao">Não precisa</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="order-step-pane">
              <label className="order-field">
                Forma de pagamento
                <select
                  name="payment_method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  {PAYMENT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="payment-note">
                <strong>Pix (Copia e Cola)</strong>
                <span>5599999042932</span>
                Confirme o pagamento no WhatsApp após enviar o pedido.
              </p>

              {/* Resumo antes de enviar */}
              <div className="order-review">
                <strong>Revise seu pedido</strong>
                <ul className="order-review-list">
                  {Object.values(cart).map((item) => (
                    <li key={item.id}>
                      {item.qty}x {item.name} — {formatPrice(item.qty * item.price)}
                    </li>
                  ))}
                </ul>
                <p className="order-review-total">Total: {formatPrice(total)}</p>
                <p>
                  {deliveryType === "retirada"
                    ? "Retirada no local"
                    : `Entrega: ${address}${reference ? ` (ref.: ${reference})` : ""}`}
                  {" · "}
                  {customerName || "—"}{" · "}
                  {cutlery === "sim" ? "com talher" : "sem talher"}{" · "}
                  {paymentDetails}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="order-nav">
            {step > 0 && (
              <button type="button" className="order-back" onClick={goBack} disabled={busy}>
                ← Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="submit-order" onClick={goNext} disabled={!stepValid}>
                Continuar
              </button>
            ) : (
              <button type="submit" className="submit-order" disabled={busy || quantity === 0}>
                {busy ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
