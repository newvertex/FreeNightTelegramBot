const Template = require('./template');
const __ = require('multi-lang')('lang/movie-poster.lang.json');

class PostPreview extends Template {
  constructor(lang = 'en') {
    super('PostPreview', 'photo', [{
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
      name: 'movie-summary',
      type: 'text',
      multiple: false,
      required: false,
      prompt: __('p-summary', lang),
      value: []
    }, {
      name: 'post-linkTitle',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-linkTitle', lang),
      value: []
    }, {
      name: 'post-linkUrl',
      type: 'text',
      multiple: false,
      required: true,
      prompt: __('p-linkUrl', lang),
      value: []
    }]);

  }

  result(lang = 'en') {
    let photo = super.getFieldValue('photo')[0];

    let buttons = [{
      'text': super.getFieldValue('post-linkTitle')[0] || '-',
      'url': super.getFieldValue('post-linkUrl')[0] || 'http://newvertex.github.io'
    }];

    let data = {
      'name': super.getFieldValue('movie-name')[0] || '-',
      'summary': super.getFieldValue('movie-summary')[0] || '-'
    };

    return {
      type: 'photo',
      data: {
        photo: photo,
        text: __('movie-preview-result', data, lang),
        buttons: buttons
      }
    }
  }
}

module.exports = PostPreview;
