'use strict';

var q = require('q'),
    authentication = require('../middleware/chrome-token-authentication'),
    authorization = require('../middleware/chrome-token-authorization'),
    elevatedAuthorization = require('../middleware/elevated-bookmark-authorization');

module.exports = function (app, router) {
  var Service = app.get('Service');
  
  authentication = authentication(app),
  authorization = authorization(app);
  elevatedAuthorization = elevatedAuthorization(app);

  // Add auth middleware
  router.route('/*').all(authentication);
  router.route('/:actionUserId/*').all(authorization);

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
      res.status(501).json({ status: 501, message: 'Not implemented' });
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
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .post(function (req, res) {
       res.status(501).json({ status: 501, message: 'Not implemented' });
    });
  
  // Get a particular group
  // Update a particular group
  // Delete a paricular group
  router.route('/:actionUserId/groups/:groupId')
    .get(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .put(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .delete(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    });
  
  // Get all bookmarks associated with a group
  // Add a shared bookmark with a group
  router.route('/:actionUserId/groups/:groupId/bookmarks')
    .get(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .post(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
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
    })
  
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
      res.status(501).json({ status: 501, message: 'Not implemented' });
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
    .get(function (req, res) {
      res.status(501).json({ status: 501, message: 'Not implemented' });
    })
    .delete(elevatedAuthorization, function (req, res) {
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
    }
  }

  return q({
    path: '/api/users',
    router: router
  });
};