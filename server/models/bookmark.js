'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'Bookmark',
      URL_REGEX = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
      type = Thinky.type,
      r = Thinky.r,
      model;

  model = Thinky.createModel(MODEL_NAME, {
    id:           type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    url:          type.string()
                      .regex(new RegExp(URL_REGEX, 'i'))
                      .max(2083)
                      .allowNull(false)
                      .required(), 
    displayText:  type.string()
                      .default(null)
                      .allowNull(true)
                      .required(),
    GroupId:      type.string()
                      .uuid(4)
                      .default(null)
                      .allowNull(true)
                      .required(),
    SenderId:     type.string()
                      .uuid(4)
                      .allowNull(false)
                      .required(),
    ReceiverId:   type.string()
                      .uuid(4)
                      .default(null)
                      .allowNull(true)
                      .required(),
    createdAt:    type.date()
                      .default(r.now())
                      .allowNull(false)
                      .required(),
    expiresAt:    type.date()
                      .default(null)
                      .allowNull(true)
                      .min(r.now())
                      .required(),
    deletedAt:    type.date()
                      .default(null)
                      .allowNull(true)
                      .required()
  }, {
    init: false,
    enforce_extra: 'remove'
  });

  model.post('save', function (next) {
    delete this.deletedAt;
    next();
  });

  model.post('retrieve', function (next) {
    delete this.deletedAt;
    next();
  });

  return q({
    name: MODEL_NAME,
    model: model,
    config: {
      primaryKey: 'id',
      secondaryIndexes: [
        'GroupId',
        'SenderId',
        'ReceiverId',
        [
          'userToUser',
          function (doc) {
            return [doc('SenderId'), doc('ReceiverId')];
          }
        ]
      ]
    }
  });
};