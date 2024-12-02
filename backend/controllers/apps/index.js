'use strict';
var ModelManager = require.main.require('./models/modelManager');
var envar = require.main.require('./envconfig.js').vars;
const { MYSQL, POSTGRES } = require('../../envconfig.js').constant;
var catchError = require('../../middlewares/catchError');
var utils = require('../../extras/utils.js');
var ModelManager = require.main.require('./models/modelManager');
var cipher = require.main.require('./lib/cipher2.js');

module.exports = function (router) {

  // ############ Create new  app for current User ###########  
  router.post('/', catchError(async function (req, res) {

    if (req.body.manual_introspection) {

      if (!req.body.manual_introspection_rows || !Array.isArray(req.body.manual_introspection_rows) || !req.body.manual_introspection_rows[0]) {
        return res.zend(null, 400, "Introspection array is not in the correct format!");
      }

      req.body.dbname = 'NA';
      req.body.dbhost = 'NA';
      req.body.dbusername = 'NA';
      req.body.dbport = 5432;

    }

    if (req.body.use_demo_db) {
      req.body.name = 'Demo Database';
      req.body.db_type = POSTGRES;
      req.body.dbname = process.env.DB_NAME;
      req.body.dbhost = process.env.DB_HOST;
      req.body.dbusername = process.env.DB_USERNAME;
      req.body.dbpassword = process.env.DB_PASSWORD;
      req.body.dbport = process.env.DB_PORT;
      req.body.auto_gen = true;
    }
    //  console.log( req.body )
    if (
      !req.body.name || req.body.name == '' ||
      !req.body.dbname || req.body.dbname == '' ||
      !req.body.dbhost || req.body.dbhost == '' ||
      !req.body.dbusername || req.body.dbusername == '' ||
      // !req.body.dbpassword || req.body.dbpassword == '' ||
      !req.body.dbport || req.body.dbport == ''
    ) return res.zend(null, 400, "Missing fields");

    req.body.dbpassword = req.body.dbpassword || '';
    if (!req.body.dbalias) req.body.dbalias = req.body.dbname;


    if (req.body.db_type === MYSQL) return res.zend(null, 400, "MySql not supported");
    ModelManager.testConnect(req.body, function (err, r) {
      // console.log(" ------->till here");
      if (err) return res.zend(null, 400, err?.message || err);
      // return res.zend(r.rows)

      //  encrpyt db password before inserting 
      // let encrpyted_pass = cipher.encrypt(req.body.dbpassword); 
      let db_type_name = req.body.db_type == MYSQL ? MYSQL : POSTGRES;
      let api_app = true;

      var app_insert = new req.models.public.apps().insert({
        name: req.body.name,
        created_by: req.user_id,
        api_app: api_app
      }).returning({ app_id: true })

      var db_insert = new req.models.public.databases().insert({
        app_id: app_insert,
        name: req.body.manual_introspection ? req.body.dbname : cipher.encrypt(req.body.dbname),
        host: req.body.manual_introspection ? req.body.dbname : cipher.encrypt(req.body.dbhost),
        username: req.body.manual_introspection ? req.body.dbname : cipher.encrypt(req.body.dbusername),
        password: req.body.manual_introspection ? req.body.dbname : cipher.encrypt(req.body.dbpassword),
        port_num: req.body.dbport,
        db_type: new req.models.public.db_types().select({ db_type_id: true }).where({ name: db_type_name }),
        alias_name: req.body.dbalias,
        auto_gen: req.body.auto_gen || false
      }).returning({ db_id: true })

      var subdomain_update = new req.models.public.subdomain_gen().update({
        app_id: app_insert
      }).where({
        name: {
          $inq: new req.models.public.subdomain_gen().select({ name: true }).limit(1).order({ random: true })
        }
      });

      var q = [
        subdomain_update
      ]

      if (req.body.manual_introspection) {

        q.push(
          new req.models.public.schema_defs().insert({
            db_id: db_insert,
            def: JSON.stringify(req.body.manual_introspection_rows)
          })
        )

      } else {

        q.push(db_insert)

      }

      new req.DB({}).execute(q, function (err, result) {

        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err.message);
        // return res.zend(result)

        var subdomain = result.newrows.subdomain_gen[0].name;
        var app_id = result.newrows.apps[0].app_id;
        var db_id = result.newrows.databases[0].db_id;

        ModelManager.loadApp(subdomain, function (err) {
          if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message || err);
          res.zend({
            subdomain: subdomain,
            app_id: app_id,
            // db_id: db_id
            created_at : result.newrows.databases[0].created_at,
            name : result.newrows.apps[0].name
    
          });
        })

      });
    });

  }));

  // ############ Update app  ###########  
  router.put('/', catchError(async function (req, res) {

    return res.zend(null, 400, "need to update");
    // console.log(req.body);
    // req.body.app_id = typeof req.body.app_id === 'string' ? req.body.app_id.trim() : undefined;
    // if (!req.body.app_id) return res.zend(null, 400, "must have field 'app_id'");
    // if (
    //   !req.body.name || req.body.name == '' ||
    //     !req.body.dbname || req.body.dbname == '' ||
    //     !req.body.dbhost || req.body.dbhost == '' ||
    //     !req.body.dbusername || req.body.dbusername == '' ||
    //     // !req.body.dbpassword || req.body.dbpassword == '' ||
    //     !req.body.dbport || req.body.dbport == ''
    // ) return res.zend(null, 400);

    // console.log(req.body);
    // req.body.dbpassword = req.body.dbpassword || '';
    // // TODO : handle password
    // // TODO : handle db_type
    // ModelManager.testConnect(req.body, function (err, r) {
    //   console.log(" ------->till here");
    //   if (err) return res.zend(null, 400);
    //   // return res.zend(r.rows)

    //   //  encrpyt db password before inserting 
    //   let encrpyted_pass = cipher.encrypt(req.body.dbpassword);
    //   /* TODO : handle    databases username,password  using  db_id */
    //   new req.DB({}).executeRaw({
    //     text: `  
    //       WITH app_in AS (
    //         UPDATE   apps 
    //         SET   name = $1
    //         WHERE 
    //           (
    //             created_by =  $2
    //             AND app_id = $8 -- app_id
    //           ) RETURNING *
    //       ), 
    //       db_in AS (
    //         UPDATE  databases 
    //         SET 
    //           name = $3, 
    //           host = $4, 
    //           username = $5, 
    //           password = $6, 
    //           port_num = $7 
    //         WHERE 
    //           app_id = (
    //             SELECT  app_id   from     app_in
    //           ) RETURNING  app_id, db_id
    //       ) 
    //       select 
    //         db_in.app_id, 
    //         db_in.db_id, 
    //         subdomain_gen.name as subdomain 
    //       from    db_in 
    //         join subdomain_gen on db_in.app_id = subdomain_gen.app_id
    //  ;     `,

    //     values: [req.body.name, req.user_id, req.body.dbname, req.body.dbhost, req.body.dbusername, encrpyted_pass, req.body.dbport, req.body.app_id ]
    //   }, function (err, result) {

    //     if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
    //     var rows = result.rows;
    //     console.log("rows");
    //     console.log(rows);
    //     var db_url = "postgres://" + req.body.dbusername + ":" + req.body.dbpassword + "@" + req.body.dbhost + ":" + req.body.dbport + "/" + req.body.dbname;
    //     console.log("db_url");
    //     console.log(db_url);

    //     if(!rows || rows.length == 0 || !rows[0].app_id) 
    //       return res.zend(null, 400, "Invalid  fields values");

    //     ModelManager.refreshAppDetails({
    //       name: req.body.name,
    //       username: req.body.dbusername,
    //       password: req.body.dbpassword,
    //       host: req.body.dbhost,
    //       port_num: req.body.dbport,
    //       db_name: req.body.dbname,
    //       created_by: req.user_id,
    //       subdomain: rows[0].subdomain,
    //       db_id: rows[0].db_id,
    //       dburl: db_url,
    //       database: {
    //         dburl: db_url,
    //         username: req.body.dbusername,
    //         password: req.body.dbpassword,
    //         host: req.body.dbhost,
    //         port_num: req.body.dbport,
    //         db_name: req.body.dbname
    //       }
    //     });

    //     // TODO ; add test connect
    //     ModelManager.refreshModels({ live: false, subdomain: rows[0].subdomain }, function (err) {

    //       if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);
    //       delete rows[0].db_id;
    //       res.zend(rows[0], 200, "Successfully Updated");
    //     });

    //   });
    // });

  }));

  // ############ Delete app  ###########  
  router.delete('/', catchError(async function (req, res) {

    console.log(req.body);
    req.body.app_id = typeof req.body.app_id === 'string' ? req.body.app_id.trim() : undefined;
    if (!req.body.app_id) return res.zend(null, 400, "must have field 'app_id'");

    /*
    select app_id from apps
    select db_id from databases 
    
    delete   apps
      - update subdomain_gen
      - delete dashboards
      - delete rawtabs
      - delete auth_details
        - delete roles
      - delete  databases   
        - delete query_run_history
        - delete schema_defs
        - delete api_queries
          - delete api_query_metrics
        - delete queries
          - delete enum_options
          - delete query_metrics
      - delete git_deployment
      - delete  
 
 
 
    
    */
    new req.DB({}).executeRaw({
      text: `
      WITH  apps_sel AS (
          SELECT app_id 
          FROM  apps 
          WHERE  created_by =  $1
          AND app_id = $2  
      ) , 
      databases_sel AS (
          SELECT db_id 
          FROM  databases 
          WHERE app_id= ( SELECT app_id FROM apps_sel  ) 
      ) , 
      queries_sel AS (
        SELECT query_id 
        FROM  queries 
        WHERE db_id in  ( SELECT db_id FROM databases_sel  ) 
      ) , 
      api_queries_sel AS (
        SELECT query_id 
        FROM  api_queries
        WHERE  app_id in  ( SELECT app_id FROM apps_sel  ) 
          OR db_id in ( SELECT db_id FROM databases_sel  ) 
      ) ,
      auth_details_sel AS (
        SELECT auth_detail_id   FROM auth_details  
        WHERE    app_id = ( SELECT app_id FROM apps_sel  )
      ),
     -- delete queries and references
      enum_options_del AS ( 
        DELETE   FROM enum_options
        WHERE query_id  in  ( SELECT query_id FROM queries_sel  ) 
      ), 
      query_metrics_del AS ( 
        DELETE   FROM query_metrics
        WHERE query_id  in  ( SELECT query_id FROM queries_sel  ) 
      ), 
      queries_del AS ( 
         DELETE   FROM queries
         WHERE query_id  in  ( SELECT query_id FROM queries_sel  ) 
       ), 

       -- delete api_queries and references
       api_query_metrics_del AS ( 
        DELETE   FROM api_query_metrics
        WHERE query_id  in  ( SELECT query_id FROM api_queries_sel  ) 
      ), 
      api_queries_del AS ( 
        DELETE   FROM api_queries
        WHERE query_id  in  ( SELECT query_id FROM api_queries_sel  ) 
      ), 
      

      -- delete databases and references
      query_run_history_del AS ( 
        DELETE   FROM query_run_history
        WHERE db_id  in ( SELECT db_id FROM databases_sel  ) 
      ), 
      schema_defs_del AS ( 
        DELETE   FROM schema_defs
        WHERE db_id  in ( SELECT db_id FROM databases_sel  ) 
      ), 
      databases_del AS (
          DELETE   FROM databases  
          WHERE    db_id in ( SELECT db_id FROM databases_sel  )  
        ), 
  
      -- delete apps and references
      roles_del AS (
        DELETE   FROM roles  
        WHERE    auth_detail_id = ( SELECT  auth_detail_id FROM auth_details_sel  )
      ), 
      auth_details_del AS (
        DELETE   FROM auth_details  
        WHERE    auth_detail_id = ( SELECT auth_detail_id FROM auth_details_sel  )
      ), 
      git_deployment_del AS (
        DELETE   FROM git_deployment  
        WHERE    app_id = ( SELECT app_id FROM apps_sel  )
      ), 
      custom_domains_del AS (
        DELETE   FROM custom_domains  
        WHERE    app_id = ( SELECT app_id FROM apps_sel  )
      ), 
      rawtabs_del AS (
        DELETE   FROM rawtabs  
        WHERE    app_id = ( SELECT app_id FROM apps_sel  )
      ), 
      dashboards_del AS (
           DELETE   FROM dashboards  
           WHERE    app_id = ( SELECT app_id FROM apps_sel  )
         ), 
   
      subdomain_gen_up AS (
          UPDATE subdomain_gen 
          SET 
            app_id = NULL, 
            auto = true 
          WHERE  app_id = ( SELECT app_id FROM apps_sel  )
          RETURNING 
            ( SELECT app_id FROM apps_sel  )  ,
             name AS "subdomain"
         ),  
      apps_del AS( 
        DELETE   FROM apps  
        WHERE   app_id = ( SELECT app_id FROM apps_sel  )
        RETURNING app_id   
      )
    SELECT
      * 
    FROM apps_del
    INNER JOIN subdomain_gen_up 
     ON subdomain_gen_up.app_id =  apps_del.app_id
       ; `,

      values: [req.user_id, req.body.app_id]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message || err);

      var rows = result.rows;
      // console.log("rows")
      // console.log(rows)

      if (!rows || rows.length == 0)
        return res.zend(null, 400, "Invalid  value for 'app_id'");

      ModelManager.deleteApp({
        subdomain: result.rows[0].subdomain,
      })


      if (req.body.detail) return res.zend(rows[0], 200, "Successfully Deleted");
      res.zend({}, 200, "Successfully Deleted");

    });

    //TODO : Remove model(subdomain ) detail from memory 
  }));

  // ############ List all apps of current User ###########  
  router.get('/', catchError(async function (req, res) {
    // console.log('user_uid_text',req.user_id)
    // console.log(req.models)
    // console.log(" ------->apps index here GET")

    // new req.DB({}).execute([
    // new req.models.public.apps().select({app_id: true, name: true}).aggAlias('apps')
    // .join({
    //   model: new req.models.public.subdomain_gen().select({name: 'subdomain'}),
    //   on: {
    //     app_id: {$ident: 'public.apps.app_id'}
    //   }
    // })
    // .where({
    //   // created_by: {$null: false}
    //   created_by: {
    //     $inq: new req.models.public.users().select({user_id: true}).where({
    //       user_id: req.user_id
    //     })
    //   }
    // })
    // console.log( 'reqr.db',req)
    // --  db_type_id,
    new req.DB({}).executeRaw({
      text: `  
      SELECT 
      apps.app_id, 
      apps.name, 
      apps.created_at, 
      subdomain_gen.name AS "subdomain" 
      
      FROM   apps 
        INNER JOIN subdomain_gen 
        ON  (subdomain_gen.app_id = apps.app_id )
      
      WHERE 
        (
          apps.created_by =  (
            SELECT   users.user_id 
            FROM     users 
            WHERE   ( 
               users.user_id = $1  
               )
          )
        ) 

      ;   `,

      values: [req.user_id]
    }, function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message);

      res.zend(result.rows);
    });
  }));

  // ############ Get app full details  ###########  
  router.get('/details', catchError(async function (req, res) {
    res.zend(null, 403, 'blocked');
    console.log(req.body);
    req.query.app_id = typeof req.query.app_id === 'string' ? req.query.app_id.trim() : undefined;
    if (!req.query.app_id) return res.zend(null, 400, "must have field 'app_id'");

    // databases.db_id, 
    new req.DB({}).executeRaw({
      text: `  
        SELECT 
            apps.name, 
            subdomain_gen.name AS subdomain ,
            databases.name AS dbname, 
            databases.host AS dbhost, 
            databases.username AS dbusername,  
            databases.password AS dbpassword, 
            databases.db_id,
            databases.port_num AS dbport,
            databases.alias_name  AS dbalias,
            db_types.db_type_id,
            db_types.name as db_type
        FROM   apps
           INNER JOIN databases ON   databases.app_id = apps.app_id 
           INNER JOIN subdomain_gen ON   subdomain_gen.app_id = apps.app_id 
           INNER JOIN db_types ON   db_types.db_type_id =databases.db_type 
        WHERE
          apps.created_by = $1
          AND  apps.app_id = $2
        LIMIT 1 
      ;     `,

      values: [req.user_id, req.query.app_id]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500);

      var rows = result.rows;
      console.log("rows");
      console.log(rows);

      if (!rows || rows.length == 0)
        return res.zend(null, 400, "Invalid  value for 'app_id'");

      rows[0].dbusername = cipher.decrypt(rows[0].dbusername);
      rows[0].dbpassword = cipher.decrypt(rows[0].dbpassword);
      rows[0].dbhost = cipher.decrypt(rows[0].dbhost);
      rows[0].dbname = cipher.decrypt(rows[0].dbname);
      // delete rows[0].db_id
      res.zend(rows[0], 200);

    });

  }));


  /* ####### Get subdomain's app details  */
  router.get('/subdoman-app', catchError(async function (req, res) {
    if (!req.query.subdomain) return res.zend(null, 400, "Must have field 'subdomain'");
    new req.DB({}).executeRaw({
      text: `
            SELECT
              apps.name as app_name
            FROM  subdomain_gen
               INNER JOIN apps ON  apps.app_id  =  subdomain_gen.app_id
            WHERE
            subdomain_gen.name =  $2
              AND apps.created_by = $1
              `,
      values: [req.user_id, req.query.subdomain]

    }, function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, err?.message || '');
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid value of 'subdomain'");

      return res.zend(result.rows[0], 200);
    });

  }));


  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });
};
