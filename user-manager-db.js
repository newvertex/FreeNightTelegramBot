const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const User = require('./models/user');

let users = null;

// mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', console.error.bind(console, 'Error on connecting to mongodb '));
mongoose.connection.on('open', () => {
  console.log('Connected to mongodb');
  User.find({}, (err, result) => {
    if (err) {
      console.log(`Error on getting users data: ${err}`);
    } else {
      users = result;
      console.log('Users data load successfully');
    }
  });
});


function addUser(userId) {
  if (!users.filter((u) => u._id == userId).length) {
    let user = {
      _id: userId,
      keys: [],
      signature: '',
      lang: 'en'
    };

    users.push(user);

    User.create({ _id: userId }, (err, result) => {
      if (err) {
        console.log(`Error on addUser: ${err}`);
      } else {
        console.log(`New user added with id: ${result._id}`);
      }
    });

    return true;
  } else {
    // User exists
    return false;
  }
}

function addKey(user) {
  let currentUser = users.filter((u) => u._id == user._id)[0];

  if (!currentUser.keys.filter((k) => k.key == user.keys[0].key).length) {

    currentUser.keys.push(user.keys[0]);

    User.findByIdAndUpdate(
      user._id,
      { $push: { 'keys': user.keys[0] }},
      { upsert: true },
      (err, result) => {
        if (err) {
          console.log(`Error on AddKey: ${err}`);
        } else {
          console.log(`Key add for user with id: ${result._id}`);
        }
      }
    );

    return true;
  } else {
    // The key user want to add is exists try another one
    return false;
  }
}

function getId(user) {
  let result = null;

  let currentUser = users.filter((u) => u._id == user._id);

  if (currentUser.length) {
    result = {};
    result._id = currentUser[0]._id;

    let currentKey = currentUser[0].keys.filter((k) => k.key == user.keys[0].key);

    if (currentKey.length) {
      result.keys = {};
      result.keys[0] = currentKey[0];
    }
  }

  return result;
}

function getSignature(userId) {
  let currentUser = users.filter((u) => u._id == userId);

  return currentUser.length && currentUser[0].signature ? currentUser[0].signature : '';
}

function setSignature(userId, userSignature) {
  let currentUser = users.filter((u) => u._id == userId)[0];

  currentUser['signature'] = userSignature;

  User.findByIdAndUpdate(
    userId,
    { $set: { 'signature': userSignature }},
    { upsert: true },
    (err, result) => {
      if (err) {
        console.log(`Error on setSignature: ${err}`);
      } else {
        console.log(`Signature updated for user with id: ${result._id}`);
      }
    }
  );

  return true;
}

function getLang(userId) {
  let currentUser = users.filter((u) => u._id == userId);
  return currentUser.length && currentUser[0].lang ? currentUser[0].lang : 'en';
}

function setLang(userId, userLanguage) {
  let currentUser = users.filter((u) => u._id == userId)[0];

  currentUser['lang'] = userLanguage;

  User.findByIdAndUpdate(
    userId,
    { $set: { 'lang': userLanguage }},
    { upsert: true },
    (err, result) => {
      if (err) {
        console.log(`Error on setLang: ${err}`);
      } else {
        console.log(`Language updated for user with id: ${result._id}`);
      }
    }
  );

  return true;
}

module.exports.addUser = addUser;
module.exports.addKey = addKey;
module.exports.getId = getId;
module.exports.getSignature = getSignature;
module.exports.setSignature = setSignature;
module.exports.getLang = getLang;
module.exports.setLang = setLang;
