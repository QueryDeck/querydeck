'use strict';
var modelutils = require.main.require('./models/utils');

var sqlFormatter = require('sql-formatter');

var json2sql = require.main.require('./models/JsonToSql.js');
var catchError = require('../middlewares/catchError');

var mhelper = require.main.require('./models/modelhelpers.js');

var allModels = require.main.require('./models/modelManager').models;

var dbhelper = require.main.require('./lib/dbhelpers.js');

var v2json = require.main.require('./models/viewToJSON.js');


module.exports = function (router) {


    router.all('/*', (req, res) => {
        res.zend({ method: req.method }, 404, "Not Found",);
    });
}

