'use strict';
require('dotenv').config();
var app = require('./index');
var http = require('http').Server(app);
var PORT = process.env.PORT || process.env.port || 3000;
app.disable('etag');

  app.use(require('kraken-js')());

  http.listen(PORT);
    http.on('listening', function () {
      console.info('Server listening on http://localhost:%d', PORT);

    });
