let axios = require('axios');
let querystring = require('querystring');

let API_URL = 'http://opizo.com/webservice/shrink';

// Enter username on opizo.com site on here or add as environment varialbe
let username = process.env.SHORT_LINK_USERNAME || '';

function shortIt(url) {
  return axios.post(API_URL, querystring.stringify({
    url,
    username
  }));
}

module.exports.shortIt = shortIt;
