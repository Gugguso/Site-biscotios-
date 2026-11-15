const products = {
  "Biscoito Petit Four": {
    image: "assets/biscoito-petit-four.jpeg",
    price: 20,
    description: "Biscoitinhos amanteigados com geleia, feitos com carinho e sob encomenda."
  },
  "Biscoito Palitinho Amanteigado": {
    image: "assets/biscoito-palitinho-amanteigado.jpeg",
    price: 20,
    description: "Palitinhos crocantes, delicados e levemente açucarados, preparados sob encomenda."
  },
  "Argolinha de Manteiga": {
    image: "assets/argolinha-de-manteiga.jpeg",
    price: 20,
    description: "Argolinhas amanteigadas, delicadas e levemente açucaradas, preparadas sob encomenda."
  }
};

const name = new URLSearchParams(window.location.search).get("produto");
const product = products[name] || products["Biscoito Petit Four"];
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

document.title = `${name || "Produto"} | bolosdabeth`;
document.querySelector("#detailName").textContent = name || "Biscoito Petit Four";
document.querySelector("#detailImage").src = product.image;
document.querySelector("#detailImage").alt = name || "Produto bolosdabeth";
document.querySelector("#detailDescription").textContent = product.description;
document.querySelector("#detailPrice").textContent = money(product.price);
document.querySelector("#detailAdd").addEventListener("click", () => {
  const cart = JSON.parse(localStorage.getItem("bolosdabeth-cart") || "[]");
  const item = cart.find((entry) => entry.name === (name || "Biscoito Petit Four"));
  if (item) item.quantity += 1;
  else cart.push({ name: name || "Biscoito Petit Four", price: product.price, quantity: 1 });
  localStorage.setItem("bolosdabeth-cart", JSON.stringify(cart));
  window.location.href = `index.html?adicionado=${encodeURIComponent(name || "Produto")}#cardapio`;
});
document.querySelector("#detailCheckout").addEventListener("click", () => {
  const productName = name || "Biscoito Petit Four";
  const cart = JSON.parse(localStorage.getItem("bolosdabeth-cart") || "[]");
  const item = cart.find((entry) => entry.name === productName);
  if (item) item.quantity += 1;
  else cart.push({ name: productName, price: product.price, quantity: 1 });
  localStorage.setItem("bolosdabeth-cart", JSON.stringify(cart));
  localStorage.setItem("bolosdabeth-checkout", JSON.stringify({
    cart,
    deliveryMethod: "retirada",
    neighborhood: "",
    shipping: 0
  }));
  window.location.href = "pagamento.html";
});
