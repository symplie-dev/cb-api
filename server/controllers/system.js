'use strict';

var q = require('q'),
    pkg = require('../../package.json'),  
    authentication = require('../middleware/chrome-token-authentication');

module.exports = function (app, router) {
  var Service = app.get('Service'),
      Logger = app.get('AppLogger');
  
  authentication = authentication(app);

  router.route('/info')
    .get(function (req, res) {
      res.status(200).json({
        status: 200,
        data: {
          version: pkg.version,
          status: 'OK',
          message: 'Welcome to the collaborative-bookmarks API'
        }
      });
    });

  router.route('/database')
    .get(function (req, res) {
      Service.System.getDbConfig().then(function (c) {
        res.status(200).json({ status: 200, data: c });
      }).catch(function (err) {
        res.status(err.status).json(err);
      });
    })
    .post(function (req, res) {
      Service.System.initDb().then(function () {
        return Service.System.getDbConfig();
      }).then(function (c) {
        res.status(201).json({ status: 201, data: c });
      }).catch(function (err) {
        res.status(err.status).json(err);
      });
    });
    
  router.route('/validate-token')
    .post(function (req, res) {
      Logger.info('Validate token: %s', req.body.token);
      authentication._validateToken(req.body.token).then(function (tokenRes) {
        Logger.info(tokenRes);
        res.status(200).json({
          status: 200,
          data: tokenRes
        });
      }).catch(function (err) {
        if (err && err.statusCode) {
          res.status(err.statusCode).json({
            status: err.statusCode,
            data: err.body
          });
        } else {
          res.status(500).json({
            status: 500,
            data: {
              message: 'Internal server error'
            }
          });
        }
      });
    });

  return q({
    path: '/api/system',
    router: router
  });
};