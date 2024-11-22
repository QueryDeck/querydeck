'use strict';
var modelutils = require.main.require('./models/utils');
var catchError = require('../middlewares/catchError');


var sqlFormatter = require('sql-formatter');

var json2sql = require.main.require('./models/JsonToSql.js');

var mhelper = require.main.require('./models/modelhelpers.js');

var allModels = require.main.require('./models/modelManager').models;

var dbhelper = require.main.require('./lib/dbhelpers.js');

var v2json = require.main.require('./models/viewToJSON.js');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
const { urlencoded } = require('express');
var envconfig = require('../envconfig'); envconfig;
var authCipher = new (require("../lib/cipher.js"))(envconfig.vars.auth.secret, envconfig.vars.auth.algorithm);


var types = require.main.require('./models/utils.js').pg_types;
var mysql_types = require.main.require('./models/utils.js').mysql_types;
var chart_agg_fn = require.main.require('./models/utils.js').pg_chart_agg_fn;
var qutils = require.main.require('./models/utils.js');
var refreshModeladder = require('../middlewares/refreshModeladder.js')();
const { MYSQL, POSTGRES, DASHBOARD_SALT, DASHBOARD_ALOG_NAME, DASHBOARD_ALOG_SECRET } = require('../envconfig.js').constant;
var dashboardCipher = new (require("../lib/cipher.js"))(DASHBOARD_ALOG_SECRET, DASHBOARD_ALOG_NAME);


module.exports = function (router) {

  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });

}
