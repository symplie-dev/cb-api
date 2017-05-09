'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'Group_User',
      type = Thinky.type,
      r = Thinky.r,
      model;

  model = Thinky.createModel(MODEL_NAME, {
    id:           type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    User_id:       type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    Group_id:      type.string()
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
    config: { primaryKey: 'id', secondaryIndexes: ['User_id', 'Group_id'] }
  });
};