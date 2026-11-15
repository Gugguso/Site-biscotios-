module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: "Mercado Pago ainda não foi configurado na Vercel." });

  const paymentId = req.query?.id;
  if (!paymentId || !/^\d+$/.test(String(paymentId))) return res.status(400).json({ error: "Pagamento inválido." });

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ error: data.message || "Não foi possível consultar o pagamento." });
  return res.status(200).json({ status: data.status, statusDetail: data.status_detail });
};
