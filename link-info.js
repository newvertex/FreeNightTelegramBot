const axios = require('axios');
const pretty = require('prettysize');

function getLinkInfo(url, shortUrl) {
    return axios.head(url)
      .then((res) => {
        const fileName = url.split('/').pop();

        if (typeof (res.headers['content-length']) !== 'undefined') {
          const contentLength = res.headers['content-length'];
          const sizeInMb = pretty(contentLength);

          return { sizeInMb, contentLength, fileName, shortUrl };
        }

        return { sizeInMb: '', contentLength: '', fileName, shortUrl };
      }).catch((err) => {
        return { sizeInMb: '', contentLength: '', fileName: `Can't get link info!`, shortUrl };
      });
}

module.exports = getLinkInfo;
