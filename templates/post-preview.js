const __ = require('multi-lang')('lang/movie-poster.lang.json');

class PostPreview {
  constructor(photo, name, summary) {
    this.photo = photo;
    this.name = name;
    this.summary = summary;
  }

  result(lang = 'en') {

    let data = {
      'name': this.name,
      'summary': this.summary
    }

    return {
      type: 'photo',
      data: {
        photo: this.photo,
        text: __('movie-preview-result', data, lang)
      }
    }
  }
}

module.exports = PostPreview;
