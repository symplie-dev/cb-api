'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'User_Group',
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
  }, {
    init: false,
    enforce_extra: 'remove'
  });

  return q({
    name: MODEL_NAME,
    model: model,
    config: { primaryKey: 'id', secondaryIndexes: ['UserId', 'GroupId'] }
  });
};