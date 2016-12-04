const Telegraf = require('telegraf');

// Enter bot API Token on here or add ass environment varialbe
const BOT_API_TOKEN = process.env.API_TOKEN || '';

const bot = new Telegraf(BOT_API_TOKEN);

bot.startPolling();

console.log('Bot start polling....');
