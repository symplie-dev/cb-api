'use strict';

var q = require('q'),
    HttpErrors = require('../errors/http'),
    tokenRegExp = /^Bearer .*/;

/**
 * Mock Express middleware to validate a Chrome identithy token.
 * 
 * @param {HttpRequest} req The request object
 * @param {HttpResponse} res The response object
 * @param {Function} next The next middleware function in the stack
 * @return {undefined}
 */
function chromeTokenAuth(req, res, next) {
  var token = req.headers.authorization;

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
}

function _validateToken(token) {
  if (token) {
    return q({
      user_id: token,
      __mock__: true
    });
  } else {
    return q.reject()
  }
}

chromeTokenAuth._validateToken = _validateToken;

module.exports = chromeTokenAuth;