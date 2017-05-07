'use strict';

var HttpErrors = require('../../errors/http'),
    tokenValidate = require('./chrome-token-validate'),
    tokenRegExp = /^Bearer .*/;

module.exports = function (app) {
  var Logger = app.get('AuthLogger');
  
  return {
    /**
     * Chrome identity-specific authentication middleware to ensure the given
     * bearer token is a valid Chrome identity token. It adds the chrome user
     * ID to the req object ['x-cb-sub'] for use later in the express
     * middleware stack.
     * 
     * @param {HttpRequest} req The request object
     * @param {HttpResponse} res The response object
     * @param {Function} next The next middleware function in the stack
     * @return {undefined}
     */
    user: function (req, res, next) {
      var token = req.headers.authorization,
          reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      if (token && tokenRegExp.test(token)) {
        token = token.split(' ')[1];
        Logger.verbose('validate token: %s', token);
        tokenValidate(token).then(function (res) {
          req.headers['x-cb-sub'] = res.user_id;
          Logger.verbose('%s sent VALID Chrome identity token: %s', reqIp, token);
          next();
        }).catch(function (err) {
          Logger.verbose('%s sent INVALID Chrome identity token: %s', reqIp, token);
          res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
            status: HttpErrors.Const.NotAuthorized.STATUS,
            data: { message: HttpErrors.Const.NotAuthorized.MESSAGE + '. ' + (((err || {}).body || {}).message || '') }
          });
        });
      } else {
        Logger.verbose('%s sent request without Chrome identity token', reqIp);
        res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
          status: HttpErrors.Const.NotAuthorized.STATUS,
          data: { message: 'Not authorized. Bearer identity token required.' }
        });
      }
    },

    _tokenValidate: tokenValidate
  };
};