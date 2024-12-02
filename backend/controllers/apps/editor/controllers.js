'use strict';
var modelutils = require.main.require('./models/utils');
var Sentry = require('../../../sentry');

var sqlFormatter = require('sql-formatter');
const { v4: uuidv4 } = require('uuid');

var mhelper = require('../../../models/modelhelpers.js');
var catchError = require('../../../middlewares/catchError');

var ModelManager = require.main.require('./models/modelManager');

// var dbhelper = require.main.require('./lib/dbhelpers.js');
var jwt = require('jsonwebtoken');

var v2sql = require.main.require('./models/view2sql.js');
var bcrypt = require('bcryptjs');
// var crypto = require('crypto');
// const { urlencoded, query } = require('express');
var envconfig = require('../../../envconfig'); envconfig
// var Sentry = require('../../../sentry');
var types = require.main.require('./models/utils.js').pg_types;
var mysql_types = require.main.require('./models/utils.js').mysql_types;
var qutils = require('../../../models/utils.js');
var utils = require('../../../extras/utils.js');
var constant = require('../../../extras/constant.js');
var { compare } = require('../../../extras/utils.js');

const { defaultsDeep, isArray } = require('lodash');
const { query } = require('express');
var refreshModeladder = require('../../../middlewares/refreshModeladder.js')();
const { MYSQL} = require('../../../envconfig.js').constant;
var repoManager = require.main.require('./repo-gen/index.js');

var cipher = require.main.require('./lib/cipher2.js');

// var tab_sample = [
//   {id: 'req', title: 'Request', content: ''},
//   {id: 'res', title: 'Response'},
//   {id: 'sql', title: 'SQL Query'},
//   {id: 'where', title: 'Where'}
// ]

module.exports = function (router) {

  /* ####### Get database id of saved query  */
  router.get('/saved-query-db', catchError(async function (req, res) {


    if (!req.query.query_id) return res.zend(null, 400, "Must have field 'query_id'");
    let tableName = req.query.apiMode == 'true' ? 'api_queries' : 'queries';
    new req.DB({}).executeRaw({
      text: `
        SELECT
          databases.db_id,
          databases.alias_name AS dbalias,
          databases.name AS db_name
        FROM
          ${tableName}
          INNER JOIN databases ON databases.db_id = ${tableName}.db_id
          INNER JOIN apps ON apps.app_id = databases.app_id
        WHERE
          ${tableName}.query_id =  $2
          AND apps.created_by = $1
          `,
      values: [req.user_id, req.query.query_id]

    }, function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid value of   'query_id' ");

      result.rows[0].db_name = cipher.decrypt(result.rows[0].db_name);
      return res.zend(result.rows[0], 200);
    });

  }));




  /*  ############   API QUERY ################ */
  /* #########  Saved API Query full detail #########  */
  router.get('/api-queries', catchError(async function (req, res) {

    let queryObj;
    if (!req.query.subdomain || !req.query.db_id || req.query.db_id == '' || !req.query.query_id || req.query.query_id == '' || !req.clientModels[req.query.subdomain]) return res.zend(null, 400, "Must have 'subdomin' , 'db_id', 'query_id' ");

      queryObj = {
        text: ` 
    SELECT  
      COALESCE(public.api_queries.query_view_data->'original_state'->'data' , '{}') AS data,
      public.api_queries.docs
      FROM 
      public.api_queries 
    WHERE 
      (
        public.api_queries.db_id :: text IN (
          SELECT 
            public.databases.db_id 
          FROM 
            public.databases 
          WHERE 
            (
              public.databases.app_id :: text IN (
                SELECT 
                  public.apps.app_id 
                FROM 
                  public.apps 
                WHERE 
                  (
                    public.apps.app_id :: text IN (
                      SELECT 
                        public.subdomain_gen.app_id 
                      FROM 
                        public.subdomain_gen 
                      WHERE 
                        (public.subdomain_gen.name =  $1)
                    )
                  ) 
                  AND (public.apps.created_by = $2)
              )
            ) 
            AND (public.databases.db_id =  $3)
        )
        AND   public.api_queries.query_id =  $4
      )   
      
      `,

        values: [req.query.subdomain, req.user_id, req.query.db_id, req.query.query_id]
      }


    new req.DB({}).executeRaw(
      queryObj
      , function (err, result) {
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
        if (!result.rows || !result.rows.length) return res.zend(null, 400, "Invalid values");

        res.zend(result.rows[0]);

      });
  }));

  /*  ############   API QUERY ################ */
  /* #########  Saved API Query full detail #########  */
  router.get('/api-queries-old', catchError(async function (req, res) {

    let queryObj;
    if (req.query.embedded_query_id) {
      queryObj = {
        text: `
    SELECT
      public.api_queries.name,
      public.api_queries.query_json,
      public.api_queries.query_view_data,
      public.api_queries.result_data,
      public.api_queries.public_link,
      public.api_queries.query_text,
      public.databases.db_id,
      public.subdomain_gen.name as subdomain,
      public.apps.created_by  
    FROM
      public.api_queries
      INNER JOIN databases ON databases.db_id = api_queries.db_id
      INNER JOIN subdomain_gen ON subdomain_gen.app_id = databases.app_id
      INNER JOIN apps ON  apps.app_id  =  subdomain_gen.app_id
    WHERE
      public.api_queries.query_id =  $1
      AND public.api_queries.public_link = true
    LIMIT
      1`,
        values: [req.query.embedded_query_id]
      };
    }
    else {
      if (!req.query.subdomain || !req.query.db_id || req.query.db_id == '' || !req.query.query_id || req.query.query_id == '' || !req.clientModels[req.query.subdomain]) return res.zend(null, 400, "Must have 'subdomin' , 'db_id', 'query_id' ");

      queryObj = {
        text: ` 
    SELECT  
      public.api_queries.raw_query ,
      -- public.api_queries.name ,
      public.api_queries.query_json,  
      public.api_queries.query_view_data,
      COALESCE(public.api_queries.query_view_data->'original_state'->'data' , '{}') AS data,
      --- public.api_queries.result_data, 
      --- public.api_queries.public_link,
      -- public.api_queries.deployed ,
      -- public.api_queries.query_text
      public.api_queries.auth_required 
      FROM 
      public.api_queries 
    WHERE 
      (
        public.api_queries.db_id :: text IN (
          SELECT 
            public.databases.db_id 
          FROM 
            public.databases 
          WHERE 
            (
              public.databases.app_id :: text IN (
                SELECT 
                  public.apps.app_id 
                FROM 
                  public.apps 
                WHERE 
                  (
                    public.apps.app_id :: text IN (
                      SELECT 
                        public.subdomain_gen.app_id 
                      FROM 
                        public.subdomain_gen 
                      WHERE 
                        (public.subdomain_gen.name =  $1)
                    )
                  ) 
                  AND (public.apps.created_by = $2)
              )
            ) 
            AND (public.databases.db_id =  $3)
        )
        AND   public.api_queries.query_id =  $4
      )   
      
      `,

        values: [req.query.subdomain, req.user_id, req.query.db_id, req.query.query_id]
      }

    }


    new req.DB({}).executeRaw(
      queryObj
      , function (err, result) {
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
        if (!result.rows || !result.rows.length) return res.zend(null, 400, "Invalid values");

        if (req.query.embedded_query_id) {
          // add query_id's owner  field 'created_by' and  load model
          req.query.subdomain = result.rows[0].subdomain;
          req.query.db_id = result.rows[0].db_id;
          req.query.query_id = req.query.embedded_query_id;
          let previous_created_by = req.user_id;
          req.user_id = result.rows[0].created_by   // replace user_id with query_id's owner 'created_by' value 

          refreshModeladder(req, res, () => {

            req.user_id = previous_created_by   // update user_id  with previous user_id  values  
            delete result.rows[0].created_by
            delete result.rows[0].subdomain  // delete this from response
            delete result.rows[0].db_id         // delete this from response
            if (!req.clientModels[req.query.subdomain] || !req.clientModels[req.query.subdomain].databases[req.query.db_id]) return res.zend(null, 400, "Model not exist for given db_id");
            updateJoinsAndSendResponse(req, res, result);

          })
        }
        else {
          updateJoinsAndSendResponse(req, res, result);

        }

      });

    function updateJoinsAndSendResponse(req, res, result) {

      try {

        result.rows = result.rows || [];
        if (result.rows.length && result.rows[0].raw_query !== true)
          for (let i = 0; i < result.rows.length; i++) {
            const element = result.rows[i];
            element.query_view_data.join_type = element.query_view_data.join_type || {};
            var joins = [];
            for (let k = 0; k < element.query_view_data.column_ids.length; k++) {
              const col = element.query_view_data.column_ids[k];
              if (col.id.indexOf('-') > -1) {
                var id_path = col.id.split('$')[0];
                var table_id_spl = id_path.split('-');
                var table_id = table_id_spl[table_id_spl.length - 1].split('.')[0];

                let currentModel = req.clientModels[req.query.subdomain].databases[req.query.db_id];
                if (!currentModel) return res.zend("Invalid value for 'db_id'", 400);

                var name = currentModel.tidToName[table_id];
                let col_id = col.id.split('$')[0];
                if (!joins.find(item => item.id === col_id)) {
                  joins.push({
                    id: col_id,
                    name: (name[0] == 'public' ? name[1] : name.join('.')),
                    type: element.query_view_data.join_type[col_id] ? element.query_view_data.join_type[col_id].toUpperCase() : "INNER"
                  });
                }
              }
            }
            element.query_view_data.joins = joins;
          }
        if (result.rows[0]?.query_view_data?.original_state) { delete result.rows[0].query_view_data.original_state };
        delete result.rows[0].query_view_data ;
        delete result.rows[0].query_json ;
        delete result.rows[0].query_text ;
        delete result.rows[0].public_link ;
        delete result.rows[0].deployed ;
        delete result.rows[0].raw_query ;
        delete result.rows[0].auth_required ;
   

        
        

        res.zend(result.rows[0]);
      }
      catch (err) {
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      }

    }
  }));


  /* ####### List all  Api query of a given database_id #######  */
  router.get('/saved-api-query', catchError(async function (req, res) {

    let query_obj;


    if (!req.query.subdomain) return res.zend(null, 400, "Must have field 'subdomain'");
    if (req.query.db_id && req.query.db_id !== '') {
      // saved query list from  given 'db_id' only
      query_obj = {
        text: ` 
            SELECT  
            public.api_queries.name ,
            public.api_queries.raw_query ,
            coalesce ( public.api_queries.query_json->>'table' , '' )  as table, 
            coalesce ( public.api_queries.query_json->>'schema' , '' )  as schema,
            public.api_queries.query_view_data->'method'  as method,   
            public.api_queries.route as "apiRoute",   
            public.api_queries.created_at, 
            public.api_queries.public_link ,
            public.api_queries.query_id,
            public.api_queries.deployed,
            public.api_queries.auth_required,
            public.api_queries.docs,
            public.databases.name as db_name
          FROM 
            public.api_queries 
            inner join public.databases on public.databases.db_id = public.api_queries.db_id
          WHERE 
            (
              public.api_queries.db_id :: text IN (
                SELECT 
                  public.databases.db_id 
                FROM 
                  public.databases 
                WHERE 
                  (
                    public.databases.app_id :: text IN (
                      SELECT 
                        public.apps.app_id 
                      FROM 
                        public.apps 
                      WHERE 
                        (
                          public.apps.app_id :: text IN (
                            SELECT 
                              public.subdomain_gen.app_id 
                            FROM 
                              public.subdomain_gen 
                            WHERE 
                              (public.subdomain_gen.name =  $1)
                          )
                        ) 
                        AND (public.apps.created_by = $2)
                    )
                  ) 
                  AND (public.databases.db_id =  $3)
              )
             
              AND query_id  not in  ( select query_id from enum_options )
            ) 
            ORDER BY public.api_queries.created_at DESC   
            `,
        values: [req.query.subdomain, req.user_id, req.query.db_id]
      };

    }
    else {
      //all  saved query  of a given subdomain 
      query_obj = {
        text: ` 
 
        with apps_sel AS (
         SELECT
            databases.db_id,
           json_build_object (
              'app_id',  apps.app_id,
              'app_name',  apps.name,
              'subdomain',  subdomain_gen.name
            ) AS app , 
           json_build_object (
              'dbname',    databases.name,
              'db_id',  databases.db_id,
              'dbalias',  databases.alias_name
            ) AS database
          FROM public.apps
            INNER JOIN subdomain_gen ON public.subdomain_gen.app_id = public.apps.app_id
            INNER JOIN databases ON public.databases.app_id = public.apps.app_id
          WHERE public.subdomain_gen.name = $1
            AND public.apps.created_by = $2
          LIMIT 1 
         ),
        api_queries_sel as (  
          SELECT  
          public.api_queries.name ,
          coalesce ( public.api_queries.query_json->>'table' , '' )  as table, 
          coalesce ( public.api_queries.query_json->>'schema' , '' )  as schema, 
          public.api_queries.query_view_data->'method'  as method,    
          public.api_queries.route as "apiRoute",   
          public.api_queries.created_at,
          public.api_queries.query_id,
          public.api_queries.deployed,
          public.api_queries.auth_required,
          public.api_queries.docs
        FROM 
          public.api_queries 
        WHERE 
          (
            public.api_queries.db_id   in   (SELECT db_id from apps_sel  )
            AND query_id  not in  ( select query_id from enum_options )
          )   
          ORDER BY public.api_queries.created_at DESC   
        )
        
        SELECT 
            (SELECT app from apps_sel  ),
            (SELECT database from apps_sel  ),
            COALESCE((SELECT json_agg(api_queries_sel.*) from api_queries_sel ) , '[]') as queries
  
          `,
        values: [req.query.subdomain, req.user_id]
      };

    }

    new req.DB({}).executeRaw(query_obj, function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows) return res.zend(null, 400, "Invalid value of 'subdomain' or 'db_id' ");

        result.rows[0].database.dbname = cipher.decrypt(result.rows[0].database.dbname);
    
      res.zend(   result.rows[0]);

    });
  }));


  /* ####### Save  Api query   #######  */
  router.post('/saved-api-query', catchError(async function (req, res) {

    req.body.deployed = true;
    if (!req.body.name || req.body.name == '' || !req.body.subdomain || req.body.subdomain == '' || !req.clientModels[req.body.subdomain] || !req.body.db_id || req.body.db_id == '') return res.zend(null, 400, "Must have value of 'name', 'subdomain','db_id'");
    let query_view_data;
    let final_object;


    if (req.body.base == undefined) return res.zend(null, 400, "Must have value of 'base' tableId");
    if (!req.body.c) return res.zend(null, 400, "Missing fields");
    if (!isArray(req.body.c)) return res.zend(null, 400, "'c' must be an array ");
    // var q_method = 'select', api_method = 'GET';


    if (!isArray(req.body.c)) return res.zend(null, 400, "'c' must be an array ");

    if (!isArray(req.body.c)) return res.zend(null, 400, "'c' must be an array ");
    if (req.body.method !== 'select' && !req.body.c.length) return res.zend(null, 400, "'c' must have atleast one element");

    var api_route_spl = req.body.apiRoute.split('/')

    var clean_route_spl = []

    for (let i = 0; i < api_route_spl.length; i++) {
      const element = api_route_spl[i];
      if (element == '') continue;
      clean_route_spl.push(element)
    }

    var clean_route = '/' + clean_route_spl.join('/')

    req.body.agg_paths = req.body.agg_paths || [];

    var apiMethod;

    final_object = v2sql.convert(req.body);

    let currentModel = ModelManager.models[req.body.subdomain].databases[req.body.db_id];

    var table_alias;


    if (req.body.method == 'insert') {
      apiMethod = 'POST'

      table_alias = currentModel.tidToName[req.body.base][1];
    }
    else if (req.body.method == 'update') {
      apiMethod = 'PUT'

      table_alias = final_object.model.table;
    }
    else if (req.body.method == 'select') {
      apiMethod = 'GET'

      table_alias = final_object.model.table;
    }
    else if (req.body.method == 'delete') {
      apiMethod = 'DELETE'

      table_alias = final_object.model.table;
    }
    else {
      return res.zend(null, 400, "Invalid method");
    }

    final_object.model.method = req.body.method;
    final_object.model = JSON.stringify(final_object.model)  // for insert  'model' is array 

    query_view_data = {
      column_ids: req.body.c,
      return_column_ids: req.body.return_c,
      column_names: final_object.all_col_names,
      where_conditions: req.body.w,
      condition_count: condition_count(req.body.w),
      body_key_props: final_object.body_key_props,
      attributes: req.body.attributes,
      chartTypes: req.body.chartTypes,
      join_type: req.body.join_type,
      shareMode: req.body.shareMode,
      base: req.body.base,
      apiRoute: req.body.apiRoute || "",
      pagination: req.body.pagination,
      method: req.body.method,
      single_base_insert: req.body.single_base_insert,
      table_alias: table_alias,
      allowedPaths: req.body.allowedPaths,
      allow_multiple_row_paths: req.body.allow_multiple_row_paths,
      on_conflict: req.body.on_conflict,
      conflictColumns: req.body.conflictColumns,
      join_conditions: req.body.join_conditions,
      filterList: req.body.filterList,
      editable: req.body.editable,
      original_state: req.body,
    };



    var db_id_select = new req.models.public.databases().select({ db_id: true }).where({
      app_id: {
        $inq: new req.models.public.apps().select({ app_id: true }).where({
          app_id: {
            $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
              name: req.body.subdomain
            })
          },
          created_by: req.user_id
        })
      },
      db_id: req.body.db_id
    });

    new req.DB({}).execute([
      new req.models.public.api_queries().insert({
        db_id: db_id_select,
        query_json: final_object.model,
        query_text: final_object.query,
        docs: final_object.docs,
        query_view_data: query_view_data,
        name: req.body.name,
        public_link: req.body.public_link || false,
        auth_required: req.body.auth_required || false,
        raw_query: req.body.raw_query || false,
        deployed: req.body.deployed || false,
        app_id: new req.models.public.subdomain_gen().select({ app_id: true }).where({
          name: req.body.subdomain
        }),
        method: apiMethod,
        route: clean_route
      })
    ], function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) {
        if (err.code == '23505') return res.zend(null, 400, 'API already exists!');
        return res.zend(null, 500, '');
      }

      var new_r_ob = {
        query_id: result.newrows['api_queries'][0].query_id,
        db_id: result.newrows['api_queries'][0].db_id,
        route: result.newrows['api_queries'][0].route,
        method: result.newrows['api_queries'][0].method,
        query_json: result.newrows['api_queries'][0].query_json,
        sqlmethod: result.newrows['api_queries'][0].query_view_data.method,
        querypaths: result.newrows['api_queries'][0].query_text.querypaths,
        pagination: result.newrows['api_queries'][0].query_view_data.pagination,
        auth_required: result.newrows['api_queries'][0].auth_required,
        subdomain: req.body.subdomain,
        body_key_props: result.newrows['api_queries'][0].query_view_data.body_key_props,
        single_base_insert: result.newrows['api_queries'][0].query_view_data.single_base_insert,
        base: result.newrows['api_queries'][0].query_view_data.base
      }

      ModelManager.updateRoute(new_r_ob)
      repoManager.overwriteRepo({ subdomain: req.body.subdomain }).then(() => {
        console.log('repo overwritten')
      }).catch((err) => {
        console.log('repo overwrite failed', err)
      })

      if (req.body.detail) return res.zend({ query_id: result.newrows['api_queries'][0].query_id, detail: result.newrows['api_queries'][0] });
      const result_row = result.newrows['api_queries'][0]; 
      res.zend({
         query_id: result_row.query_id ,
         name: result_row.name ,
         table: result_row.query_json.table ,
         schema: result_row.query_json.schema ,
         method: result_row.query_view_data.method ,
         apiRoute: result_row.route ,
         created_at: result_row.created_at ,
         deployed: result_row.deployed ,
         auth_required: result_row.auth_required ,
        
        });

    });

  }));

  /* ######### Update Saved api  Query #########  */
  router.put('/saved-api-query', catchError(async function (req, res) {

    req.body.deployed = true;
    if (!req.body.query_id || req.body.query_id == '') return res.zend(null, 400, "Must have 'query_id'");
    if (!req.body.name || req.body.name == '' || !req.body.subdomain || req.body.subdomain == '' || !req.clientModels[req.body.subdomain] || !req.body.db_id || req.body.db_id == '') return res.zend(null, 400, "Missing fields");
    let query_view_data;
    let final_object;

    // var q_method = 'select', api_method = 'GET';
    if (req.body.base == undefined) return res.zend(null, 400, "Must have value of 'base' tableId");
    if (!isArray(req.body.c)) return res.zend(null, 400, "'c' must be an array ");
    if (req.body.method !== 'select' && !req.body.c.length) return res.zend(null, 400, "'c' must have atleast one element");


    req.body.agg_paths = req.body.agg_paths || [];

    final_object = v2sql.convert(req.body);

    let currentModel = ModelManager.models[req.body.subdomain].databases[req.body.db_id];
    let table_alias;

    if (req.body.method == 'insert') {
      table_alias = currentModel.tidToName[req.body.base][1];


    } else {
      table_alias = final_object.model.table;

    }
    final_object.model.method = req.body.method;
    final_object.model = JSON.stringify(final_object.model)  // for insert  'model' is array 
    query_view_data = {
      column_ids: req.body.c,
      return_column_ids: req.body.return_c,
      column_names: final_object.all_col_names,
      where_conditions: req.body.w,
      condition_count: condition_count(req.body.w),
      attributes: req.body.attributes,
      body_key_props: final_object.body_key_props,
      chartTypes: req.body.chartTypes,
      join_type: req.body.join_type,
      shareMode: req.body.shareMode,
      base: req.body.base,
      single_base_insert: req.body.single_base_insert,
      apiRoute: req.body.apiRoute || "",
      pagination: req.body.pagination,
      method: req.body.method,
      table_alias: table_alias,
      allowedPaths: req.body.allowedPaths,
      allow_multiple_row_paths: req.body.allow_multiple_row_paths,
      on_conflict: req.body.on_conflict,
      conflictColumns: req.body.conflictColumns,
      join_conditions: req.body.join_conditions,
      filterList: req.body.filterList,
      editable: req.body.editable,
      original_state: req.body,

    };

    // TODO:  handle  missing req.models.public()
    var db_id_select = new req.models.public.databases().select({ db_id: true }).where({
      app_id: {
        $inq: new req.models.public.apps().select({ app_id: true }).where({
          app_id: {
            $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
              name: req.body.subdomain
            })
          },
          created_by: req.user_id
        })
      },
      db_id: req.body.db_id
    });

    new req.DB({}).execute([
      new req.models.public.api_queries().update({
        // db_id: db_id_select,
        query_json: final_object.model,
        query_text: final_object.query,
        docs: final_object.docs,
        query_view_data: query_view_data,
        name: req.body.name,
        public_link: req.body.public_link || false,
        auth_required: req.body.auth_required || false,
        raw_query: req.body.raw_query || false,
        deployed: req.body.deployed || false,

      }).where({
        query_id: req.body.query_id,
        db_id: {
          $inq: db_id_select
        },
      })
    ], function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');

      if (result.newrows['api_queries'] && result.newrows['api_queries'][0]) {

        var new_r_ob = {
          query_id: result.newrows['api_queries'][0].query_id,
          db_id: result.newrows['api_queries'][0].db_id,
          route: result.newrows['api_queries'][0].route,
          method: result.newrows['api_queries'][0].method,
          query_json: result.newrows['api_queries'][0].query_json,
          sqlmethod: result.newrows['api_queries'][0].query_view_data.method,
          querypaths: result.newrows['api_queries'][0].query_text.querypaths,
          pagination: result.newrows['api_queries'][0].query_view_data.pagination,
          auth_required: result.newrows['api_queries'][0].auth_required,
          subdomain: req.body.subdomain,
          body_key_props: result.newrows['api_queries'][0].query_view_data.body_key_props,
          single_base_insert: result.newrows['api_queries'][0].query_view_data.single_base_insert,
          base: result.newrows['api_queries'][0].query_view_data.base
        }

        ModelManager.updateRoute(new_r_ob)
        repoManager.overwriteRepo({ subdomain: req.body.subdomain }).then(() => {
          console.log('repo overwritten')
        }).catch((err) => {
          console.log('repo overwrite failed', err)
        })

        if (req.body.detail) return res.zend({ query_id: result.newrows['api_queries'][0].query_id, detail: result.newrows['api_queries'][0] });
        const result_row = result.newrows['api_queries'][0]; 
        res.zend({
           query_id: result_row.query_id ,
           name: result_row.name ,
           table: result_row.query_json.table ,
           schema: result_row.query_json.schema ,
           method: result_row.query_view_data.method ,
           apiRoute: result_row.route ,
           created_at: result_row.created_at ,
           deployed: result_row.deployed ,
           auth_required: result_row.auth_required ,
        
          });
 
 
        }
    });

  }));

  /* ######### Delete  Saved Api  Query #########  */
  router.delete('/saved-api-query', catchError(async function (req, res) {


    req.body.query_id = typeof req.body.query_id === 'string' ? req.body.query_id.trim() : undefined;
    req.body.subdomain = typeof req.body.subdomain === 'string' ? req.body.subdomain.trim() : undefined;
    // req.body.db_id = typeof req.body.db_id === 'string' ? req.body.db_id.trim() : undefined;

    if (!req.body.query_id || !req.body.subdomain) return res.zend(null, 400, "Must have field 'subdomain' and 'query_id'");

    // var db_id_select = new req.models.public.databases().select({db_id: true}).where({
    //   app_id: {
    //     $inq: new req.models.public.apps().select({app_id: true}).where({
    //       app_id: {
    //         $inq: new req.models.public.subdomain_gen().select({app_id: true}).where({
    //           name: req.body.subdomain
    //         })
    //       },
    //       created_by: req.user_id
    //     })
    //   },
    //   db_id: req.body.db_id
    // });

    // new req.DB({}).execute([
    //   new req.models.public.queries().delete({} ).where({
    //     query_id: req.body.query_id,
    //     db_id: {
    //       $inq: db_id_select
    //     }, 
    //   })
    // ], function(err, result){

    /* 
    - delete row from queries  table 
    - delete query_id from dashboard table column 'query_json_arr'
    */
    // TODO: delete rows of query_metrics 
    new req.DB({}).executeRaw({
      // dashboards.name,
      // dashboards.db_id,
      // db_types.name as db_type,
      // dashboards.created_at
      text: `
      WITH sel_api_queries AS ( 
        SELECT
          api_queries.query_id,  
          api_queries.method,  
          api_queries.route,  
          subdomain_gen.name as "subdomain"
        FROM
          public.api_queries
          INNER JOIN databases ON databases.db_id = api_queries.db_id
          INNER JOIN subdomain_gen ON subdomain_gen.app_id = databases.app_id
          INNER JOIN apps ON  apps.app_id  =  subdomain_gen.app_id
        WHERE
          public.subdomain_gen.name = $2
          AND apps.created_by =    $3
          AND public.api_queries.query_id = $1
        ),
        
        del_api_query_metrics AS ( 
          DELETE FROM 
            api_query_metrics
          WHERE api_query_metrics.query_id = ( SELECT  query_id FROM  sel_api_queries )
        ),
        
        del_api_queries AS (
          DELETE FROM 
            public.api_queries 
          WHERE 
            public.api_queries.query_id =( SELECT  query_id FROM  sel_api_queries)
          RETURNING query_id
        ), 

        del_dashboard_api_queries AS (
          UPDATE 
            public.dashboards 
          SET 
            query_json_arr[1] = (
              json_build_object(
                'layout', 
                jsonb_build_object (
                  'lg', 
                  ARRAY (
                    SELECT * 
                    FROM 
                      jsonb_array_elements(
                        query_json_arr[1] -> 'layout' -> 'lg'
                      ) AS arr_tab 
                    WHERE 
                      arr_tab ->> 'query_id' != (
                        SELECT   query_id 
                        FROM  del_api_queries
                      )
                  ), 
                  'md', 
                  ARRAY (
                    SELECT * 
                    FROM 
                      jsonb_array_elements(
                        query_json_arr[1] -> 'layout' -> 'md'
                      ) AS arr_tab 
                    WHERE 
                      arr_tab ->> 'query_id' != (
                        SELECT   query_id 
                        FROM  del_api_queries
                      )
                  ), 
                  'sm', 
                  ARRAY (
                    SELECT * 
                    FROM 
                      jsonb_array_elements(
                        query_json_arr[1] -> 'layout' -> 'sm'
                      ) AS arr_tab 
                    WHERE 
                      arr_tab ->> 'query_id' != (
                        SELECT   query_id 
                        FROM  del_api_queries
                      )
                  ), 
                  'xs', 
                  ARRAY (
                    SELECT * 
                    FROM 
                      jsonb_array_elements(
                        query_json_arr[1] -> 'layout' -> 'xs'
                      ) AS arr_tab 
                    WHERE 
                      arr_tab ->> 'query_id' != (
                        SELECT   query_id 
                        FROM  del_api_queries
                      )
                  ), 
                  'xxs', 
                  ARRAY (
                    SELECT * 
                    FROM 
                      jsonb_array_elements(
                        query_json_arr[1] -> 'layout' -> 'xxs'
                      ) AS arr_tab 
                    WHERE 
                      arr_tab ->> 'query_id' != (
                        SELECT   query_id 
                        FROM  del_api_queries
                      )
                  )
                ), 
                'viewTypes', 
                (query_json_arr[1] -> 'viewTypes') - (
                  SELECT 
                    query_id 
                  FROM 
                    del_api_queries
                )
              )
            ) 
          WHERE 
            EXISTS (
              SELECT 
                * 
              FROM 
                del_api_queries
            ) 
            AND EXISTS (
              SELECT 
                * 
              FROM 
                jsonb_array_elements(
                  query_json_arr[1] -> 'layout' -> 'lg'
                ) AS arr_tab 
              WHERE 
                arr_tab ->> 'query_id' = (
                  SELECT 
                    query_id 
                  FROM 
                    del_api_queries
                )
            ) RETURNING *
        ) 
        SELECT   * 
        FROM   del_api_queries
        INNER JOIN  sel_api_queries  
         ON sel_api_queries.query_id = del_api_queries.query_id

         ; `,

      values: [req.body.query_id, req.body.subdomain, req.user_id]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid value of 'subdomain',   or 'query_id' ");

      ModelManager.deleteRoute({
        subdomain: result.rows[0].subdomain,
        method: result.rows[0].method,
        route: result.rows[0].route,
      })
      repoManager.overwriteRepo({ subdomain: result.rows[0].subdomain }).then(() => {
        console.log('repo overwritten')
      }).catch((err) => {
        console.log('repo overwrite failed', err)
      })
      return res.zend({ query_id: result.rows[0].query_id });
      // return res.zend(null, 400)

    });

  }));


  /* ####### List all  Api query metrics #######  */
  router.get('/api-query-metrics', catchError(async function (req, res) {

    let limit = Math.min((parseInt(req.query.limit) || 100), 1000)
    let offset = limit * ((parseInt(req.query.page_number) || 1) - 1)

    let query_obj = {
      text: ` 
      WITH apps_sel AS (
        SELECT databases.db_id,
          json_build_object (
            'app_id',  apps.app_id,
            'app_name',  apps.name,
            'subdomain', subdomain_gen.name
          ) AS app,
          json_build_object (
            'dbname', databases.name,
            'db_id', databases.db_id,
            'dbalias',  databases.alias_name
          ) AS database
        FROM public.apps
          INNER JOIN subdomain_gen ON public.subdomain_gen.app_id = public.apps.app_id
          INNER JOIN databases ON public.databases.app_id = public.apps.app_id
        WHERE public.subdomain_gen.name = $1
          AND public.apps.created_by = $2
        LIMIT 1
      ), 
      
      sel_api_query_metrics AS (
        SELECT json_build_object (
            'total_row_count',   count(*) OVER(),
            'ip_address',  api_query_metrics.ip_address,
            'query_metric_id',  api_query_metrics.query_metric_id,
            'db_error',   api_query_metrics.db_error,
            'response_code',  api_query_metrics.response_code,
            'exec_time',  api_query_metrics.exec_time,
            'created_at',    api_query_metrics.created_at,
            'query_id', api_queries.query_id,
            'method',  api_queries.method,
            'apiRotue',  api_queries.route
          ) as query_metrics
        FROM public.api_query_metrics
          inner join public.api_queries on public.api_queries.query_id = public.api_query_metrics.query_id
        WHERE public.api_queries.db_id = (
            SELECT db_id
            from apps_sel
          )
        ORDER BY public.api_query_metrics.created_at DESC OFFSET $3
        LIMIT $4
      )
       SELECT  
          (SELECT app from apps_sel  limit 1 ),
          (SELECT database from apps_sel   limit 1 ),
          COALESCE((SELECT json_agg(sel_api_query_metrics.query_metrics) from sel_api_query_metrics ) , '[]') as query_metrics
; 
          `,
      values: [req.query.subdomain, req.user_id, offset, limit]
    };

    new req.DB({}).executeRaw(query_obj, function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows) return res.zend(null, 400, "Invalid value of 'subdomain'  ");

      result.rows[0].database.dbname = cipher.decrypt(result.rows[0].database.dbname);
      result.rows[0].row_count =   result.rows.length && result.rows[0]?.query_metrics?.length ? result.rows[0].query_metrics[0].total_row_count : 0; 
      for (let i = 0; i < result.rows[0]?.query_metrics.length; i++) {
         delete result.rows[0].query_metrics[i].total_row_count
      }

      res.zend( result.rows[0]) ;

    });
  }));




  /* ##### Generate query and return Query Statement ####  */
  router.post('/sql-gen', catchError(async function (req, res) {

    console.log('/sql-gen')

    if (!req.body.subdomain || !req.body.db_id) return res.zend(null, 400, "Must have fields subdomain and db_id");
    if (!req.clientModels[req.body.subdomain] || !req.clientModels[req.body.subdomain].databases[req.body.db_id]) return res.zend(null, 400, "Invalid value for  subdomain and db_id");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    var q = v2sql.convert(req.body)

    if (!q) return res.zend(null, 500, "unable to generate");

    let currentModel = ModelManager.models[req.body.subdomain].databases[req.body.db_id];
    // console.file(q)


    // console.file(q)
    /*   
       add option to correctly format query text according to dbms 
       available language options   https://github.com/sql-formatter-org/sql-formatter/blob/HEAD/docs/language.md 
     */
    let options = {
      "language": currentModel.db_type == MYSQL ? "mysql" : "postgresql",
      // "tabWidth": 2,
      // "keywordCase": "upper",
      // "linesBetweenQueries": 2
    };
    q.query.text = sqlFormatter.format(q.query.text, options);
    if (process.env.PROJECT_ENV === 'dev') console.log(q.query.text)

    var tabs = [
      {
        id: 'req',
        title: 'Request',
        body: q.body || {},
        content: q.formatted_request_body || q.request || {},
        content_detailed: q.detailed_body || {},
        query_params: q.query.request_query_params || {}
      },
      {
        id: 'res',
        title: 'Response',
        content: q.response || {},
        content_detailed: q.response_detailed || {}
      },
      {
        id: 'sql',
        title: 'SQL Query',
        content: q.query.text
      },
      // {
      //   "id": "forms_linear",
      //   "title": "SQL Linear Forms",
      //   // "content": q.final_body || {},
      //   "content":   {},
      // },
      // {
      //   "id": "forms",
      //   "title": "SQL Forms",
      //   "content": q.final_body2 || {}

      // },

      // {
      //   "id": "enum queries",
      //   "title": "Enum Query",
      //   "content": []
      // },
      {
        "id": "view2json",
        "title": "View to Json",
        "content": q
      },


    ];

    res.zend(tabs);

  }));



  router.post('/where-cols', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain] || !req.body.c || req.body.c.length == 0) return res.zend(null, 400, "Must have field 'subdomain' and 'c'");
    if (!req.body.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    req.body.agg_paths = req.body.agg_paths || [];

    req.body.c = req.body.c || [];

    for (let i = 0; i < req.body.c.length; i++) {
      const element = req.body.c[i];
      if (element.id.indexOf('-') > -1) {
        var id_spl = element.id.split('-');
        element.id = id_spl.pop().split('$')[0]
      }
    }

    if (req.body.c.length != 1) return res.zend(null, 400, "Must have exactly one column");

    res.zend(mhelper.getAllWhereColumns(req.body));
    
  }));


  router.post('/load-all-where-cols', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain]) return res.zend(null, 400, "Must have field 'subdomain'");
    if (!req.body.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");


    let response = {
      base: {},
      joinConditions: {},
      // existsClause: {},
    }
    let input = {
      agg_paths: req.body.agg_paths || [],
      c: [],
      db_id: req.body.db_id,
      subdomain: req.body.subdomain,

    }

    if (req.body.base) {
      input.c = [{ id: req.body.base }]
      response.base = mhelper.getAllWhereColumns(input)
    }

    if (req.body.joinConditions && req.body.joinConditions.length) {
      for (let i = 0; i < req.body.joinConditions.length; i++) {
        input.c = [{ id: req.body.joinConditions[i] }]
        response.joinConditions[req.body.joinConditions[i]] = mhelper.getAllWhereColumns(input)
      }
    }


    // if (req.body.existsClause && req.body.existsClause.length) {
    //   for (let i = 0; i < req.body.existsClause.length; i++) {
    //     input.c = [{ id: req.body.existsClause[i] }]
    //     response.existsClause[req.body.existsClause[i]] = mhelper.getAllWhereColumns(input)
    //   }

    // }


    res.zend(response)

  }));
  /**
   * params:
   * id (
   *    40 : opening el (expandable), add referencedBy
   *    40.8 : normal el (expandable if refers, selectable), 
   *    40.1-30.2 : referencedBy el (expandable)
   *    40.8-20.1$1 : (expandable if refers, selectable)
   *  )
   */

  router.get('/nodes', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400, "Invalid Values");
    if (!req.query.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    let qm = 'select';
    if (req.query.qm == 'insert' || req.query.qm == 'update' || req.query.qm == 'delete') qm = req.query.qm;
    let id = req.query.id;
    let currentModel = req.clientModels[req.query.subdomain].databases[req.query.db_id];

    let Models = currentModel.models;
    if (!id) return res.zend(null, 400);
    let idSplit = id.split('$');
    // let idSplitLength = idSplit.length;
    let currentSchema;
    let path, pathSplit, pathSplitLength, lastel, secondLastEl, currentColumn, currentTable, nodes = [];
    path = idSplit[0];
    pathSplit = path.split('-');
    pathSplitLength = pathSplit.length;
    if (pathSplitLength > 6) return res.zend(null, 400); // TODO: increase length  
    if (idSplit.length == 1) {
      // opening or refby 
      if (pathSplitLength == 1) {
        // 40
        if (!currentModel.tidToName[pathSplit[0]]) return res.zend(null, 400, "Invalid Table Id");
        let node = { nodes: [] };
        currentSchema = currentModel.tidToName[pathSplit[0]][0];
        currentTable = currentModel.tidToName[pathSplit[0]][1];
        node.text = currentSchema + '.' + currentTable;
        let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
        for (let i = 0; i < columnKeys.length; i++) {
          let currentNode = {};
          let currentNodeId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
          currentNode.text = columnKeys[i];
          currentNode.id = path + '.' + currentNodeId;

          currentNode.required = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].not_null && Models[currentSchema][currentTable].properties.columns[columnKeys[i]].default === null;
          currentNode.foreign = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].foreign;
          currentNode.primary = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].primary;
          currentNode.unique = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].unique;
          currentNode.unique_cols = qutils.getUniqueColumnData(
            path,
            Models[currentSchema][currentTable].properties.uindex,
            Models[currentSchema][currentTable].properties
          )
          // currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
          currentNode.subType = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type;
          currentNode.optionType = qutils.getSuperType(Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type, currentModel.db_type);
          if (Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {
            currentNode.nodes = [];

            for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
              let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
              if (req.query.primary && Models[refbysplit[0]][refbysplit[1]].properties.primary.length == 0) continue;
              let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
              let join_path_list = mhelper.pathToText(currentNode.id + '-' + refbyid, req.query.subdomain, req.query.db_id);
              let currentSubJoinId = currentNode.id + '-' + refbyid;
              let nnode = {
                text: refbysplit[0] + '.' + refbysplit[1],
                id: currentSubJoinId,
                nodes: [],
                
                // showAgg: true,
                childNodes: mhelper.isHaveSubJoin(currentSubJoinId, req.query.subdomain, req.query.db_id),
                join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                onExpand: '/apps/editor/controllers/nodes?subdomain=' + req.query.subdomain + '&id=' + currentNode.id + '-' + refbyid + '&qm=' + qm + '&db_id=' + req.query.db_id,
              };
              let reldetails = mhelper.relDetails(currentNode.id + '-' + refbyid, req.query.subdomain, req.query.db_id);
              if (qm == 'select') {
                nnode.showAgg = true;
              } else if (qm == 'insert') {
                if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
              }
              currentNode.nodes.push(nnode);
            }
          }
          if (Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {
            currentNode.nodes = currentNode.nodes || [];
            let refsplit = Models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
            if (req.query.primary && Models[refsplit[0]][refsplit[1]].properties.primary.length == 0) continue;
            let refid = Models[refsplit[0]][refsplit[1]].properties.id + '.' + Models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
            let join_path_list = mhelper.pathToText(currentNode.id + '-' + refid, req.query.subdomain, req.query.db_id);
            let currentSubJoinId = currentNode.id + '-' + refid;
            let nnode = {
              text: refsplit[0] + '.' + refsplit[1],
              id: currentSubJoinId,
              nodes: [],
         
              // showAgg: true,
              childNodes: mhelper.isHaveSubJoin(currentSubJoinId, req.query.subdomain, req.query.db_id),
              join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
              join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
              onExpand: '/apps/editor/controllers/nodes?subdomain=' + req.query.subdomain + '&id=' + currentNode.id + '-' + refid + '&qm=' + qm + '&db_id=' + req.query.db_id,
            };
            let reldetails = mhelper.relDetails(currentNode.id + '-' + refid, req.query.subdomain, req.query.db_id);
            if (qm == 'select') {
              nnode.showAgg = true;
            } else if (qm == 'insert') {
              if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
            }
            currentNode.nodes.push(nnode);
          }
          node.nodes.push(currentNode);
        }
        return res.zend(node);
      } else {
        // 40.1-30.2
        // 40.1-30.2-30.2-4.3
        lastel = pathSplit[pathSplitLength - 1];
        secondLastEl = pathSplit[pathSplitLength - 2];
        if (!currentModel.idToName[lastel]) return res.zend(null, 400, "Invalid Table Id");
        currentSchema = currentModel.idToName[lastel][0];
        currentTable = currentModel.idToName[lastel][1];
        currentColumn = currentModel.idToName[lastel][2];
        let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
        for (let i = 0; i < columnKeys.length; i++) {
          // let element = columnKeys[i];
          let currentNode = {};
          let currentColumnId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
          let currentNodeId = Models[currentSchema][currentTable].properties.id + '.' + currentColumnId;
          currentNode.text = columnKeys[i];
          currentNode.id = path + '$' + currentColumnId;
          currentNode.required = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].not_null && Models[currentSchema][currentTable].properties.columns[columnKeys[i]].default === null;
          currentNode.primary = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].primary;
          currentNode.foreign = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].foreign;
          currentNode.unique = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].unique;
          // currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
          currentNode.subType = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type;
          currentNode.optionType = qutils.getSuperType(Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type, currentModel.db_type);
          currentNode.unique_cols = qutils.getUniqueColumnData(
            path,
            Models[currentSchema][currentTable].properties.uindex,
            Models[currentSchema][currentTable].properties
          )
          if (Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {

            for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
              let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
              if (req.query.primary && Models[refbysplit[0]][refbysplit[1]].properties.primary.length == 0) continue;
              let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
              if (currentNodeId == lastel && refbyid == secondLastEl && !modelutils.haveMany(lastel + '-' + secondLastEl)) {
                continue;
              }
              var secondLastEl_table = secondLastEl.split('.')[0]
              var refbyid_table = refbyid.split('.')[0]
              if (refbyid_table == secondLastEl_table) {
                continue;
              }
              let fid = path + '-' + currentNodeId + '-' + refbyid;
              let join_path_list = mhelper.pathToText(currentNodeId + '-' + refbyid, req.query.subdomain, req.query.db_id);
              currentNode.nodes = currentNode.nodes || [];

              if (pathSplitLength < 6) { // TODO : increase node length 
                let nnode = {
                  text: refbysplit[0] + '.' + refbysplit[1],
                  id: fid,
                  nodes: [],
                
                  // showAgg: true,
                  childNodes: mhelper.isHaveSubJoin(fid, req.query.subdomain, req.query.db_id),
                  join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                  join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                  onExpand: '/apps/editor/controllers/nodes?subdomain=' + req.query.subdomain + '&id=' + fid + '&qm=' + qm + '&db_id=' + req.query.db_id,
                };
                let reldetails = mhelper.relDetails(fid, req.query.subdomain, req.query.db_id);
                if (qm == 'select') {
                  nnode.showAgg = true;
                } else if (qm == 'insert') {
                  if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
                }
                currentNode.nodes.push(nnode);
              }
            }
          }
          if (Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {

            let refsplit = Models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
            if (req.query.primary && Models[refsplit[0]][refsplit[1]].properties.primary.length == 0) continue;
            let refid = Models[refsplit[0]][refsplit[1]].properties.id + '.' + Models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;

            var secondLastEl_table = secondLastEl.split('.')[0]
            var refid_table = refid.split('.')[0]

            if (currentNodeId !== lastel && refid !== secondLastEl && refid_table !== secondLastEl_table) {
              currentNode.nodes = currentNode.nodes || [];
              let fid = path + '-' + currentNodeId + '-' + refid;
              let join_path_list = mhelper.pathToText(currentNodeId + '-' + refid, req.query.subdomain, req.query.db_id);
              if (pathSplitLength < 6) {
                let nnode = {
                  text: refsplit[0] + '.' + refsplit[1],
                  id: fid,
                  nodes: [],
                  // showAgg: true,
                  childNodes: mhelper.isHaveSubJoin(fid, req.query.subdomain, req.query.db_id),
                  join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                  join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                  onExpand: '/apps/editor/controllers/nodes?subdomain=' + req.query.subdomain + '&id=' + fid + '&qm=' + qm + '&db_id=' + req.query.db_id,
                };
                let reldetails = mhelper.relDetails(fid, req.query.subdomain, req.query.db_id);
                if (qm == 'select') {
                  nnode.showAgg = true;
                } else if (qm == 'insert') {
                  if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
                }
                currentNode.nodes.push(nnode);
              }

            } else {
              // console.log('SKIP', refsplit, currentNodeId, lastel, refid,  secondLastEl);
            }
          }
          nodes.push(currentNode);
        }
        return res.zend(nodes);
      }
    }
    return res.zend(null, 400);
  }));
  router.post('/load-all-nodes', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain]) return res.zend(null, 400);
    if (!req.body.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");
    let qm = 'select';
    if (req.body.qm == 'insert' || req.body.qm == 'update' || req.body.qm == 'delete') qm = req.body.qm;
    let id = req.body.id;
 
    // let tableIdsSet = new Set( []);
    let tableIds = Array.isArray(req.body.id) ? req.body.id : [req.body.id];

    let responseNodes = [];

    for (let i = 0; i < tableIds.length; i++) {
      let resultNodes = mhelper.getAllNodes(tableIds[i], req.body.subdomain, req.body.db_id, req.body.search_body,  )
      if (resultNodes !== null && resultNodes.nodes.length) {
        resultNodes.tableId = tableIds[i];
        responseNodes.push(resultNodes);
      }
    }
    responseNodes = utils.formatNodesForTableMode(responseNodes);

    return res.zend(responseNodes);
  }));

  router.get('/ops', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400);
    if (!req.query.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");
    let currentModel = req.clientModels[req.query.subdomain].databases[req.query.db_id];
    // console.log( "currentModel",currentModel)
    var Models = currentModel.models;
    var tables = {};
    var tables_arr = [];
    if (!currentModel.tidToName) return res.zend(null, 500, "Table is not defined");

    var tids = Object.keys(currentModel.tidToName);
    // var text = '';
    for (var i = 0; i < tids.length; i++) {
      var n = currentModel.tidToName[tids[i]];
      if (n) {
        tables[n[0] + '.' + n[1]] = Models[n[0]][n[1]].properties.columns;
      }
      var has_id = false, has_single_id = false;
      if ((Models[n[0]][n[1]].properties.primary && Models[n[0]][n[1]].properties.primary.length > 0) || (Models[n[0]][n[1]].properties.unique && Models[n[0]][n[1]].properties.unique.length > 0)) has_id = true;

      if ((Models[n[0]][n[1]].properties.primary && Models[n[0]][n[1]].properties.primary.length == 1) || (Models[n[0]][n[1]].properties.unique && Models[n[0]][n[1]].properties.unique.length == 1)) has_single_id = true;

      /* if req.query.primary=true then skip table without primary keys  */
      if (req.query.primary && Models[n[0]][n[1]].properties.primary && Models[n[0]][n[1]].properties.primary.length == 0) continue;

      var substitute_p_keys = []

      // check if table has sigle column unique index and col is not null
      if (currentModel.models[n[0]][n[1]].properties.uindex) {
        var u_indexes = Object.keys(currentModel.models[n[0]][n[1]].properties.uindex);
        for (let j = 0; j < u_indexes.length; j++) {
          const element = u_indexes[j];
          if (currentModel.models[n[0]][n[1]].properties.uindex[u_indexes[j]].length == 1 && currentModel.models[n[0]][n[1]].properties.notnulls && currentModel.models[n[0]][n[1]].properties.notnulls.indexOf(currentModel.models[n[0]][n[1]].properties.uindex[u_indexes[j]][0]) > -1) {
            substitute_p_keys.push(currentModel.models[n[0]][n[1]].properties.uindex[u_indexes[j]][0])
          }
        }
      }

      tables_arr.push({
        id: tids[i],
        text: n[0] + '.' + n[1],
        has_id: has_id,
        has_single_id: has_single_id,
        p_key: Models[n[0]][n[1]].properties.primary,
        substitute_p_keys: substitute_p_keys
      });
    }
    var ops = {
      // app_name: req.clientModels[req.query.subdomain].appDetails.name, // get app name from loaded model 
      // db_name: currentModel.db_name,
      // tables: tables,
      // type_map: currentModel.db_type == MYSQL ? mysql_types : types,
      types: currentModel.db_type == MYSQL ? mysql_types : qutils.formatPGTypesForFE(),  //<--- remove this line 
      tables: tables_arr,
      // chart_agg_fn: chart_agg_fn,
      // ts_granularity: qutils.ts_granularity,
      // options: qutils.agg_fn_operations,
      // merged_types: qutils.all_merged_types,

    };
    if (req.query.remainingTypes) {
      ops.remainingTypes = qutils.getUnlistedTypes(currentModel, req.query.subdomain, req.query.db_id).remainingTypes
    }
    res.zend(ops);
    // resWith(response, ops);

  }));

  router.get('/auth', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400);
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");
    
    new req.DB({}).execute([

      new req.models.public.auth_details().select({
        auth_detail_id: true,
        app_id: true,
        client_id: true,
        jwt_type: true,
        redirect_url: true,
        client_secret_encrypted: 'client_secret',
        redirect_url: true,
        session_key_values: true,
        // user_id_column_name: true,
        user_id_column_id: true,
        user_id_session_key: true,
        token_header: true
      })
      .join({
        model: new req.models.public.roles().select().agg('roles')
        .join({
          model: new req.models.public.role_types().select({
            role_type_id: true,
            name: 'type'
          }),
          on: {
            role_type_id: {$ident: 'public.roles.role_type_id'}
          }
        })
        ,
        on: {
          auth_detail_id: {$ident: 'public.auth_details.auth_detail_id'}
        }
      })
      .where({
        app_id: {
          $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
            name: req.query.subdomain
          })
        }
      }).aggAlias('auth'),

      new req.models.public.role_types().select({
        role_type_id: true,
        name: true,
        description: true
      }).aggAlias('role_types')

    ], function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      result.auth = result.auth || [];
      if(result.auth[0]) {
        result.auth[0].role_types = result.role_types || [];
        result.auth[0].client_secret = cipher.decrypt(result.auth[0].client_secret)
      }
      
      
      if (result.auth[0]?.user_id_column_id) {
        var db_key = Object.keys(req.clientModels[req.query.subdomain].databases)[0];
        result.auth[0].user_id_column_name = req.clientModels[req.query.subdomain].databases[db_key].idToName[result.auth[0].user_id_column_id];
        result.auth[0].user_id_column_name = result.auth[0].user_id_column_name.join('.');
        result.auth[0].user_session_object = {
          column_id: result.auth[0].user_id_column_id,
          column_name: result.auth[0].user_id_column_name,
          param_key: result.auth[0].user_id_session_key
        }
      }
      return res.zend(result.auth[0]);

    });

  }));

// var custom_permissions = {
//   'schema_name.table_name': {
//       'insert': {},
//       'update': {},
//       'delete': {},
//       'select': {
//         // -1 - no access, 0 - conditional, 1 - full
//         access_type: 0,
//         conditions: {}
//       }
//     }
//   }

  router.post('/auth/role', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.clientModels[req.body.subdomain] || !req.body.auth_detail_id || req.body.auth_detail_id == '' || !req.body.name || req.body.name == '' || !req.body.role_type_id || req.body.role_type_id == '') return res.zend(null, 400);
    if (req.user_id !== req.clientModels[req.body.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    if (!req.body.name || req.body.name == '') {
      return res.zend(null, 400, "Invalid role name. It must contain alphanumeric characters, hyphens, or underscores.");
    }

    if(!req.body.role_value || req.body.role_value == '') {
      req.body.role_value = req.body.name.trim().toLowerCase()
      .replace(/[^a-zA-Z0-9-_\s]/g, '')  // Remove non-alphanumeric chars except - and _
      .replace(/\s+/g, ' ').replace(/\s/g, '-')  // Replace spaces with -
    }

    new req.DB({}).execute([
      new req.models.public.roles().insert({
        auth_detail_id: new req.models.public.auth_details().select({ auth_detail_id: true }).where({ app_id: req.clientModels[req.body.subdomain].appDetails.app_id }),
        name: req.body.name,
        role_type_id: req.body.role_type_id,
        custom_permissions: req.body.custom_permissions,
        role_value: req.body.role_value
      }).conflict({
        on: ['auth_detail_id', 'role_value'],
        update: {
          custom_permissions: req.body.custom_permissions,
          name: req.body.name
        }
      })
    ], function (err, result) {
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      result.newrows.roles = result.newrows.roles || []
      res.zend(result.newrows.roles[0]);
      new req.DB({}).execute([
        new req.models.public.roles().select({
          auth_detail_id: true,
          name: true,
          role_type_id: true,
          custom_permissions: true
        }).where({
          auth_detail_id: {
            $inq: new req.models.public.auth_details().select({ auth_detail_id: true }).where({ app_id: req.clientModels[req.body.subdomain].appDetails.app_id })
          }
        }).aggAlias('roles')
      ], function (err, result) {
        if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return console.log(err);

        ModelManager.updateRole({
          subdomain: req.body.subdomain,
          roles: result.roles
        })
      })
    })
  }))

  // ######  Get authentication Details   #####
  router.get('/app-auth', catchError(async function (req, res) {

    if (!req.query.subdomain) return res.zend(null, 400, "Must have valid values of 'subdomain' ");

    new req.DB({}).executeRaw({
      text: ` 
        WITH apps_sel AS(
          SELECT  
              apps.app_id
          FROM  apps
              INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
          WHERE
                subdomain_gen.name = $2
                AND apps.created_by = $1
        )
        SELECT  
          * ,
        client_secret_encrypted AS client_secret
        FROM  auth_details 
        WHERE app_id = ( SELECT  app_id FROM apps_sel )

          `,

      values: [
        req.user_id,
        req.query.subdomain,
      ]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!result.rows.length) return res.zend({});
      result.rows[0].client_secret = cipher.decrypt(result.rows[0].client_secret)
      if(result.rows[0].user_id_column_id) {
        var db_key = Object.keys(req.clientModels[req.query.subdomain].databases)[0];
        result.rows[0].user_id_column_name = req.clientModels[req.query.subdomain].databases[db_key].idToName[result.rows[0].user_id_column_id];
        if(result.rows[0].user_id_column_name) {
          result.rows[0].user_id_column_name = result.rows[0].user_id_column_name.join('.');
          result.rows[0].user_session_object = {
            column_id: result.rows[0].user_id_column_id,
            column_name: result.rows[0].user_id_column_name,
            param_key: result.rows[0].user_id_session_key
          }
        }
      }
      delete result.rows[0].client_secret_encrypted;
      return res.zend(result.rows[0]);

    });


  }));


  // ######  Add authentication to apps  #####
  router.post('/app-auth', catchError(async function (req, res) {

    if (
      !req.body.subdomain ||
      !req.body.client_secret
    ) return res.zend(null, 400, "Must have valid values of 'subdomain' and 'client_secret' ");
    // req.body.client_secret = cipher.encrypt(req.body.client_secret)


    const JWT_TYPES = constant.JWT_TYPES;
    if (req.body.jwt_type && !JWT_TYPES.includes(req.body.jwt_type)) {
      return res.zend(null, 400, `jwt_type must be one of the following values ${JWT_TYPES.join(', ')}`);
    }

    new req.DB({}).execute([
      new req.models.public.auth_details().insert({
        app_id: new req.models.public.apps().select({app_id: true}).where({
          app_id: {
            $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
              name: req.body.subdomain
            })
          },
          created_by: req.user_id
        }),
        jwt_type: req.body.jwt_type,
        client_secret_encrypted: cipher.encrypt(req.body.client_secret),
        token_header: req.body.token_header,
        user_id_session_key: req.body.user_id_session_key,
        user_id_column_id: req.body.user_id_column_id,
        role_session_key: req.body.role_session_key
      })
    ], function(err, result) {
      if (err?.message && err?.message.startsWith('null value in column')) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');

      res.zend(result.newrows.auth_details[0]);
      
      ModelManager.updateAuth({
        subdomain: req.body.subdomain,
        jwt_key: req.body.client_secret,
        jwt_type: req.body.jwt_type,
        token_header: req.body.token_header,
        user_id_session_key: req.body.user_id_session_key,
        user_id_column_id: req.body.user_id_column_id,
        role_session_key: req.body.role_session_key
      })
    })

  }));

  // ######  update app authentication   #####
  router.put('/app-auth', catchError(async function (req, res) {

    if (
      !req.body.subdomain ||
      !req.body.client_secret
    ) return res.zend(null, 400, "Must have valid values of 'subdomain' and 'client_secret' ");
    // req.body.client_secret = cipher.encrypt(req.body.client_secret)

    const JWT_TYPES = constant.JWT_TYPES
    if (req.body.jwt_type && !JWT_TYPES.includes(req.body.jwt_type)) {
      return res.zend(null, 400, `jwt_type must be one of the following values ${JWT_TYPES.join(', ')}`);
    }

    new req.DB({}).execute([
      new req.models.public.auth_details().update({
        jwt_type: req.body.jwt_type,
        client_secret_encrypted: cipher.encrypt(req.body.client_secret),
        token_header: req.body.token_header,
        user_id_session_key: req.body.user_id_session_key,
        user_id_column_id: req.body.user_id_column_id,
        role_session_key: req.body.role_session_key
      }).where({
        auth_detail_id: req.body.auth_detail_id,
        app_id: {
          $inq: new req.models.public.apps().select({app_id: true}).where({
            app_id: {
              $inq: new req.models.public.subdomain_gen().select({ app_id: true }).where({
                name: req.body.subdomain
              })
            },
            created_by: req.user_id
          })
        }
      })
    ], function(err, result){
      if (err?.message && err?.message.startsWith('null value in column')) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');

      res.zend(result.newrows.auth_details[0]);

      ModelManager.updateAuth({
        subdomain: req.body.subdomain,
        jwt_key: req.body.client_secret,
        jwt_type: req.body.jwt_type,
        token_header: req.body.token_header,
        user_id_session_key: req.body.user_id_session_key,
        user_id_column_id: req.body.user_id_column_id,
        role_session_key: req.body.role_session_key
      })
      
    })

  }));

  // ######  remove authentication  ##### 
  router.delete('/app-auth', catchError(async function (req, res) {

    if (!req.body.auth_detail_id) return res.zend(null, 400, "Must have valid values of 'auth_detail_id'  ");

    new req.DB({}).executeRaw({
      text: ` 
            WITH auth_details_sel AS(
              SELECT 
                 subdomain_gen.name AS subdomain,
                 auth_detail_id
              FROM  auth_details
                  INNER JOIN  apps ON apps.app_id  = auth_details.app_id
                  INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
              WHERE
                  auth_details.auth_detail_id = $2
                  AND apps.created_by = $1
           ),
           auth_details_del AS ( 
              DELETE
              FROM auth_details
              WHERE 
                  auth_detail_id = (SELECT auth_detail_id FROM  auth_details_sel)
              RETURNING  auth_detail_id
           )
            SELECT * 
            FROM auth_details_del
            INNER JOIN auth_details_sel on auth_details_sel.auth_detail_id = auth_details_del.auth_detail_id
             `,

      values: [
        req.user_id,
        req.body.auth_detail_id,
      ]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid value of 'auth_detail_id'");

      ModelManager.updateAuth({
        subdomain: result.rows[0].subdomain,
        jwt_key: null,
        jwt_type: null
      })
      return res.zend(result.rows[0], 200, "Successfully Deleted");

    });


  }));


  // ######  update param map  #####
  router.put('/param-map', catchError(async function (req, res) {

    if (
      !req.body.subdomain ||
      !req.body.session_key_values
    ) return res.zend(null, 400, "Must have valid values of 'subdomain' and 'session_key_values' ");


    new req.DB({}).executeRaw({
      text: ` 
            WITH apps_sel AS(
              SELECT  
               
                 auth_details.auth_detail_id
              FROM  apps
                  INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
                  INNER JOIN auth_details ON auth_details.app_id = apps.app_id
              WHERE
                   subdomain_gen.name = $2 
                   AND apps.created_by = $1
           )
            UPDATE  auth_details
            SET   
                  session_key_values  = $3
            WHERE 
              EXISTS ( SELECT  auth_detail_id FROM apps_sel )
              AND auth_detail_id = ( SELECT  auth_detail_id FROM apps_sel )
             RETURNING  auth_detail_id
             `,

      values: [
        req.user_id,
        req.body.subdomain,
        req.body.session_key_values,
      ]
    }, function (err, result) {

      if (err?.message && err?.message.startsWith('null value in column')) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Auth is disabled");

      res.zend(result.rows[0]);

      ModelManager.updateAuthSessionParams({
        subdomain: req.body.subdomain,
        session_key_values: req.body.session_key_values
      })

    });


  }));


  // ######  Get Cors domains   #####
  router.get('/cors-domain', catchError(async function (req, res) {

    if (!req.query.subdomain) return res.zend(null, 400, "Must have valid values of 'subdomain' ");

    new req.DB({}).executeRaw({
      text: ` 
            SELECT  
              coalesce(apps.cors, '{}') AS cors
            FROM  apps
                INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
            WHERE
                  subdomain_gen.name = $2
                  AND apps.created_by = $1
            `,

      values: [
        req.user_id,
        req.query.subdomain,
      ]
    }, function (err, result) {

      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '');
      if (!result || !result.rows) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!result.rows.length) return res.zend({});
      return res.zend(result.rows[0]);

    });


  }));


  // ######  Save  Cors domains  #####
  router.put('/cors-domain', catchError(async function (req, res) {

    if (!req.body.subdomain || !req.body.cors) return res.zend(null, 400, "Must have valid values of 'subdomain' and 'cors' ");
    // TODO: add format check 

    var cors = [];

    req.body.cors = req.body.cors || []

    for (let i = 0; i < req.body.cors.length; i++) {
      const element = req.body.cors[i];
      if (!element || element.trim() == '') continue;
      cors.push(element)
    }

    new req.DB({}).executeRaw({
      text: ` 
          WITH apps_sel AS(
            SELECT  
                apps.app_id
            FROM  apps
                INNER JOIN subdomain_gen ON subdomain_gen.app_id = apps.app_id
            WHERE
                  subdomain_gen.name = $2
                  AND apps.created_by = $1
          )
          UPDATE apps
          SET   cors = $3
          WHERE 
            apps.app_id = ( SELECT app_id FROM  apps_sel)
          RETURNING   app_id, cors
           `,

      values: [
        req.user_id,
        req.body.subdomain,
        cors,
      ]

    }, function (err, result) {
      if (err?.message && err?.message.startsWith('null value in column')) return res.zend(null, 400, "Invalid value of 'subdomain'");
      if (!req.ErrorHandler({ err: err, line: 0, file: __filename })) return res.zend(null, 500, '' || "Something went Wrong");
      if (!result || !result.rows || !result.rows.length) return res.zend(null, 400, "Invalid value of 'subdomain'");

      ModelManager.updateCORS({
        subdomain: req.body.subdomain,
        cors: result.rows[0].cors
      })

      return res.zend(result.rows[0], 200, "Successfully Updated");
    });

  }));


  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });
};




function condition_count(w) {
  var c = 0;
  w = w || { rules: [] };
  for (let i = 0; i < w.rules.length; i++) {
    const element = w.rules[i];
    if (w.rules[i].condition) {
      c += condition_count(w.rules[i]);
    } else {
      ++c;
    }
  }
  return c;
}




