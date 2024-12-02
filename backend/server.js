'use strict';
require('dotenv').config();
var init = require('./init.js');
var app = require('./index');
var http = require('http').Server(app);
var https = require('https');
var PORT = 3000;
var fs = require('fs');
var Sentry = require('./sentry.js');

init(function (err) {
  if (err) return console.error('Error starting backend', err);

  app.disable('etag');

  Sentry.useRequestHandler(app);
  app.use(require('kraken-js')());
  Sentry.useErrorHandler(app); 

  http.listen(PORT);
  http.on('listening', function () {
    console.info('Backend listening on http://localhost:%d', PORT);

  });

});
