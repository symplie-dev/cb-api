'use strict';

var errors = {};

errors.Const = {};
errors.Const.BadRequest = { STATUS: 400, MESSAGE: 'Bad request error' };
errors.Const.NotAuthorized = { STATUS: 401, MESSAGE: 'Not authorized' };
errors.Const.NotFound = { STATUS: 404, MESSAGE: 'Entity not found error' };
errors.Const.Conflict = { STATUS: 409, MESSAGE: 'Entity exists conflict error' };
errors.Const.InternalServerError = { STATUS: 500, MESSAGE: 'Internal server error' };

errors.BadRequest = function CustomError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || errors.Const.BadRequest.MESSAGE;
  this.status = errors.Const.BadRequest.STATUS;
};

errors.InternalServerError = function InternalServerError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || errors.Const.InternalServerError.MESSAGE;
  this.status = errors.Const.InternalServerError.STATUS;
};

module.exports = errors;