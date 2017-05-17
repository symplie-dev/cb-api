'use strict';

var q = require('q');

module.exports = function (app) {
  var Model = app.get('Model'),
      r = app.get('Thinky').r,
      Errors = app.get('Errors'),
      Config =app.get('Config'),
      Service = {};

  /**
   * Create a new user.
   * 
   * @param {Object} user The new user to be created
   * @return {Promise<User>} The newly created user
   */
  Service.create = function (user) {
    return Model.User.getAll(user.sub, {
      index: 'sub'
    }).filter({ deletedAt: null }).then(function (users) {
      if (users.length > 0) {
        return q.reject(new Errors.Db.EntityExists('User already exists'));
      } else {
        delete user.id;
        delete user.createdAt;
        return Model.User.save(user);
      }
    });
  };

  /**
   * Get a particular user.
   * 
   * @param {String} userId The id of the user to get
   * @return {Promise<Object>} The fetched user
   */
  Service.get = function (userId) {
    var user;

    return Model.User.getAll(userId).filter({ deletedAt: null }).then(function (u) {
      user = (u || [])[0];

      if (user) {
        // Get friends where the user is the requester and requested
        return q.all([
          Model.Friendship.getAll(userId, { index: 'RequesterId' })
            .filter(
              r.row('deletedAt').eq(null).and(r.row('status').ne('rejected'))
            ).getJoin({ requested: true }),
          Model.Friendship.getAll(userId, { index: 'RequestedId' })
            .filter(
              r.row('deletedAt').eq(null).and(r.row('status').ne('rejected'))
            ).getJoin({ requester: true })
        ]);
      } else {
        return q.reject(new Errors.Db.EntityNotFound('User not found'));
      }
    }).spread(function (requester, requested) {
      user.friends = requester.concat(requested);

      return user;
    });
  };

  /**
   * Update a user. Currently `username` is the only editable field.
   * 
   * @param {Object} user The id of the user to update
   * @return {Promise<Object>} Promise containing the updated user
   */
  Service.update = function (user) {
    return Model.User.getAll(user.id).filter({ deletedAt: null }).then(function (updUser) {
      updUser = updUser[0];

      if (updUser) {
        return Model.User.get(user.id).update({
          username: user.username
        });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('User not found'));
      }
    });
  };

  /**
   * Delete a particular user. This will begin a cascade delete
   * of all friendships the user is a part of AND groups.
   * 
   * @param {String} userId The user to delete
   * @return {Promise<Object>} The deleted user
   */
  Service.delete = function (userId) {
    var user;

    return Model.User.getAll(userId).filter({ deletedAt: null }).then(function (u) {
      user = (u || [])[0];

      if (user) {
        return q.all([
          // Delete all friendships the user is part of
          Model.Friendship.getAll(userId, { index: 'RequesterId' }).update({ deletedAt: r.now() }),
          Model.Friendship.getAll(userId, { index: 'RequestedId' }).update({ deletedAt: r.now() }),
          // Delete all bookmarks created by the user or received by the user
          Model.Bookmark.getAll(userId, { index: 'SenderId' }).update({ deletedAt: r.now() }),
          Model.Bookmark.getAll(userId, { index: 'ReceiverId' }).update({ deletedAt: r.now() }),
          // Delete all user memberships
          Model.Membership.getAll(userId, { index: 'UserId' }).filter({ role: 'owner' }),
          Model.Membership.getAll(userId, { index: 'UserId' }).update({ deletedAt: r.now() }),
          // Delete the user record itself
          Model.User.get(userId).update({ deletedAt: r.now() })
        ]);
      } else {
        return q.reject(new Errors.Db.EntityNotFound('User not found'));
      }
    }).then(function (res) {
      var groupDels = [];

      res[4].forEach(function (membership) {
        // Delete each group the user owns
        groupDels.push(Model.Group.getAll(membership.GroupId).update({ deletedAt: r.now() }));
        // Delete all memberships attached to the group the user owns
        groupDels.push(Model.Membership.getAll(membership.GroupId, { index: 'GroupId' }).update({ deletedAt: r.now() }));
      });

      return q.all(groupDels);
    }).then(function () {
      return user;
    });
  };

  /**
   * Create a new friendship. Friendships must be accepted before they are
   * respected. TODO: Make safer.
   * 
   * @param {String} requesterId The user requesting the friendship
   * @param {String} requestedId The user being requested
   * @return {Promise<User>} The newly created user
   */
  Service.createFriendship = function (requesterId, requestedId) {
    return Service.validateFriendshipRequest(requesterId, requestedId).then(function () {
      return r.table(Model.User.getTableName()).get(requesterId).update(function (user) {
        return r.branch(
          user('numFriends').lt(Config.consts.MAX_FRIENDS),
          {
            numFriends: user('numFriends').add(1)
          },
          {}
        );
      });
    }).then(function (result) {
      if (result.replaced > 0) {
        return Model.Friendship.save({
          RequesterId: requesterId,
          RequestedId: requestedId
        });
      } else {
        return q.reject(new Errors.Http.BadRequest('You\'ve already reached the maximum number of friends; unable to request friendship'));
      }
    });
  };

  /**
   * Accept or reject a friend request.
   * 
   * @param {String} requestedId The user approving the friendship
   * @param {String} requesterId The user requesting the friendship
   * @param {String} status The new status
   * @return {Promise<Object>} The confirmed friendship
   */
  Service.updateFriendship = function (requestedId, requesterId, status) {
    return r.table(Model.Friendship.getTableName()).getAll(
      [requesterId, requestedId],
      { index: 'friendship' }
    ).filter({ deletedAt: null, rejectedAt: null }).then(function (friendship) {
      friendship = friendship[0];

      if (friendship) {
        if (status === 'accepted') {
          return _acceptFriendship(friendship);
        } else if (status === 'rejected') {
          return _rejectFriendship(friendship);
        }
      } else {
        return q.reject(new Errors.Db.EntityNotFound());
      }
    });
  };

  function _acceptFriendship(friendship) {
    return r.table(Model.Friendship.getTableName()).get(friendship.id).update(function (f) {
      return r.branch(
        f('status').eq('pending'),
        {
          acceptedAt: r.now(),
          rejectedAt: null,
          status: 'accepted'
        },
        {}
      );
    }).then(function (result) {
      if (result.replaced > 0) {
        return r.table(Model.User.getTableName()).get(friendship.RequestedId).update(function (user) {
          return r.branch(
            user('numFriends').lt(Config.consts.MAX_FRIENDS),
            {
              numFriends: user('numFriends').add(1)
            },
            {}
          );
        });
      } else {
        return q.reject(new Errors.Http.BadRequest('Friendship already accepted/rejected'));
      }
    }).then(function (result) {
      if (result.replaced > 0) {
        return Model.Friendship.get(friendship.id);
      } else {
        // Roll back friendship status
        return Model.Friendship.get(friendship.id).update({
          status: 'pending',
          acceptedAt: null
        }).then(function () {
          return q.reject(new Errors.Http.BadRequest('You\'ve already reached the maximum number of friends; unable to accept friendship'));
        });
      }
    });
    // return r.table(Model.User.getTableName()).get(friendship.RequestedId).update(function (user) {
    //   return r.branch(
    //     user('numFriends').lt(Config.consts.MAX_FRIENDS),
    //     {
    //       acceptedAt: r.now(),
    //       rejectedAt: null,
    //       status: 'accepted'
    //     },
    //     {}
    //   );
    // }).then(function (result) {
    //   if (result.replaced > 0) {
    //     return Model.Friendship.get(friendship.id).update({

    //     });
    //   } else {
    //     return q.reject(new Errors.Http.BadRequest('You have reached the maximum number of friends; unable to accept friendship'));
    //   }
    // });
  }

  function _rejectFriendship(friendship) {
    // Free up the 
    return Model.User.get(friendship.RequesterId).update(function (user) {
      return {
        numFriends: user('numFriends').sub(1)
      };
    }).then(function () {
      return Model.Friendship.get(friendship.id).update({
        rejectedAt: r.now(),
        acceptedAt: null,
        status: 'rejected'
      });
    });
  }

  /**
   * Get all friends associated with the user.
   * 
   * @param {String} userId The user to get friends of
   * @return {Promise<Array<Object>>} The friend list
   */
  Service.getFriendships = function (userId) {
    return Service.get(userId).then(function (user) {
      return user.friends;
    });
  };

  Service.deleteFriendship = function (aUserId, bUserId) {
    var friendship;

    return q.all([
      r.table(Model.Friendship.getTableName()).getAll(
        [aUserId, bUserId],
        { index: 'friendship' }
      ).filter({ deletedAt: null, rejectedAt: null }),
      r.table(Model.Friendship.getTableName()).getAll(
        [bUserId, aUserId],
        { index: 'friendship' }
      ).filter({ deletedAt: null, rejectedAt: null })
    ]).then(function (res) {
      friendship = res[0][0] || res[1][0];

      if (friendship) {
        if (friendship.status === 'accepted') {
          // Decrement friendships count for both requester and requested
          return q.all([
            Model.User.get(friendship.RequesterId).update(function (user) {
              return {
                numFriends: user('numFriends').sub(1)
              };
            }),
            Model.User.get(friendship.RequestedId).update(function (user) {
              return {
                numFriends: user('numFriends').sub(1)
              };
            })
          ]);
        } else if (friendship.status === 'rejected') {
          // No decrements needed
          return q();
        } else {
          // Decrement friendships count for requester
          return Model.User.get(friendship.RequesterId).update(function (user) {
            return {
              numFriends: user('numFriends').sub(1)
            };
          });
        }
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Could not find friendship; unable to delete'));
      }
    }).then(function () {
      return Model.Friendship.get(friendship.id).update({ deletedAt: r.now() });
    });
  };

  /**
   * Ensure the rules of a friendship are followed.
   * 
   * - No duplicate friendships (including inverse)
   * - No self friendships
   * - No more than the MAX_FRIENDS number of friends
   * - Requester and requested must be users
   * 
   * @param {String} requesterId The id of the user doing the requesting
   * @param {String} requestedId The id the requested user
   * @return {Promise<null>} Return an empty promise on completed validation
   */
  Service.validateFriendshipRequest = function (requesterId, requestedId) {
    if (requestedId !== requesterId) {
      return q.all([
        Model.User.getAll(requesterId).filter({ deletedAt: null }),
        Model.User.getAll(requestedId).filter({ deletedAt: null })
      ]).then(function (res) {
        if (res[0].length === 1 && res[1].length === 1) {
          return q.all([
            // Ensure friendship does not exist
            // A friendship does not exist if it was logically deleted or rejected
            r.table(Model.Friendship.getTableName()).getAll(
              [requesterId, requestedId],
              { index: 'friendship' }
            ).filter({ deletedAt: null, rejectedAt: null }).count().eq(0),
            // Ensure inverse friendship does not exist
            r.table(Model.Friendship.getTableName()).getAll(
              [requestedId, requesterId],
              { index: 'friendship' }
            ).filter({ deletedAt: null, rejectedAt: null }).count().eq(0)
          ]);
        } else {
          return q.reject(new Errors.Db.EntityNotFound('ERROR: Both users in the friendship not found'));
        }
      }).then(function (noExists) {
        if (noExists[0] && noExists[1]) {
          return q.all([
            r.table(Model.Friendship.getTableName()).getAll(
              requesterId,
              { index: 'RequesterId' }
            ).filter({ deletedAt: null }),
            r.table(Model.Friendship.getTableName()).getAll(
              requesterId,
              { index: 'RequestedId' }
            ).filter({ deletedAt: null })
          ]);
        } else {
          return q.reject(new Errors.Db.EntityExists('ERROR: Friendship request already exists'));
        }
      }).then(function (friends) {
        if (friends[0].length + friends[1].length < Config.consts.MAX_FRIENDS) {
          return null;
        } else {
          return q.reject(new Errors.Db.EntityExists('ERROR: Maximum number of friendships (' +
            Config.consts.MAX_FRIENDS + ') already exists'));
        }
      });
    } else {
      return q.reject(new Errors.Http.BadRequest('ERROR: Friendship not found'));
    }
  };

  /**
   * Check to see if the friendship exists and is in the desired state.
   * 
   * @param  {String} aUserId User A in the friendship
   * @param  {String} bUserId User B in the friendship
   * @param  {String} [status] Optional status defaults to 'accepted'
   * @return {Promise<Object>} Return the friendship if its valid
   */
  Service.validateFriendship = function (aUserId, bUserId, status) {
    if (typeof status === 'undefined') {
      status = 'accepted';
    }
    return q.all([
      // Ensure friendship does not exist
      r.table(Model.Friendship.getTableName()).getAll(
        [aUserId, bUserId],
        { index: 'friendship' }
      ).filter({ deletedAt: null, status: status }),
      // Ensure inverse friendship does not exist
      r.table(Model.Friendship.getTableName()).getAll(
        [bUserId, aUserId],
        { index: 'friendship' }
      ).filter({ deletedAt: null, status: status })
    ]).then(function (exists) {
      if (exists && exists[0] && exists[0].length > 0) {
        return q(exists[0][0]);
      } if (exists && exists[1] && exists[1].length > 0) {
        return q(exists[1][0]);
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Friendship not found'));
      }
    });
  };

  return q({
    name: 'User',
    service: Service
  });
};