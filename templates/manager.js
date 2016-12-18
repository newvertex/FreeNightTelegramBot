const MoviePoster = require('./movie-poster');

function selectTemplate(templateName, userLang) {
  let template = null;

  switch (templateName) {
    case 'MoviePoster':
      template = new MoviePoster(userLang);
      break;
  }

  return template;
}

module.exports.selectTemplate = selectTemplate;
