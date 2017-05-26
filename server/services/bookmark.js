'use strict';

var q = require('q');

module.exports = function (app) {
  var Model = app.get('Model'),
      r = app.get('Thinky').r,
      Errors = app.get('Errors'),
      Config = app.get('Config'),
      Service = {};

  /**
   * Create a user-to-user bookmark.
   * 
   * @param {String} senderId The creater/sender of the bookmark
   * @param {String} receiverId The receiver of the bookmark
   * @param {Object} bookmark The bookmark being shared
   * @return {Promise<Object>} The newly created bookmark
   */
  Service.createUserBookmark = function (senderId, receiverId, bookmark) {
    return app.get('Service').User.validateFriendship(senderId, receiverId, 'accepted').then(function () {
      return r.table(Model.User.getTableName()).get(senderId).update(function (user) {
        return r.branch(
          user('numBookmarksCreated').lt(Config.consts.MAX_USER_BOOKMARKS),
          {
            numBookmarksCreated: user('numBookmarksCreated').add(1)
          },
          {}  
        );
      });
    }).then(function (res) {
      if (res.replaced > 0) {
        bookmark.SenderId = senderId;
        bookmark.ReceiverId = receiverId;
        delete bookmark.createdAt;
        delete bookmark.deletedAt;
        delete bookmark.id;
        delete bookmark.GroupId;

        return Model.Bookmark.save(bookmark);
      } else {
        return q.reject(new Errors.Http.BadRequest('You have reached the maximum number of bookmarks'));
      }
    });
  };

  /**
   * Get all bookmarks shared between two users.
   * 
   * @param {String} selfUser User id fetching the bookmarks
   * @param {String} friendUser User id with shared bookmarks
   * @return {Promise<Array<Object>>} List of shared bookmarks
   */
  Service.getUserBookmarks = function (selfUser, friendUser) {
    return q.all([
      Model.User.getAll(selfUser).filter({ deletedAt: null }),
      Model.User.getAll(friendUser).filter({ deletedAt: null }),
      r.table(Model.Bookmark.getTableName()).getAll(
        [selfUser, friendUser],
        { index: 'userToUser' }
      ).filter({ deletedAt: null }),
      r.table(Model.Bookmark.getTableName()).getAll(
        [friendUser, selfUser],
        { index: 'userToUser' }
      ).filter({ deletedAt: null })
    ]).then(function (res) {
      res[0] = res[0][0];
      res[1] = res[1][0];
      
      if (!res[0] || !res[1]) {
        return q.reject(new Errors.Db.EntityNotFound('User not found. Unable to retrieve bookmarks'));
      } else {
        // Don't leak chrome identity ids
        delete res[0].sub;
        delete res[1].sub;
        return {
          self: res[0],
          friend: res[1],
          bookmarks: res[2].concat(res[3])
        };
      }
    });
  };

  Service.getUserBookmark = function (bookmarkId) {
    var bookmark;

    return Model.Bookmark.getAll(bookmarkId).filter({ deletedAt: null }).getJoin({
      sender: true,
      receiver: true
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
      sender: true,
      receiver: true
    }).then(function (b) {
      bookmark = b[0];

      if (bookmark) {
        return Model.Bookmark.get(bookmarkId).update({ deletedAt: r.now() });
      } else {
        return q.reject(new Errors.Db.EntityNotFound('Bookmark not found'));
      }
    }).then(function () {
      return Model.User.get(bookmark.SenderId).update(function (user) {
        return {
          numBookmarksCreated: user('numBookmarksCreated').sub(1)
        };
      });
    }).then(function () {
      return bookmark;
    });
  };

  /**
   * Create a bookmark shared by a group.
   * 
   * @param {String} senderId The creator of the bookmark
   * @param {String} groupId The group to share with
   * @param {Object} bookmark The bookmark being shared
   * @return {Promise<Object>} The newly created bookmark
   */
  Service.createGroupBookmark = function (senderId, groupId, bookmark) {
    bookmark.SenderId = senderId;
    bookmark.GroupId = groupId;
    delete bookmark.ReceiverId;
    delete bookmark.createdAt;
    delete bookmark.deletedAt;
    delete bookmark.id;

    return Model.Bookmark.save(bookmark);
  };

  /**
   * Get all bookmarks associated with the group.
   * 
   * @param {String} groupId The group to get bookmarks for
   * @return {Promise<Array<Object>>} The m
   */
  Service.getGroupBookmarks = function (groupId) {
    return Model.Bookmark.getAll(groupId, { index: 'GroupId' })
      .filter({ deletedAt: null })
      .getJoin({ sender: true });
  };

  /**
   * Get the specified bookmark.
   * 
   * @param {String} bookmarkId The id of the bookmark to fetch
   * @return {Promise<Object>} The bookmark
   */
  Service.getGroupBookmark = function (bookmarkId) {
    return Model.Bookmark.getAll(bookmarkId)
      .filter({ deletedAt: null })
      .getJoin({ sender: true })
      .then(function (bookmark) {
        bookmark = bookmark[0];

        if (bookmark) {
          return q(bookmark);
        } else {
          return q.reject(new Errors.Db.EntityNotFound('Bookmark not found'));
        }
      });
  };

  /**
   * Delete the specified group bookmark.
   * 
   * @param {String} bookmarkId The id of the bookmark to delete
   * @return {Promise<Object>} The deleted bookmark
   */
  Service.deleteGroupBookmark = function (bookmarkId) {

  };

  return q({
    name: 'Bookmark',
    service: Service
  });
};