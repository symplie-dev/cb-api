'use strict';

var q = require('q');

module.exports = function (app) {
  var Model = app.get('Model'),
      r = app.get('Thinky').r,
      Errors = app.get('Errors'),
      Service = {};

  /**
   * Create a user-to-user bookmark.
   * 
   * @param {String} senderId The creater/sender of the bookmark
   * @param {String} receiverId The receiver of the bookmark
   * @param {Object} bookmark The bookmark being shared
   * @return {undefined}
   */
  Service.createUserBookmark = function (senderId, receiverId, bookmark) {
    return app.get('Service').User.validateFriendship(senderId, receiverId, 'accepted').then(function () {
      bookmark.SenderId = senderId;
      bookmark.ReceiverId = receiverId;
      delete bookmark.createdAt;
      delete bookmark.deletedAt;
      delete bookmark.id;

      return Model.Bookmark.save(bookmark);
    });
  };

  /**
   * Get all bookmarks shared between two users.
   * 
   * @param {String} aUserId User with shared bookmarks
   * @param {String} bUserId User with shared bookmarks
   * @return {Promise<Array<Object>>} List of shared bookmarks
   */
  Service.getUserBookmarks = function (aUserId, bUserId) {
    return q.all([
      Model.User.get(aUserId),
      Model.User.get(bUserId),
      r.table(Model.Bookmark.getTableName()).getAll(
        [aUserId, bUserId],
        { index: 'userToUser' }
      ).filter({ deletedAt: null }),
      r.table(Model.Bookmark.getTableName()).getAll(
        [bUserId, aUserId],
        { index: 'userToUser' }
      ).filter({ deletedAt: null })
    ]).then(function (res) {
      // Don't leak chrome identity ids
      delete res[0].sub;
      delete res[1].sub;
      return {
        aUser: res[0],
        bUser: res[1],
        bookmarks: res[2].concat(res[3])
      };
    });
  };

  Service.getUserBookmark = function (bookmarkId) {
    var bookmark;

    return Model.Bookmark.getAll(bookmarkId).filter({ deletedAt: null }).getJoin({
      sender: {
        _apply: function (user) { return user.getPublicView(); }
      },
      receiver: {
        _apply: function (user) { return user.getPublicView(); }
      }
    }).then(function (b) {
      bookmark = b[0];

      if (bookmark) {
        delete bookmark.sender.deletedAt;
        delete bookmark.receiver.deletedAt;
        return bookmark;
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Bookmark not found'));
      }
    });
  };

  /**
   * Delete a user-to-user bookmark. Only the creater of a bookmark can
   * delete it.
   * 
   * @param {String} bookmarkId The bookmark to delete
   * @return {Promise<Object>} The deleted bookmark
   */
  Service.deleteUserBookmark = function (bookmarkId) {
    var bookmark;

    return Model.Bookmark.getAll(bookmarkId).filter({ deletedAt: null }).getJoin({
      sender: {
        _apply: function (user) { return user.getPublicView(); }
      },
      receiver: {
        _apply: function (user) { return user.getPublicView(); }
      }
    }).then(function (b) {
      bookmark = b[0];

      if (bookmark) {
        return Model.Bookmark.get(bookmarkId).update({ deletedAt: r.now() });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Bookmark not found'));
      }
    }).then(function () {
      // TODO WHY DOES .without NOT WORK FOR DATES
      delete bookmark.sender.deletedAt;
      delete bookmark.receiver.deletedAt;
      return bookmark;
    });
  };

  return q({
    name: 'Bookmark',
    service: Service
  });
};