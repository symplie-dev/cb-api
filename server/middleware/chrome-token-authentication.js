'use strict';

var q = require('q'),
    request = require('request'),
    Config = require('../config')(),
    HttpErrors = require('../errors/http'),
    __mock__ = require('./__mock-chrome-token-authentication__'),
    tokenRegExp = /^Bearer .*/;


module.exports = function (app) {
  /**
   * Express middleware to validate a Chrome identithy token.
   * 
   * @param {HttpRequest} req 
   * @param {HttpResponse} res 
   * @param {Function} next 
   */
  function chromeTokenAuth(req, res, next) {
    var token = req.headers['authorization'];

    if (token && tokenRegExp.test(token)) {
      token = token.split(' ')[1];

      _validateToken(token).then(function (res) {
        req.headers['x-cb-sub'] = res.user_id;
        next();
      }).catch(function (err) {
        res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
          status: HttpErrors.Const.NotAuthorized.STATUS,
          data: { message: HttpErrors.Const.NotAuthorized.MESSAGE + '. ' + (((err || {}).body || {}).message || '') }
        });
      });
    } else {
      res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
        status: HttpErrors.Const.NotAuthorized.STATUS,
        data: { message: 'Not authorized. Bearer identity token required.' }
      });
    }
  };

  // TODO USE GOOGLE NPM AUTH MODULE FOR VALIDATION WITHOUT A REMOTE CALL
  function _validateToken(token) {
    var deferred = q.defer();

    request('https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=' + token, function (err, res) {
      var body;

      if (err) {
        deferred.reject(err);
      } else  if (res && res.statusCode === 200 && res.body && res.body) {
        try {
          body = JSON.parse(res.body);

          if (body.audience === Config.oauth.CLIENT_ID && body.expires_in > 0) {
            deferred.resolve(body);
          } else {
            deferred.reject();
          }
        } catch (e) {
          deferred.reject();
        }
      } else if (res.body) {
        try {
          body = JSON.parse(res.body);

          if (body.error_description) {
            body = { message: body.error_description };
          }

          res.body = body;
        } catch (e) {
          deferred.reject();
        }
        deferred.reject(res);
      }
    });

    return deferred.promise;
  }

  chromeTokenAuth._validateToken = _validateToken;

  if (Config.app.ENV === 'test') {
    return __mock__;
  } else {
    return chromeTokenAuth;
  }
};