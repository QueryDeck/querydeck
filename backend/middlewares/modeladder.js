'use strict';
var DB = require.main.require('./models/index.js').db;
var ErrorHandler = require.main.require('./lib/errors.js');
var ModelManager = require.main.require('./models/modelManager');
 
var jwt = require('jsonwebtoken');
var public_subdomain = ["videogames", "astronauts", "globaldevelopment", "billionaires", "energy" , 'coviddaily']; 


module.exports = function(req, res, next){
  return function (req, res, next) {

    // console.log("model ladder ");
    // jwt   
    
    /* for pulic access  */
    let subdomain = req.body.subdomain || req.query.subdomain; 
    let isPublic = req.body.public || req.query.public; 
    // if(public_subdomain.includes(subdomain) || isPublic){ 
    //   // check path  and use public user_id 
    //   let accessible_endpoint= {
    //     get: [ '/apps', '/databases', '/apps/editor/models/tables', '/apps/editor/models/table-map', '/apps/editor/models/table-map-old', '/apps/editor/models/tables/columns', '/apps/editor/controllers/nodes', '/apps/editor/z/ops', '/apps/editor/controllers/db', '/apps/editor/controllers/saved-query', '/apps/editor/controllers/queries' , '/apps/editor/controllers/custom-cols'],
    //     post: [ '/apps/editor/controllers/where-cols', '/apps/editor/controllers/sql-gen', '/apps/editor/controllers/query-exec', '/apps/editor/controllers/sql-execute', '/apps/editor/controllers/saved-query', '/apps/editor/controllers/custom-cols',]
    //   }; 
    //   if((req.method == 'GET' && accessible_endpoint.get.includes (req.path)) ||    
    //      (req.method == 'POST' && accessible_endpoint.post.includes (req.path))) {
    //     req.session.user = { user_id: process.env.PUBLIC_USER_ID }; 
    //   }   
   
    // }
   
    // console.log(req.session);
    // if(!req.session.user) req.session.user = {"uid":1,"email":"1119231@gmail.com","name":"kabir narain","hash":"$2a$10$ILjyBnZyCX757m2hxBhi7en0q3OVsYtqB.iF5i/Kyb2rnQmSwom2.","created_at":null};
    res.serverRedirect = function(url) {
      res.send('<html><body></body><script type="text/javascript">window.location.href="' + url + '";</script></html>');
    };
    req.DB = DB;
    req.ErrorHandler = ErrorHandler;
    var whitelist = ['/','/register', '/login', '/login/sandbox', '/login/session', '/logout', '/apps/editor/controllers/component/routes','/account/forgot-pass', '/account/forgot-pass-verify' , '/account/forgot-pass-reset' ,'/register/verify' , '/account/remove', '/github/auth-callback'];
    // console.log('------------------Start--------------');
    // console.log(req.session);
    // console.log(req.session.user);
 
    // if(req.path.startsWith("/public/")) return next(); //  for public routes  
    
    /* for shared dashboard access  */
    // if(req.body.public_dashboard_id || req.query.public_dashboard_id){
    //   let accessible_endpoint= {
    //     get: [ '/apps/editor/controllers/dashboards', '/apps/editor/controllers/saved-query', ],
    //     post: [ '/apps/editor/controllers/query-exec', ]
    //   }; 
    //   if((req.method == 'GET' && accessible_endpoint.get.includes (req.path)) ||    
    //      (req.method == 'POST' && accessible_endpoint.post.includes (req.path))) {
    //     req.clientModels = ModelManager.models;
    //     return next(); 
    //   }    

    // } 

        /* embedded queries     */
    // if (req.query.embedded_query_id || req.body.embedded_query_id) {
    //   let accessible_endpoint = {
    //     get: ['/apps/editor/controllers/queries',],
    //     post: ['/apps/editor/controllers/sql-gen', '/external/sql-execute-embed-insert', '/external/sql-execute-embed-select']
    //   };

    //   if ((req.method == 'GET' && accessible_endpoint.get.includes(req.path)) ||
    //     (req.method == 'POST' && accessible_endpoint.post.includes(req.path))) {
    //     req.clientModels = ModelManager.models;
    //     return next();
    //   }
    //   else {
    //     return res.zend(null, 403, "Login Required");

    //   }
    // } 
    /* api queries     */
  //   if (req.query.apiRoute) {
  //   let accessible_endpoint = {
  //     get: [ '/external/sql-execute-embed-select'] ,
  //     post: [  '/external/sql-execute-embed-insert'],
  //     put: ['/external/sql-execute-embed-update']
  //   };

  //   if ((req.method == 'GET' && accessible_endpoint.get.includes(req.path)) ||
  //     (req.method == 'POST' && accessible_endpoint.post.includes(req.path)) ||
  //     (req.method == 'PUT' && accessible_endpoint.put.includes(req.path)) 
  //     ) {
  //     req.clientModels = ModelManager.models;
  //     return next();
  //   }
  //   else {
  //     return res.zend(null, 403, "Login Required");

  //   }
  // } 
 
        /*editable table  auth_token   */
    // if (req.session?.user?.shared?.user_id )  {
    //   let subdomain = req.body.subdomain ||  req.query.subdomain ; 
    //   let accessible_endpoint = {
    //     get: [ ],
    //     post: [ ]
    //   };
 
    // if( subdomain){

    //   if (( req.session.user.shared.accessibleSubdomains.includes(subdomain) )) {
    //     req.clientModels = ModelManager.models;
    //     req.user_id = req.session.user.shared.user_id ; 
    //     return next();
    //   }
    //   else {
    //     return res.zend(null, 403, "Login Required");

    //   }
    // }
    // } 

    // if(subdomain == 'sandbox' && !req.session.user)  {
    //   var path = req.originalUrl;
    //   if(path.indexOf('app.querydeck') > -1 || path.indexOf('api.querydeck.io') > -1 || path.indexOf('dev.querydeck') > -1) {

    //     // prod:
    //     req.session.user = {
    //       user_id: 'bd934447-5723-475a-aec6-c2cee0e201e5',
    //       email: 'sandbox@gmail.com',
    //       email_verified: true,
    //       created_at: 1725457482,
    //       api_project: true,
    //       sandbox: true
    //     }

    //   } else if(path.indexOf('app.querycharts') > -1 || path.indexOf('dev-api.querycharts.com') > -1 || path.indexOf('dev-api.querydeck') > -1) {

    //     // dev:
    //     req.session.user = {
    //       user_id: 'a19cdd39-b8c6-4079-be70-bc85db4520cf',
    //       email: 'sandbox@gmail.com',
    //       email_verified: true,
    //       created_at: 1725457482,
    //       api_project: true,
    //       sandbox: true
    //     }

    //   }
      
    // }

    // if(req.path.indexOf('/app-routes/') > -1)
    var path = req.path;
    // console.log(req.session.user, whitelist, path)
    if(path.charAt(path.length - 1) == '/' && path.length > 1) path = path.slice(0, -1); 
    if((!req.session.user || !req.session.user.user_id || req.session.user.user_id == '') && whitelist.indexOf(path) == -1 && req.path.indexOf('/app-routes/') == -1) return res.zend(null, 403, "Login Required");
    req.models = ModelManager.pgtmodels.models;
    if(req.session.user) {
      req.clientModels = ModelManager.models;
      req.user_id = req.session.user.user_id;
    }
    
    // if(req.session.client && req.models[req.session.client.subdomain]) req.clientModels = req.models[req.session.client.subdomain];
    next();
  };
};
