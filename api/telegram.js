/**
 * Vercel Serverless: env TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * У telegram-config.js: proxyUrl: "/api/telegram"
 */
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const country = String(body?.country ?? "").trim();

  const emailOk = (() => {
    const v = email;
    if (!v) return false;
    const re =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    const typo =
      /^(gmail|yahoo|hotmail|outlook|live|icloud|mail)\.(co|con|cm|om)$/i;
    if (!re.test(v)) return false;
    const at = v.lastIndexOf("@");
    const domain = v.slice(at + 1).toLowerCase();
    const labels = domain.split(".").filter(Boolean);
    if (labels.length < 2) return false;
    const tld = labels[labels.length - 1];
    if (tld.length < 2) return false;
    if (typo.test(domain)) return false;
    return true;
  })();

  if (!emailOk) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const text = [
    "New course registration",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Country: ${country}`,
  ].join("\n");

  const tgRes = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );

  const tgJson = await tgRes.json().catch(() => ({}));

  if (!tgRes.ok || !tgJson.ok) {
    return res.status(502).json({
      error: "Telegram error",
      detail: tgJson.description || tgRes.statusText,
    });
  }

  return res.status(200).json({ ok: true });
};
