'use strict';

var $ = require('jquery');
var _ = require('underscore');

// Hack: Append jQuery to `window` for use by legacy libraries
window.$ = window.jQuery = $;

require('jquery.inputmask');
require('jquery.inputmask/dist/inputmask/inputmask.date.extensions.js');
require('jquery.inputmask/dist/inputmask/inputmask.numeric.extensions.js');

var typeahead = require('./typeahead');
var typeaheadFilter = require('./typeahead-filter');
var FilterControl = require('./filter-control').FilterControl;
var moment = require('moment');

var cyclesTemplate = require('./templates/election-cycles.hbs');

var KEYCODE_ENTER = 13;

function ensureArray(value) {
  return _.isArray(value) ? value : [value];
}

function prepareValue($elm, value) {
  return $elm.attr('type') === 'checkbox' ?
    ensureArray(value) :
    value;
}

function Filter(elm) {
  this.$body = $(elm);
  this.$input = this.$body.find('input:not([name^="_"])');
  this.$remove = this.$body.find('.button--remove');

  this.$input.on('change', this.handleChange.bind(this));
  this.$input.on('keydown', this.handleKeydown.bind(this));
  this.$remove.on('click', this.handleClear.bind(this));

  this.name = this.$body.data('name') || this.$input.attr('name');
  this.fields = [this.name];

  $('body').on('filter:modify', this.handleModifyEvent.bind(this));

  if (this.$body.hasClass('js-filter-control')) {
    new FilterControl(this.$body);
  }

  if (this.$input.data('inputmask')) {
    this.$input.inputmask();
  }
}

Filter.build = function($elm) {
  if ($elm.hasClass('js-date-choice-field')) {
    return new DateFilter($elm);
  } else if ($elm.hasClass('js-typeahead-filter')) {
    return new TypeaheadFilter($elm);
  } else if ($elm.hasClass('js-election-filter')) {
    return new ElectionFilter($elm);
  } else if ($elm.hasClass('js-multi-filter')) {
    return new MultiFilter($elm);
  } else if ($elm.hasClass('js-select-filter')) {
    return new SelectFilter($elm);
  } else {
    return new Filter($elm);
  }
};

Filter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
  return this;
};

Filter.prototype.setValue = function(value) {
  var $input = this.$input.data('temp') ?
    this.$body.find('#' + this.$input.data('temp')) :
    this.$input;
  $input.val(prepareValue($input, value)).change();
  return this;
};

Filter.prototype.handleClear = function() {
  this.setValue();
  this.$input.focus();
};

Filter.prototype.handleKeydown = function(e) {
  if (e.which === KEYCODE_ENTER) {
    e.preventDefault();
    this.$input.change();
  }
};

Filter.prototype.handleModifyEvent = function() {};

Filter.prototype.handleChange = function(e) {
  var $input = $(e.target);
  var type = $input.attr('type') || 'text';
  var prefix = $input.data('prefix');
  var suffix = $input.data('suffix');
  var id = $input.attr('id');
  var eventName;
  var value;

  this.$remove.css('display', $input.val() ? 'block' : 'none');

  if (type === 'checkbox' || type === 'radio') {
    eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';
    value = $('label[for="' + id + '"]').text();
  } else if (type === 'text') {
    eventName = $input.val().length ? 'filter:added' : 'filter:removed';
    value = $input.val();
  } else {
    return;
  }

  if (prefix) {
    value = prefix + ' ' + value;
  }
  if (suffix) {
    value = value + ' ' + suffix;
  }

  $input.trigger(eventName, [
    {
      key: id,
      value: value,
    }
  ]);
};

function SelectFilter(elm) {
  Filter.call(this, elm);
  this.$input = this.$body.find('select');
  this.name = this.$input.attr('name');
  this.requiredDefault = this.$body.data('required-default') || null; // If a default is required
  this.setRequiredDefault();
}

SelectFilter.prototype = Object.create(Filter.prototype);
SelectFilter.constructor = SelectFilter;

SelectFilter.prototype.setRequiredDefault = function() {
  if (this.requiredDefault) {
    this.setValue(this.requiredDefault);
  }
};

SelectFilter.prototype.fromQuery = function(query) {
  this.setValue(query[this.name]);
};

SelectFilter.prototype.setValue = function(value) {
  this.$input.find('option[selected]').attr('selected','false');
  this.$input.find('option[value="' + value + '"]').attr('selected','true');
  this.$input.change();
};

function DateFilter(elm) {
  Filter.call(this, elm);

  this.$minDate = this.$body.find('.js-min-date');
  this.$maxDate = this.$body.find('.js-max-date');
  this.$minDate.inputmask('mm-dd-yyyy', {
    oncomplete: this.validate.bind(this)
  });
  this.$maxDate.inputmask('mm-dd-yyyy', {
    oncomplete: this.validate.bind(this)
  });

  this.$body.on('change', this.handleRadioChange.bind(this));
  this.fields = ['min_' + this.name, 'max_' + this.name];
}

DateFilter.prototype = Object.create(Filter.prototype);
DateFilter.constructor = DateFilter;

DateFilter.prototype.handleRadioChange = function(e) {
  var $input = $(e.target);
  if (!$input.is(':checked')) { return; }
  if ($input.attr('data-min-date')) {
    this.$minDate.val($input.data('min-date')).change();
    this.$maxDate.val($input.data('max-date')).change();
  }
};

DateFilter.prototype.validate = function() {
  var years = [this.minYear, this.maxYear];
  var minDateYear = this.$minDate.val() ?
    parseInt(this.$minDate.val().split('-')[2]) : this.minYear;
  var maxDateYear = this.$maxDate.val() ?
    parseInt(this.$maxDate.val().split('-')[2]) : this.maxYear;
  if ( years.indexOf(minDateYear) > -1 && years.indexOf(maxDateYear) > -1 ) {
    this.hideWarning();
    this.$body.trigger('filters:validation', [
      {
        isValid: true,
      }
    ]);
  } else {
    this.showWarning();
    this.$body.trigger('filters:validation', [
      {
        isValid: false,
      }
    ]);
  }
};

DateFilter.prototype.fromQuery = function(query) {
  if (query['min_' + this.name] || query['max_' + this.name]) {
    this.setValue([
      query['min_' + this.name],
      query['max_' + this.name]
    ]);
  }
  return this;
};

DateFilter.prototype.setValue = function(value) {
  value = ensureArray(value);
  this.$minDate.val(value[0]).change();
  this.$maxDate.val(value[1]).change();
};

DateFilter.prototype.handleModifyEvent = function(e, opts) {
  var today = new Date();
  // Sets min and max years based on the transactionPeriod filter
  if (opts.filterName === this.name) {
    this.maxYear = parseInt(opts.filterValue);
    this.minYear = this.maxYear - 1;
    this.$minDate.val('01-01-' + this.minYear.toString()).change();
    if (this.maxYear === today.getFullYear()) {
      today = moment(today).format('MM-DD-YYYY');
      this.$maxDate.val(today).change();
    } else {
      this.$maxDate.val('12-31-' + this.maxYear.toString()).change();
    }
    this.validate();
  }
};

DateFilter.prototype.showWarning = function() {
  if (!this.showingWarning) {
    var warning =
    '<div class="message message--error message--small">' +
      'You entered a date that\'s outside the selected transaction period. ' +
      'Please enter a receipt date from ' +
      '<strong>' + this.minYear + '-' + this.maxYear + '</strong>' +
    '</div>';
    this.$maxDate.after(warning);
    this.showingWarning = true;
  }
};

DateFilter.prototype.hideWarning = function() {
  if (this.showingWarning) {
    this.$body.find('.message').remove();
    this.showingWarning = false;
  }
};

function TypeaheadFilter(elm) {
  Filter.call(this, elm);

  var key = this.$body.data('dataset');
  var allowText = this.$body.data('allow-text') !== undefined;
  var dataset = key ? typeahead.datasets[key] : null;
  this.typeaheadFilter = new typeaheadFilter.TypeaheadFilter(this.$body, dataset, allowText);
  this.typeaheadFilter.$body.on('change', 'input[type="checkbox"]', this.handleNestedChange.bind(this));
}

TypeaheadFilter.prototype = Object.create(Filter.prototype);
TypeaheadFilter.constructor = TypeaheadFilter;

TypeaheadFilter.prototype.fromQuery = function(query) {
  var values = query[this.name] ? ensureArray(query[this.name]) : [];
  this.typeaheadFilter.getFilters(values);
  this.typeaheadFilter.$body.find('input[type="checkbox"]').val(values);
  return this;
};

// Ignore changes on typeahead input
TypeaheadFilter.prototype.handleChange = function() {};

TypeaheadFilter.prototype.handleNestedChange = function(e) {
  var $input = $(e.target);
  var id = $input.attr('id');
  var $label = this.$body.find('[for="' + id + '"]');

  var eventName = $input.is(':checked') ? 'filter:added' : 'filter:removed';

  $input.trigger(eventName, [
    {
      key: id,
      value: $label.text(),
    }
  ]);
};

function ElectionFilter(elm) {
  Filter.call(this, elm);

  this.duration = parseInt(this.$body.data('duration'));
  this.cycleName = this.$body.data('cycle-name');
  this.fullName = this.$body.data('full-name');

  this.$election = this.$body.find('.js-election');
  this.$cycles = this.$body.find('.js-cycles');
  this.$cycle = this.$body.find('input[type="hidden"][name="' + this.cycleName + '"]');
  this.$full = this.$body.find('input[type="hidden"][name="' + this.fullName + '"]');

  this.$election.on('change', this.handleElectionChange.bind(this));
  this.$cycles.on('change', this.handleCycleChange.bind(this));

  this.fields = [this.name, this.cycleName, this.fullName];
}

ElectionFilter.prototype = Object.create(Filter.prototype);
ElectionFilter.constructor = ElectionFilter;

ElectionFilter.prototype.fromQuery = function(query) {
  var election = query[this.name] || '2016';
  var cycle = query[this.cycleName] || election;
  var full = query[this.fullName] !== null ? query[this.fullName] : true;
  if (election) {
    this.$election.val(election);
    this.handleElectionChange({target: this.$election});
    this.$cycles.find('input[value="' + cycle + ':' + full + '"]')
      .prop('checked', true)
      .change();
  }
  return this;
};

ElectionFilter.prototype.handleChange = function() {};

ElectionFilter.prototype.handleElectionChange = function(e) {
  if (this.duration === 2) {
    return;
  }
  var election = parseInt($(e.target).val());
  var cycles = _.range(election - this.duration + 2, election + 2, 2);
  var bins = _.map(cycles, function(cycle) {
    return {
      name: this.name,
      cycle: cycle,
      min: cycle - 1,
      max: cycle,
      full: false
    };
  }.bind(this));
  bins.unshift({
    name: this.name,
    cycle: election,
    min: election - this.duration + 1,
    max: election,
    full: true
  });
  this.$cycles.html(cyclesTemplate(bins));
  this.$cycles.find('input').eq(0).prop('checked', true).change();
};

ElectionFilter.prototype.handleCycleChange = function(e) {
  var selected = $(e.target).val().split(':');
  this.$cycle.val(selected[0]).change().attr('checked', true);
  this.$full.val(selected[1]).change();
  this.setTag();
};

ElectionFilter.prototype.setTag = function() {
  var election = this.$election.val();
  var cycle = this.$cycles.find(':checked').data('display-value');
  var value = election + ' election: ' + cycle;
  this.$election.trigger('filter:added', [
    {
      key: 'election',
      value: value,
      nonremovable: true
    }
  ]);
};

/* MultiFilters used when there are multiple filters that share the
 * same name attribute
*/

function MultiFilter(elm) {
  Filter.call(this, elm);
  this.$group = $(this.$body.data('filter-group'));
  this.$input = this.$group.find('input[name=' + this.name + ']');
}

MultiFilter.prototype = Object.create(Filter.prototype);
MultiFilter.constructor = MultiFilter;

module.exports = {Filter: Filter};
