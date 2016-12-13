const MoviePoster = require('./movie-poster');

function selectTemplate(templateName) {
  let template = null;

  switch (templateName) {
    case 'MoviePoster':
      template = new MoviePoster();
      break;
  }

  return template;
}

module.exports.selectTemplate = selectTemplate;
