const Telegraf = require('telegraf');
const { memorySession } = require('telegraf');

let userManager = require('./user-manager');

// Enter bot API Token on here or add as environment varialbe
const BOT_API_TOKEN = process.env.API_TOKEN || '';

const bot = new Telegraf(BOT_API_TOKEN);

bot.use(memorySession());

// Use array to keep track of user on registration
let registerSession = [];

// Call this function anytime want to check if on registration then cancel it
function cancelRegistration(userId) {
  if (userId in registerSession) {
    delete registerSession[userId];

    bot.telegram.sendMessage(userId, 'Registration canceled!');
  }
}

// Put user on registration mode and ask for confirmation
bot.command('register', (ctx) => {
  if (typeof (ctx.message.chat.type) !== 'undefined' &&
      ctx.message.chat.type === 'private') {
    let userId = ctx.message.from.id;

    // Make sure user is in the list
    userManager.addUser(userId);

    registerSession[userId] = null;

    ctx.reply(`I get your register request,\nSend below command on group or channel you want to register on it:\n/reg ${userId}\nor send /cancel to cancel registration!`);
  }
});

// If on registration mode and chatKey was not exists before confirm it
bot.hears(/^\/confirm (.+)$/, (ctx) => {
  let userId = ctx.message.from.id;
  let chatKey = ctx.match[1];

  if (userId in registerSession && registerSession[userId]) {
    let user = {
      id: userId,
      keys: [{ key: chatKey, id: registerSession[userId] }]
    };

    if (userManager.addKey(user)) {
      ctx.telegram.sendMessage(userId,
        `Registration confirmed, The new name is: ${chatKey}`);

      delete registerSession[userId];
    } else {
      ctx.telegram.sendMessage(userId,
        `The entered name was exists, try another one\nPlease confirm it with a unique name (you can't change it anymore),\nTo confirm it just send /confirm your-unique-name\nor to cancel it just send /cancel.`);
    }
  } else {
    ctx.reply(`You are not on registration!\nUse /help to read more.`);
  }
});

bot.command('cancel', (ctx) => {
  let userId = ctx.message.from.id;
  cancelRegistration(userId);
});


bot.on('channel_post', (ctx) => {

  if (typeof (ctx.update.channel_post.text) !== 'undefined') {
    if (ctx.update.channel_post.text.startsWith('/reg ')) {

      let chatId = ctx.update.channel_post.chat.id;
      let userId = ctx.update.channel_post.text.split(' ')[1];

      if (userId in registerSession) {
        registerSession[userId] = chatId;
        ctx.telegram.sendMessage(userId,
          `Please confirm your registration with a unique name (you can't change it anymore),\nTo confirm it just send /confirm your-unique-name\nor to cancel it just send /cancel.`);
      } else {
        ctx.telegram.sendMessage(userId,
          `You are not on registration!\nUse /help to read more.`);
      }
    }
  }

});

bot.on('message', (ctx) => {

  if (typeof (ctx.message.text) !== 'undefined' &&
  ctx.message.chat.type === 'group') {

    if (ctx.message.text.startsWith('/reg ')) {
      let chatId = ctx.message.chat.id;
      let userId = ctx.message.text.split(' ')[1];

      if (userId in registerSession) {
        registerSession[userId] = chatId;
        ctx.telegram.sendMessage(userId,
          `Please confirm your registration with a unique name (you can't change it anymore),\nTo confirm it just send /confirm your-unique-name\nor to cancel it just send /cancel.`);
      } else {
        ctx.telegram.sendMessage(userId,
          `You are not on registration!\nUse /help to read more.`);
      }
    }
  }

});

bot.startPolling();

console.log('Bot start polling....');
