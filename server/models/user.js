'use strict';

var q = require('q');

module.exports = function (app) {
  var Thinky = app.get('Thinky'),
      MODEL_NAME = 'User',
      type = Thinky.type,
      r = Thinky.r,
      model;

  model = Thinky.createModel(MODEL_NAME, {
    id:           type.string()
                      .uuid(4)
                      .default(r.uuid())
                      .allowNull(false)
                      .required(),
    username:     type.string()
                      .regex('^[a-zA-Z0-9]{1,15}$')
                      .allowNull(false)
                      .required(),
    sub:          type.string()
                      .allowNull(false)
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

  model.defineStatic('getPublicView', function () {
    return this.without(['sub', 'deletedAt']);
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
    config: { primaryKey: 'id', secondaryIndexes: ['username', 'sub'] }
  });
};