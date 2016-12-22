class Link {
  constructor() {
    this.url = ''; // http[s]://...
    this.type = 'Link'; // Link, HyperLink, SubLink, HyperSubLink, ButtonLink
    this.label = '';  // This is my link
    this.size = ''; // 18.6 MB
    this.quality = 'None';

    this.fields = Object.getOwnPropertyNames(this);
    this.index = 0;
  }

  getNext() {
    if (this.index < 5) {
      return {
        'name': this.fields[this.index],
        'value': this[this.fields[this.index]]
      };
    } else {
      return false;
    }
  }

  setNext(value) {
    if (this.index < 5) {

      if (value !== '.') {
        this[this.fields[this.index]] = value;
      }

      this.index += 1;
      return true;
    } else {
      return false;
    }
  }

  hasNext() {
    if (this.index < 5) {
      return true;
    } else {
      return false;
    }
  }

}

module.exports = Link;
