'use strict';
var DB = require.main.require('./models/index.js').db;
var ModelManager = require('../models/modelManager');
const requestIp = require('request-ip');
const _ = require('lodash');
var allModels = require.main.require('./models/modelManager').models;
var requestHandler = require.main.require('./models/requestHandler').handleRequest;
/**
 * @commment  Add user models to ModelManager.models if  subdomain is available
 */
module.exports = function () {
  return function (req, res, next) {

    var host = req.get('host');
    var subdomain = getSubdomainList(host)
    if(subdomain) subdomain = subdomain[0]

    if(ModelManager.domainToSubdomain[host]) {
      subdomain = ModelManager.domainToSubdomain[host];
    }

    if(subdomain && subdomain !== 'api' && subdomain !== 'dev-api') {
      var exec_time_start = Date.now();
      var clientip = requestIp.getClientIp(req);
      requestHandler({
        request_path: req.path,
        request_method: req.method,
        request_body: req.body,
        request_params: req.query,
        request_headers: req.headers,
        request_cookies: parseCookies(req),
        currentModel: allModels[subdomain]
      }, function(err, exec_data) {
        var res_status = 200;
        if(err) {
          res_status = err.response_code;
          res.status(res_status).send({error: err});
        } else {
          res.send(exec_data);
        }
        // record_query_log({
        //   query_id: query_model.query_id,
        //   ip_address: clientip,
        //   db_error: err,
        //   response_code: res_status,
        //   exec_time_end: Date.now(),
        //   exec_time_start: exec_time_start
        // })
      });

    } else {
      next()
    }
    
  };
};

function record_query_log(params) {
  new DB({}).execute(
    new ModelManager.pgtmodels.models.public.api_query_metrics().insert({
      query_id: params.query_id,
      ip_address: params.ip_address,
      db_error: params.db_error,
      response_code: params.response_code,
      exec_time: (params.exec_time_end - params.exec_time_start)
    }),
    function(err){
      if(err) console.log(err)
    }
  )
}

function getSubdomainList(host) {
  var subdomainList = host ? host.split('.') : null;
  if(subdomainList)
      subdomainList.splice(-1, 1);
  return subdomainList;
}

function parseCookies (request) {
  const list = {};
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(`;`).forEach(function(cookie) {
      let [ name, ...rest] = cookie.split(`=`);
      name = name?.trim().toLowerCase();
      if (!name) return;
      const value = rest.join(`=`).trim();
      if (!value) return;
      list[name] = decodeURIComponent(value);
  });

  return list;
}