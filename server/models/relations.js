'use strict';

var q = require('q');

module.exports = function (app) {
  var Model = app.get('Model');

  return q.all([
    Model.Group.hasAndBelongsToMany(Model.User, 'members', 'id', 'id', { init: false }),
    Model.User.hasAndBelongsToMany(Model.Group, 'groups', 'id', 'id', { init: false }),
    Model.Group.belongsTo(Model.User, 'creator', 'CreatorId', 'id', { init: false }),

    Model.User.hasMany(Model.Friendship, 'friendships', 'FriendshipId', 'id', { init: false }),
    Model.Friendship.hasOne(Model.User, 'requester', 'RequesterId', 'id', { init: false }),
    Model.Friendship.hasOne(Model.User, 'requested', 'RequestedId',  'id', { init: false }),

    Model.Bookmark.belongsTo(Model.User, 'sender', 'SenderId', 'id', { init: false }),
    Model.Bookmark.belongsTo(Model.User, 'receiver', 'ReceiverId', 'id', { init: false }),
  ]);
};