const Telegraf = require('telegraf');
const { memorySession, Markup, Extra } = require('telegraf');

const __ = require('multi-lang')('lang/lang.json', 'en', false);

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

// Get user lang from user manager, use this to simple access
function getLang(userId) {
  return userManager.getLang(userId);
}

// Put user on registration mode and ask for confirmation
bot.command('register', (ctx) => {
  if (typeof (ctx.message.chat.type) !== 'undefined' &&
    ctx.message.chat.type === 'private') {
    let userId = ctx.message.from.id;

    // Make sure user is in the list
    userManager.addUser(userId);

    registerSession[userId] = null;

    ctx.reply(__('register-start', { userId }, getLang(userId)));
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
        __('register-confirm-success', { chatKey }, getLang(userId)));

      delete registerSession[userId];
    } else {
      ctx.telegram.sendMessage(userId,
        __('register-confirm-failed', getLang(userId)));
    }
  } else {
    ctx.reply(__('register-not-started', getLang(userId)));
  }
});

// Cancel Registration
bot.command('cancelReg', (ctx) => {
  let userId = ctx.message.from.id;
  if (userId in registerSession) {
    delete registerSession[userId];

    bot.telegram.sendMessage(userId,
      __('register-cancel', getLang(userId)));
  }
});

bot.command('start', (ctx) => {
  let userId = ctx.message.from.id;

  if (ctx.message.chat.type === 'private') {
    ctx.session.state = null;
    ctx.session.store = null;
  }

  userManager.addUser(userId);

  ctx.reply(__('welcome'));

  //TODO: ask user about language and set the default one
});

bot.hears(/^\/setLang (.+)$/, (ctx) => {
  let userId = ctx.message.from.id;
  let lang = ctx.match[1];

  if (lang === 'fa' || lang === 'en') {
    userManager.setLang(userId, lang);
    ctx.reply(__('setLang-success', lang))
  } else {
    ctx.reply(__('setLang-failed', getLang(userId)));
  }
});

bot.hears(/^\/setSignature (.+)$/, (ctx) => {
  let userId = ctx.message.from.id;
  let signature = ctx.match[1];

  userManager.setSignature(userId, signature);
  ctx.reply(__('setSignature-success', getLang(userId)));
});

bot.hears(/^\/shortLink (.+)$/, (ctx) => {
  // Get url from bot command, if url start with http:// or https:// continue otherwise send back error!
  let linkUrl = ctx.match[1].startsWith('http://') || ctx.match[1].startsWith('https://') ? ctx.match[1] : null;
  let userId = ctx.message.from.id;

  if (linkUrl) {
    ctx.reply(__('shortLink-received', getLang(userId)));

    shortLink(linkUrl)
      .then((result) => {
        let answerMsg = __('shortLink-success', { shortUrl: result.shortUrl, url: result.url }, getLang(userId));

        if (result.fileInfo) {
          answerMsg = `File info: ${result.fileInfo.name} - ${result.fileInfo.sizeInMB} \n\n` + answerMsg;
        }

        ctx.reply(answerMsg);
      })
      .catch((err) => {
        // Code 1 for server error and code 2 for link access error
        if (err.code === 1) {
          ctx.reply(__('shortLink-error-1', { "errMessage": err.message, "url": err.result.url }, getLang(userId)));
        } else if (err.code === 2) {
          ctx.reply(__('shortLink-error-2', { "errMessage": err.message, "shortUrl": err.result.shortUrl, "url": err.result.url }, getLang(userId)));
        }
      });

  } else {
    ctx.reply(__('shortLink-failed', getLang(userId)));
  }

});

bot.on('photo', (ctx) => {
  if (ctx.message.chat.type === 'private') {
    // Get file_if of best quality version of photo from photo list
    let photoFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    let userId = ctx.message.from.id;

    if (ctx.session.state === 'new' &&
      ctx.session.store.type === 'photo' &&
      ctx.session.store.currentFieldType === 'photo') {
        ctx.session.store.answer(photoFileId);
        fillStore(ctx);
    } else {
      ctx.reply(__('image-received', getLang(userId)));

      // Get file link from telegram server
      ctx.telegram.getFileLink(photoFileId)
        .then((fileLink) => {
          // Upload photo from telegram server to imgur and return the link to user chat page
          imageUploader.uploadIt(fileLink)
            .then((jsonResult) => {
              if (ctx.session.state === 'new' &&
                ctx.session.store.type === 'text' &&
                ctx.session.store.currentFieldType === 'photo') {
                  ctx.session.store.answer(jsonResult.data.link);
                  fillStore(ctx);
              } else {
                return ctx.reply(__('image-success', { 'link': jsonResult.data.link }, getLang(userId)));
              }
            }).catch((err) => {
              return ctx.reply(__('image-upload-error', { 'errMessage': err.message }, getLang(userId)));
            });

        }).catch((err) => {
          return ctx.reply(__('image-error', { 'errMessage': err.message }, getLang(userId)));
        });
    }
  }
});

bot.hears(/\/new (.+)$/, (ctx) => {
  if (ctx.message.chat.type === 'private') {
    let userId = ctx.message.from.id;

    let template = templateManager.selectTemplate(ctx.match[1], getLang(userId));

    if (template) {
      ctx.session.state = 'new';
      ctx.session.store = template;

      ctx.reply(__('newPost-start', { 'templateName': template.name }, getLang(userId)))
        .then(res => {
          fillStore(ctx);
        });
    } else {
      ctx.reply(__('newPost-failed', getLang(userId)));
    }
  }
});

function fillStore(ctx) {
  let store = ctx.session.store;
  let userId = ctx.message.from.id;

  if (store) {
    let prompt = store.prompt();
    if (prompt) {
      ctx.reply(prompt);
    } else {
      ctx.session.state = 'ready';
      ctx.reply(__('newPost-ready', getLang(userId)));
    }
  }
}

function getChatId(ctx, userId, preview) {
  if (preview) {
    return userId;
  }

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
    return key.keys[0].id;
  }

  return null;
}

function postDelivery(ctx, userId, msg) {
  ctx.session.state = 'sent';

  let postLink = '';

  if (msg.chat.type === 'channel') {
    let messageId = msg.message_id;
    let chatUsername = msg.chat.username;
    postLink = 'https://telegram.me/' + chatUsername + '/' + messageId;
  }

  ctx.telegram.sendMessage(userId, __('message-sent', { postLink }, getLang(userId)));
}

function getUrlButtons(data) {
  let buttons = [];
  for (let {text, url} of data) {
    buttons.push([Markup.urlButton(text, url)]);
  }

  return Extra.markdown().markup(
    Markup.inlineKeyboard(buttons)
  );
}

function sendPost(ctx, userId, preview) {
  let chatId = getChatId(ctx, userId, preview);
  let userSignature = userManager.getSignature(userId)
  let result = ctx.session.store.result(getLang(userId));

  if (result.type === 'photo') {
    return ctx.telegram.sendPhoto(chatId, result.data.photo, {caption: result.data.text + userSignature});
  } else if (result.type === 'text') {
    if (result.data.buttons) {
      return ctx.telegram.sendMessage(chatId, result.data.text + userSignature, getUrlButtons(result.data.buttons));
    } else {
      return ctx.telegram.sendMessage(chatId, result.data.text + userSignature, {parse_mode: 'Markdown'});
    }
  }
}

function postAction(ctx, preview = true) {
  let userId = ctx.message.from.id;

  sendPost(ctx, userId, preview)
    .then(res => {
      if (preview && ctx.session.state === 'new') {
        ctx.reply(__('newPost-not-ready', getLang(userId)))
          .then(res => {
            fillStore(ctx);
          });
      }
      if (!preview) {
        postDelivery(ctx, userId, res);
      }
    })
    .catch(err => {
      ctx.reply(__('newPost-is-empty', getLang(userId)))
        .then(res => {
          fillStore(ctx);
        });
    });

}

bot.command('preview', (ctx) => {
  let state = ctx.session.state;
  if (ctx.message.chat.type === 'private' &&
    (state === 'new' || state === 'ready' || state === 'sent')) {
      postAction(ctx, true);
    }
});

bot.hears(/\/sendTo (.+)$/, (ctx) => {
  let state = ctx.session.state;
  if (ctx.message.chat.type === 'private' && state &&
    (state === 'ready' || state === 'sent')) {
      postAction(ctx, false);
    }
});

// Register user and send request to confirm registration
function registerUser(ctx, userId, chatId) {
  if (userId in registerSession) {
    registerSession[userId] = chatId;
    ctx.telegram.sendMessage(userId,
      __('register-request-confirm', getLang(userId)));
  } else {
    ctx.telegram.sendMessage(userId,
      __('register-not-started', getLang(userId)));
  }
}

bot.on('channel_post', (ctx) => {
  if (typeof (ctx.update.channel_post.text) !== 'undefined') {
    if (ctx.update.channel_post.text.startsWith('/reg ')) {

      let chatId = ctx.update.channel_post.chat.id;
      let userId = ctx.update.channel_post.text.split(' ')[1];

      registerUser(ctx, userId, chatId);
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

      registerUser(ctx, userId, chatId);
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
