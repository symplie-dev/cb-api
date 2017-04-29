'use strict';

var winston = require('winston'),
    morgan = require('morgan'),
    ERR_CODE_REGEX = /` ([45][0-9]{2}) `/,
    STATUS_CODE_REGEX = /` ([0-9]{3}) `/;

module.exports = function (app) {
  var Config = app.get('Config'),
      appLogger,
      accessLogger;
  
  appLogger = _getAppLogger();
  accessLogger = _getAccessLogger();
  app.use(morgan(':method ` :status ` :remote-addr :response-time ms - :url', { stream: accessLogger.stream }));

  app.set('AppLogger', appLogger);
  app.set('AccessLogger', accessLogger);

  /**
   * Create and return the appLogger used for logging node/app related content.
   * 
   * @return {Object} The app logger object
   */
  function _getAppLogger() {
    return new winston.Logger({
      transports: [
        new winston.transports.Console({
          level: Config.log.NODE_LEVEL,
          handleExceptions: true,
          json: false,
          colorize: true,
          timestamp: true,
          label: 'app'
        })
      ],
      exitOnError: false
    });
  }

  /**
   * Create and return the access appLogger
   * 
   * @return {Object} The access logger objects
   */
  function _getAccessLogger() {
    var al = new winston.Logger({
      transports: [
        new winston.transports.Console({
          level: Config.log.HTTP_LEVEL,
          handleExceptions: true,
          json: false,
          colorize: true,
          timestamp: true,
          label: 'access'
        })
      ],
      exitOnError: false
    });

    al.stream = {
      write: function (message) {
        if (ERR_CODE_REGEX.test(message)) {
          al.error(message.replace(ERR_CODE_REGEX, '$1').trim());
        } else {
          al.info(message.replace(STATUS_CODE_REGEX, '$1').trim());
        }
      }
    };

    return al;
  }
};