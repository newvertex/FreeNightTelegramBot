const Template = require('./template');
const __ = require('multi-lang')('lang/movie-poster.lang.json');

class MoviePoster extends Template {
  constructor(lang = 'en') {
    super('Movie Poster', 'photo', [{
      name: 'photo',
      type: 'photo',
      multiple: false,
      required: true,
      prompt: __('p-uploadPhoto', lang),
      value: []
    }, {
      name: 'movie-name',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-movieName', lang),
      value: []
    }, {
      name: 'movie-director',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-movieDirector', lang),
      value: []
    }, {
      name: 'movie-stars',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-starring', lang),
      value: []
    }, {
      name: 'movie-release-date',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-release', lang),
      value: []
    }, {
      name: 'hash-tag',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-hashTag', lang),
      value: []
    }]);

  }

  result(lang = 'en') {
    let photo = super.getFieldValue('photo')[0];

    let tag = super.getFieldValue('hash-tag')[0] || '-';
    tag = (tag !== '-') ? '\n' + tag.trim().split(' ').map(i => '#' + i).join(' ') : '';

    let data = {
      'name': super.getFieldValue('movie-name')[0] || '-',
      'director': super.getFieldValue('movie-director')[0] || '-',
      'starring': super.getFieldValue('movie-stars')[0] || '-',
      'release': super.getFieldValue('movie-release-date')[0] || '-',
      'tag': tag
    };

    return {
      type: 'photo',
      data: {
        photo: photo,
        text: __('movie-poster-result', data, lang)
      }
    }
  }
}

module.exports = MoviePoster;
