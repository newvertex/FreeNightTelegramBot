const rp = require('request-promise-native');
const pretty = require('prettysize');
const url = require('url');

let API_URL = 'http://opizo.com/webservice/shrink';

// Enter username on opizo.com site on here or add as environment varialbe
let username = process.env.SHORT_LINK_USERNAME || '';

function shortLink(link) {
  let result = {
    url: link,
    shortUrl: null,
    fileInfo: null
  };

  return rp.post(API_URL, {
      form: {
        url: link,
        username
      }
    })
    .then(body => {
      if (body.length > 5) {
        result.shortUrl = body;
        return rp.head(link);
      } else {
        throw `Server Error: ${body}`;
      }
    }).then(header => {
      if (typeof(header['content-length']) !== 'undefined') {
        result.fileInfo = {};
        result.fileInfo.contentLength = header['content-length'];
        result.fileInfo.sizeInMB = pretty(result.fileInfo.contentLength);

        const parsedUrl = url.parse(link);
        const fileName = parsedUrl.path.replace(parsedUrl.search, '')
          .split('/').pop();

        result.fileInfo.name = fileName;
      }

      return result;
    })
    .catch(err => {
      if (!result.shortUrl) {
        throw {
          code: 1,
          message: 'Server error on generating short link!',
          result: result,
          rp: err
        };
      }

      if (!result.fileInfo) {
        throw {
          code: 2,
          message: 'Can\'t access to requested link',
          result: result,
          rp: err
        };
      }
    });
}

module.exports = shortLink;
