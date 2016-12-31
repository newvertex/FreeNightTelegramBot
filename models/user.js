const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
  _id: String,
  keys: [{
    key: { type: String },
    id: { type: String }
  }],
  signature: String,
  lang: { type: String, default: 'en' }
});

module.exports = mongoose.model('User', userSchema);
