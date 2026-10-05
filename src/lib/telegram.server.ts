/**
 * Sends a plain-text message to every chat listed in TELEGRAM_CHAT_IDS
 * (comma-separated; a group chat id works and starts with "-").
 * Never throws — alerting must not break data ingestion.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!token || chatIds.length === 0) return;

  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) {
          console.error("[telegram] send failed", chatId, res.status, await res.text());
        }
      } catch (err) {
        console.error("[telegram] send error", chatId, err);
      }
    }),
  );
}
