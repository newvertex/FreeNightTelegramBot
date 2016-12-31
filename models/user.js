const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
  _id: String,
  keys: [{
    key: { type: String },
    kid: { type: String }
  }],
  signature: { type: String, default: '' },
  lang: { type: String, default: 'en' }
});

module.exports = mongoose.model('User', userSchema);
