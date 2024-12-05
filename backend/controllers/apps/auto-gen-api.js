'use strict';
var catchError = require.main.require('./middlewares/catchError');
var api_gen = require.main.require('./lib/apihelper.js');

module.exports = function(router) {

    router.post('/', catchError(async function(req, res) {

        if(!req.body.subdomain){
            return res.zend(null, 400, "Bad Request");
        }

        if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

        api_gen.autoGenAndSave({
            subdomain: req.body.subdomain,
            allowed_tables: req.body.allowed_tables || [],
            allowed_methods: req.body.allowed_methods || ['GET', 'POST', 'PUT']
        }, function(err,data){
            if (err) {
                console.log(err);
                return res.zend(err, 500, "Internal Server Error");
            }
        
            res.zend(data);
        })

    }));

};