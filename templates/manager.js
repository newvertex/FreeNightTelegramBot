const MoviePoster = require('./movie-poster');
const Movie = require('./movie');

function selectTemplate(templateName, userLang) {
  let template = null;

  switch (templateName) {
    case "Movie":
      template = new Movie(userLang);
      break;
    case 'MoviePoster':
      template = new MoviePoster(userLang);
      break;
  }

  return template;
}

module.exports.selectTemplate = selectTemplate;
