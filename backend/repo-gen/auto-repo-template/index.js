'use strict';
// require('newrelic');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
// var sessions = require('./middlewares/sessions');
const bodyParser = require('body-parser');


app.on('start', function () {
  console.log('Application ready to serve requests.');
  console.log('Environment: %s', app.kraken.get('env:env'));
});


// app.use('/.well-known', express.static('.well-known')); //###  for ssl certificate genration 
// app.use(sessions())

app.use(bodyParser.json({ limit: '500kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));
app.use(cookieParser());
module.exports = app;