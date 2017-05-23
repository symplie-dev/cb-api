'use strict';

var q = require('q'),
    authenticate = require('../middleware/authenticate'),
    authorize = require('../middleware/authorize');

module.exports = function (app, router) {
  var Service = app.get('Service');
  
  authenticate = authenticate(app),
  authorize = authorize(app);

  // Add auth middleware
  router.route('/*').all(authenticate.chrome.user);
  router.route('/:actionUserId/*').all(authorize.chrome.user);

  // Create a new user
  router.route('/')
    .post(function (req, res) {
      var newUser = req.body;
      newUser.sub = req.headers['x-cb-sub'];
      Service.User.create(newUser).then(function (user) {
        res.status(201).json({ status: 201, data: user });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  
  // Get a specific user
  // Update a specific user
  // Delete a specific user
  router.route('/:actionUserId')
    .get(function (req, res) {
      Service.User.get(req.params.actionUserId).then(function (user) {
        res.status(200).json({ status: 200, data: user });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .put(function (req, res) {
      var user = req.body;

      user.id = req.params.actionUserId;
      Service.User.update(user).then(function (updUser) {
        res.status(200).json({ status: 200, data: updUser });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .delete(function (req, res) {
      Service.User.delete(req.params.actionUserId).then(function (user) {
        res.status(200).json({ status: 200, data: user });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // Get all the groups a user is a member of
  // Create a group
  router.route('/:actionUserId/groups')
    .get(function (req, res) {
      Service.Group.getByUserId(req.params.actionUserId).then(function (groups) {
        res.status(200).json({ status: 200, data: groups });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .post(function (req, res) {
      Service.Group.create(req.body, req.params.actionUserId).then(function (group) {
        res.status(201).json({ status: 201, data: group });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // Get a particular group
  // Update a particular group
  // Delete a paricular group
  router.route('/:actionUserId/groups/:groupId')
    .get(authorize.group.member, function (req, res) {
      Service.Group.get(req.params.groupId).then(function (group) {
        res.status(200).json({ status: 200, data: group });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .put(authorize.group.admin, function (req, res) {
      var group = req.body;

      group.id = req.params.groupId;
      Service.Group.update(group).then(function (updGroup) {
        res.status(200).json({ status: 200, data: updGroup });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .delete(function (req, res) {
      Service.Group.delete(req.params.groupId).then(function (group) {
        res.status(200).json({ status: 200, data: group });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });

  // Get all members of a group
  // Create a new membership invite for a group
  router.route('/:actionUserId/groups/:groupId/members')
    .get(authorize.group.member, function (req, res) {
      Service.Group.getMembers(req.params.groupId).then(function (members) {
        res.status(200).json({ status: 200, data: members });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .post(authorize.group.member, function (req, res) {
      Service.Group.createGroupMembershipInvite(
        req.params.groupId,
        req.params.actionUserId,
        req.body.UserId,
        req.body.role
      ).then(function (membership) {
        res.status(201).json({ status: 201, data: membership });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // Accept/Reject a membership invite
  // Remove a previously accepted membership
  router.route('/:actionUserId/groups/:groupId/members/:memberId')
    .put(function (req, res) {
      Service.Group.updateMembershipStatus(
        req.params.groupId,
        req.params.actionUserId,
        req.body.status
      ).then(function (membership) {
        res.status(200).json({ status: 200, data: membership });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .delete(function (req, res) {
      // TODO: Let admin users remove other members
      Service.Group.removeMembership(req.params.groupId, req.params.actionUserId).then(function () {
        res.status(200).json({ status: 200, data: {} });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // Get all bookmarks associated with a group
  // Add a shared bookmark with a group
  router.route('/:actionUserId/groups/:groupId/bookmarks')
    .get(authorize.group.member, function (req, res) {
      Service.Bookmark.getGroupBookmarks(req.params.groupId).then(function (bookmarks) {
        res.status(200).json({ status: 200, data: bookmarks });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .post(authorize.group.member, function (req, res) {
      Service.Bookmark.createGroupBookmark(req.params.actionUserId, req.params.groupId, req.body).then(function (bookmark) {
        res.status(201).json({ status: 201, data: bookmark });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  

  // Delete a particular shared bookmark from a group
  router.route('/:actionUserId/groups/:groupId/bookmarks/:bookmarkId')
    .get(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .delete(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    });
  
  // Get all friends of a user
  router.route('/:actionUserId/friends')
    .get(function (req, res) {
      Service.User.getFriendships(req.params.actionUserId).then(function (friends) {
        res.status(200).json({ status: 200, data: friends });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // The aUserId is the user requesting the action
  // Add friendship (requested)
  // Update friendship (approve/reject)
  // Remove friendship
  router.route('/:actionUserId/friends/:bUserId')
    .post(function (req, res) {
      Service.User.createFriendship(req.params.actionUserId, req.params.bUserId).then(function (friendship) {
        res.status(201).json({ status: 201, data: friendship });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .put(function (req, res) {
      Service.User.updateFriendship(req.params.actionUserId, req.params.bUserId, req.body.status).then(function (friendship) {
        res.status(200).json({ status: 200, data: friendship });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .delete(function (req, res) {
      Service.User.deleteFriendship(req.params.actionUserId, req.params.bUserId).then(function (friendship) {
        res.status(200).json({ status: 200, data: friendship });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });

  // Get all bookmarks shared with a particular friend
  // Create a shared bookmark with a friend
  // Delete a shared bookmark with a friend
  router.route('/:actionUserId/friends/:friendId/bookmarks')
    .get(function (req, res) {
      Service.Bookmark.getUserBookmarks(req.params.actionUserId, req.params.friendId).then(function (bookmarks) {
        res.status(200).json({ status: 200, data: bookmarks });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .post(function (req, res) {
      Service.Bookmark.createUserBookmark(req.params.actionUserId, req.params.friendId, req.body).then(function (bookmark) {
        res.status(201).json({ status: 201, data: bookmark });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  // Get a particular bookmark shared with a particular friend
  // Delete a particular bookmark shared with a particular friend
  router.route('/:actionUserId/friends/:friendId/bookmarks/:bookmarkId')
    .get(authorize.bookmark.user, function (req, res) {
      Service.Bookmark.getUserBookmark(req.params.bookmarkId).then(function (bookmark) {
        res.status(200).json({ status: 200, data: bookmark });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    })
    .delete(authorize.bookmark.creator, function (req, res) {
      Service.Bookmark.deleteUserBookmark(req.params.bookmarkId).then(function (bookmark) {
        res.status(200).json({ status: 200, data: bookmark });
      }).catch(function (err) {
        res.status(err.status || 500).json(_errorResponse(err));
      });
    });
  
  function _errorResponse(err) {
    return {
      status: err.status || 500,
      data: {
        message: err.message || 'Internal server error'
      }
    };
  }

  return q({
    path: '/api/users',
    router: router
  });
};