'use strict';

var q = require('q');

module.exports = function (app) {
  var Service = {};

  /**
   * Create a new group.
   * 
   * @param  {Object} group The group to be created
   * @return {Promise<Object>} The newly created group
   */
  Service.create = function (group) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
  };

  /**
   * Get a specific group by id.
   * 
   * @param {String} groupId The id of the group to fetch
   * @return {Promise<Object>} The group
   */
  Service.get = function (groupId) {
    return q.reject(new Error('NOT YET IMPLEMENTED'));
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