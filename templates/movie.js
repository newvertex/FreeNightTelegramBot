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
      name: 'movie-links',
      type: 'links',
      multiple: true,
      required: false,
      prompt: __('p-links', lang),
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
    let seperator = '—---------------------------------------------';

    let links = '';
    let subLinks = '';
    let buttons = null;

    let allLinks = super.getFieldValue('movie-links');
    for (let link of allLinks) {

      switch (link.type) {
        case 'Link':
          links += `${seperator}\n🎥${link.quality}: 🔻(${link.label}) ${link.size}\n🔥${link.url}\n`;
          break;
        case 'HyperLink':
          links += `${seperator}\n[🎥${link.quality}](${link.url}): 🔻(${link.label}) ${link.size}🔥\n`;
          break;
        case 'SubLink':
          if (subLinks === '') {
            subLinks += `${seperator}\n📇SubLink:🔻\n`;
          }
          subLinks += `🔥${link.quality}: 🔻(${link.label}) ${link.size}\n🔥${link.url}\n`;
          break;
        case 'HyperSubLink':
          if (subLinks === '') {
            subLinks += `${seperator}\n📇SubLink:🔻\n`;
          }
          subLinks += `[🎥${link.quality}: 🔻(${link.label})](${link.url}) ${link.size}🔥\n`;
          break;
        case 'Button':
          if (!buttons) {
            buttons = [];
          }
          buttons.push({'text': `🎥${link.quality}: 🔻(${link.label}) ${link.size}\n🔥`, 'url': link.url});
          break;
      }
    }

    let genre = super.getFieldValue('movie-genre')[0] || '-';
    genre = (genre !== '-') ? genre.trim().split(' ').map(i => '#' + i).join(' ') : '';

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
      'links': links,
      'subLinks': subLinks,
      'tag': tag
    };

    return {
      type: 'text',
      data: {
        photo: null,
        text: __('movie-result', data, lang),
        buttons: buttons
      }
    }
  }
}

module.exports = Movie;
