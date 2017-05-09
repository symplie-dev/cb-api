'use strict';

var q = require('q'),
    uuid = require('uuid');

module.exports = function (app) {
  var Model = app.get('Model'),
      Errors = app.get('Errors'),
      Config = app.get('Config'),
      r = app.get('Thinky').r,
      Service = {};

  /**
   * Create a new group.
   * 
   * @param  {Object} group The group to be created
   * @return {Promise<Object>} The newly created group
   */
  Service.create = function (group) {
    return Model.User.getAll(group.CreatorId).filter({ deletedAt: null }).then(function (creator) {
      var groupId = uuid.v4();

      creator = creator[0];
      group.id = groupId;

      if (creator && creator.numGroupsCreated < Config.consts.MAX_GROUPS) {
        return q.all([
          // Increment the created groups counter
          Model.User.get(group.CreatorId).update({
            numGroupsCreated:  r.row('numGroupsCreated').add(1).default(1)
          }),
          // Save the group
          Model.Group.save(group),
          // Save the association
          Model.Group_User.save({
            Group_id: groupId,
            User_id: group.CreatorId
          })
        ]);
      } else if (creator) {
        return q.reject(new Errors.Http.BadRequest('You have reached the maximum number of allowed groups.'));
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Creator not found; unable to create group.'));
      }
    }).then(function (res) {
      return q(res[1]);
    });
  };

  /**
   * Get a specific group by id.j;
   * 
   * @param {String} groupId The id of the group to fetch
   * @return {Promise<Object>} The group
   */
  Service.get = function (groupId) {
    return Model.Group.getAll(groupId).filter({ deletedAt: null }).getJoin({
      creator: {
        apply: function (user) {
          return user.filter(function (doc) {
            return doc('deletedAt').eq(null);
          }).without('sub');
        }
      },
      members: {
        _apply: function (user) {
          return user.filter(function (doc) {
            return doc('deletedAt').eq(null);
          }).without('sub');
        }
      }
    }).then(function (group) {
      group = group[0];

      if (group && group.creator) {
        return group;
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Group not found'));
      }
    });
  };

  /**
   * Get all groups associated with the given user ID.
   * 
   * @param {String} userId The user id to fetch groups for
   * @return {Promise<Array<Object>>} The list of associated groups
   */
  Service.getByUserId = function (userId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
  };

  /**
   * Remove a group.
   * 
   * @param  {String} groupId The id of the group to remove
   * @return {Promise<Object>} The removed group
   */
  Service.remove = function (groupId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
  };

  /**
   * Get all users associated with a group
   * 
   * @param {String} groupId The id of the group to get members for
   * @return {Promise<Array<Object>>} The member list associated with the group
   */
  Service.getMembers = function (groupId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));  
  };

  /**
   * Add a member to a group
   * 
   * @param {String} groupId The id of the group to add the member to
   * @param {String} userId The id of the user to add
   * @return {Promise<Object>} The group with updated member list
   */
  Service.addMember = function (groupId, userId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
  };

  /**
   * Remove a member from a group.
   * 
   * @param {String} groupId The id of the group to remove member from
   * @param {String} userId The id of the user to remove
   * @return {Promise<Object>} The group with updated member list
   */
  Service.removeMember = function (groupId, userId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
  };

  return q({
    name: 'Group',
    service: Service
  });
};