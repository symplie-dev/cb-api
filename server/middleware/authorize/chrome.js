'use strict';

var HttpErrors = require('../../errors/http');

module.exports = function (app) {
  var Logger = app.get('AuthLogger'),
      Model  = app.get('Model');

  return {
    /**
     * Generic authorization middleware that ensures the user initiating the
     * action on a particulaar resource allowed to do so.
     * 
     * @param {HttpRequest} req The request object
     * @param {HttpResponse} res The response object
     * @param {Function} next The next middleware function in the stack
     * @return {undefined}
     */
    user: function (req, res, next) {
      var actionUserId = req.params.actionUserId,
          actualSub = req.headers['x-cb-sub'],
          reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      if (typeof req.headers['x-cb-sub'] !== 'string') {
        Logger.error('%s - Missing required x-cb-sub header', reqIp);
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
            Logger.error('%s - %s requesting action for user %s', reqIp, actualSub, (user || {}).sub);
            res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
              status: HttpErrors.Const.NotAuthorized.STATUS,
              data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
            });
          }
        }).catch(function (err) { 
          Logger.error('Unable to get actionUserId: %s', actionUserId);
          Logger.error(err);
          res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
            status: HttpErrors.Const.NotAuthorized.STATUS,
            data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
          });
        });
      }
    }
  };
};