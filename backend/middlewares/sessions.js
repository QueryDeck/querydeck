'use strict';
var session = require('express-session');
var envconfig = require('../envconfig.js');
const MongoStore = require('connect-mongo');


var s = session({
  "secret": envconfig.vars.mongoStore.secret,
  "cookie": {
    "httpOnly": true,
    "maxAge": envconfig.vars.jwt.expiry_time * 1000 , 
    // "secure": process.env.PROJECT_ENV == 'prod' ? true :  false
     "secure":    false,
    //  "domain":'https://app.querydeck.io'
  },
  "resave": false,
  "saveUninitialized": false,
  "store": new MongoStore({
    mongoUrl: 'mongodb://mongo:27017/qd_session',
    collection: 'sessions',
    autoRemove: 'disabled'
  })
});


module.exports = function (sessionConfig, pgstoreConfig) {
  return s;
};
