'use strict';

var ba = require('basic-auth');

module.exports = function (app) {
  var Logger = app.get('AuthLogger'),
      Config = app.get('Config');

  return {
    user: function (req, res, next) {
      var credentials = ba(req),
          reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
 
      if (!credentials || credentials.name !== Config.admin.USER || credentials.pass !== Config.admin.PASS) {
        Logger.warn('%s attempted unauthenticated admin request', reqIp);
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="example"')
        res.end('Access denied')
      } else {
        Logger.info('%s successfully authenticated for admin', reqIp);
        next();
      }
    }
  };
};