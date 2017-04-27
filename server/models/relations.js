'use strict';

module.exports = function (app) {
  var Model = app.get('Model');

  Model.Group.hasAndBelongsToMany(Model.User, 'members', 'id', 'username', { init: false });
  Model.User.hasAndBelongsToMany(Model.Group, 'groups', 'username', 'id', { init: false });

  Model.User.hasMany(Model.Friendship, 'friendships', 'FriendshipId', 'id', { init: false });
  Model.Friendship.hasOne(Model.User, 'requester', 'RequesterId', 'id', { init: false });
  Model.Friendship.hasOne(Model.User, 'requested', 'RequestedId',  'id', { init: false });
};