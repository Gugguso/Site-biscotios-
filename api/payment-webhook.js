module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).end();
  const paymentId = req.body?.data?.id || req.query?.["data.id"] || req.query?.id;
  if (!paymentId) return res.status(200).json({ received: true });

  if (process.env.MP_ACCESS_TOKEN) {
    await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
  }
  return res.status(200).json({ received: true });
};
