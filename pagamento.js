const checkout = JSON.parse(localStorage.getItem("bolosdabeth-checkout") || "null");
const summary = document.querySelector("#paymentSummary");
const message = document.querySelector("#paymentMessage");
const pixPayment = document.querySelector("#pixPayment");
const pixCopy = document.querySelector("#pixCopy");
const pixQrCode = document.querySelector("#pixQrCode");
const copyPix = document.querySelector("#copyPix");
const confirmPayment = document.querySelector("#confirmPayment");
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let currentPaymentId = null;
let statusTimer = null;

function renderSummary() {
  if (!checkout || !checkout.cart?.length) {
    summary.textContent = "Sua sacola está vazia. Volte ao cardápio para escolher seus produtos.";
    confirmPayment.disabled = true;
    return;
  }
  const subtotal = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + Number(checkout.shipping || 0);
  const delivery = checkout.deliveryMethod === "entrega"
    ? `Entrega${checkout.neighborhood ? ` — ${checkout.neighborhood}` : ""}`
    : "Retirada na loja";
  summary.innerHTML = `<strong>Pedido:</strong> ${checkout.cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}<br><strong>Recebimento:</strong> ${delivery}<br><strong>Total:</strong> ${money(total)}`;
}

async function createPixPayment() {
  if (currentPaymentId) return;
  message.textContent = "Gerando cobrança Pix...";
  confirmPayment.disabled = true;
  const response = await fetch("/api/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkout)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível gerar o Pix.");
  currentPaymentId = data.paymentId;
  pixCopy.value = data.qrCode || "";
  if (data.qrCodeBase64) {
    pixQrCode.innerHTML = `<img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code Pix">`;
  } else if (window.QRCode && data.qrCode) {
    new QRCode(pixQrCode, { text: data.qrCode, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  }
  message.textContent = "Pix gerado. Aguardando confirmação do pagamento...";
  confirmPayment.textContent = "Aguardando pagamento";
  statusTimer = window.setInterval(checkPaymentStatus, 5000);
}

async function checkPaymentStatus() {
  const response = await fetch(`/api/payment-status?id=${encodeURIComponent(currentPaymentId)}`);
  const data = await response.json();
  if (data.status === "approved") {
    window.clearInterval(statusTimer);
    message.textContent = "Pagamento confirmado! Enviando pedido pelo WhatsApp...";
    sendOrder("Pix confirmado");
  }
}

function sendOrder(payment) {
  const items = checkout.cart.map((item) => `• ${item.quantity}x ${item.name} - ${money(item.price * item.quantity)}`).join("\n");
  const total = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + Number(checkout.shipping || 0);
  const destination = checkout.deliveryMethod === "entrega"
    ? `Entrega\nBairro: ${checkout.neighborhood}\nFrete: ${checkout.shipping ? money(checkout.shipping) : "consultar por telefone"}`
    : "Retirada na loja";
  const orderMessage = `Olá, bolosdabeth! Pedido pago:\n\n${items}\n\nForma de recebimento: ${destination}\nForma de pagamento: ${payment}\nTotal: ${money(total)}`;
  window.setTimeout(() => { window.location.href = `https://wa.me/557999773727?text=${encodeURIComponent(orderMessage)}`; }, 500);
}

document.querySelectorAll('input[name="paymentMethod"]').forEach((option) => {
  option.addEventListener("change", async () => {
    const isPix = option.value === "Pix" && option.checked;
    pixPayment.classList.toggle("hidden", !isPix);
    if (isPix) {
      try { await createPixPayment(); } catch (error) { message.textContent = error.message; confirmPayment.disabled = false; }
    }
  });
});

copyPix.addEventListener("click", async () => {
  if (!pixCopy.value) return;
  await navigator.clipboard.writeText(pixCopy.value);
  copyPix.textContent = "Código copiado";
  window.setTimeout(() => { copyPix.textContent = "Copiar código Pix"; }, 2000);
});

confirmPayment.addEventListener("click", () => {
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  if (!selected) { message.textContent = "Selecione uma forma de pagamento."; return; }
  if (selected.value === "Pix") { if (currentPaymentId) message.textContent = "Aguardando confirmação do Pix."; return; }
  sendOrder(selected.value);
});

renderSummary();
