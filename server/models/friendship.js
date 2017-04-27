'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'Friendship',
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
    RequesterId:  type.string()
                      .uuid(4)
                      .allowNull(false)
                      .required(),
    RequestedId:  type.string()
                      .uuid(4)
                      .allowNull(false)
                      .required(),
    status:      type.string()
                      .default('pending')
                      .enum(['pending', 'accepted', 'rejected'])
                      .allowNull(false)
                      .required(),
    acceptedAt:   type.date()
                      .default(null)
                      .allowNull(true)
                      .required(),
    rejectedAt:   type.date()
                      .default(null)
                      .allowNull(true)
                      .required(),
    createdAt:    type.date()
                      .default(r.now())
                      .allowNull(false)
                      .required(),
    deletedAt:    type.date()
                      .default(null)
                      .allowNull(true)
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
        'RequesterId',
        'RequestedId',
        [
          'friendship',
          function (doc) {
            return [doc('RequesterId'), doc('RequestedId')];
          }
        ]
      ]
    }
  });
};