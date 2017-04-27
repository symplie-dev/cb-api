'use strict';

var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    Express = require('express'),
    ctrlFiles = fs.readdirSync(__dirname),
    jsFileRegEx = /.*\.js$/,
    ctrlPrms = [];

module.exports = function (app) {
  var logger = app.get('AppLogger');

  // Loop through controller files and load them
  ctrlFiles.forEach(function (fh) {
    var deferred = q.defer();

    ctrlPrms.push(deferred.promise);
    // Grab stats to ensure we're looking at a file
    fs.stat(path.join(__dirname, fh), function (err, stats) {
      var ctrlProvider;

      if (!stats.isDirectory() && fh !== 'index.js' && jsFileRegEx.test(fh)) {
          try {
            ctrlProvider = require(path.join(__dirname, fh));

            ctrlProvider(app, Express.Router()).then(function (ctrlDescription) {
              // Service[ctrlDescription.name] = ctrlDescription.service;
              app.use(ctrlDescription.path, ctrlDescription.router);
              logger.info('Controller init success: %s', fh.split('.')[0]);
              deferred.resolve();
            }).catch(function (err) {
              logger.error('Controller init failure: %s', fh);
              logger.error(e);
              deferred.reject(err);
            });

          } catch (e) {
            logger.error('Error loading controller: %s', fh);
            logger.error(e);
            deferred.reject(e);
          }
      } else  {
        deferred.resolve();
      }
    });
  });

  // Resolve when all services have resolved
  return q.all(ctrlPrms).then(function () {
    return q();
  }).catch(function (err) {
    return q.reject(err);
  });
};