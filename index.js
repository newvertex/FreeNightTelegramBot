const Telegraf = require('telegraf');
const { memorySession, Markup, Extra } = require('telegraf');
const request = require('request-promise-native');

const __ = require('multi-lang')('lang/lang.json', 'en', false);
const opizo = require('opizo-api');
const imdb = require('imdb-search');

let userManager = require('./user-manager-db');
let imageUploader = require('./image-uploader');
let templateManager = require('./templates/manager');

// Enter bot API Token on here or add as environment varialbe
const BOT_API_TOKEN = process.env.BOT_API_TOKEN || '';
const URL = process.env.URL || 'https://free-night.herokuapp.com';

const bot = new Telegraf(BOT_API_TOKEN);

bot.telegram.setWebhook(`${URL}/bot${BOT_API_TOKEN}`);

bot.use(memorySession());

// Use array to keep track of user on registration
let registerSession = [];

// Get user lang from user manager, use this to simple access
function getLang(userId) {
  return userManager.getLang(userId);
}

// Signup new user for web ui
bot.command('web', (ctx) => {
      // ask for email, password, name, & get user id from ctx and send a create request
      let userId = ctx.message.from.id;
      
      ctx.reply(__('web-signup-info', { userId }, getLang(userId)));
})

// Signup new user for web ui
bot.hears(/^\/web (.+)$/, (ctx) => {
  if (typeof (ctx.message.chat.type) !== 'undefined') {
    let userId = ctx.message.from.id;
    if (ctx.message.chat.type === 'private') {
      // ask for email, password, name, & get user id from ctx and send a create request
      let data = ctx.match[1].split(',');
      if (data.length === 3 && data[0].indexOf('@') > 0) {
        // send post request to create user
        request.post(`${URL}/users`, {
          form: {
            email: data[0],
            password: data[1],
            name: data[2],
            tid: userId,
          }
        }).then(res => {
          console.log('res', res)
          // if signup successful reply success message
          ctx.reply(__('web-signup-success', { userId }, getLang(userId)));
        }).catch(err => {
          console.log('err', err)
          // else reply failed message
          ctx.reply(__('web-signup-failed', { userId }, getLang(userId)));
        })
      } else {
        ctx.reply(__('web-signup-not-valid-pattern', { userId }, getLang(userId)));
      }
    } else {
      // show some info about web ui
      ctx.reply(__('web-signup-only-private', { userId }, getLang(userId)));
    }
  }
})

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
      _id: userId,
      keys: [{
        key: chatKey,
        kid: registerSession[userId]
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

  ctx.reply(__('welcome'), getLang(userId));
});

bot.command('help', (ctx) => {
  ctx.reply(__('help', getLang(ctx.message.from.id)), { parse_mode: 'Markdown', disable_web_page_preview: true });
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

function isLinkValid(url) {
  // If url start with http:// or https://
  return url.startsWith('http://') || url.startsWith('https://') ? url : null;
}

function shortener(ctx, userId, url, onLink = false) {
  if (isLinkValid(url)) {
    ctx.reply(__('shortLink-received', getLang(userId)));

    opizo(url)
      .then((result) => {
        ctx.reply(__('shortLink-success', { 'shortUrl': result.shortUrl, 'url': result.url }, getLang(userId)))
          .then(res => {
            if (onLink) {
              ctx.session.tmpLink.setNext(result.shortUrl);
              linkNextPrompt(ctx, userId);
            }
          });
      })
      .catch((err) => {
        ctx.reply(__('shortLink-error-1', { "errMessage": err.message, "url": err.result.url }, getLang(userId)));
      });

  } else {
    ctx.reply(__('invalidLink', getLang(userId)));
  }
}

bot.hears(/^\/shortLink (.+)$/, (ctx) => {
  let userId = ctx.message.from.id;

  shortener(ctx, userId, ctx.match[1], false);
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

bot.hears(/\/imdb (.+)$/, (ctx) => {
  let state = ctx.session.state;
  let args = ctx.match[1];

  if (!args.startsWith('#')) {
    args = args.split('#');

    imdb.search(args[0], args[1] || '', args[2] || '')
      .then((movies) => {
        let message = '';
        for (let movie of movies) {
          message += `ID: ${movie.id} - ${movie.type} - ${movie.title} ${cleanYear(movie.year)}\n`;
        }
        ctx.reply(message + __('select-imdb', getLang(ctx.message.from.id)), { parse_mode: 'Markdown' });
      })
      .catch((err) => {
        ctx.reply(err + __('err-imdb', getLang(ctx.message.from.id)));
      });

  } else {
    imdb.get(args.substring(1))
      .then((movie) => {
        ctx.session.imdb = movie;
        let message = `[ ](${movie.poster})${movie.title} ${cleanYear(movie.year)}\nDirector: ${movie.director}\nGenre: ${movie.genres}\nCountry: ${movie.countries}\nActors: ${movie.actors}\nReleased: ${getFormatedDate(movie.released)}\n`;
        ctx.reply(message, { parse_mode: 'Markdown' });
      })
      .catch((err) => {
        ctx.reply(err);
      });
  }

});

function cleanYear(year) {
  if (typeof year !== 'object') {
    return `(${year})`;
  } else {
    return `(${year.from}-${typeof year.to !== 'undefined' ? year.to : '?'})`
  }
}

function getFormatedDate(date) {
  let d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function fillStoreFromImdb(ctx) {
  let store = ctx.session.store;
  let imdb = ctx.session.imdb;

  if (imdb) {
    store.setFieldValue('photo', imdb.poster);
    store.setFieldValue('movie-name', `${imdb.title} ${cleanYear(imdb.year)}`);
    store.setFieldValue('movie-director', imdb.director);
    store.setFieldValue('movie-stars', imdb.actors);
    store.setFieldValue('movie-release-date', getFormatedDate(imdb.released));
    store.setFieldValue('movie-country', imdb.countries);
    store.setFieldValue('movie-genre', imdb.genres);
    store.setFieldValue('movie-rank', imdb.imdb.rating);
    store.setFieldValue('movie-reviewer-rank', typeof imdb.tomato !== 'undefined' ? imdb.tomato.rating : '-');
    store.setFieldValue('movie-summary', imdb.plot);
  }
}

bot.hears(/\/new (.+)$/, (ctx) => {
  if (ctx.message.chat.type === 'private') {
    let args = ctx.match[1].split(' ');
    let userId = ctx.message.from.id;

    let template = templateManager.selectTemplate(args[0], getLang(userId));

    if (template) {
      ctx.session.state = 'new';
      ctx.session.store = template;
      ctx.session.postPreview = null;

      if (args[1] === 'fromImdb') {
        if (ctx.session.imdb) {
          fillStoreFromImdb(ctx);
        } else {
          ctx.reply(__('no-imdb', getLang(userId)));
        }
      }

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
      if (store.currentFieldType === 'links' || store.currentFieldType === 'arrayLinks') {
        ctx.reply(prompt.text);
      } else {
        ctx.reply(__('template-field-prompt', { 'text': prompt.text, 'value': prompt.value }, getLang(userId)));
      }
    } else {
      ctx.session.state = 'ready';
      ctx.reply(__('newPost-ready', getLang(userId)));

      if (store.name === 'Movie' || store.name === 'Series') {
        let photo = store.getFieldValue('photo')[0];
        let name = store.getFieldValue('movie-name')[0] || '-';
        let summary = store.getFieldValue('movie-summary')[0] || '-';

        let tmpPostPreview = templateManager.selectTemplate('PostPreview', getLang(userId));
        tmpPostPreview.setFieldValue('photo', photo);
        tmpPostPreview.setFieldValue('movie-name', name);
        tmpPostPreview.setFieldValue('movie-summary', summary);
        tmpPostPreview.setFieldValue('post-linkTitle', `GoTo ${name} Post`);
        ctx.session.postPreview = tmpPostPreview;
      }
    }
  }
}

function getChatId(arg, userId, preview) {
  if (preview) {
    return userId;
  }

  let chatKey = arg;

  let user = {
    _id: userId,
    keys: [{
      key: chatKey,
      kid: null
    }]
  };

  let key = userManager.getId(user);

  if (key && key.keys) {
    return key.keys[0].kid;
  }

  return null;
}

function postDelivery(ctx, userId, msg, args) {
  ctx.session.state = 'sent';

  let postLink = '';

  if (msg.chat.type === 'channel') {
    let messageId = msg.message_id;
    let chatUsername = msg.chat.username;
    postLink = 'https://telegram.me/' + chatUsername + '/' + messageId;
  }

  ctx.telegram.sendMessage(userId, __('message-sent', { postLink }, getLang(userId)));

  if (ctx.session.store.name === 'Movie' || ctx.session.store.name === 'Series' && args[1]) {
    let postPreview = ctx.session.postPreview;

    if (postLink !== '' && typeof postPreview !== 'undefined' && postPreview) {
      postPreview.setFieldValue('post-linkUrl', postLink);

      sendPost(ctx, userId, false, args[1], true);
    }
  }

}

function getUrlButtons(data) {
  data = data || [];

  let buttons = [];
  for (let { text, url } of data) {
    buttons.push([Markup.urlButton(text, url)]);
  }

  return Markup.inlineKeyboard(buttons);
}

function sendPost(ctx, userId, preview, arg, isPostPreview = false) {
  let chatId = getChatId(arg, userId, preview);
  let userSignature = userManager.getSignature(userId)

  let result = null;
  if (!isPostPreview) {
    result = ctx.session.store.result(getLang(userId));
  } else {
    result = ctx.session.postPreview.result(getLang(userId));
  }

  if (result.type === 'photo') {
    return bot.telegram.sendPhoto(chatId, result.data.photo, {
      caption: result.data.text + userSignature,
      reply_markup: getUrlButtons(result.data.buttons)
    });
  } else if (result.type === 'text') {
    return bot.telegram.sendMessage(chatId, result.data.text + userSignature, {
      parse_mode: 'Markdown',
      reply_markup: getUrlButtons(result.data.buttons)
    });
  }
}

function postAction(ctx, preview = true, args = []) {
  let userId = ctx.message.from.id;

  sendPost(ctx, userId, preview, args[0])
    .then(res => {
      if (preview && ctx.session.state === 'new') {
        ctx.reply(__('newPost-not-ready', getLang(userId)))
          .then(res => {
            fillStore(ctx);
          });
      }
      if (!preview) {
        postDelivery(ctx, userId, res, args);
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
  let args = ctx.match[1].split(' ');

  if (ctx.message.chat.type === 'private' && state &&
    (state === 'ready' || state === 'sent')) {
    postAction(ctx, false, args);
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

function linkNextPrompt(ctx, userId) {
  let linkPrompt = ctx.session.tmpLink.getNext();

  if (linkPrompt) {
    if (linkPrompt.name !== 'url') {
      ctx.reply(__('links-prompt', { 'fieldName': linkPrompt.name, 'fieldValue': linkPrompt.value }, getLang(userId)));
    }
  } else {
    ctx.session.store.answer(ctx.session.tmpLink);
    ctx.session.tmpLink = null;
    ctx.reply(__('links-added', getLang(userId)));

    fillStore(ctx);
  }
}

bot.on('message', (ctx) => {
  let text = ctx.message.text;

  if (typeof (text) !== 'undefined' &&
    (ctx.message.chat.type === 'group' ||
      ctx.message.chat.type === 'supergroup')) {

    if (text.startsWith('/reg ')) {
      let chatId = ctx.message.chat.id;
      let userId = text.split(' ')[1];

      registerUser(ctx, userId, chatId);
    }
  }

  if (typeof (text) !== 'undefined' &&
    ctx.message.chat.type === 'private' && ctx.session.state === 'new') {

    let userId = ctx.message.from.id;

    if (ctx.session.store.currentFieldType === 'links' && text !== '/skip') {
      // Create new link
      if (typeof ctx.session.tmpLink === 'undefined' || !ctx.session.tmpLink) {
        ctx.session.tmpLink = templateManager.newLink();
      }

      if (ctx.session.tmpLink.getNext().name === 'url') {
        if (text.toLowerCase().startsWith('s ')) {
          shortener(ctx, userId, text.substring(2), true);
        } else if (isLinkValid(text)) {
          ctx.session.tmpLink.setNext(text);
        } else {
          ctx.reply(__('invalidLink', getLang(userId)));
        }
      } else {
        ctx.session.tmpLink.setNext(text);
      }

      linkNextPrompt(ctx, userId);

    } else if (ctx.session.store.currentFieldType === 'arrayLinks' && text !== '/skip') {
      let title = '';
      let arrayLinks = [];

      for (let t of text.split('\n')) {
        if (title === '') {
          title = t;
        } else {
          let label = t.substring(0, t.indexOf(':'));
          let url = t.substring(t.indexOf(':') + 1);

          arrayLinks.push(`[${label}](${url})`);
        }
      }

      ctx.session.store.answer({ 'title': title, 'links': arrayLinks });
      fillStore(ctx);
    } else {
      ctx.session.store.answer(text);
      fillStore(ctx);
    }

  }
});

module.exports = bot;
module.exports.api = `/bot${BOT_API_TOKEN}`;
