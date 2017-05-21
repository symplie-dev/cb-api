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
   * @param  {String} creatorId The id of the user creating the group
   * @return {Promise<Object>} The newly created group
   */
  Service.create = function (group, creatorId) {
    var creator;

    return Model.User.getAll(creatorId).filter({ deletedAt: null }).then(function (c) {
      var groupId = uuid.v4();

      creator = c[0];
      group.id = groupId;

      if (creator) {
        return r.table(Model.User.getTableName()).get(creatorId).update(function (user) {
          return r.branch(
            user('numGroupsCreated').lt(Config.consts.MAX_GROUPS).and(
              user('numMemberships').lt(Config.consts.MAX_MEMBERSHIPS)
            ),
            {
              numGroupsCreated: user('numGroupsCreated').add(1),
              numMemberships: user('numMemberships').add(1)
            },
            {}
          );
        }).then(function (result) {
          if (result.replaced > 0) {
            return q.all([
              Model.Group.save(group),
              // Save the association
              Model.Membership.save({
                GroupId: groupId,
                UserId: creatorId,
                status: 'accepted',
                acceptedAt: r.now(),
                role: 'admin'
              })
            ]);
          } else {
            return q.reject(new Errors.Http.BadRequest('You have reached the maximum number of allowed groups or memberships.'));
          }
        });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Creator not found; unable to create group.'));
      }
    }).then(function (res) {
      var group = res[0];

      res[1].user = creator;
      group.members = [res[1]];
      return q(res[0]);
    });
  };

  /**
   * Get a specific group by id.j;
   * 
   * @param {String} groupId The id of the group to fetch
   * @param {Object} [opts] Optional options for building response
   * @return {Promise<Object>} The group
   */
  Service.get = function (groupId, opts) {
    var group;

    opts = opts || {};
    if (typeof opts.expandUser !== 'boolean') {
      opts.expandUser = true;
    }

    return Model.Group.getAll(groupId).filter({ deletedAt: null }).then(function (g) {
      group = g[0];

      if (group) {
        return Model.Membership.getAll(groupId, { index: 'GroupId' }).filter({
          rejectedAt: null,
          deletedAt: null
        }).getJoin({ user: opts.expandUser });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Group not found'));
      }
    }).then(function (members) {
      group.members = members;

      return q(group);
    });
  };

  /**
   * Updatee a group. Only the `name` property is editable.
   * 
   * @param {Object} group The group to update
   * @return {Promise<Object>} Promise containing the updated group
   */
  Service.update = function (group) {
    return Model.Group.getAll(group.id).filter({ deletedAt: null }).then(function (updGroup) {
      updGroup = updGroup[0];

      if (updGroup) {
        return Model.Group.get(group.id).update({
          name: group.name
        });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Group not found'));
      }
    });
  };

  /**
   * Delete the given group and all associated memberships
   * 
   * @param {String} groupId The id of the group to delete
   * @return {Promise<Object>} The deleted group
   */
  Service.delete = function (groupId) {
    var group;

    return Model.Group.getAll(groupId).filter({ deletedAt: null }).then(function (g) {
      group = g[0];

      if (group) {
        return q.all([
          // Delete the group itself
          Model.Group.get(groupId).update({ deletedAt: r.now() }),
          // Delete all memberships
          Model.Membership.getAll(groupId, { index: 'GroupId' }).filter({
            deletedAt: null
          }).update({
            deletedAt: r.now()
          }).then(function (memberships) {
            var memberPrms = [];
            // Decrememt numMemberships property for each member
            memberships.forEach(function (membership) {
              if (membership.status === 'accepted') {
                memberPrms.push(
                  Model.User.getAll(membership.UserId).update({
                    numMemberships: r.row('numMemberships').sub(1)
                  })
                );
              }
            });

            return q.all(memberPrms);
          })
        ]).then(function () {
          return q(group);
        });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Group not found'));
      }
    });
  };

  /**
   * Get all groups associated with the given user ID. This will also return
   * group memberships that are not accepted IFF it has also not been rejected.
   * 
   * @param {String} userId The user id to fetch groups for
   * @return {Promise<Array<Object>>} The list of associated groups
   */
  Service.getByUserId = function (userId) {
    return q.all([
      Model.User.getAll(userId).filter({ deletedAt: null }),
      Model.Membership.getAll(userId, { index: 'UserId' }).filter({
        deletedAt: null,
        rejectedAt: null
      }).getJoin({ group: true })
    ]).then(function (res) {
      var user = res[0][0];

      if (user) {
        return res[1];
      } else {
        return q.reject(new Errors.Db.EntityNotFound('User not found; unable to retrieve groups.'));
      }
    });
  };

  /**
   * Create a group membership invite.
   * 
   * @param {String} groupId The group to create a membership request for
   * @param {String} requesterId The user adding another user to the group
   * @param {String} requestedId The user to add to the group
   * @param {String} [role] The optional role; defaults to member
   * @return {Promise<Object>} The membership request
   */
  Service.createGroupMembershipInvite = function (groupId, requesterId, requestedId, role) {
    var group,
        user;
    
    if (typeof role !== 'string') {
      role = 'member';
    }
    // Only allow group invites between friends
    return app.get('Service').User.validateFriendship(requesterId, requestedId, 'accepted').then(function () {
      return q.all([
        Service.get(groupId, { expandUser: false }),
        Model.User.getAll(requestedId).filter({ deletedAt: null })
      ]);
    }).then(function (res) {
      var exists;

      group = res[0];
      user = res[1][0];

      exists = _membershipExists(user, group);

      if (exists) {
        return q.reject(new Errors.Db.EntityConflict('Membership already exists'));
      } else {
        return Model.Membership.save({
          GroupId: groupId,
          UserId: requestedId,
          role: role
        });
      }
    });
  };

  /**
   * Accept or reject an invite to a group.
   * 
   * @param {String} groupId The group id in the membership
   * @param {String} memberId The user accepting/rejecting the membership
   * @param {String} status The new status of the membership
   * @return {Promise<Object>} The modified membership
   */
  Service.updateMembershipStatus = function (groupId, memberId, status) {

    return (function () {
      if (status === 'accepted') {
        return _acceptMembership(groupId, memberId);
      } else if (status === 'rejected') {
        return _rejectMembership(groupId, memberId);
      } else {
        return q.reject(new Errors.Http.BadRequest('Invalid membership status.'));
      }
    })().then(function (membership) {
      if (!membership) {
        return q.reject(new Errors.Db.EntityNotFound('Membership invite not found'));
      } else {
        return q(membership);
      }
    });
  };

  Service.getMembers = function (groupId) {
    return Service.get(groupId).then(function (group) {
      return q(group.members);
    });
  };

  /**
   * Remove a member from a group.
   * 
   * @param {String} groupId The id of the group to remove member from
   * @param {String} memberId The id of the user to remove
   * @return {Promise<Object>} The group with updated member list
   */
  Service.removeMembership = function (groupId, memberId) {
    var membership;
    
    return q.all([
      Model.Membership.getAll([groupId, memberId], { index: 'membership' }).filter({
        deletedAt: null
      }),
      Model.User.getAll(memberId).filter({ deletedAt: null })
    ]).then(function (res) {
      var user = res[1][0],
          prms = [];

      membership = res[0][0];

      if (!membership) {
        return q.reject(new Errors.Db.EntityNotFound('Membership not found.'));
      }

      // If the user is the admin for the group delete the group
      if (membership && membership.role === 'admin') {
        prms.push(Service.delete(membership.GroupId));
      } else {
        // Decrement memberships count IFF the membership was accepted
        if (membership && membership.status === 'accepted' && user) {
          prms.push(
            Model.User.get(user.id).update(function (u) {
              return {
                numMemberships: u('numMemberships').sub(1)
              };
            })
          );
        }
        // Update deletedAt property for logical delete
        prms.push(
          Model.Membership.get(membership.id).update({
            deletedAt: r.now()
          })
        );
      }

      return q.all(prms);
    });
  };

  /**
   * Check if the membership exists.
   * 
   * @param {Object} user The user to check for membership
   * @param {Object} group The group to check for membership
   * @return {Boolean} True if the membership exists, else false
   */
  function _membershipExists(user, group) {
    var exists = false,
        i;

    for (i = 0; i < group.members.length; i++) {
      if (group.members[i].UserId === user.id) {
        exists = true;
        break;
      }
    }

    return exists;
  }

  function _acceptMembership(groupId, memberId) {
    return r.table(Model.User.getTableName()).get(memberId).update(function (user) {
      return r.branch(
        user('numMemberships').lt(Config.consts.MAX_MEMBERSHIPS),
        {
          numMemberships: user('numMemberships').add(1)
        },
        {}
      );
    }).then(function (result) {
      if (result.replaced >= 0) {
        return Model.Membership.getAll([groupId, memberId], { index: 'membership' }).filter({
          deletedAt: null,
          status: 'pending'
        }).update({
          status: 'accepted',
          acceptedAt: r.now()
        });
      } else {
        return q.reject(new Errors.Http.BadRequest('You have reached the maximum number of allowed groups.'));
      }
    }).then(function (upd) {
      var membership = upd[0];
      
      if (membership) {
        return q(membership);
      } else {
        // Roll back the membership increment
        return Model.User.get(memberId).update(function (user) {
          return {
            numMemberships: user('numMemberships').sub(1)
          };
        }).then(function () {
          return q.reject(new Errors.Db.EntityNotFound('Membership invite now found. Was it already accepted/rejected?'));
        });
      }
    });
  }

  function _rejectMembership(groupId, memberId) {
    return Model.Membership.getAll([groupId, memberId], { index: 'membership' }).filter({
      deletedAt: null,
      status: 'pending'
    }).update({
      status: 'rejected',
      rejectedAt: r.now()
    }).then(function (upd) {
      var membership = upd[0];

      if (membership) {
        return q(membership);
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Membership invite now found. Was it already accepted/rejected?'));
      }
    });
  }

  return q({
    name: 'Group',
    service: Service
  });
};