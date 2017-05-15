'use strict';

var errors = {},
    HttpError = require('./http');

errors.EntityExists = function EntityExists(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || HttpError.Const.Conflict.MESSAGE;
  this.status = HttpError.Const.Conflict.STATUS;
};

errors.EntityNotFound = function EntityNotFound(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || HttpError.Const.NotFound.MESSAGE;
  this.status = HttpError.Const.NotFound.STATUS;
};

errors.EntityConflict = function EntityConflict(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || HttpError.Const.Conflict.MESSAGE;
  this.status = HttpError.Const.Conflict.STATUS;
};

module.exports = errors;