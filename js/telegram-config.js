/**
 * Telegram: bot via @BotFather; chat_id — свій id (наприклад @userinfobot) або id групи.
 *
 * Рекомендовано: proxyUrl = "/api/telegram" на Vercel + змінні TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у проєкті.
 * Якщо вказати botToken і chatId тут — токен видно в DevTools (лише для тестів).
 */
window.TELEGRAM_CONFIG = {
  proxyUrl: "/api/telegram",
};
