const MoviePoster = require('./movie-poster');
const Movie = require('./movie');
const Link = require('./link');

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

function newLink() {
  return new Link();
}

module.exports.selectTemplate = selectTemplate;
module.exports.newLink = newLink;
