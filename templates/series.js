const Template = require('./template');
const __ = require('multi-lang')('lang/movie-poster.lang.json');

class Movie extends Template {
  constructor(lang = 'en') {
    super('Movie', 'text', [{
      name: 'photo',
      type: 'photo',
      multiple: false,
      required: false,
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
      required: false,
      prompt: __('p-release', lang),
      value: []
    }, {
      name: 'movie-country',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-country', lang),
      value: []
    }, {
      name: 'movie-genre',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-genre', lang),
      value: []
    }, {
      name: 'movie-rank',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-rank', lang),
      value: []
    }, {
      name: 'movie-reviewer-rank',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-reviewerRank', lang),
      value: []
    }, {
      name: 'movie-summary',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-summary', lang),
      value: []
    }, {
      name: 'movie-sectionHeader',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-sectionHeader', lang),
      value: []
    }, {
      name: 'movie-linksHeader',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-linksHeader', lang),
      value: []
    }, {
      name: 'movie-links',
      type: 'arrayLinks',
      multiple: true,
      required: false,
      prompt: __('p-arrayLinks', lang),
      value: []
    }, {
      name: 'movie-subLink',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-subLink', lang),
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
    let imageLink = super.getFieldValue('photo')[0];

    let links = '';

    let allLinks = super.getFieldValue('movie-links');
    for (let item of allLinks) {
      links += `🎥${item.title}: ${item.links.join(' | ')}\n`;
    }

    let genre = super.getFieldValue('movie-genre')[0] || '-';
    if (typeof genre !== 'string') {
      genre = genre.join(' ');
    }
    genre = (genre !== '-') ? '\n' + genre.trim().split(' ').map(i => '#' + i).join(' | ') : '';
    
    let tag = super.getFieldValue('hash-tag')[0] || '-';
    tag = (tag !== '-') ? '\n' + tag.trim().split(' ').map(i => '#' + i).join(' ') : '';

    let data = {
      'name': super.getFieldValue('movie-name')[0] || '-',
      'director': super.getFieldValue('movie-director')[0] || '-',
      'starring': super.getFieldValue('movie-stars')[0] || '-',
      'release': super.getFieldValue('movie-release-date')[0] || '-',
      'country': super.getFieldValue('movie-country')[0] || '-',
      'genre': genre,
      'rank': super.getFieldValue('movie-rank')[0] || '-',
      'reviewerRank': super.getFieldValue('movie-reviewer-rank')[0] || '-',
      'summary': super.getFieldValue('movie-summary')[0] || '-',
      'poster': imageLink,
      'sectionHeader': super.getFieldValue('movie-sectionHeader')[0] || '-',
      'linksHeader': super.getFieldValue('movie-linksHeader')[0] || '-',
      'links': links,
      'subLink': super.getFieldValue('movie-subLink')[0] || '-',
      'tag': tag
    };

    return {
      type: 'text',
      data: {
        photo: null,
        text: __('series-result', data, lang),
        buttons: null
      }
    }
  }
}

module.exports = Movie;
