'use strict';

var $ = require('jquery');
var countdown = require('countdown');
var introJs = require('intro.js');
var URI = require('urijs');

var helpers = require('./helpers');

var uri = window.location.toString();
var uriQuery = helpers.sanitizeQueryParams(URI.parseQuery(window.location.search));

function SiteOrientation(selector) {
  this.$selector = $(selector);

  this.$banner = this.$selector.find('.banner');
  this.$bannerToggleSection = this.$banner.find('.toggle');
  this.$bannerToggleLink = this.$banner.find('.toggle-text');
  this.$bannerMoreText = this.$bannerToggleLink.find('.more');
  this.$bannerLessText = this.$bannerToggleLink.find('.less');

  this.$tourHeader = this.$selector.find('.tour-header');

  this.$startTourLink = this.$selector.find('.start-tour');
  this.$startTourLink.on('click', this.startTour.bind(this));

  if (uriQuery.tour) {
    this.startTour();
  }
  else {
    this.initBanner();
  }
}

SiteOrientation.prototype.initBanner = function () {
  this.$banner.show();

  // fill in _ DAYS until this site...
  this.$days = this.$selector.find('.days');
  var countdownDate = new Date(this.$days.data('date'));
  this.$days.html(countdown(countdownDate, null, countdown.DAYS).days);

  // anonymous feedback tool click
  this.$selector.on('click', '.js-feedback', function () {
    $(document.body).trigger('feedback:open');
  });

  if (localStorage.getItem('FEC_BANNER_COLLAPSED') === 'true') {
    this.collapseBanner();
  }

  // unbind to prevent multiple click actions
  this.$bannerToggleLink.unbind().on('click', this.handleToggle.bind(this));
};

SiteOrientation.prototype.handleToggle = function () {
  this.$bannerToggleSection.toggle();
  this.$bannerLessText.toggle();
  this.$bannerMoreText.toggle();

  this.setBannerState();
};

SiteOrientation.prototype.collapseBanner = function () {
  this.$bannerToggleSection.hide();
  this.$bannerLessText.hide();
  this.$bannerMoreText.show();
};

SiteOrientation.prototype.setBannerState = function () {
  if (this.$selector.find('.more').is(':visible')) {
    localStorage.setItem('FEC_BANNER_COLLAPSED', 'true');
  }
  else {
    localStorage.setItem('FEC_BANNER_COLLAPSED', 'false');
  }
};

SiteOrientation.prototype.startTour = function () {
  var self = this;

  // if the user clicks "start a tour" on a page without tooltips
  // then it will take them to the homepage and start the tour
  if (typeof TOUR_PAGE == 'undefined') {
    window.location.href = CMS_URL + '/?tour=true';
    return;
  }

  // make sure tour window starts on top
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  this.$banner.hide();

  // set top padding for fixed tour header
  $('body').css('padding-top', this.$tourHeader.outerHeight());

  this.$tourHeader.show();

  // highlight current tour page on header and turn off link
  this.$tourHeader.find('.tour-' + TOUR_PAGE).addClass('is-active').find('a').click(function (e) {
    e.preventDefault();
  });

  this.$exitTourButton = this.$selector.find('.exit-tour');
  this.$exitTourButton.on('click', this.exitTour.bind(this));

  // display tour dots relative to their nearest element
  $('.tour-dot').css('display', 'inline-block').parent().css('position', 'relative');
  $('.tour-dot--middle').css('display', 'block');

  var tour = introJs.introJs();
  var tourLastLabel = 'Next section <i class="icon icon--small i-arrow-right"></i>';
  var nextSectionLink = this.$selector.find('.is-active').next().find('a').attr('href');
  var lastTourPage = 'legal-resources';

  // Legal resources is last tour page
  // Last tooltip opens modal
  if (TOUR_PAGE === lastTourPage) {
    tourLastLabel = 'Next <i class="icon icon--small i-arrow-right"></i>';
  }

  tour.setOptions({
    showStepNumbers: false,
    tooltipClass: 'tour-tooltip',
    tooltipPosition: 'bottom-middle-aligned',
    prevLabel: '<i class="icon icon--small i-arrow-left"></i> Back',
    nextLabel: 'Next <i class="icon icon--small i-arrow-right"></i>',
    doneLabel: tourLastLabel,
    overlayOpacity: 0
  });

  // native intro.js behavior scrolls longer tooltips offscreen
  // so this scrolls to tooltip with some padding
  tour.onchange(function (target) {
    $(window).scrollTop($(target).offset().top - 200);
  });

  tour.onexit(function () {
    if (TOUR_PAGE === lastTourPage) {
      self.exitTour();

      var tourEndCurtain = $('<div />', {'class': 'tour-end--curtain'});
      var tourEndModal = $('<div />', {
        'class': 'tour-end--modal',
        'html': '<h5><i class="icon icon-star"></i> Congratulations!</h5>' +
        'You\'ve completed our tour of new features!' +
        '<a role="button" class="tour-end--button tour-end--button--home" href="' +
        CMS_URL + '/">Return home</a>' +
        '<p>Send us your questions and feedback anonymously from any page using our ' +
        '<a class="js-feedback">feedback tool</a>.</p>' +
        '<a role="button" class="tour-end--button tour-end--button--close">Close tour</a>'
      });

      self.$selector.prepend(tourEndCurtain, tourEndModal);

      self.$selector.find('.tour-end--button--close').on('click', function () {
        tourEndCurtain.remove();
        tourEndModal.remove();
      });
    }
    else {
      window.location.href = nextSectionLink;
    }
  });

  // begin intro.js functionality
  tour.start();

  // removes native intro.js curtain to not close tooltip
  $('.introjs-overlay').remove();
};

SiteOrientation.prototype.exitTour = function () {
  this.$tourHeader.hide();
  this.initBanner();

  // removes top padding for fixed tour header
  $('body').removeAttr('style');

  this.collapseBanner();
  this.setBannerState();

  $('.tour-dot').hide();
  $('.introjs-helperLayer , .introjs-tooltipReferenceLayer').remove();

  // remove ?tour=true querystring
  if (uri.indexOf('?') > 0) {
    var clean_uri = uri.substring(0, uri.indexOf('?'));
    window.history.replaceState({}, document.title, clean_uri);
  }
};

module.exports = {
  SiteOrientation: SiteOrientation
};
