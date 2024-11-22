'use strict';
var db = require.main.require('./lib/database.js');
var jwt = require('jsonwebtoken');

var executeClientRequest = require.main.require('./models/executeClientRequest').executeClientRequest;

var Routes = require.main.require('./lib/api-index.js')
var Models = require.main.require('./lib/models.js');
const appDetails = require.main.require('./lib/app.js');

/**
 * @commment  Add user models to ModelManager.models if  subdomain is available
 */
module.exports = function () {
  return function (req, res, next) {

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

      var route_id;

      if(!Routes[clean_path] || !Routes[clean_path][req.method]) {
        // check for url param
        var partial_url = clean_path_spl.slice(0, clean_path_spl.length - 1).join('/')
        partial_url = partial_url +  '/:';
        var all_paths = Object.keys(Routes)
        for (let i = 0; i < all_paths.length; i++) {
          const element = all_paths[i];
          if(element.indexOf(partial_url) > -1 && Routes[element] && Routes[element][req.method]) {
            query_model = JSON.parse(
              JSON.stringify(
                Routes[element][req.method])
            );
            query_model = JSON.parse(JSON.stringify(Routes[element][req.method]));
            route_id = Routes[element][req.method]
            url_param_value = clean_path_spl[clean_path_spl.length - 1];
            break;
          }
        }

      } else {
        route_id = Routes[clean_path][req.method]
        query_model = JSON.parse(JSON.stringify(Routes[clean_path][req.method]));
      }

      if(!route_id) {
        return res.status(404).send({error: "Invalid route"})
      }

      query_model = JSON.parse(
        JSON.stringify(
          require.main.require(`./lib/api/${route_id}.js`)
        )
      )
      
      var session = {}

      if (query_model.auth_required === true) {
        if(!process.env.QD_JWT_SECRET) return res.status(500).send({ error: "Auth not setup correctly" });

        var authorization = req.get(appDetails.auth.token_header);

        if(!authorization) {
          // check cookies
          var cookies = parseCookies(req);
          if(cookies[appDetails.auth.token_header]) authorization = cookies[appDetails.auth.token_header]
        }

        if (!authorization) {
          return res.status(403).send({ error: "Login required" })
        }

        try {
          session = jwt.verify(
            authorization,
            process.env.QD_JWT_SECRET,
            {
              ignoreExpiration: true,
              algorithm: appDetails.auth.jwt_type
            });

        } catch (err) {
          console.error(err)
          return res.status(500).send({ error: "Auth failed" });
        }

      }
      var res_status = 200;

      executeClientRequest({
        query_model: query_model,
        auth: appDetails.auth,
        request: {
          body: req.body || {},
          query: req.query || {},
          session: session,
          url_param_value: url_param_value
        },
        currentModel: Models,
        db: db.query
      }, function(err, data) {
        if(err) {
          res_status = err.response_code;
          console.log(err)
          res.status((res_status ? res_status : 500)).send({error: 'Database error'})
        } else {
          res.send(data)
        }
      })
    
  };
};

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