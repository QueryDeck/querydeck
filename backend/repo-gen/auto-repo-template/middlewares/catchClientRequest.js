'use strict';
var db = require.main.require('./lib/database.js');

var requestHandler = require.main.require('./models/requestHandler').handleRequest;

var Routes = require.main.require('./lib/api-index.js')
var Models = require.main.require('./lib/models.js');
const appDetails = require.main.require('./lib/app.js');

Models.query = db.query;

var routes = Object.keys(Routes);

var loaded_routes = {};

for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    // console.log('route', route)
    var route_methods = Object.keys(Routes[route]);
    for (let j = 0; j < route_methods.length; j++) {
        const route_id = Routes[route][route_methods[j]];

        if (!route_id) {
            continue;
        } else {
            loaded_routes[route] = loaded_routes[route] || {};
            loaded_routes[route][route_methods[j]] = require.main.require(`./lib/api/${route_id}.js`)
        }
    }
}

/**
 * @commment  Add user models to ModelManager.models if  subdomain is available
 */
module.exports = function() {
    return function(req, res, next) {

        requestHandler({
            request_path: req.path,
            request_method: req.method,
            request_body: req.body,
            request_params: req.query,
            request_headers: req.headers,
            request_cookies: parseCookies(req),
            currentModel: {
                appDetails: appDetails,
                routes: loaded_routes,
                databases: {
                    db_id: Models
                }
            }
        }, function(err, exec_data) {
            if (err) {
                let res_status = err.response_code;
                res.status(res_status).send({
                    response_code: res_status,
                    error: err?.error?.message || err?.error?.error || err?.error || err
                });

            } else {
                res.send(exec_data);
            }
        })

    };
};

function parseCookies(request) {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [name, ...rest] = cookie.split(`=`);
        name = name?.trim().toLowerCase();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}