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
        delete user.GroupId;
        return Model.User.save(user);
      }
    });
  };

  /**
   * Get a particular user.
   * 
   * @param {String} userId The id of the user to get
   * @param {Object} [opts] Options to use when fetching
   */
  Service.get = function (userId, opts) {
    var user;

    return Model.User.getAll(userId).filter({ deletedAt: null }).then(function (u) {
      user = (u || [])[0];

      if (user) {
        // Get friends where the user is the requester and requested
        return q.all([
          Model.Friendship.getAll(userId, { index: 'RequesterId' })
            .filter(
              r.row('deletedAt').eq(null).and(r.row('status').ne('rejected'))
            ).getJoin({ requested: true }), //.without('RequestedId', 'RequesterId'),
          Model.Friendship.getAll(userId, { index: 'RequestedId' })
            .filter(
              r.row('deletedAt').eq(null).and(r.row('status').ne('rejected'))
            ).getJoin({ requester: true }) //.without('RequestedId', 'RequesterId')
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
          Model.Friendship.getAll(userId, { index: 'RequesterId' }).update({ deletedAt: r.now() }),
          Model.Friendship.getAll(userId, { index: 'RequestedId' }).update({ deletedAt: r.now() }),
          // TODO REMOVE GROUPS USER OWNS
          Model.User.get(userId).update({ deletedAt: r.now() })
        ]);
      } else {
        return q.reject(new Errors.Db.EntityNotFound('User not found'));
      }
    }).then(function (re) {
      return user;
    });
  };

  /**
   * Create a new friendship. Friendships must be accepted before they are
   * respected. TODO: Make safer.
   * 
   * @param {Object} user The new user to be created
   * @return {Promise<User>} The newly created user
   */
  Service.createFriendship = function (requesterId, requestedId) {
    return _validateFriendshipRequest(requesterId, requestedId).then(function () {
      return Model.Friendship.save({
        RequesterId: requesterId,
        RequestedId: requestedId
      });
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
    ).filter({ deletedAt: null }).then(function (friendship) {
      var upd = {};
      
      friendship = friendship[0];
      if (friendship) {
        if (status === 'accepted') {
          upd.acceptedAt = r.now();
          upd.rejectedAt = null;
        } else if (status === 'rejected') {
          upd.rejectedAt = r.now();
          upd.acceptedAt = null;
        }
        upd.status = status;

        return Model.Friendship.get(friendship.id).update(upd);
      } else {
        return q.reject(new Errors.Db.EntityNotFound());
      }
    });
  };

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

  /**
   * Create a usuer-to-user bookmark.
   * 
   * @param {String} senderId The creater/sender of the bookmark
   * @param {String} receieverId The receiver of the bookmark
   * @param {Object} bookmark The bookmark being shared
   */
  Service.createUserBookmark = function (senderId, receiverId, bookmark) {
    return _validateFriendship(senderId, receiverId, 'accepted').then(function () {
      bookmark.SenderId = senderId;
      bookmark.receiverId = receiverId;
      delete bookmark.createdAt;
      delete bookmark.deletedAt;
      delete bookmark.id;
      return Model.Bookmark.save(bookmark);
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
  function _validateFriendshipRequest(requesterId, requestedId) {
    if (requestedId !== requesterId) {
      return q.all([
        Model.User.getAll(requesterId).filter({ deletedAt: null }),
        Model.User.getAll(requestedId).filter({ deletedAt: null })
      ]).then(function (res) {
        if (res[0].length === 1 && res[1].length === 1) {
          return q.all([
            // Ensure friendship does not exist
            r.table(Model.Friendship.getTableName()).getAll(
              [requesterId, requestedId],
              { index: 'friendship' }
            ).filter({ deletedAt: null }).count().eq(0),
            // Ensure inverse friendship does not exist
            r.table(Model.Friendship.getTableName()).getAll(
              [requestedId, requesterId],
              { index: 'friendship' }
            ).filter({ deletedAt: null }).count().eq(0)
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
  }

  /**
   * Check to see if the friendship exists and is in the desired state.
   * 
   * @param  {String} aUserId User A in the friendship
   * @param  {String} bUserId User B in the friendship
   * @param  {String} [status] Optional status defaults to 'accepted'
   * @return {Promise<Object>} Return the friendship if its valid
   */
  function _validateFriendship(aUserId, bUserId, status) {
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
  }

  return q({
    name: 'User',
    service: Service
  });
};