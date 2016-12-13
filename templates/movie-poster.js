const Template = require('./template');

class MoviePoster extends Template {
  constructor() {
    super('Movie Poster', 'photo', [{
      name: 'photo',
      type: 'photo',
      multiple: false,
      required: true,
      prompt: 'Upload a photo or give me the image link',
      value: []
    }, {
      name: 'movie-name',
      type: 'text',
      multiple: false,
      required: true,
      prompt: 'What is the movie name?',
      value: []
    }, {
      name: 'movie-director',
      type: 'text',
      multiple: false,
      required: true,
      prompt: 'Who is the director?',
      value: []
    }, {
      name: 'movie-stars',
      type: 'text',
      multiple: false,
      required: true,
      prompt: 'Starring?',
      value: []
    }, {
      name: 'movie-release-date',
      type: 'text',
      multiple: false,
      required: true,
      prompt: 'Release dates?',
      value: []
    }, {
      name: 'hash-tag',
      type: 'text',
      multiple: false,
      required: false,
      prompt: 'Hash tag?',
      value: []
    }]);

  }

  result() {
    let photo = super.getFieldValue('photo')[0];

    let title = `🎥Movie: ${super.getFieldValue('movie-name')}`;
    let director = `👤Director: ${super.getFieldValue('movie-director')}`;
    let starring = `👥Starring: ${super.getFieldValue('movie-stars')}`;
    let release = `📆Release date: ${super.getFieldValue('movie-release-date')}`;
    let tag = `${super.getFieldValue('hash-tag')}`;

    return {
      type: 'photo',
      data: {
        photo: photo,
        text: `${title}\n${director}\n${starring}\n${release}\n${tag}`
      }
    }
  }
}

module.exports = MoviePoster;
