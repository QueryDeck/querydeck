'use strict';
var envconfig = require.main.require('./envconfig.js').vars;
var DB = require.main.require('./models/index.js').db;
var ErrorHandler = require.main.require('./lib/errors.js');
var ModelManager = require('../models/modelManager');
var jwt = require('jsonwebtoken');
var db = require.main.require('./lib/maindb.js');
var cipher = new (require("../lib/cipher.js"))(envconfig.cipher.secret, envconfig.cipher.algorithm);
// const  { MYSQL, POSTGRES,MYSQL_ID, POSTGRES_ID} =  require('../envconfig.js').constant;
var Sentry =  require('../sentry');
const os = require( 'os' );
var allModels = require.main.require('./models/modelManager').models;

/**
 * @commment  Add user models to ModelManager.models if  subdomain is available
 */
module.exports = function (req, res, next) {
  return function (req, res, next) {

    //   //* _---------  ---------/ */
    //    let prev_func = next 
    //       next = ()=>{
    //     console.log("---_> refreshModeladder ")
    //     console.log("---->ModelManager.models")
    //     // console.log(  (ModelManager.models['autumn-river-62'] && ModelManager.models['autumn-river-62'] ))
    //     console.log( Object.keys (ModelManager.models))
    //     prev_func(); 
    // }
    //   //* _---------  ---------/ */

    console.log('refreshModeladder')

    res.zend = function(data, status, message, options = {}){
      if(!status) status = 200;
      this.status(status);
     
      // console.log( " --> res.headersSent " + res.statusCode, status)
  
      if (status >= 400 && !options.isAlreadySentError) {
        message = message || 'Something Went Wrong';
        let myError = new Error(message)
        myError.message += ' (status: ' + status + ')'
        myError.statusCode = status
        Sentry.saveData(req); 
        Sentry.captureError(myError);
      } 
    
      if(!res.headersSent){ 
        res.send({
          meta: {
            status: status,
            message: message
          },
          data: data
        });
      }else{ 
        console.error("Header Already Sent ");
        console.error(data); 
        console.error(status); 
        console.error(message); 
      }
      // console.log("\n\n\n\n");
    };

    // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    // console.log('fullUrl', fullUrl)
    // console.log('req.subdomains', getSubdomainList(req.get('host')))

    var host = req.get('host');

    var subfromurl = getSubdomainList(host)

    let subdomain = req.query.subdomain || req.body.subdomain || (subfromurl ? subfromurl[0] : null); 
    if(subdomain == '' || subdomain == 'api' || subdomain == 'dev-api') subdomain = null;

    if(!subdomain && req.originalUrl.indexOf('/login/sandbox') > -1) {
      subdomain = 'sandbox'
    }

    if(ModelManager.domainToSubdomain[host]) {
      subdomain = ModelManager.domainToSubdomain[host];
    }

    if(host.indexOf('querycharts') == -1 && host.indexOf('querydeck') == -1 && host.indexOf('localhost') == -1 && !ModelManager.domainToSubdomain[host]) {
      // this is just for custom domains on app restart since we are lazy loading ModelManager.domainToSubdomain
      // TODO: redesign this in a better way. this is too ugly

      ModelManager.loadAppFromDomain(host, function(err){
        if(err) {
          if(err.error && err.error == 404) return res.zend(null, 400, ("Invalid subdomain " + subdomain));
          else return res.zend(null, 500, ("Error loading app " + subdomain));
        }
        next()
      })
      
    } else if (subdomain && (!allModels[subdomain])) {
      // TODO: app.name not require use 

      ModelManager.loadApp(subdomain, function(err){
        if(err) {
          if(err.error && err.error == 404) return res.zend(null, 400, ("Invalid subdomain " + subdomain));
          else return res.zend(null, 500, ("Error loading app " + subdomain));
        }
        next()
      })

    } else {
      next(); 
    }

  };
};

function getSubdomainList(host) {
  var subdomainList = host ? host.split('.') : null;
  if(subdomainList)
      subdomainList.splice(-1, 1);
  return subdomainList;
}