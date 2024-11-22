'use strict';
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var catchError = require('../middlewares/catchError');

module.exports = function(router){
 

  router.post('/', catchError(async   function(req, res){
      req.session.destroy();  
        res.zend(null, 200, "Logout Successfully");
      }));

    router.all('/*',(req, res) => {  
      res.zend( { method: req.method} ,404, "Not Found", );
    });
};
