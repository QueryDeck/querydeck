'use strict';
var session = require('express-session');
var envconfig = require('../envconfig.js');
const MongoStore = require('connect-mongo');


var s = session({
  "secret": envconfig.vars.mongoStore.secret,
  "cookie": {
    "httpOnly": true,
    "maxAge": 7 * 24 * 60 * 60 , 
    // "secure": process.env.PROJECT_ENV == 'prod' ? true :  false
     "secure":    false,
    //  "domain":'https://app.querydeck.io'
  },
  "resave": false,
  "saveUninitialized": false,
  "rolling": true,
  "store": new MongoStore({
    mongoUrl: 'mongodb://mongo:27017/qd_session',
    collection: 'sessions',
    autoRemove: 'native',
    autoRemoveInterval: 1440
  })
});


module.exports = function (sessionConfig, pgstoreConfig) {
  return s;
};
