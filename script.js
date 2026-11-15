const cart = JSON.parse(localStorage.getItem("bolosdabeth-cart") || "[]");
const cartButton = document.querySelector("#cartButton");
const cartDrawer = document.querySelector("#cartDrawer");
const drawerOverlay = document.querySelector("#drawerOverlay");
const closeCart = document.querySelector("#closeCart");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const cartTotal = document.querySelector("#cartTotal");
const shippingRow = document.querySelector("#shippingRow");
const shippingTotal = document.querySelector("#shippingTotal");
const cartToast = document.querySelector("#cartToast");
const deliveryOptions = document.querySelectorAll('input[name="deliveryMethod"]');
const neighborhoodField = document.querySelector("#neighborhoodField");
const neighborhoodSelect = document.querySelector("#neighborhoodSelect");
const phoneShippingNote = document.querySelector("#phoneShippingNote");

const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getShipping() {
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
  if (!deliveryMethod || deliveryMethod.value !== "entrega") return 0;
  return Number(neighborhoodSelect.selectedOptions[0]?.dataset.shipping || 0);
}

function renderCart() {
  localStorage.setItem("bolosdabeth-cart", JSON.stringify(cart));
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = getShipping();
  cartCount.textContent = quantity;
  cartTotal.textContent = money(subtotal + shipping);
  shippingTotal.textContent = money(shipping);
  shippingRow.classList.toggle("hidden", shipping === 0);

  if (!cart.length) {
    cartItems.innerHTML = '<div class="empty-cart"><span>♡</span><p>Sua sacola está vazia.</p><small>Escolha um doce para começar.</small></div>';
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-line">
      <div><h3>${item.name}</h3><small>${item.quantity} × ${money(item.price)}</small></div>
      <div><strong>${money(item.price * item.quantity)}</strong><br><button class="remove-item" data-index="${index}" type="button">remover</button></div>
    </div>
  `).join("");
}

function openDrawer() {
  cartDrawer.classList.add("open");
  drawerOverlay.classList.add("visible");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  cartDrawer.classList.remove("open");
  drawerOverlay.classList.remove("visible");
  cartDrawer.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".quick-add").forEach((button) => {
  button.addEventListener("click", () => {
    const item = cart.find((entry) => entry.name === button.dataset.name);
    if (item) item.quantity += 1;
    else cart.push({ name: button.dataset.name, price: Number(button.dataset.price), quantity: 1 });
    renderCart();
    openDrawer();
  });
});

document.querySelectorAll(".product-card").forEach((card) => {
  const openProduct = () => {
    const name = card.querySelector("h3").textContent;
    window.location.href = `produto.html?produto=${encodeURIComponent(name)}`;
  };
  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", (event) => {
    if (!event.target.closest(".quick-add")) openProduct();
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  });
});

document.querySelectorAll(".category-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".category-button.active").classList.remove("active");
    button.classList.add("active");
    document.querySelectorAll(".product-card").forEach((card) => {
      card.classList.toggle("hidden", button.dataset.category !== "todos" && card.dataset.category !== button.dataset.category);
    });
  });
});

cartItems.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove-item")) return;
  cart.splice(Number(event.target.dataset.index), 1);
  renderCart();
});

document.querySelector("#checkoutButton").addEventListener("click", () => {
  if (!cart.length) return;
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
  if (!deliveryMethod) {
    window.alert("Escolha entre retirada na loja ou entrega.");
    return;
  }
  if (deliveryMethod.value === "entrega" && !getShipping() && neighborhoodSelect.value !== "Outro bairro") {
    window.alert("Selecione seu bairro para calcular o frete.");
    neighborhoodSelect.focus();
    return;
  }
  localStorage.setItem("bolosdabeth-checkout", JSON.stringify({
    cart,
    deliveryMethod: deliveryMethod.value,
    neighborhood: neighborhoodSelect.value,
    shipping: getShipping()
  }));
  window.location.href = "pagamento.html";
});

deliveryOptions.forEach((option) => {
  option.addEventListener("change", () => {
    const isDelivery = option.value === "entrega" && option.checked;
    neighborhoodField.classList.toggle("hidden", !isDelivery);
    if (!isDelivery) neighborhoodSelect.value = "";
    phoneShippingNote.classList.add("hidden");
    renderCart();
  });
});

neighborhoodSelect.addEventListener("change", () => {
  phoneShippingNote.classList.toggle("hidden", neighborhoodSelect.value !== "Outro bairro");
  renderCart();
});

cartButton.addEventListener("click", openDrawer);
closeCart.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
renderCart();
