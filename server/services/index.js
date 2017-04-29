'use strict';

var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    serviceFiles = fs.readdirSync(__dirname),
    jsFileRegEx = /.*\.js$/,
    servicePrms = [],
    Service = {};

module.exports = function (app) {
  var logger = app.get('AppLogger');

  // Loop through service files and load them
  serviceFiles.forEach(function (fh) {
    var deferred = q.defer();

    servicePrms.push(deferred.promise);
    // Grab stats to ensure we're looking at a file
    fs.stat(path.join(__dirname, fh), function (err, stats) {
      var serviceProvider;

      if (!stats.isDirectory() && fh !== 'index.js' && jsFileRegEx.test(fh)) {
        try {
          serviceProvider = require(path.join(__dirname, fh));

          serviceProvider(app).then(function (serviceDescription) {
            Service[serviceDescription.name] = serviceDescription.service;
            logger.info('Service init success: %s', fh.split(',')[0]);
            deferred.resolve();
          }).catch(function (err) {
            logger.error('Service init failure: %s', fh);
            logger.error(err);
            deferred.reject(err);
          });

        } catch (e) {
          logger.error('Service init failure: %s', fh);
          logger.error(e);
          deferred.reject(e);
        }
      } else  {
        deferred.resolve();
      }
    });
  });

  // Resolve when all services have resolved
  return q.all(servicePrms).then(function () {
    app.set('Service', Service);
    return q();
  }).catch(function (err) {
    return q.reject(err);
  });
};