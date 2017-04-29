'use strict';

var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    modelFiles = fs.readdirSync(__dirname),
    jsFileRegEx = /.*\.js$/,
    modelPrms = [],
    Model = {};

module.exports = function (app) {
  var logger = app.get('AppLogger'),
      thinky = require('thinky')(app.get('Config').db.CONN_OPTS);
  
  app.set('Thinky', thinky);

  // Loop through model files and load them
  modelFiles.forEach(function (fh) {
    var deferred = q.defer();

    modelPrms.push(deferred.promise);
    // Grab stats to ensure we're looking at a file
    fs.stat(path.join(__dirname, fh), function (err, stats) {
      var modelProvider;

      if (!stats.isDirectory() && jsFileRegEx.test(fh) && fh !== 'index.js'  && fh !== 'relations.js') {
        try {
          modelProvider = require(path.join(__dirname, fh));

          modelProvider(app).then(function (modelDescription) {
            Model[modelDescription.name] = modelDescription.model;
            Model[modelDescription.name]._cbConfig = modelDescription.config; // Add custom config
            logger.info('Model init success: %s', fh.split(',')[0]);
            deferred.resolve();
          }).catch(function (err) {
            logger.error('Model init failure: %s', fh);
            logger.error(err);
            deferred.reject(err);
          });

        } catch (e) {
          logger.error('Model init failure: %s', fh);
          logger.error(e);
          deferred.reject(e);
        }
      } else  {
        deferred.resolve();
      }
    });
  });

  // Resolve when all models have resolved
  return q.all(modelPrms).then(function () {
    app.set('Model', Model);
    // Initialize thinky relations
    require('./relations')(app);
    return q();
  }).catch(function (err) {
    return q.reject(err);
  });
};