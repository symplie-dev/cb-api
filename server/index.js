'use strict';

module.exports = function (app) {
  // Initialize config
  app.set('Config', require('./config')(app));
  // Initialize loggers
  require('./logger')(app);
  // Check admin credentials provided
  if (app.get('Config').admin.USER === 'postman' || app.get('Config').admin.PASS === 'test') {
    app.get('AppLogger').warn('Using test admin credentials; ADMIN_USER, ADMIN_USER should be set explicitly in production.');
  }
  // Initialize custom errors
  app.set('Errors', require('./errors')(app));
  // Load models
  return require('./models')(app).then(function () {
    // Load Services
    return require('./services')(app);
  }).then(function () {
    // Load controllers
    return require('./controllers')(app);
  });
}