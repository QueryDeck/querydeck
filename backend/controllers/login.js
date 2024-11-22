'use strict';
var bcrypt = require('bcryptjs');
var catchError = require('../middlewares/catchError');
var utils = require('../extras/utils');
var ModelManager = require.main.require('./models/modelManager');

module.exports = function(router){

  router.post('/',catchError(async  function(req, res){
    if(!req.body.email || !req.body.password) return res.zend(null, 400, "Missing fields");
    new req.DB({}).executeRaw({
      text: "select * from users where email = $1",
      values: [req.body.email]
    }, function(err, result){
      if(!req.ErrorHandler({err: err, line: 0, file: __filename})) return res.zend(null, 500);
      var rows = result.rows;
      if(!rows || !rows[0] || !rows[0].email) return res.zend(null, 404, "not found");
      bcrypt.compare(req.body.password, rows[0].passhash, function(err, auth){
        if(!req.ErrorHandler({err: err, line: 0, file: __filename})) return res.zend(null, 500);
        if(!auth) return  res.zend(null, 404, 'not found' );
        delete rows[0].passhash;
        delete rows[0].github_ob;
        req.session.user = rows[0]; 
        if(req.body.remember == true){ 
          // increase token time 
     
        }
        
        res.zend({
    
          details: {     user_id : result.rows[0].user_id, 
          email : rows[0].email, 
          },
          preferences:rows[0].preference || {}
        });
      });
    })
    
  }));

  router.all('/*',(req, res) => {  
    res.zend( { method: req.method} ,404, "Not Found", );
  });
 
};
