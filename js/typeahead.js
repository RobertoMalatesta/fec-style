'use strict';

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var Handlebars = require('handlebars');

// Hack: Append jQuery to `window` for use by typeahead.js
window.$ = window.jQuery = $;

require('typeahead.js/dist/typeahead.jquery');
var Bloodhound = require('typeahead.js/dist/bloodhound');

var events = require('./events');

var officeMap = {
  H: 'House',
  S: 'Senate',
  P: 'President'
};

function formatCandidate(result) {
  return {
    name: result.name,
    id: result.id,
    office: officeMap[result.office_sought]
  };
}

function getUrl(resource) {
  return URI(window.API_LOCATION)
    .path([window.API_VERSION, 'names', resource, ''].join('/'))
    .query({
      q: '%QUERY',
      api_key: window.API_KEY
    })
    .readable();
}

var engineOpts = {
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 10
};

function createEngine(opts) {
  return new Bloodhound(_.extend({}, engineOpts, opts));
}

var candidateEngine = createEngine({
  remote: {
    url: getUrl('candidates'),
    wildcard: '%QUERY',
    transform: function(response) {
      return _.map(response.results, formatCandidate);
    }
  }
});

var committeeEngine = createEngine({
  remote: {
    url: getUrl('committees'),
    wildcard: '%QUERY',
    transform: function(response) {
      return response.results;
    },
  }
});

var candidateDataset = {
  name: 'candidate',
  display: 'name',
  limit: 3,
  source: candidateEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a candidate:</span>',
    pending: '<span class="tt-suggestion__loading">Loading suggestions...</span>',
    notFound: Handlebars.compile(
      '<span class="tt-suggestion__header tt-suggestion__missing">No candidates found matching "{{query}}"</span>'
    ),
    suggestion: Handlebars.compile(
      '<span>' +
        '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>' +
        '<span class="tt-suggestion__office">{{ office }}</span>' +
      '</span>'
    )
  }
};

var committeeDataset = {
  name: 'committee',
  display: 'name',
  limit: 3,
  source: committeeEngine,
  templates: {
    header: '<span class="tt-suggestion__header">Select a committee:</span>',
    pending: '<span class="tt-suggestion__loading">Loading suggestions...</span>',
    notFound: Handlebars.compile(
      '<span class="tt-suggestion__header tt-suggestion__missing">No committees found matching "{{query}}"</span>'
    ),
    suggestion: Handlebars.compile(
      '<span class="tt-suggestion__name">{{ name }} ({{ id }})</span>'
    )
  }
};

/* This is a fake dataset for showing an empty option with the query
 * when clicked, this will load the receipts page,
 * filtered to contributions from this person
 */
var individualDataset = {
  display: 'id',
  source: function(query, syncResults) {
    syncResults([{
      id: query,
      type: 'individual'
    }]);
  },
  templates: {
    suggestion: function(datum) {
      return '<span><strong>Search individual contributions from:</strong> "' + datum.id + '"</span>';
    }
  }
};

var datasets = {
  candidates: candidateDataset,
  committees: committeeDataset,
  individuals: individualDataset
};

var typeaheadOpts = {
  minLength: 3,
  highlight: true,
  hint: false
};

function Typeahead(selector, type, url) {
  this.$input = $(selector);
  this.url = url || '/';
  this.typeahead = null;

  // If there's a type defined, use that dataset; otherwise use all of them
  if (type) {
    this.dataset = datasets[type];
  } else {
    this.dataset = Object.values(datasets);
  }

  this.init();

  events.on('searchTypeChanged', this.handleChangeEvent.bind(this));
}

Typeahead.prototype.init = function() {
  if (this.typeahead) {
    this.$input.typeahead('destroy');
  }
  this.typeahead = this.$input.typeahead(typeaheadOpts, this.dataset);
  this.$element = this.$input.parent('.twitter-typeahead');
  this.$element.css('display', 'block');
  this.$element.find('.tt-menu').attr('aria-live', 'polite');
  this.$input.on('typeahead:select', this.select.bind(this));
};

Typeahead.prototype.handleChangeEvent = function(data) {
  this.init(data.type);
};

Typeahead.prototype.select = function(event, datum) {
  if (datum.type === 'individual') {
    window.location = this.url + 'receipts/individual-contributions/?contributor_name=' + datum.id;
  } else {
    window.location = this.url + this.dataset.name + '/' + datum.id;
  }
};

module.exports = {
  Typeahead: Typeahead,
  datasets: datasets
};
