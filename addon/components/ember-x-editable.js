/* globals calculateSize, WebFont */
import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['editable-container', 'editable-inline'],
  tagName: 'span',
  errorMessage: false,
  isValid: function() {
    return !this.get('errorMessage') ? true : false;
  }.property('errorMessage'),
  mouseInsideComponent: false,
  originalValue: null,
  changeSelectedUnderlineSize: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (this.get('isSelect')) {
        if (!this.get('isEditing')) {
          var size = this.getTextWidth(this.$('select'), this.$('select option:selected').text());
          this.$('.selectContainer').css('width', 'auto');
          this.$('.selectContainer').height(size.height + 8);
          this.$('select').width(size.width);
          this.$('select').height(size.height + 7);
          this.$('.borderBottom').css('width', size.width);
        } else {
          this.$('.selectContainer').css('width', '68%');
          this.$('.selectContainer').height('auto');
          this.$('select').css('width', '100%');
        }
      }
    });
  }.observes('isEditing'),
  changeTextUnderlineSize: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (this.get('isText') && !this.get('isEditing')) {
        if (this.get('value') && this.get('value').length > 0) {
          var size = this.getTextWidth(this.$('input'), this.get('value'));
          this.$('.textContainer').width('68%');
          this.$('input').width(size.width + 10);
          this.$('.borderBottom').width(size.width);
        }
      }
    });
  }.observes('isEditing'),
  makeFullWidthWhenEditing: function() {
    if (this.get('isText')) {
      this.$('input').width('100%');
    }
  }.observes('isEditing'),
  /**
   * Sets the isFieldEditing property to the current isEditing status.
   * This is used to pass isEditing out to the controller, if you need it
   */
  setFieldIsEditing: function() {
    this.set('isFieldEditing', this.get('isEditing'));
  }.observes('isEditing'),
  classes: function() {
    var classNames = '';
    if (this.get('isText')) {
      classNames += 'ember-x-editable-text input-sm';
    }
    if (this.get('isSelect')) {
      classNames += 'ember-x-editable-select input-sm';
    }
    if (!this.get('isEditing')) {
      if (!this.get('value') || this.get('value') === '' || this.get('value') === 'Empty') {
        classNames += ' is-empty';
      }
      classNames += ' is-not-editing';
    } else {
      classNames += ' is-editing';
    }
    if (this.get('errorMessage')) {
      classNames += ' error';
    }
    return classNames;
  }.property('isEditing', 'errorMessage'),
  isEditing: false,
  isSelect: function() {
    return this.get('type') === 'select';
  }.property('type'),
  isText: function() {
    return this.get('type') === 'text';
  }.property('type'),
  focusIn: function() {
    if (this.get('value') === 'Empty') {
      this.set('value', '');
    }
    this.set('isValid', true);
    this.set('isEditing', true);
  },
  focusOut: function() {
    if (!this.get('mouseInsideComponent')) {
      this.send('cancelAction');
    }
  },
  mouseEnter: function() {
    this.set('mouseInsideComponent', true);
  },
  mouseLeave: function() {
    this.set('mouseInsideComponent', false);
  },
  /**
   * Calculate the width of a text string, given the element to grab styles from and the text string
   * @param element The element the text is inside, this is used to get font size, weight, etc
   * @param text The text string we are measuring
   * @returns {*}
   */
  getTextWidth: function(element, text) {
    var fontFamily = element.css('font-family');
    var fontSize = element.css('font-size');
    var fontWeight = element.css('font-weight');
    var size = calculateSize(text, {
      font: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight
    });
    return size;
  },
  actions: {
    cancelAction: function() {
      this.set('isEditing', false);
      if (this.get('isSelect')) {
        this.set('value', this.get('originalValue'));
      }
      if (this.get('isText')) {
        this.set('value', this.get('originalValue'));
      }
      this.set('errorMessage', false);
      this.sendAction('cancelAction');
    },
    saveAction: function() {
      //Do any validation here, before saving
      if (this.get('isText')) {
        if (this.get('validator')) {
          this.set('errorMessage', this.get('validator')(this.get('value')));

          //If no errors, update the originalValue to be the newly saved value
          if (!this.get('errorMessage')) {
            this.set('originalValue', this.get('value'));
          }
        }
        else if (!this.get('value') || this.get('value') === '') {
          this.set('value', 'Empty');
        }
        //If no errors, go ahead and save
        if (!this.get('errorMessage')) {
          this.set('isEditing', false);
          this.changeTextUnderlineSize();
          this.sendAction('saveAction');
        }
      }
      else if (this.get('isSelect')) {
        if (this.get('validator')) {
          this.set('errorMessage', this.get('validator')(this.get('value')));
        }
        this.set('originalValue', this.get('value'));
        //If no errors, go ahead and save
        if (!this.get('errorMessage')) {
          this.set('isEditing', false);
          this.changeSelectedUnderlineSize();
          this.sendAction('saveAction');
        }
      }
    }
  },
  didInsertElement: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      var didInsertElementLogic = function() {
        if (this.get('isText')) {
          if (!this.get('value') || this.get('value') === '') {
            this.set('value', 'Empty');
          }
          this.changeTextUnderlineSize();
          //Store the original value, so we can restore it on cancel click
          this.set('originalValue', this.get('value'));
        }
        if (this.get('isSelect') && this.get('value')) {
          //Store the original value, so we can restore it on cancel click
          this.set('originalValue', this.get('value'));
          this.changeSelectedUnderlineSize();
        }
      }.bind(this);

      // If custom font families are being loaded with @font-face,
      // we need to wait until the font is loaded to display the inputs
      if (this.get('fontFamilyConfig')) {
        WebFont.load({
          custom: {
            families: this.get('fontFamilyConfig')
          },
          active: function() {
            didInsertElementLogic();
          }.bind(this)
        });
      } else {
        didInsertElementLogic();
      }

    });
  }
});
