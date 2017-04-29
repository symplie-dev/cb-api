'use strict';

var errors = {},
    HttpError = require('./http');

errors.EntityExists = function CustomError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || HttpError.Const.Conflict.MESSAGE;
  this.status = HttpError.Const.Conflict.STATUS;
};

errors.EntityNotFound = function CustomError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || HttpError.Const.NotFound.MESSAGE;
  this.status = HttpError.Const.NotFound.STATUS;
};

module.exports = errors;