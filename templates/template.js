class Template {
  constructor(name, type = 'text', fields = []) {
    this.name = name;
    this.type = type;

    this.fields = fields;
    this.state = 0;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
  }

  get state() {
    return this._state;
  }

  set state(value) {
    this._state = value;
  }

  incState(value = 1) {
    this._state += value;
  }

  get fields() {
    return this._fields;
  }

  set fields(value) {
    this._fields = value;
  }

  get currentFieldType() {
    return this._fields[this.state].type;
  }

  getFieldValue(fieldName) {
    let field = this._fields.filter(field => field.name === fieldName);
    return field.length ? field[0].value : null;
  }

  setFieldValue(fieldName, fieldValue) {
    let field = this._fields.filter(field => field.name === fieldName);
    if (field.length) {
      field[0].value.push(fieldValue);
    }
  }

  prompt() {
    if (this._state < this._fields.length) {
      return {
        'text': this._fields[this._state].prompt,
        'value': this._fields[this._state].value
      }
    } else {
      return null;
    }
  }

  answer(answerValue) {
    let field = this._fields[this._state];
    let skipMultiple = field.multiple && typeof answerValue === 'string' && answerValue === '/skip';
    let skipValue = typeof answerValue === 'string' && answerValue === '.';

    if (skipMultiple) {
      this.incState();
    } else {
      if (!skipValue) {
        if (field.multiple) {
          field.value.push(answerValue);
        } else {
          field.value[0] = answerValue;
        }
      }
      if (!field.multiple && (!field.required || field.value.length)) {
        this.incState();
      }
    }
  }

  result(type = 'text', data = {text: '', photo: ''}) {
    return {
      type,
      data
    }
  }
}

module.exports = Template;
