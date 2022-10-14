'use strict';

var url = require('url');

var ServiceTestSpecification = require('../service/ServiceTestSpecificationService');

module.exports.createServiceTestSpecification = function createServiceTestSpecification (req, res, next) {
  ServiceTestSpecification.createServiceTestSpecification(req, res, next);
};

module.exports.deleteServiceTestSpecification = function deleteServiceTestSpecification (req, res, next) {
  ServiceTestSpecification.deleteServiceTestSpecification(req, res, next);
};

module.exports.listServiceTestSpecification = function listServiceTestSpecification (req, res, next) {
  ServiceTestSpecification.listServiceTestSpecification(req, res, next);
};

module.exports.patchServiceTestSpecification = function patchServiceTestSpecification (req, res, next) {
  ServiceTestSpecification.patchServiceTestSpecification(req, res, next);
};

module.exports.retrieveServiceTestSpecification = function retrieveServiceTestSpecification (req, res, next) {
  ServiceTestSpecification.retrieveServiceTestSpecification(req, res, next);
};
