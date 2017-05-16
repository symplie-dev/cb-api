'use strict';

var HttpErrors = require('../../errors/http');

module.exports = function (app) {
  var Logger = app.get('AuthLogger'),
      Model = app.get('Model'),
      r = app.get('Thinky').r;

  return {
    /**
     * Authorization middleware to check that the user initiating the action on
     * a given group is a member of the group
     * 
     * @param {HttpRequest} req The request object
     * @param {HttpResponse} res The response object
     * @param {Function} next The next middleware function in the stack
     * @return {undefined}
     */
    member: function (req, res, next) {
      _authHelper(req, res, next, ['member', 'admin', 'owner']);
    },

    /**
     * Authorization middleware to check that the user initiating the action on
     * a given group is an admin of the group
     * 
     * @param {HttpRequest} req The request object
     * @param {HttpResponse} res The response object
     * @param {Function} next The next middleware function in the stack
     * @return {undefined}
     */
    admin: function (req, res, next) {
      _authHelper(req, res, next, ['admin', 'owner']);
    }
  };

  function _authHelper(req, res, next, roles) {
    var actionUserId = req.params.actionUserId,
        groupId = req.params.groupId,
        reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (typeof req.headers['x-cb-sub'] !== 'string') {
      Logger.error('%s - Missing required x-cb-sub header', reqIp);
      res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
        status: HttpErrors.Const.NotAuthorized.STATUS,
        data: { message: HttpErrors.Const.NotAuthorized.MESSAGE }
      });
    } else {
      Model.Membership.getAll([groupId, actionUserId], { index: 'membership' }).filter(
        r.row('deletedAt').eq(null).and(r.row('acceptedAt').ne(null))
      ).then(function (membership) {
        membership = membership[0];
        if (membership && roles.indexOf(membership.role) >= 0) {
          next();
        } else {
          Logger.error('%s - %s attempted action on unaffiliated group %s', reqIp, actionUserId, groupId);
          res.status(HttpErrors.Const.NotAuthorized.STATUS).json({
            status: HttpErrors.Const.NotAuthorized.STATUS,
            data: { message: 'This function requires you to be affiliated with the group in question.' }
          });
        }
      });
    }
  }
};