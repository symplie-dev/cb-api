'use strict';

var q = require('q');

module.exports = function (app) {
  var Model = app.get('Model');

  return q.all([
    Model.Membership.hasOne(Model.User, 'user', 'UserId', 'id', { init: false }),
    Model.Membership.hasOne(Model.Group, 'group', 'GroupId', 'id', { init: false }),

    Model.Friendship.hasOne(Model.User, 'requester', 'RequesterId', 'id', { init: false }),
    Model.Friendship.hasOne(Model.User, 'requested', 'RequestedId',  'id', { init: false }),

    Model.Bookmark.belongsTo(Model.User, 'sender', 'SenderId', 'id', { init: false }),
    Model.Bookmark.belongsTo(Model.User, 'receiver', 'ReceiverId', 'id', { init: false }),
  ]);
};