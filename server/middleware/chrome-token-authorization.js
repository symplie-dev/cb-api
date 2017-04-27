'use strict';

var q = require('q'),
    request = require('request'),
    Config = require('../config')(),
    HttpErrors = require('../errors/http'),
    tokenRegExp = /^Bearer .*/;

module.exports = function (app) {
  var Config = app.get('Config'),
      Logger = app.get('AppLogger'),
      Model  = app.get('Model');

  return function (req, res, next) {
    var actionUserId = req.params.actionUserId;

    if (typeof req.headers['x-cb-sub'] !== 'string') {
      res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
        status: HttpErrors.Const.NotAuthorized.STATUS,
        data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
      });
    } else {
      Model.User.getAll(actionUserId).filter({ deletedAt: null }).then(function (user) {
        user = user[0];
        if (user && user.sub === req.headers['x-cb-sub']) {
          next();
        } else {
          res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
            status: HttpErrors.Const.NotAuthorized.STATUS,
            data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
          });
        }
      }).catch(function (err) {
        res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
          status: HttpErrors.Const.NotAuthorized.STATUS,
          data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
        });
      });
    }
  };
};