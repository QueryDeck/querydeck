'use strict';
var catchError = require('../../../middlewares/catchError');
var utils = require('../../../extras/utils.js');

var ModelManager = require.main.require('./models/modelManager');

// const { urlencoded, query } = require('express');
var envconfig = require('../../../envconfig');envconfig
// var Sentry = require('../../../sentry');
 
module.exports = function (router) {

  router.get('/custom-domains', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400, "Invalid Values");
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    new req.DB({}).execute([
      new req.models.public.custom_domains().select({
        custom_domain_id: true,
        domain: true
      }).where({
        app_id: {
          $inq: new req.models.public.apps().select({ app_id: true }).where({
            app_id: {
              $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
                name: req.query.subdomain
              })
            },
            created_by: req.user_id
          })
        }
      }).aggAlias('domains')
    ], function(err, result){
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
      result.domains = result.domains || []
      return res.zend(result.domains);
    })  

  }));

  router.post('/custom-domains', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain]) return res.zend(null, 400, "Invalid Values");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");
    if(!req.body.custom_domains || req.body.custom_domains.length == 0 || req.body.custom_domains.length > 1) return res.zend(null, 400, "Invalid Values");

    var domain_insert = []

    var app_id = new req.models.public.apps().select({ app_id: true }).where({
      app_id: {
        $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
          name: req.body.subdomain
        })
      },
      created_by: req.user_id
    })

    for (let i = 0; i < req.body.custom_domains.length; i++) {
      const element = req.body.custom_domains[i];
      domain_insert.push({
        app_id: app_id,
        domain: req.body.custom_domains[i]
      })
    }

    new req.DB({}).execute([
      new req.models.public.custom_domains().insert(domain_insert).conflict({})
    ], function(err, result){
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
      ModelManager.addCustomDomain({
        subdomain: req.body.subdomain,
        domain: req.body.custom_domains[0]
      })
      return res.zend({});
    })  

  }));

  router.delete('/custom-domains', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain]) return res.zend(null, 400, "Invalid Values");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");
    if(!req.body.custom_domain_id) return res.zend(null, 400, "Invalid Values");

    new req.DB({}).execute([
      new req.models.public.custom_domains().delete().where({
        custom_domain_id: req.body.custom_domain_id
      })
    ], function(err, result){
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
      if(result.deletedrows && result.deletedrows.custom_domains && result.deletedrows.custom_domains[0]) {
        ModelManager.deleteCustomDomain({
          domain: result.deletedrows.custom_domains[0].domain
        })
      }
      return res.zend({});
    })  

  }));

  router.get('/join-graph', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400, "Invalid Values");
    if (!req.query.db_id) return res.zend(null, 400, "Must have field db_id");
    if (!req.query.id) return res.zend(null, 400, "Must have field id");
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    var tm = ModelManager.buildJoinGraph({
        db_id: req.query.db_id,
        subdomain: req.query.subdomain,
        id: req.query.id
    });

    return res.zend(utils.formatJoinGraph(tm));

  }));

};
