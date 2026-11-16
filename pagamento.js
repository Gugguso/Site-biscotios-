const checkout = JSON.parse(localStorage.getItem("bolosdabeth-checkout") || "null");
const summary = document.querySelector("#paymentSummary");
const message = document.querySelector("#paymentMessage");
const pixPayment = document.querySelector("#pixPayment");
const pixCopy = document.querySelector("#pixCopy");
const pixQrCode = document.querySelector("#pixQrCode");
const copyPix = document.querySelector("#copyPix");
const confirmPayment = document.querySelector("#confirmPayment");
const cashOptions = document.querySelector("#cashOptions");
const changeAmountField = document.querySelector("#changeAmountField");
const changeAmount = document.querySelector("#changeAmount");
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIX_KEY = "19935170578";
const PIX_MERCHANT_NAME = "BOLOS DABETH";
const PIX_MERCHANT_CITY = "ARACAJU";

function pixField(id, value) {
  const text = String(value);
  return `${id}${String(text.length).padStart(2, "0")}${text}`;
}

function crc16Ccitt(value) {
  let crc = 0xffff;
  for (const character of value) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function createPixPayload(amount) {
  const merchantAccount = pixField("00", "br.gov.bcb.pix") + pixField("01", PIX_KEY);
  const additionalData = pixField("05", "***");
  const payload = [
    pixField("00", "01"),
    pixField("26", merchantAccount),
    pixField("52", "0000"),
    pixField("53", "986"),
    pixField("54", amount.toFixed(2)),
    pixField("58", "BR"),
    pixField("59", PIX_MERCHANT_NAME),
    pixField("60", PIX_MERCHANT_CITY),
    pixField("62", additionalData)
  ].join("");
  return `${payload}6304${crc16Ccitt(`${payload}6304`)}`;
}

function renderSummary() {
  if (!checkout || !checkout.cart?.length) {
    summary.textContent = "Sua sacola está vazia. Volte ao cardápio para escolher seus produtos.";
    confirmPayment.disabled = true;
    return;
  }
  const subtotal = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + Number(checkout.shipping || 0);
  const delivery = checkout.deliveryMethod === "entrega"
    ? "Entrega — entrar em contato para combinar"
    : "Retirada na loja";
  summary.innerHTML = `<strong>Pedido:</strong> ${checkout.cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}<br><strong>Recebimento:</strong> ${delivery}<br><strong>Total:</strong> ${money(total)}`;
}

function renderPix() {
  const subtotal = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + Number(checkout.shipping || 0);
  const payload = createPixPayload(total);
  pixCopy.value = payload;
  pixQrCode.innerHTML = "";
  new QRCode(pixQrCode, { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  message.textContent = "QR Code Pix gerado. Confira o recebimento no aplicativo do Nubank.";
}

function getCashDetails() {
  const changeOption = document.querySelector('input[name="changeNeeded"]:checked');
  if (!changeOption) {
    message.textContent = "Informe se vai precisar de troco.";
    return null;
  }
  if (changeOption.value === "nao") return "Não precisa de troco";
  const amount = Number(changeAmount.value);
  const total = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + Number(checkout.shipping || 0);
  if (!amount || amount <= 0) {
    message.textContent = "Informe o valor que vai entregar para calcular o troco.";
    changeAmount.focus();
    return null;
  }
  if (amount < total) {
    message.textContent = `O valor precisa ser igual ou maior que ${money(total)}.`;
    changeAmount.focus();
    return null;
  }
  return `Precisa de troco — vai pagar com ${money(amount)}`;
}

function sendOrder(payment) {
  const items = checkout.cart.map((item) => `• ${item.quantity}x ${item.name} - ${money(item.price * item.quantity)}`).join("\n");
  const total = checkout.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + Number(checkout.shipping || 0);
  const destination = checkout.deliveryMethod === "entrega"
    ? "Entrega — entrar em contato para combinar endereço e frete"
    : "Retirada na loja";
  const cashDetails = payment === "Dinheiro" ? `\n${getCashDetails()}` : "";
  const orderMessage = `Olá! Pedido bolosdabeth:\nProduto(s):\n${items}\nTotal: ${money(total)}\nPagamento: ${payment}${cashDetails}\nRecebimento: ${destination}`;
  localStorage.setItem("bolosdabeth-pending-order", orderMessage);
  window.location.href = "pedido-enviado.html";
}

document.querySelectorAll('input[name="paymentMethod"]').forEach((option) => {
  option.addEventListener("change", () => {
    const isPix = option.value === "Pix" && option.checked;
    pixPayment.classList.toggle("hidden", !isPix);
    cashOptions.classList.toggle("hidden", isPix);
    confirmPayment.innerHTML = isPix
      ? "Já fiz o pagamento <span>→</span>"
      : "Informar pedido pelo WhatsApp <span>→</span>";
    if (isPix) {
      document.querySelectorAll('input[name="changeNeeded"]').forEach((input) => { input.checked = false; });
      changeAmount.value = "";
      changeAmountField.classList.add("hidden");
    }
    if (isPix) renderPix();
    if (!isPix) message.textContent = "";
  });
});

document.querySelectorAll('input[name="changeNeeded"]').forEach((option) => {
  option.addEventListener("change", () => {
    const needsChange = option.value === "sim" && option.checked;
    changeAmountField.classList.toggle("hidden", !needsChange);
    if (!needsChange) changeAmount.value = "";
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
  if (!selected) {
    message.textContent = "Selecione uma forma de pagamento.";
    return;
  }
  if (selected.value === "Dinheiro" && !getCashDetails()) return;
  sendOrder(selected.value === "Pix" ? "Pix (conferir pagamento)" : selected.value);
});

renderSummary();
