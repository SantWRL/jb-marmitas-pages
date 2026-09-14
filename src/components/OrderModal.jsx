import { useState } from "react";
import { formatWhatsAppMessage, calculateTotal, cartQuantity } from "../lib/cart.js";
import { createOrder } from "../lib/api.js";
import { formatPrice } from "../lib/format.js";
import { isWithinBusinessHours } from "../lib/hours.js";

const PAYMENT_OPTIONS = [
  ["pix", "Pix"],
  ["cartao", "Cartão de crédito"],
  ["dinheiro", "Dinheiro"]
];

const STEPS = ["Entrega", "Você", "Pagamento"];

// Modal de finalização em etapas: 1) Entrega  2) Você  3) Pagamento.
// Só a etapa atual fica montada (os dados vivem no estado do componente,
// nada se perde ao voltar/avançar) e o submit só faz algo na última etapa —
// assim Enter no meio do formulário nunca manda o cliente direto para o
// WhatsApp sem escolher o pagamento.
// Salva o pedido no Supabase e abre o WhatsApp com o resumo formatado.
export default function OrderModal({ cart, onClose, onDone }) {
  const quantity = cartQuantity(cart);
  const total = calculateTotal(cart);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Dados guardados conforme o usuário avança pelas etapas.
  const [deliveryType, setDeliveryType] = useState("entrega");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [reference, setReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cutlery, setCutlery] = useState("sim");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  // LGPD art. 7º, I e 8º: consentimento livre, informado e inequívoco,
  // coletado por ação positiva (checkbox) antes do dado ir para o banco
  // e para o WhatsApp.
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const paymentDetails = PAYMENT_OPTIONS.find(([value]) => value === paymentMethod)?.[1];

  // Validação por etapa:
  //  - Entrega: retirada passa direto; entrega exige rua, número e bairro.
  //  - Você: nome e WhatsApp do cliente obrigatórios.
  //  - Pagamento: sempre válido (radio já nasce marcado).
  const stepValid =
    (step === 0 && (deliveryType === "retirada" || (street.trim() && number.trim() && district.trim()))) ||
    (step === 1 && Boolean(customerName.trim()) && customerPhone.replace(/\D/g, "").length >= 10) ||
    (step === 2 && lgpdConsent);

  function goNext() {
    if (step === 0 && deliveryType === "entrega" && !(street.trim() && number.trim() && district.trim())) {
      setError("Preencha rua, número e bairro para entrega.");
      return;
    }
    if (step === 1 && (!customerName.trim() || customerPhone.replace(/\D/g, "").length < 10)) {
      setError("Informe seu nome e um WhatsApp válido com DDD.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function goToStep(index) {
    // Só deixa voltar para etapas já concluídas (o indicador marca em verde).
    if (index >= step || busy) return;
    setError("");
    setStep(index);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Trava de horário antes de qualquer outra ação: o modal pode ter ficado
    // aberto de ontem ou o relógio bateu 14h com o cliente digitando — o
    // pedido não sai nem para o banco nem para o WhatsApp.
    if (!isWithinBusinessHours()) {
      setError("Pedidos apenas das 11h às 14h (horário de Balsas). Volte amanhã!");
      return;
    }
    // Enter em campos das etapas 1 e 2 cai aqui: não pode enviar nada.
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    // Trava de corrida: cliques repetidos no botão (ou Enter segurado)
    // não podem criar vários pedidos iguais no Supabase.
    if (busy) return;
    if (deliveryType === "entrega" && !(street.trim() && number.trim() && district.trim())) {
      setStep(0);
      setError("Preencha rua, número e bairro para entrega.");
      return;
    }
    if (!customerName.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setStep(1);
      setError("Informe seu nome e um WhatsApp válido com DDD.");
      return;
    }
    // LGPD: sem o consentimento marcado, o pedido não sai — nem para o
    // banco nem para o WhatsApp.
    if (!lgpdConsent) {
      setError("Autorize o uso dos seus dados para concluir o pedido.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const orderDate = new Date();
      const savedOrder = await createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        address:
          deliveryType === "entrega"
            ? [street, number, complement].filter((part) => part.trim()).join(", ")
            : null,
        district: deliveryType === "entrega" ? district : null,
        reference: deliveryType === "entrega" ? reference : null,
        cutlery: cutlery === "sim",
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        lgpd_consent_at: lgpdConsent ? orderDate.toISOString() : null,
        total,
        items: Object.values(cart).map(({ id, name, price, qty }) => ({ id, name, price, qty }))
      });

      // Nº do pedido: coluna order_number quando existir, senão o contador
      // local +1 (bumpado a cada pedido neste navegador). localStorage pode
      // estar bloqueado (modo privado/restrições): o pedido segue sem número.
      let orderNumber = null;
      try {
        if (Number.isFinite(Number(savedOrder?.order_number)) && savedOrder.order_number !== null) {
          orderNumber = savedOrder.order_number;
        } else {
          orderNumber = Number(localStorage.getItem("jb-last-order-number") || "0") + 1;
          localStorage.setItem("jb-last-order-number", String(orderNumber));
        }
      } catch {
        // localStorage indisponível: segue sem número local.
      }

      const whatsappUrl = formatWhatsAppMessage({
        cart,
        orderNumber,
        orderDate,
        customerName,
        customerPhone,
        deliveryType,
        street,
        number,
        complement,
        district,
        reference,
        paymentMethod,
        paymentDetails
      });

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
              onClick={() => goToStep(index)}
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

        {/* Um único <form> para as 3 etapas: os dados ficam no estado do
            componente (nada se perde ao voltar/avançar) e o submit só envia
            na etapa Pagamento — Enter no meio do formulário só avança. */}
        <form onSubmit={handleSubmit}>
          {/* Etapa 1 — Entrega */}
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
                  Rua
                  <input
                    name="street"
                    type="text"
                    required
                    placeholder="Ex.: Rua Castro Alves"
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                  />
                </label>
                <div className="order-field-row">
                  <label className="order-field">
                    Número
                    <input
                      name="number"
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder="327"
                      value={number}
                      onChange={(event) => setNumber(event.target.value)}
                    />
                  </label>
                  <label className="order-field">
                    Complemento
                    <input
                      name="complement"
                      type="text"
                      placeholder="Apto, bloco… (opcional)"
                      value={complement}
                      onChange={(event) => setComplement(event.target.value)}
                    />
                  </label>
                </div>
                <label className="order-field">
                  Bairro
                  <input
                    name="district"
                    type="text"
                    required
                    placeholder="Ex.: Junco"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  />
                </label>
                <label className="order-field">
                  Ponto de referência
                  <input
                    name="reference"
                    type="text"
                    placeholder="Ex.: em frente à ótica (opcional)"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          )}

          {/* Etapa 2 — Você */}
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
              Seu WhatsApp
              <input
                name="customer_phone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="(99) 99999-9999"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
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

          {/* Etapa 3 — Pagamento */}
          {step === 2 && (
          <div className="order-step-pane">
            <fieldset className="payment-options">
              <legend>Forma de pagamento</legend>
              {PAYMENT_OPTIONS.map(([value, label]) => (
                <label key={value} className={`payment-option ${paymentMethod === value ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            {paymentMethod === "pix" && (
              <p className="payment-note">
                <strong>Pix (Copia e Cola)</strong>
                <span>5599999042932</span>
                Confirme o pagamento no WhatsApp após enviar o pedido.
              </p>
            )}
            {paymentMethod === "cartao" && (
              <p className="payment-note">
                <strong>Cartão na entrega</strong>
                <span>Levamos a maquininha. Aceite débito e crédito.</span>
              </p>
            )}
            {paymentMethod === "dinheiro" && (
              <p className="payment-note">
                <strong>Dinheiro na entrega</strong>
                <span>Avisa no WhatsApp se precisar de troco.</span>
              </p>
            )}

            {/* LGPD: consentimento antes do envio (art. 8º — destaque da
                finalidade, com link para a Política de Privacidade). */}
            <label className="lgpd-consent">
              <input
                type="checkbox"
                name="lgpd_consent"
                checked={lgpdConsent}
                onChange={(event) => setLgpdConsent(event.target.checked)}
              />
              <span>
                Autorizo o uso dos meus dados (nome, WhatsApp e endereço)
                apenas para este pedido, conforme a{" "}
                <a href="./privacidade.html" target="_blank" rel="noreferrer">
                  Política de Privacidade
                </a>
                .
              </span>
            </label>

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
                  : `Entrega: ${street}, ${number}${complement ? ` - ${complement}` : ""} — ${district}${
                      reference ? ` (ref.: ${reference})` : ""
                    }`}
                {" · "}
                {customerName || "—"}
                {" · "}
                {customerPhone || "—"}
                {" · "}
                {cutlery === "sim" ? "com talher" : "sem talher"}
                {" · "}
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
