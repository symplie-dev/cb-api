'use strict';

module.exports = function () {
  var Config = {
    app: {
      PORT: process.env.PORT || 3000,
      ENV: process.env.NODE_ENV || 'test'
    },
    db: {
      NAME: process.env.DB_NAME || 'cb_test',
      SERVERS: (process.env.DB_HOST || 'localhost').split(',').map(function (host) {
        return {
          host: host,
          port: process.env.DB_PORT || 28015
        };
      }),
      KEY: process.env.DB_KEY,
      CERT: process.env.DB_CERT
    },
    log: {
      NODE_LEVEL: process.env.NODE_LOG_LEVEL || 'verbose',
      HTTP_LEVEL: process.env.HTTP_LOG_LEVEL || 'verbose'
    },
    consts: {
      MAX_FRIENDS: 50
    },
    oauth: {
      CLIENT_ID: process.env.OAUTH_CLIENT_ID,
      CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET
    }
  };

  // Add derived properties
  Config.db.CONN_OPTS = { db: Config.db.NAME, servers: Config.db.SERVERS };

  if (Config.db.KEY && Config.db.CERT) {
    Config.db.CONN_OPTS.ssl = { key: Config.db.KEY, cert: Config.db.CERT };
  }

  return Config;
};