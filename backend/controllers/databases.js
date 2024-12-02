'use strict';
var ModelManager = require.main.require('./models/modelManager');
var cipher = require.main.require('./lib/cipher2.js');
var catchError = require('../middlewares/catchError');

module.exports = function (router) {


  router.get('/', catchError(async function (req, res) {


    if (!req.query.subdomain || req.query.subdomain == '') return res.zend(null, 400, "must have value 'subdomain'");


    new req.DB({}).executeRaw({

      text: `
  SELECT
 
       json_build_object(
              'app_id',
              apps.app_id  ,
              'app_name',
              apps.name   
          ) as "app",
      json_agg(
          json_build_object(
              'dbalias',
              databases.alias_name,
              'dbname',
              databases.name,
              'db_id',
              databases.db_id,
              'db_type',
              db_types.name,
              'created_at',
              databases.created_at
          )
      ) as "databases"
  FROM
      databases
      INNER JOIN db_types ON db_types.db_type_id = databases.db_type
      INNER JOIN apps ON apps.app_id = databases.app_id
  WHERE
      databases.app_id IN (
          SELECT
              apps.app_id
          FROM
              apps
          WHERE
              (
                  apps.app_id IN (
                      SELECT
                          subdomain_gen.app_id
                      FROM
                          public.subdomain_gen
                      WHERE
                          subdomain_gen.name = $1
                          AND public.apps.created_by = $2
                  )
              )
      )
  GROUP BY
      apps.app_id
     ; `,


      values: [req.query.subdomain, req.user_id,]
    }, function (err, result) {

      // console.log( result)
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, err?.message || "Invalid  value for 'subdomain'");

      let row = result.rows[0];
      for (let i = 0; i < row.databases.length; i++) {
        row.databases[i].dbname = cipher.decrypt(row.databases[i].dbname);
        if (!row.databases[i].dbalias) row.databases[i].dbalias = row.databases[i].dbname;
      }
      row.app.subdomain = req.query.subdomain
      res.zend(row, 200,)




    });
    //  res.redirect('/apps/editor/controllers/db?subdomain='+ req.query.subdomain )


    //   )
  }));


  router.post('/resync-schema', catchError(async function (req, res) {
    if (
      !req.body.subdomain || req.body.subdomain == '' ||
      !req.body.db_id || req.body.db_id == ''
    ) return res.zend(null, 400, "Missing fields");
    if (!req.clientModels[req.body.subdomain] || !req.clientModels[req.body.subdomain].databases[req.body.db_id]) return res.zend(null, 400, 'Invalid value of subdomain or db_id');
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    ModelManager.loadApp(req.body.subdomain, function (err) {

      if (err) {
        // Sentry.setExtra('data', JSON.stringify({
        //     subdomain: subdomain,
        // }))
        // Sentry.captureError(err)
        // callSuccess()
        // return;
        console.log(err)
        return res.zend(null, 500);
      }

      return res.zend({});

      // console.log('finish: ' ,subdomain)   
    }, { reSyncSchema: true })

  }));


  router.get('/details', catchError(async function (req, res) {
    // res.zend(null , 403, 'blocked');
    // console.log(req.body);
    req.query.subdomain = typeof req.query.subdomain === 'string' ? req.query.subdomain.trim() : undefined;
    if (!req.query.subdomain) return res.zend(null, 400, "must have field 'subdomain'   ");

    // databases.db_id, 
    new req.DB({}).executeRaw({
      text: `  
        SELECT 
        databases.auto_gen,
            apps.name as app_name, 
            apps.app_id as app_id, 
            subdomain_gen.name AS subdomain ,
            databases.name AS dbname, 
            databases.host AS dbhost, 
            databases.username AS dbusername,  
            databases.db_id,
            databases.port_num AS dbport,
            databases.alias_name  AS dbalias,
            schema_defs.last_sync_success_time as last_sync ,
            db_types.name as db_type
        FROM   apps
           INNER JOIN databases ON   databases.app_id = apps.app_id 
           INNER JOIN schema_defs ON   schema_defs.db_id = databases.db_id 
           INNER JOIN subdomain_gen ON   subdomain_gen.app_id = apps.app_id 
           INNER JOIN db_types ON   db_types.db_type_id =databases.db_type 
        WHERE
          apps.created_by = $1
          AND subdomain_gen.name = $2
          AND databases.auto_gen is false 
        LIMIT 1 
      ;     `,

      values: [req.user_id, req.query.subdomain]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);

      var rows = result.rows;

      if (rows && rows.length > 0) {
        rows[0].dbusername = cipher.decrypt(rows[0].dbusername);
        // rows[0].dbpassword = cipher.decrypt(rows[0].dbpassword); 
        rows[0].dbhost = cipher.decrypt(rows[0].dbhost);
        rows[0].dbname = cipher.decrypt(rows[0].dbname); 

        rows[0] =  {
          app: {
            app_id: rows[0].app_id ,
            app_name: rows[0].app_name ,
            subdomain: rows[0].subdomain ,
          },
          database: {
            dbname: rows[0].dbname,
            dbhost: rows[0].dbhost,
            dbusername: rows[0].dbusername,
            db_id: rows[0].db_id,
            dbport: rows[0].dbport ,
            dbalias: rows[0].dbalias,
            db_type: rows[0].db_type,
            last_sync: rows[0].last_sync,
 
       
          }
        }
      }

 

      res.zend(rows[0] || null, 200);

    });

  }));


  router.all('/*', (req, res) => {

    res.zend({ method: req.method }, 404, "Not Found",);
  });
};
