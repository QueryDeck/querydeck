'use strict';
var catchError = require('../middlewares/catchError');
var github_keys = require.main.require('./envconfig.js').vars.github;

var request = require('request');

module.exports = function(router) {

    router.get('/generate-oauth-url', catchError(async function(req, res) {

        if(!req.query.subdomain || !req.clientModels[req.query.subdomain] || req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) {
            return res.zend(null, 400, "Bad Request");
        }

        var redir;

        var state = req.user_id + '.' + req.query.subdomain

        var path = req.originalUrl;

        if(path.indexOf('app.querydeck') > -1 || path.indexOf('api.querydeck.io') > -1 || path.indexOf('dev-api.querydeck.io') > -1) {
            redir = 'https://api.querydeck.io/github/auth-callback';
        } else {
            redir = 'http://localhost:3000/github/auth-callback'
        }

        res.zend({url: `https://github.com/login/oauth/authorize?client_id=${github_keys.client_id}&state=${state}&redirect_uri=${redir}`});

    }));

    router.get('/auth-callback', catchError(async function(req, res) {

        const requestToken = req.query.code
        var state = req.query.state

        var state_split = state.split('.');
        var user_id = state_split[0];
        var subdomain = state_split[1];

        if(!requestToken){
            return res.zend(null, 400, "Bad Request");
        }

        request({
            url:  `https://github.com/login/oauth/access_token?client_id=${github_keys.client_id}&client_secret=${github_keys.client_secret}&code=${requestToken}`,
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            }
        }, function(error, response, body) {
            if (error) {
                console.log(error);
                return res.zend(error, 500, "Internal Server Error");
            }

            var token_split = body.split('&')
            var token_ob = {}
            for(var i=0; i<token_split.length; i++){
                var current_split = token_split[i].split('=')
                token_ob[current_split[0]] = current_split[1]
            }

            token_ob.unix = Date.now()

            request({
                url:  `https://api.github.com/user`,
                method: 'GET',
                headers: {
                    'accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token_ob.access_token}`,
                    'user-agent': 'node.js'
                }
            }, function(error, response, body) {
                if (error) {
                    console.log(error);
                    return res.zend(error, 500, "Internal Server Error");
                }

                body = JSON.parse(body)

                var where;
                var installation = false;

                if(user_id){

                    where = {
                        user_id: user_id
                    }

                } else {

                    installation = true
                    where = {
                        "$raw": " (github_ob -> 'profile' ->> 'id' = '" + body.id + "') "
                    }

                }

                new req.DB({}).execute([
                    new req.models.public.users().update({
                        github_ob: {
                            profile: body,
                            token: token_ob,
                            installation: installation
                        }
                    }).where(where)
                    ], function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.zend(err, 500, "Internal Server Error");
                    }
                    res.redirect('https://app.querydeck.io/apps/' + subdomain + '/deploy?git_success=true')
                    // return res.zend('User linked to github');
                });
                
            });

        });

    }));


};