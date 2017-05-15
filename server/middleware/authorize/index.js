'use strict';

module.exports = function (app) {
  return {
    chrome: require('./chrome')(app),
    bookmark: require('./bookmark')(app),
    group: require('./group')(app)
  };
};