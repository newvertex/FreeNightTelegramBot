module.exports = function(multiLang){

  const MoviePoster = require('./movie-poster')(multiLang);

  function selectTemplate(templateName) {
    let template = null;

    switch (templateName) {
      case 'MoviePoster':
        template = new MoviePoster();
        break;
    }

    return template;
  }

  return {
    selectTemplate
  };
}
