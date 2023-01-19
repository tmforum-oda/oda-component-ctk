'use strict';

var url = require('url');

var NotificationListenersClientSide = require('../service/NotificationListenersClientSideService');

module.exports.listenToServiceTestAttributeValueChangeEvent = function listenToServiceTestAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToServiceTestCreateEvent = function listenToServiceTestCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestCreateEvent(req, res, next);
};

module.exports.listenToServiceTestDeleteEvent = function listenToServiceTestDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestDeleteEvent(req, res, next);
};

module.exports.listenToServiceTestSpecificationAttributeValueChangeEvent = function listenToServiceTestSpecificationAttributeValueChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestSpecificationAttributeValueChangeEvent(req, res, next);
};

module.exports.listenToServiceTestSpecificationCreateEvent = function listenToServiceTestSpecificationCreateEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestSpecificationCreateEvent(req, res, next);
};

module.exports.listenToServiceTestSpecificationDeleteEvent = function listenToServiceTestSpecificationDeleteEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestSpecificationDeleteEvent(req, res, next);
};

module.exports.listenToServiceTestStateChangeEvent = function listenToServiceTestStateChangeEvent (req, res, next) {
  NotificationListenersClientSide.listenToServiceTestStateChangeEvent(req, res, next);
};
