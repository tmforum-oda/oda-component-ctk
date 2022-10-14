'use strict';

var url = require('url');

var EventsSubscription = require('../service/EventsSubscriptionService');

module.exports.registerListener = function registerListener (req, res, next) {
  EventsSubscription.registerListener(req, res, next);
};

module.exports.unregisterListener = function unregisterListener (req, res, next) {
  EventsSubscription.unregisterListener(req, res, next);
};
