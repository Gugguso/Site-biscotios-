const PRODUCT_PRICES = {
  "Biscoito Petit Four": 20,
  "Biscoito Palitinho Amanteigado": 20,
  "Argolinha de Manteiga": 20
};

const SHIPPING = {
  "Ponto Novo": 7,
  "Siqueira Campos": 7,
  "Getúlio Vargas": 7,
  "Cirurgia": 7,
  "Farolândia": 9,
  "Jardins": 9,
  "Salgado Filho": 9,
  "13 de Julho": 9,
  "Jabotiana": 9,
  "Coroa do Meio": 12,
  "Atalaia": 12
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: "Mercado Pago ainda não foi configurado na Vercel." });

  try {
    const body = req.body || {};
    const items = body.items || body.cart;
    const { deliveryMethod, neighborhood } = body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Pedido vazio." });
    if (!["retirada", "entrega"].includes(deliveryMethod)) return res.status(400).json({ error: "Forma de recebimento inválida." });

    const subtotal = items.reduce((sum, item) => {
      const price = PRODUCT_PRICES[item.name];
      if (!price || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Produto inválido.");
      return sum + price * item.quantity;
    }, 0);
    const shipping = deliveryMethod === "entrega" ? (SHIPPING[neighborhood] || 0) : 0;
    const amount = subtotal + shipping;
    const externalReference = `bolosdabeth-${Date.now()}`;
    const notificationUrl = process.env.MP_WEBHOOK_URL;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalReference
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: "Pedido bolosdabeth",
        payment_method_id: "pix",
        external_reference: externalReference,
        notification_url: notificationUrl
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || "Não foi possível criar o pagamento." });

    return res.status(200).json({
      paymentId: data.id,
      status: data.status,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      amount,
      externalReference
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Não foi possível criar o pagamento." });
  }
};
