const Telegraf = require('telegraf');
const { memorySession } = require('telegraf');

let userManager = require('./user-manager');
let imageUploader = require('./image-uploader');
let shortLink = require('./shortlink');
let templateManager = require('./templates/manager');

// Enter bot API Token on here or add as environment varialbe
const BOT_API_TOKEN = process.env.API_TOKEN || '';

const bot = new Telegraf(BOT_API_TOKEN);

bot.use(memorySession());

// Use array to keep track of user on registration
let registerSession = [];

// Put user on registration mode and ask for confirmation
bot.command('register', (ctx) => {
  if (typeof (ctx.message.chat.type) !== 'undefined' &&
    ctx.message.chat.type === 'private') {
    let userId = ctx.message.from.id;

    // Make sure user is in the list
    userManager.addUser(userId);

    registerSession[userId] = null;

    ctx.reply(`I get your register request,\nSend below command on group or channel you want to register on it:\n/reg ${userId}\nor send /cancelReg to cancel registration!`);
  }
});

// If on registration mode and chatKey was not exists before confirm it
bot.hears(/^\/confirm (.+)$/, (ctx) => {
  let userId = ctx.message.from.id;
  let chatKey = ctx.match[1];

  if (userId in registerSession && registerSession[userId]) {
    let user = {
      id: userId,
      keys: [{
        key: chatKey,
        id: registerSession[userId]
      }]
    };

    if (userManager.addKey(user)) {
      ctx.telegram.sendMessage(userId,
        `Registration confirmed, The new name is: ${chatKey}`);

      delete registerSession[userId];
    } else {
      ctx.telegram.sendMessage(userId,
        `The entered name was exists, try another one\nPlease confirm it with a unique name (you can't change it anymore),\nTo confirm it just send /confirm your-unique-name\nor to cancel it just send /cancelReg.`);
    }
  } else {
    ctx.reply(`You are not on registration!\nUse /help to read more.`);
  }
});

// Cancel Registration
bot.command('cancelReg', (ctx) => {
  let userId = ctx.message.from.id;
  if (userId in registerSession) {
    delete registerSession[userId];

    bot.telegram.sendMessage(userId, 'Registration canceled!');
  }
});

bot.command('start', (ctx) => {
  let userId = ctx.message.from.id;

  if (ctx.message.chat.type === 'private') {
    ctx.session.state = null;
    ctx.session.store = null;
  }

  userManager.addUser(userId);

  ctx.reply(`Welcome 😊`);
});

bot.hears(/^\/shortLink (.+)$/, (ctx) => {
  // Get url from bot command, if url start with http:// or https:// continue otherwise send back error!
  let linkUrl = ctx.match[1].startsWith('http://') || ctx.match[1].startsWith('https://') ? ctx.match[1] : null;

  if (linkUrl) {
    ctx.reply(`Link address received, Please wait...`);

    shortLink(linkUrl)
      .then((result) => {
        let answerMsg = `Short link address is:\n\n ${result.shortUrl}\n\nRequested link was: ${result.url}`;

        if (result.fileInfo) {
          answerMsg = `File info: ${result.fileInfo.name} - ${result.fileInfo.sizeInMB} \n\n` + answerMsg;
        }

        ctx.reply(answerMsg);
      })
      .catch((err) => {
        // Code 1 for server error and code 2 for link access error
        if (err.code === 1) {
          ctx.reply(`${err.message}\n\nRequested link was: ${err.result.url}`);
        } else if (err.code === 2) {
          ctx.reply(`${err.message}\n\nShort link address is:\n\n ${err.result.shortUrl}\n\nRequested link was: ${err.result.url}`)
        }
      });

  } else {
    ctx.reply(`Link address is not valid!\nPlease use an address that starts with 'http://' or 'https://'`);
  }

});

bot.on('photo', (ctx) => {
  if (ctx.message.chat.type === 'private') {
    // Get file_if of best quality version of photo from photo list
    let photoFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    if (ctx.session.state === 'new' && ctx.session.store.currentFieldType === 'photo') {
        ctx.session.store.answer(photoFileId);
        fillStore(ctx);
    } else {
      ctx.reply(`Image received, Please wait...`);

      // Get file link from telegram server
      ctx.telegram.getFileLink(photoFileId)
        .then((fileLink) => {
          // Upload photo from telegram server to imgur and return the link to user chat page
          imageUploader.uploadIt(fileLink)
            .then((jsonResult) => {
              return ctx.reply(`Image link is:\n ${jsonResult.data.link}`);
            }).catch((err) => {
              return ctx.reply(`Error on uploading image:\n ${err.message}\ntry again later`);
            });

        }).catch((err) => {
          return ctx.reply(`Error on get file link:\n ${err.message}\ntry again later`);
        });
    }
  }
});

bot.hears(/\/new (.+)$/, (ctx) => {
  if (ctx.message.chat.type === 'private') {
    let template = templateManager.selectTemplate(ctx.match[1]);

    if (template) {
      ctx.session.state = 'new';
      ctx.session.store = template;

      ctx.reply(`New ${template.name} was created👍, Please answer the questions to fill the fields of new post`)
        .then(res => {
          fillStore(ctx);
        });
    }
  }
});

function fillStore(ctx) {
  let store = ctx.session.store;

  if (store) {
    let prompt = store.prompt();
    if (prompt) {
      ctx.reply(prompt);
    } else {
      ctx.session.state = 'ready';
      ctx.reply(`This post is Ready to send\nNow you can use /sendTo channelKey or /sendTo groupKey commands to send this post to channel or group\nOr /preview to see a preview of your post`);
    }
  }
}

bot.command('preview', (ctx) => {
  let state = ctx.session.state;
  if (ctx.message.chat.type === 'private' &&
    (state === 'new' || state === 'ready' || state === 'sent')) {

      let userId = ctx.message.from.id;
      let userSignature = userManager.getSignature(userId)
      let result = ctx.session.store.result();

      ctx.reply(`Preview of ${ctx.session.store.name}`)
        .then(res => {
          if (result.type === 'photo') {
            return ctx.telegram.sendPhoto(userId, result.data.photo, {caption: result.data.text + userSignature});
          } else if (result.type === 'text') {
            return ctx.telegram.sendMessage(userId, result.data.text + userSignature, {parse_mode: 'Markdown'});
          }
        })
        .then(res => {
          if (state === 'new') {
            ctx.reply(`This post is not ready to send!\nPlease fill all the fields`)
              .then(res => {
                fillStore(ctx);
              });
          }
        })
        .catch(err => {
          ctx.reply(`Noting to show!\nFirst fill some fields`)
            .then(res => {
              fillStore(ctx);
            });
        });
    }
});

bot.hears(/\/sendTo (.+)$/, (ctx) => {
  let state = ctx.session.state;
  if (ctx.message.chat.type === 'private' && state &&
    (state === 'ready' || state === 'sent')) {

    let userId = ctx.message.from.id;
    let chatKey = ctx.match[1];

    let user = {
      id: userId,
      keys: [{
        key: chatKey,
         id: null
       }]
    };

    let key = userManager.getId(user);

    if (key && key.keys) {
      let chatId = key.keys[0].id;
      let result = ctx.session.store.result();

      let messageId = '';
      let chatUsername = '';
      let postLink = '';

      if (result.type === 'photo') {
        ctx.telegram.sendPhoto(chatId, result.data.photo, {caption: result.data.text})
          .then(res => {
            if (res.chat.type === 'channel') {
              messageId = res.message_id;
              chatUsername = res.chat.username;
              postLink = 'https://telegram.me/' + chatUsername + '/'+messageId;
            }

            ctx.session.state = 'sent';
            ctx.telegram.sendMessage(userId, `Message sent to ${key.keys[0].key}\nLink to post: ${postLink}`);
          });
      } else if (result.type === 'text') {
        ctx.telegram.sendMessage(chatId, result.data.text, {parse_mode: 'Markdown'})
          .then(res => {
            if (res.chat.type === 'channel') {
              messageId = res.message_id;
              chatUsername = res.chat.username;
              postLink = 'https://telegram.me/' + chatUsername + '/'+messageId;
            }

            ctx.session.state = 'sent';
            ctx.telegram.sendMessage(userId, `Message sent to ${key.keys[0].key}\nLink to post: ${postLink}`);
          });
      }

    }
  }
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
    (ctx.message.chat.type === 'group' ||
      ctx.message.chat.type === 'supergroup')) {

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

  if (typeof (ctx.message.text) !== 'undefined' &&
    ctx.message.chat.type === 'private' && ctx.session.state === 'new') {

      ctx.session.store.answer(ctx.message.text);
      fillStore(ctx);
    }
});

bot.startPolling();

console.log('Bot start polling....');
