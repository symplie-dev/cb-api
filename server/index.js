'use strict';

module.exports = function (app) {
  // Initialize config
  app.set('Config', require('./config')(app));
  // Initialize loggers
  require('./logger')(app);
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