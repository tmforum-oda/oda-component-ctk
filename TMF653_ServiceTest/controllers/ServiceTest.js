'use strict';

var url = require('url');

var ServiceTest = require('../service/ServiceTestService');

module.exports.createServiceTest = function createServiceTest (req, res, next) {
  ServiceTest.createServiceTest(req, res, next);
};

module.exports.deleteServiceTest = function deleteServiceTest (req, res, next) {
  ServiceTest.deleteServiceTest(req, res, next);
};

module.exports.listServiceTest = function listServiceTest (req, res, next) {
  ServiceTest.listServiceTest(req, res, next);
};

module.exports.patchServiceTest = function patchServiceTest (req, res, next) {
  ServiceTest.patchServiceTest(req, res, next);
};

module.exports.retrieveServiceTest = function retrieveServiceTest (req, res, next) {
  ServiceTest.retrieveServiceTest(req, res, next);
};
