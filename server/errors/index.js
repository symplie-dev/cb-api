'use strict';

var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    errorFiles = fs.readdirSync(__dirname),
    jsFileRegEx = /.*\.js$/,
    Errors = {};


module.exports = function (app) {
  var logger = app.get('AppLogger');

  // Loop through error files and load them
  errorFiles.forEach(function (fh) {
    var err = fh.split('.')[0];
    
    err = err.charAt(0).toUpperCase() + err.slice(1);

    if (fh !== 'index.js' && jsFileRegEx.test(fh)) {
      try {
        Errors[err] = require(path.join(__dirname, fh));
        // Each custom error constructor should inherit from Error
        Object.keys(Errors[err]).forEach(function (errConstructor) {
          if (typeof Errors[err][errConstructor] === 'function') {
            util.inherits(Errors[err][errConstructor], Error);
          }
        });

      } catch (e) {
        logger.error('Error init failure: %s', fh);
        logger.error(e);
        process.exit(1);
      }
    }
  });

  return Errors;
};