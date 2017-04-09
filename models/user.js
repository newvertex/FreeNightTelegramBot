const mongoose = require('mongoose');

const tuserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  keys: [{
    key: { type: String },
    kid: { type: String }
  }],
  signature: { type: String, 'default': '' },
  lang: { type: String, 'default': 'en' },
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('tuser', tuserSchema);
