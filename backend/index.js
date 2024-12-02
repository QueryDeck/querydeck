'use strict';
// require('newrelic');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var sessions = require('./middlewares/sessions.js');
var responseEnd = require('./middlewares/responseEnd.js');
const bodyParser = require('body-parser');
const { MYSQL  , REQUEST_BODY_SIZE } = require('./envconfig.js').constant;
var reSyncSchema = require('./lib/reSyncSchema.js');   
var refreshGithub = require('./lib/refreshGithub.js');  

app.on('start', function () {
  console.log('Application ready to serve requests.');
  console.log('Environment: %s', app.kraken.get('env:env'));
  reSyncSchema();
  refreshGithub.start();
});

app.use('/.well-known', express.static('.well-known')); //###  for ssl certificate genration 
app.use(sessions())

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: REQUEST_BODY_SIZE }));
app.use(cookieParser());
app.use(responseEnd());
module.exports = app;