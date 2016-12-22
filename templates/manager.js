const MoviePoster = require('./movie-poster');
const Movie = require('./movie');
const Link = require('./link');
const PostPreview = require('./post-preview');

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

function newPostPreview(photo, name, summary) {
  return new PostPreview(photo, name, summary);
}

module.exports.selectTemplate = selectTemplate;
module.exports.newLink = newLink;
module.exports.newPostPreview = newPostPreview;
