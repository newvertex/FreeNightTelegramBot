let imgur = require('imgur');

imgur.setAPIUrl('https://api.imgur.com/3/');

function uploadIt(file) {
  return imgur.uploadUrl(file);
}

module.exports.uploadIt = uploadIt;
