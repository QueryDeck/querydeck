'use strict';
var DB = require.main.require('./models/index.js').db;
var ErrorHandler = require.main.require('./lib/errors.js');
var ModelManager = require.main.require('./models/modelManager');
 
var jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
  return function (req, res, next) {

    res.serverRedirect = function(url) {
      res.send('<html><body></body><script type="text/javascript">window.location.href="' + url + '";</script></html>');
    };
    req.DB = DB;
    req.ErrorHandler = ErrorHandler;
    var whitelist = ['/','/register', '/login', '/login/sandbox', '/login/session', '/logout', '/apps/editor/controllers/component/routes','/account/forgot-pass', '/account/forgot-pass-verify' , '/account/forgot-pass-reset' ,'/register/verify' , '/account/remove', '/github/auth-callback'];
    
    var path = req.path;
    // console.log(req.session.user, whitelist, path)
    if(path.charAt(path.length - 1) == '/' && path.length > 1) path = path.slice(0, -1); 
    if((!req.session.user || !req.session.user.user_id || req.session.user.user_id == '') && whitelist.indexOf(path) == -1 && req.path.indexOf('/app-routes/') == -1) return res.zend(null, 403, "Login Required");
    req.models = ModelManager.pgtmodels.models;
    if(req.session.user) {
      req.clientModels = ModelManager.models;
      req.user_id = req.session.user.user_id;
    }
    
    next();
  };
};
