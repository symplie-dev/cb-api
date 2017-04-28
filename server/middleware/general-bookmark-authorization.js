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

  /**
   * Authorization middleware to check that the user initiating the action on
   * a given bookmark is affiliated with the bookmark.
   * 
   * @param {HttpRequest} req 
   * @param {HttpResponse} res 
   * @param {Function} next 
   */
  return function (req, res, next) {
    var actionUserId = req.params.actionUserId,
        bookmarkId = req.params.bookmarkId,
        reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (typeof req.headers['x-cb-sub'] !== 'string') {
      Logger.error('%s - Missing required x-cb-sub header', reqIp);
      res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
        status: HttpErrors.Const.NotAuthorized.STATUS,
        data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
      });
    } else {
      Model.Bookmark.get(bookmarkId).then(function (bookmark) {
        if (bookmark.SenderId === actionUserId || bookmark.ReceiverId === actionUserId) {
          next();
        } else {
          Logger.error('%s - %s attempted action on unaffiliated bookmark %s', reqIp, actionUserId, bookmarkId);
          res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
            status: HttpErrors.Const.NotAuthorized.STATUS,
            data: { message: 'This function requires you to be affiliated with the bookmark in question.' }
          });
        }
      });
    }
  };
};