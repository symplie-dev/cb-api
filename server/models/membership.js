'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'Membership',
      type = Thinky.type,
      r = Thinky.r,
      model;

  model = Thinky.createModel(MODEL_NAME, {
    id:           type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    UserId:       type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    GroupId:      type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    status:      type.string()
                      .default('pending')
                      .enum(['pending', 'accepted', 'rejected'])
                      .allowNull(false)
                      .required(),
    role:         type.string()
                      .default('member')
                      .enum(['admin', 'member'])
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

  return q({
    name: MODEL_NAME,
    model: model,
    config: {
      primaryKey: 'id',
      secondaryIndexes: [
        'GroupId',
        'UserId',
        [
          'membership',
          function (doc) {
            return [doc('GroupId'), doc('UserId')];
          }
        ]
      ]
    }
  });
};