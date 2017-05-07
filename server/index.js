'use strict';

module.exports = function (app) {
  // Initialize config
  app.set('Config', require('./config')(app));
  // Initialize loggers
  require('./logger')(app);
  // Check admin credentials provided
  if (!app.get('Config').admin.USER || !app.get('Config').admin.PASS) {
    app.get('AppLogger').error('You must provide ADMIN_USER and ADMIN_PASS environment variables. Exiting..');
    process.exit(1);
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