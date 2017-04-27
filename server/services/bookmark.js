'use strict';

var q = require('q');

module.exports = function (app) {
  var Service = {};

  Service.createUserBookmark = function (sender, receiver, bookmark) {

  };

  return q({
    name: 'Group',
    service: Service
  });
};