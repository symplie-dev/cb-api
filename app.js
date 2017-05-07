'use strict';

var app = require('express')(),
    bodyParser = require('body-parser'),
    helmet = require('helmet');

// Standard middleware config
app.use(helmet());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// Enable CORS request from extension
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

require('./server')(app).then(function () {
  app.listen(app.get('Config').app.PORT, function () {
    app.get('AppLogger').info('API server listening on port: ' + app.get('Config').app.PORT);
  });
}).catch(function (err) {
  app.get('AppLogger').error('Error initializing app');
  app.get('AppLogger').error(err);
  process.exit(1);
});

