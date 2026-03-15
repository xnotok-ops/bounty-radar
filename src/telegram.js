/**
 * Bounty Radar - Telegram Notifier
 */

async function sendTelegram(message, botToken, chatId) {
  if (!botToken || !chatId) {
    console.log("Telegram not configured — skipping.");
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Telegram error: ${res.status} — ${err}`);
      return false;
    }
    console.log("Telegram notification sent!");
    return true;
  } catch (err) {
    console.error(`Telegram send failed: ${err.message}`);
    return false;
  }
}

module.exports = { sendTelegram };
