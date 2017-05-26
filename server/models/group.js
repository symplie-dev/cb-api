'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'Group',
      type = Thinky.type,
      r = Thinky.r,
      model;

  model = Thinky.createModel(MODEL_NAME, {
    id:           type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    name:         type.string()
                      .min(2)
                      .max(128)
                      .allowNull(false)
                      .required(),
    numBookmarks: type.number()
                      .allowNull(false)
                      .default(0)
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
    config: { primaryKey: 'id', secondaryIndexes: ['CreatorId'] }
  });
};