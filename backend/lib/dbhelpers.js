'use strict';
var DB = require.main.require('./models/index.js').db;

var models = require.main.require('./models/modelManager').pgtmodels;

function authApp(params, callback) {

  if(!params.user_id || params.user_id == '' || !params.subdomain || params.subdomain == '') return callback({error: '400. params missing'});
  new DB({}).execute([

    new models.apps().select({app_id: true})
      .aggAlias('appauth')
      .join({
        model: new models.subdomain_gen().select({name: 'subdomain'}),
        on: {
          app_id: {$ident: 'public.apps.app_id'}
        }
      })
      .where({
        uid: {
          $inq: new models.subdomain_gen().select({app_id: true}).where({
            subdomain: params.subdomain
          })
        },
        created_by: params.user_id
      })

  ], function(err, result){
    if(err) return callback(err);
    if(result.appauth && result.appauth[0]) {
      return callback(null, true);
    } else {
      // is someone screwing with the API?
      return callback(null, false);
    }
  });

}