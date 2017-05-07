'use strict';

var q = require('q'),
    request = require('request'),
    Config = require('../../config')();

/**
 * Validate the given chrome identity token
 * 
 * @param {String} token The token to be validated
 * @return {Promise<Object>} A promise containing the chrome user_id
 */
function tokenValidate(token) {
  var deferred = q.defer();

  request('https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=' + token, function (err, res) {
    var body;

    if (err) {
      deferred.reject(err);
    } else if (res && res.statusCode === 200 && res.body && res.body) {
      try {
        body = JSON.parse(res.body);

        if (body.audience === Config.oauth.CLIENT_ID && body.expires_in > 0) {
          deferred.resolve(body);
        } else {
          deferred.reject();
        }
      } catch (e) {
        deferred.reject();
      }
    } else if (res.body) {
      try {
        body = JSON.parse(res.body);

        if (body.error_description) {
          body = { message: body.error_description };
        }

        res.body = body;
      } catch (e) {
        deferred.reject();
      }
      deferred.reject(res);
    }
  });

  return deferred.promise;
}

function __mockTokenValidate__(token) {
  if (token) {
    return q({
      user_id: token,
      __mock__: true
    });
  } else {
    return q.reject();
  }
}

if (Config.app.ENV === 'test') {
  module.exports = __mockTokenValidate__;
} else {
  module.exports = tokenValidate;
}