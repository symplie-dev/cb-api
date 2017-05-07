'use strict';

var q = require('q');

module.exports = function (app) {
  var thisService = {},
      Config = app.get('Config'),
      Model = app.get('Model'),
      r = app.get('Thinky').r;

  thisService.getDbConfig = function () {
    return r.tableList().then(function (tables) {
      return {
        database: Config.db.NAME,
        tables: tables
      };
    });
  };

  thisService.createDb = function () {
    return r.dbList().then(function (dbList) {
      if (dbList.indexOf(Config.db.NAME) < 0) {
        return r.dbCreate(Config.db.NAME);
      } else {
        return q();
      }
    });
  };

  /**
   * Create all tables represented by Models. Only create the tables if they
   * don't already exist.
   * 
   * @return {Promise<undefined>} Resolve an empty promise on completion
   */
  thisService.createTables = function () {
    var models = Object.keys(Model),
        createPrms = [];

    return thisService.getDbConfig().then(function (dbConfig) {
      models.forEach(function (model) {
        if (dbConfig.tables.indexOf(model) < 0) {
          createPrms.push(r.tableCreate(model, _getRethinkTableConfig(Model[model]._cbConfig)));
        }
      });
      
      return q.all(createPrms);
    });
  };

  /**
   * Create all secondary indexes specified by the models.
   * 
   * @return {Promise<undefined>} Resolve an empty promise on completion
   */
  thisService.ensureSecondaryIndexes = function () {
    var models = Object.keys(Model);

    models.forEach(function (model) {
      Model[model]._cbConfig = Model[model]._cbConfig || {};
      Model[model]._cbConfig.secondaryIndexes = Model[model]._cbConfig.secondaryIndexes || [];

      Model[model]._cbConfig.secondaryIndexes.forEach(function (index) {
        if (Array.isArray(index) && typeof index[0] === 'string' && typeof index[1] === 'function') {
          Model[model].ensureIndex(index[0], index[1]);
        } else if (typeof index === 'string') {
          Model[model].ensureIndex(index);
        } else {
          app.get('AppLogger').error('Secondary indexes must be an array[<string>, <function>] or a string');
          process.exit(1);
        }
      });
    });

    return q();
  };

  /**
   * Initialize the database. We do this ourselves instead of letting Thinky do
   * the work because if multiple nodes attempt to create tables simultaneously
   * bad things happen in rethinkdb.
   * 
   * @return {Promise<undefined>} Resolve an empty promise on completion
   */
  thisService.initDb = function () {
    return thisService.createDb().then(function () {
      return thisService.createTables();
    }).then(function () {
      thisService.ensureSecondaryIndexes();
    });
  };

  function _getRethinkTableConfig(modelConfig) {
    modelConfig = modelConfig || {};
    modelConfig.primaryKey = modelConfig.primaryKey || 'id';

    return {
      primaryKey: modelConfig.primaryKey
    };
  }

  return q({
    name: 'System',
    service: thisService
  });
};