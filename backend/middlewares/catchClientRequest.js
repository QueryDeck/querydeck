'use strict';
var DB = require.main.require('./models/index.js').db;
var ModelManager = require('../models/modelManager');
var jwt = require('jsonwebtoken');
const requestIp = require('request-ip');
const _ = require('lodash');
var allModels = require.main.require('./models/modelManager').models;
var executeClientRequest = require.main.require('./models/executeClientRequest').executeClientRequest;
var executeGraphqlRequest = require.main.require('./models/executeGraphqlRequest').executeClientRequest;

/**
 * @commment  Add user models to ModelManager.models if  subdomain is available
 */
module.exports = function (req, res, next) {
  return function (req, res, next) {

    var host = req.get('host');
    var subdomain = getSubdomainList(host)
    if(subdomain) subdomain = subdomain[0]

    if(ModelManager.domainToSubdomain[host]) {
      subdomain = ModelManager.domainToSubdomain[host];
    }

    // console.log('catchClientRequest', subdomain)

    if(subdomain && subdomain !== 'api' && subdomain !== 'dev-api') {

      var clean_path_spl = [];
      var orig_path_spl = req.path.split('/')

      // console.log(orig_path_spl, req.path)

      for (let i = 0; i < orig_path_spl.length; i++) {
        const element = orig_path_spl[i];
        if(element == '') continue;
        clean_path_spl.push(element)
      }

      var clean_path = '/' + clean_path_spl.join('/');

      var query_model;

      var url_param_value;

      var db_id = Object.keys(allModels[subdomain].databases)[0];

      let currentModel = allModels[subdomain].databases[db_id];

      if(clean_path == '/graphql' && req.method == 'POST') {
        if(!req.body.query) {
          return res.send({
            error: 'query is required'
          })
        } else {

          executeGraphqlRequest({
            // query_model: query_model,
            auth: allModels[subdomain].appDetails.auth,
            request: {
              // body: req.body,
              // query: req.query,
              session: session,
              // url_param_value: url_param_value
            },
            currentModel: allModels[subdomain],
            db: currentModel.query,
            graphql: {
              query: req.body.query,
              variables: req.body.variables
            }
          }, function(err, exec_data) {
            if(err) {
              res.status(500).send({error: err});
            } else {
              res.send(exec_data);
            }
          });

        }
        return;
      } else if(!allModels[subdomain].routes[clean_path] || !allModels[subdomain].routes[clean_path][req.method]) {
        // check for url param
        var partial_url = clean_path_spl.slice(0, clean_path_spl.length - 1).join('/')
        partial_url = partial_url +  '/:';
        var all_paths = Object.keys(allModels[subdomain].routes)
        for (let i = 0; i < all_paths.length; i++) {
          const element = all_paths[i];
          if(element.indexOf(partial_url) > -1 && allModels[subdomain].routes[element] && allModels[subdomain].routes[element][req.method]) {
            query_model = JSON.parse(JSON.stringify(allModels[subdomain].routes[element][req.method]));
            url_param_value = clean_path_spl[clean_path_spl.length - 1];
            break;
          }
        }

      } else {
        query_model = JSON.parse(JSON.stringify(allModels[subdomain].routes[clean_path][req.method]));
      }

      if(!query_model){
        return res.status(404).send({error: "Invalid route"})
      }

      var session = {}

      // TODO: dev testing
      // allModels[subdomain].appDetails.auth.jwt_key = 'dev_key';

      if (query_model.auth_required === true) {
        if(!allModels[subdomain].appDetails.auth.jwt_key) return res.status(500).send({ error: "Auth not setup correctly" });

        var authorization = req.get(allModels[subdomain].appDetails.auth.token_header)

        if(!authorization) {
          // check cookies
          var cookies = parseCookies(req);
          if(cookies[allModels[subdomain].appDetails.auth.token_header]) authorization = cookies[allModels[subdomain].appDetails.auth.token_header]
        }

        // TODO: dev testing
        // authorization = 'test'

        if (!authorization) {
          return res.status(403).send({ 
            error: "Login required"
           })
        }

        try {
          session = jwt.verify(
            authorization,
            allModels[subdomain].appDetails.auth.jwt_key,
            {
              ignoreExpiration: true,
              algorithm: allModels[subdomain].appDetails.auth.jwt_type
            }
          ); //TODO: set expiration time 

        } catch (err) {
          // console.error('jwt error', err)
          return res.status(403).send({ 
            error: "Login required"
           })
        }

      }
      var res_status = 200;
      var clientip = requestIp.getClientIp(req); 
      var db_error;
      var exec_time_start = Date.now();

      executeClientRequest({
        query_model: query_model,
        auth: allModels[subdomain].appDetails.auth,
        request: {
          body: req.body,
          query: req.query,
          session: session,
          url_param_value: url_param_value
        },
        currentModel: currentModel,
        db: currentModel.query
      }, function(err, exec_data) {
        if(err) {
          res_status = err.response_code;
          if(process.env.PROJECT_ENV !== 'prod') {
            console.log(err)
          }
          res.status(res_status).send({error: err})
        } else {
          res.send(exec_data)
        }

        record_query_log({
          query_id: query_model.query_id,
          ip_address: clientip,
          db_error: err,
          response_code: res_status,
          exec_time_end: Date.now(),
          exec_time_start: exec_time_start
        })
        
      })

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