'use strict';
var pg = require('pg');
var mysql = require('mysql2');
var base = require.main.require('./models/baseModel.js');
var cipher = require.main.require('./lib/cipher2.js');
var execCommand = require("../lib/execCommand.js"); 
var db = require.main.require('./lib/maindb.js');
const { MYSQL, POSTGRES, MAX_CONNECTION_POOL} = require('../envconfig.js').constant;
var asyncloop = require.main.require('./lib/asyncloop.js').asyncloop;
var Sentry = require('../sentry.js');
var modelutils = require.main.require('./models/utils');
var repoManager = require.main.require('./repo-gen/index.js');
var subdomain_gen = require.main.require('./lib/sub.js').gen;
const pluralize = require('pluralize');

function compare(a, b) {
  if (a.last_nom < b.last_nom) {
    return -1;
  }
  if (a.last_nom > b.last_nom) {
    return 1;
  }
  return 0;
}

var ModelManager = {

  // temp

  pathToText(pathid, subdomain, db_id) {

    if(pathid.indexOf('-') == -1) return null;
      
    let spl = pathid.split('-');
  
    let arr = [];
  
    // console.log(ModelManager.models)
  
    for (let i = 0; i < spl.length; i++) {
      let currentModel = ModelManager.models[subdomain].databases[db_id];    
  
      arr.push(currentModel.idToName[spl[i]]);
    }
    return arr;
  },


  buildJoinGraph(params){

    let id = params.id;
    let subdomain = params.subdomain
    let db_id = params.db_id

    if (!db_id || !subdomain || !id || !ModelManager.models[subdomain] || !ModelManager.models[subdomain].databases[db_id]) return null

    if(id.indexOf('-') > - 1 || id.indexOf('$') > -1) return null;

    var arr_1 = this.getJoinPaths({
      id: id,
      subdomain: subdomain,
      db_id: db_id
    })

    // console.log('1st arr', arr_1.length)

    var final_arr = []

    for (let i = 0; i < arr_1.length; i++) {

      arr_1[i].degree = 1
      final_arr.push(arr_1[i])

      // var arr_2 = this.getJoinPaths({
      //   id: arr_1[i].id,
      //   subdomain: subdomain,
      //   db_id: db_id
      // })

      // for (let j = 0; j < arr_2.length; j++) {

      //   arr_2[j].degree = 2;
      //   final_arr.push(arr_2[j])

      //   var arr_3 = this.getJoinPaths({
      //     id: arr_2[j].id,
      //     subdomain: subdomain,
      //     db_id: db_id
      //   })

      //   for (let k = 0; k < arr_3.length; k++) {

      //     arr_3[k].degree = 3
      //     final_arr.push(arr_3[k]);
      //   }
        
      // }
      
    }

    // console.log(final_arr)
    // console.log(final_arr.length)

    return final_arr.sort(function(a, b) {
      var keyA = new Date(a.degree),
        keyB = new Date(b.degree);
      // Compare the 2 dates
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    })
    
    
  },


  getJoinPaths: function (params) {

    let id = params.id;
    let subdomain = params.subdomain
    let db_id = params.db_id
  
    if (!db_id || !subdomain || !id || !ModelManager.models[subdomain] || !ModelManager.models[subdomain].databases[db_id]) return null
  
    let currentModel = ModelManager.models[subdomain].databases[db_id];
    let idSplit = id.split('$');
    // let idSplitLength = idSplit.length;
    let currentSchema;
    let path, pathSplit, pathSplitLength, lastel, secondLastEl, currentColumn, currentTable, nodes = [];
    path = idSplit[0];
    pathSplit = path.split('-');
    pathSplitLength = pathSplit.length;
    var join_arr = []
    if (pathSplitLength > 6) return null; // TODO: increase length  
    if (idSplit.length == 1) {
        // opening or refby 
        if (pathSplitLength == 1) {
            // 40
            if (!currentModel.tidToName[pathSplit[0]]) return null
            let node = {
            };
            currentSchema = currentModel.tidToName[pathSplit[0]][0];
            currentTable = currentModel.tidToName[pathSplit[0]][1];
            node.text = currentSchema + '.' + currentTable;
            let columnKeys = Object.keys(currentModel.models[currentSchema][currentTable].properties.columns);
            for (let i = 0; i < columnKeys.length; i++) {

              let currentNodeId = currentModel.models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
                let path_node_id = path + '.' + currentNodeId;
  
  
                if (currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {
  
                    for (let j = 0; j < currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
                        let refbysplit = currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
                        let refbyid = currentModel.models[refbysplit[0]][refbysplit[1]].properties.id + '.' + currentModel.models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
                        let join_path_list = ModelManager.pathToText(path_node_id + '-' + refbyid, subdomain, db_id);
                        let currentSubJoinId = path_node_id + '-' + refbyid;
                        join_arr.push({
                            text: refbysplit[0] + '.' + refbysplit[1],
                            id: currentSubJoinId,
                            // showAgg: true,
                            // join_path: (join_path_list[1][0] == 'public' ? join_path_list[1][1] + '.' + join_path_list[1][2] : join_path_list[1].join(".")),
                            join_path: join_path_list[1].join(".") + ' - ' + join_path_list[0].join("."),
                            display_text: refbysplit[0] + '.' + refbysplit[1] + ' (' + join_path_list[0][2] + ')',
                            // join_path_list: join_path_list
                            // join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`
                        })
                    }
                }
                if (currentModel.models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {
  
                    let refsplit = currentModel.models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
                    let refid = currentModel.models[refsplit[0]][refsplit[1]].properties.id + '.' + currentModel.models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
                    let join_path_list = ModelManager.pathToText(path_node_id + '-' + refid, subdomain, db_id);
                    let currentSubJoinId = path_node_id + '-' + refid;
                    join_arr.push({
                        text: refsplit[0] + '.' + refsplit[1],
                        id: currentSubJoinId,
                        // showAgg: true,
                        // join_path: (join_path_list[0][0] == 'public' ? join_path_list[0][1] + '.' + join_path_list[0][2] : join_path_list[0].join(".")),
                        join_path: join_path_list[0].join(".") + ' - ' + join_path_list[1].join("."),
                        // join_path: join_path_list[1].join(".") + ' - ' + join_path_list[0].join("."),
                        display_text: refsplit[0] + '.' + refsplit[1] + ' (' + join_path_list[0][2] + ')',
                        // join_path_list: join_path_list
                        // join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                    })
                }
            }
            return join_arr
        } else {
            // 40.1-30.2
            // 40.1-30.2-30.2-4.3
            lastel = pathSplit[pathSplitLength - 1];
            secondLastEl = pathSplit[pathSplitLength - 2];
            if (!currentModel.idToName[lastel]) return null
            currentSchema = currentModel.idToName[lastel][0];
            currentTable = currentModel.idToName[lastel][1];
            currentColumn = currentModel.idToName[lastel][2];
            let columnKeys = Object.keys(currentModel.models[currentSchema][currentTable].properties.columns).sort(compare);
            for (let i = 0; i < columnKeys.length; i++) {
                // let element = columnKeys[i];
  
                let currentColumnId = currentModel.models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
                let currentNodeId = currentModel.models[currentSchema][currentTable].properties.id + '.' + currentColumnId;
  
                if (currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {
  
                    for (let j = 0; j < currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
                        let refbysplit = currentModel.models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
  
                        let refbyid = currentModel.models[refbysplit[0]][refbysplit[1]].properties.id + '.' + currentModel.models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
                        if (currentNodeId == lastel && refbyid == secondLastEl && !modelutils.haveMany(lastel + '-' + secondLastEl)) {
                            continue;
                        }
                        var secondLastEl_table = secondLastEl.split('.')[0]
                        var refbyid_table = refbyid.split('.')[0]
                        if(refbyid_table == secondLastEl_table) {
                          continue;
                        }
                        let fid = path + '-' + currentNodeId + '-' + refbyid;
                        let join_path_list = ModelManager.pathToText(currentNodeId + '-' + refbyid, subdomain, db_id);
                        let full_join_path_list = ModelManager.pathToText(fid, subdomain, db_id);
  
                        if (pathSplitLength < 6) { // TODO : increase node length 

                            join_arr.push({
                              text: refbysplit[0] + '.' + refbysplit[1],
                              id: fid,
                              // showAgg: true,
                              join_path: ModelManager.getFullJoinPathText(full_join_path_list),
                              join_path_short: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                              display_text: refbysplit[0] + '.' + refbysplit[1] + ' (' + join_path_list[0][2] + ')',
                              // full_join_path_list: full_join_path_list
                              // join_path_list: join_path_list
                              // join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                          })
                        }
                    }
                }
                if (currentModel.models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {
  
                    let refsplit = currentModel.models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
  
                    let refid = currentModel.models[refsplit[0]][refsplit[1]].properties.id + '.' + currentModel.models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
                    var secondLastEl_table = secondLastEl.split('.')
                    var refid_table = refid.split('.')[0]

                    if (currentNodeId !== lastel && refid !== secondLastEl && refid_table !== secondLastEl_table) {
  
                        let fid = path + '-' + currentNodeId + '-' + refid;
                        let join_path_list = ModelManager.pathToText(currentNodeId + '-' + refid, subdomain, db_id);
                        let full_join_path_list = ModelManager.pathToText(fid, subdomain, db_id);
                        if (pathSplitLength < 6) {
  
                            join_arr.push({
                                text: refsplit[0] + '.' + refsplit[1],
                                id: fid,
                                // showAgg: true,
                                join_path: ModelManager.getFullJoinPathText(full_join_path_list),
                                join_path_short: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                                display_text: refsplit[0] + '.' + refsplit[1] + ' (' + join_path_list[0][2] + ')',
                                // full_join_path_list: full_join_path_list
                                // join_path_list: join_path_list
                                // join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                            })
  
                        }
  
                    } else {
                        // console.log('SKIP', refsplit, currentNodeId, lastel, refid,  secondLastEl);
                    }
                }
            }
            return join_arr
        }
    }
    return join_arr
  },

  getFullJoinPathText(arr) {
    var farr = []
    for (let i = 0; i < arr.length; i++) {
      const element = arr[i];
      var t;
      if(element[0] == 'public') {
        t = element[1] + '.' + element[2]
      } else {
        t = element.join('.')
      }
      if(farr[farr.length - 1] != t) {
        farr.push(t)
      }
    }
    return farr.join(' - ')
  },

  pgtmodels: {}, // store   models of this project

  models: {}, // store   models of client 

  domainToSubdomain: {},

  testConnect: async function(params, callback) {
    console.log("---->test connect");
    /* db_type_name :  MySQL  
      db_type_id :   142cdcea-9bbe-41ea-be1e-a2b7254f66c5 */
    // return callback()
    // TODO : Handle connection error 
    if (params.db_type == MYSQL) {
    // console.log("---->test mysql connect");
      // `mysql://${data.user}:${data.password}@${data.host}/${db_name}`
      let connectionString = "mysql://" + params.dbusername + ":" + params.dbpassword + "@" + params.dbhost + ":" + params.dbport + "/" + params.dbname;
      // console.log(connectionString);
      // try{ 
      if(!params.dbname) throw new Error("Must have 'dbname' of  Mysql database"); 
      const client = mysql.createConnection(connectionString);
      
      // client.on("error", (err)=>{ 
      //   console.error("err 34- -------"); 
      //   console.error(err); 
      //   callback(err);
      // });
      client.connect(function (err) {
        if (err) {
          console.error('connection error', err.stack);
          return callback(err);
        } 
        client.query(ModelManager.query[ MYSQL], [params.dbname, params.dbname, params.dbname], function (err, result) {
          callback(err, result);
          // console.log(JSON.stringify(result, null, 0))
          client.end();
        });
      });
      // }
      // catch ( err){
      //   console.error( '---- error ----')  ; 
      //   console.error( err)  ; 
      //   callback(err)
      // }

    } else {
      try {
        // console.log("------>test connect postgres");
        // TODO : sanitized user input before executing 
        const client = new pg.Client({
          user: params.dbusername,
          password: params.dbpassword,
          host: params.dbhost,
          port: params.dbport,
          database: params.dbname,
          connectionTimeoutMillis: 30000,
          ssl: {
            rejectUnauthorized: false,
          },
        })
        await client.connect()

        const result = await client.query(ModelManager.query[POSTGRES])
        // console.log(result?.rows || result)
        callback(null, result?.rows || result)
        await client.end()


      } catch (e) {
        console.error(e)
        if(e.message.startsWith('received invalid response: 4a')){ 
          e.message = "Invalid Database"
        }
        callback(e);
      }


    }

  },

  // #### load project model ##### 
  loadMain: function(callback){
    
    ModelManager.extractSchema(db, function(err, rows){
      if(err) return callback(err);

      ModelManager.pgtmodels = ModelManager.makeModelFromSchema({rows: rows});  

      if(!ModelManager.pgtmodels || !ModelManager.pgtmodels.models || !ModelManager.pgtmodels.models.public || !ModelManager.pgtmodels.models.public.schema_defs) {
        // create schema
        const fs = require('fs');
        const path = require('path');
        const dbSqlPath = path.join(__dirname, '..', 'db.sql');

        fs.readFile(dbSqlPath, 'utf8', (err, sql) => {
          if (err) {
              console.error('Error reading db.sql:', err);
              return callback(err);
          }
  
          // Execute the SQL schema
          db.query({text: sql}, (err) => {
              if (err) {
                  console.error('Error executing schema:', err);
                  return callback(err);
              }
  
              // Call loadMain again after executing the schema
              ModelManager.loadMain(callback);
          });
        });

      } else {
        // check subdomain_gen table
        db.query({
          text: "select count(*) from subdomain_gen",
        }, function(err, result) {
          if (err) {
            console.error('Error checking subdomain_gen count:', err);
            return callback(err);
          }

          if (!result.rows[0].count || result.rows[0].count == 0) {
            console.log('Generating subdomains...');
            // Generate subdomains if none exist
            subdomain_gen(function(err) {
              callback(err);
            });
          } else {
            callback();
          }
        });
      }
 
    });
  },

  loadAppFromDomain(domain, callback) {

    db.query({
      text: "select name from subdomain_gen where app_id in (select custom_domains.app_id from custom_domains where domain = $1)",
      values: [domain]
    }, function(err, result){
      if (err) {
        return callback(err);
      }
      if (!result.rows || result.rows.length == 0) return callback();
      ModelManager.loadApp(result.rows[0].name, callback);
    })

  },

  // #### load client models  ##### 
  loadApp: function (subdomain, callback ,options ={}) {
  // TODO:  update to load data from queries table  
    db.query({
      text: `select 
              apps.app_id as app_id,
              apps.name as name, 
              apps.cors, 
              apps.graphql, 
              created_by, 
              s.name as subdomain,
              auth_details.client_secret_encrypted as jwt_key,
              auth_details.jwt_type as jwt_type,
              token_header as token_header,
              auth_details.session_key_values as session_key_values,
              auth_details.user_id_session_key as user_id_session_key,
              auth_details.user_id_column_id as user_id_column_id,
              auth_details.role_session_key as role_session_key,
              git_deployment.github_details as github_details,
              users.github_ob as github_ob,
              (
                select 
                  json_agg(d.*) as databases 
                from 
                  (
                    select 
                      databases.username, 
                      databases.password, 
                      databases.db_id, 
                      databases.host, 
                      databases.port_num, 
                      databases.name as db_name, 
                      db_types.name as db_type, 
                      schema_defs.custom_columns, 
                      schema_defs.enum_tables, 
                      schema_defs.def
                    from 
                      databases 
                      join db_types on (
                        databases.db_type = db_types.db_type_id
                      ) 
                      left join schema_defs on (
                        databases.db_id = schema_defs.db_id
                      ) 
                    where 
                      databases.app_id = apps.app_id
                      AND db_types.name = $2
                  ) d
              ), 
              (
                select 
                  json_agg(r.*) as roles 
                from 
                  (
                    SELECT 
                      roles.name as role_name,
                      role_types.name as role_type_name,
                      roles.custom_permissions as custom_permissions,
                      role_value
                    FROM 
                      roles
                      join role_types on (
                        roles.role_type_id = role_types.role_type_id
                      )
                    WHERE 
                      roles.auth_detail_id = auth_details.auth_detail_id
                  ) r
              ), 
              (
                select 
                  json_agg(a.*) as routes 
                from 
                  (
                    SELECT 
                      query_id, 
                      db_id, 
                      route, 
                      method, 
                      public.api_queries.query_json, 
                      public.api_queries.query_view_data ->> 'method' as sqlmethod, 
                      query_text -> 'querypaths' as querypaths, 
                      auth_required,
                      query_view_data ->> 'base' as base
                    FROM 
                      public.api_queries 
                    WHERE 
                      api_queries.app_id = apps.app_id
                  ) a
              ), 
              (
                select 
                  json_agg(c.*) as custom_domains 
                from 
                  (
                    SELECT 
                      domain
                    FROM 
                      public.custom_domains 
                    WHERE 
                      custom_domains.app_id = apps.app_id
                  ) c
              ) 
            from 
              apps 
              join subdomain_gen s on (
                s.app_id = apps.app_id 
                AND s.name = $1
              )
              left join auth_details on (
                auth_details.app_id = apps.app_id
              )
              left join git_deployment on (
                git_deployment.app_id = apps.app_id
              )
              left join users on (
                users.user_id = apps.created_by
              )
          ;`,

      values: [subdomain ,POSTGRES ],
    },
    function (err, result) {

      if (err) {
        return callback(err);
      }
      if (!result.rows || result.rows.length == 0) return callback({error: 404});
      
      let row = result.rows[0];

      row.routes = row.routes || []
      row.custom_domains = row.custom_domains || []

      var route_ob = {
      }

      for (let k = 0; k < row.routes.length; k++) {
        const element = row.routes[k];
        route_ob[element.route] = route_ob[element.route] || {}
        route_ob[element.route][element.method] = element
      }

      for (let k = 0; k < row.custom_domains.length; k++) {
        ModelManager.domainToSubdomain[row.custom_domains[k].domain] = row.subdomain
      }

      var appdetails = {
        app_id: row.app_id,
        name: row.name,
        created_by: row.created_by,
        subdomain: row.subdomain,
        graphql: row.graphql || {
          tables: [],
          enabled: false
        },
        cors: row.cors,
        auth: {
          jwt_key: row.jwt_key ? cipher.decrypt(row.jwt_key) : null,
          jwt_type: row.jwt_type,
          token_header: row.token_header,
          session_key_values: row.session_key_values || {},
          user_id_session_key: row.user_id_session_key,
          user_id_column_id: row.user_id_column_id,
          role_session_key: row.role_session_key,
          roles: row.roles
        },
        custom_domains: row.custom_domains
      }

      var databases = (ModelManager.models[subdomain] && ModelManager.models[subdomain].databases) ? ModelManager.models[subdomain].databases : {};

      asyncloop(row.databases, function(element, success) {

        element.username = cipher.decrypt(element.username);
        element.password = cipher.decrypt(element.password);
        element.host = cipher.decrypt(element.host);
        element.db_name = cipher.decrypt(element.db_name); 

        databases[element.db_id] = databases[element.db_id] || {};

        if(!databases[element.db_id].query) {
          let dburl = "postgres://" + element.username + ":" + element.password + "@" + element.host + ":" + element.port_num + "/" + element.db_name;
          let clientpool = new pg.Pool({   
            connectionString: dburl, 
            idleTimeoutMillis: 0, // milliseconds   after which connection terminates.set to 0 for unlimited
            max: MAX_CONNECTION_POOL,   
            ssl: {
              rejectUnauthorized: false,
            },
          });  
          // databases[row.db_id].dburl = dburl;  
          databases[element.db_id].query = function (q, cb) { 
            let startTime = Date.now() ; 
            clientpool.query(q, function (err, result) {
              cb(err, result, Date.now()- startTime); 
            }) 
          }; 
        }

        var custom = {
          custom_columns: element.custom_columns,
          enum_tables: element.enum_tables
        }

        databases[element.db_id].db_id = element.db_id;
        databases[element.db_id].custom = custom
        databases[element.db_id].db_name = element.db_name

        if( options.reSyncSchema || !element.def ) {
          ModelManager.extractSchema(databases[element.db_id], function(err, rows2){
            if(err) {
              ModelManager.schemaResyncFailed({
                db_id: element.db_id,
                error: err
              })
              return callback(err);
            }
            var mod_gen_res = ModelManager.makeModelFromSchema({rows: rows2});
            databases[element.db_id].models = mod_gen_res.models;
            databases[element.db_id].idToName = mod_gen_res.idToName;
            databases[element.db_id].tidToName = mod_gen_res.tidToName; 
            databases[element.db_id].table_count = mod_gen_res.table_count;
            databases[element.db_id].schema_count = mod_gen_res.schema_count;
            databases[element.db_id].graphql_tables = mod_gen_res.graphql_tables;
  
            ModelManager.models[subdomain] = {
              appDetails: appdetails,
              databases: databases,
              routes: route_ob
            }
            
            ModelManager.saveSchema({
              db_id: element.db_id,
              rows: rows2
            }, function(err){
              if(err) {
                ModelManager.schemaResyncFailed({
                  db_id: element.db_id,
                  error: err
                })
                return callback(err);
              }
              // console.log(ModelManager.models[subdomain])
              success()
            })
          })
        } else {
          var mod_gen_res = ModelManager.makeModelFromSchema({rows: element.def});
          databases[element.db_id].models = mod_gen_res.models;
          databases[element.db_id].idToName = mod_gen_res.idToName;
          databases[element.db_id].tidToName = mod_gen_res.tidToName; 
          databases[element.db_id].table_count = mod_gen_res.table_count;
          databases[element.db_id].schema_count = mod_gen_res.schema_count;
          databases[element.db_id].graphql = {};
          databases[element.db_id].graphql.tables = mod_gen_res.graphql_tables;
  
          ModelManager.models[subdomain] = {
            appDetails: appdetails,
            databases: databases,
            routes: route_ob
          }
          // console.log(ModelManager.models[subdomain])
          success()
        }

      }, function(){
        callback()
        if(row.github_details && row.github_details.repo_url) {
          var token_ob = cipher.decrypt(row.github_ob.token_encrypted);
          // console.log(row.github_ob)
          // console.log(token_ob)
          // return;
          row.github_ob.token = JSON.parse(token_ob);
          repoManager.checkIfLocalRepoExists({
            subdomain: subdomain,
            gitUrl: row.github_details.repo_url,
            username: 'x-access-token',
            password: row.github_ob.token.access_token
          }).then((cloneNeeded) => {
            // console.log('local repo exists')
            if(cloneNeeded) {
              repoManager.overwriteRepo({
                subdomain: subdomain
              }).then(() => {
  
              }).catch((err) => {
                console.log('err', err)
              })
            }
            
          }).catch((err) => {
            console.log('err', err)
          })
        }
      })

    });

  },

  // schema resync failed
  schemaResyncFailed(params, callback) {
    if (!params.db_id || !params.error) {
      return callback(new Error('Missing required parameters'));
    }

    var unix_sec = Math.round(Date.now()/1000)
  
    // Update the schema_defs table to indicate the sync failure
    db.query({
      text: `
        UPDATE public.schema_defs 
        SET last_sync_attempt_time = $1, 
            sync_error = $2
        WHERE db_id = $3
      `,
      values: [unix_sec, params.error, params.db_id],
    }, function(err, result) {
      if (err) {
        Sentry.captureError(err);
        if(callback) callback(err);
      }
      if(callback) callback(null, { message: 'Schema resync failure recorded' });
    });
  },

  addCustomDomain(params) {
    if(!params.subdomain || !params.domain) throw '400';
    ModelManager.domainToSubdomain[params.domain] = params.subdomain
  },

  deleteCustomDomain(params) {
    if(!params.domain) throw '400';
    delete ModelManager.domainToSubdomain[params.domain];
  },

  updateAuth(params) {
    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].appDetails) throw '400';

    ModelManager.models[params.subdomain].appDetails.auth = ModelManager.models[params.subdomain].appDetails.auth || {};

    if(params.jwt_key) ModelManager.models[params.subdomain].appDetails.auth.jwt_key = params.jwt_key;
    if(params.jwt_type) ModelManager.models[params.subdomain].appDetails.auth.jwt_type = params.jwt_type;
    if(params.token_header) ModelManager.models[params.subdomain].appDetails.auth.token_header = params.token_header;

    if(params.user_id_session_key) ModelManager.models[params.subdomain].appDetails.auth.user_id_session_key = params.user_id_session_key;
    if(params.user_id_column_id) ModelManager.models[params.subdomain].appDetails.auth.user_id_column_id = params.user_id_column_id;
    if(params.role_session_key) ModelManager.models[params.subdomain].appDetails.auth.role_session_key = params.role_session_key;
  },

  updateGraphql(params) {
    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].appDetails) throw '400';
    if(!Array.isArray(params.tables)) throw '400';
    if(typeof params.enabled !== 'boolean') throw '400';

    ModelManager.models[params.subdomain].appDetails.graphql = {
      tables: params.tables,
      enabled: params.enabled
    };
  },

  updateRole(params) { 
    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].appDetails) throw '400';
    
    ModelManager.models[params.subdomain].appDetails.auth = ModelManager.models[params.subdomain].appDetails.auth || {};

    // ModelManager.models[params.subdomain].appDetails.auth.roles = params.roles;
    // console.log(ModelManager.models[params.subdomain].appDetails)

    db.query({
      text: `SELECT 
                      roles.name as role_name,
                      role_types.name as role_type_name,
                      roles.custom_permissions as custom_permissions,
                      role_value
                    FROM 
                      roles
                      join role_types on (
                        roles.role_type_id = role_types.role_type_id
                      )
                    WHERE 
                      auth_detail_id in (select auth_detail_id from auth_details where app_id = (select app_id from subdomain_gen where name = $1))`,
      values: [params.subdomain]
    }, function(err, result) {
      if(err) return console.log(err);
      ModelManager.models[params.subdomain].appDetails.auth.roles = result.rows;
    })
  },

  updateAuthSessionParams(params) {
    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].appDetails) throw '400';

    ModelManager.models[params.subdomain].appDetails.auth = ModelManager.models[params.subdomain].appDetails.auth || {};

    ModelManager.models[params.subdomain].appDetails.auth.session_key_values = params.session_key_values;
  },

  updateCORS(params) {
    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].appDetails) throw '400';
    ModelManager.models[params.subdomain].appDetails.cors = params.cors
  },

  updateRoute(params) {

    var req_params = [
      'query_id',
      'db_id',
      'route',
      'method',
      'query_json',
      'sqlmethod',
      'auth_required'
    ]
    for (let i = 0; i < req_params.length; i++) {
      const element = req_params[i];
      if(params[req_params[i]] === undefined) throw new Error( `'400' missing field '${req_params[i]}'` );
    }

    if(!ModelManager.models[params.subdomain] || !ModelManager.models[params.subdomain].routes) throw '400';

    ModelManager.models[params.subdomain].routes[params.route] = ModelManager.models[params.subdomain].routes[params.route] || {};

    ModelManager.models[params.subdomain].routes[params.route][params.method] = {
      query_id: params.query_id,
      db_id: params.db_id,
      route: params.route,
      method: params.method,
      query_json: params.query_json,
      sqlmethod: params.sqlmethod,
      querypaths: params.querypaths,
      auth_required: params.auth_required,
      base: params.base
    };

  },

  deleteRoute(params) {

    if(
      !params.subdomain || 
      !params.method || 
      !params.route ||
      !ModelManager.models[params.subdomain] ||
      !ModelManager.models[params.subdomain].routes[params.route] || 
      !ModelManager.models[params.subdomain].routes[params.route][params.method]
      ) return;

    ModelManager.models[params.subdomain].routes[params.route][params.method] = null;

  },

  deleteApp(params) {

    if(
      !params.subdomain ||
      !ModelManager.models[params.subdomain]
      ) return;

    delete ModelManager.models[params.subdomain];

  },

  extractSchema: function(localDb, callback) {

    let db_type = localDb.db_type == MYSQL ? MYSQL : POSTGRES;
    let query_values =[]; 
    if(db_type == MYSQL) {
      if(!options.db_name) throw new Error("Must have 'db_name' of  Mysql database"); 
      query_values = [options.db_name, options.db_name, options.db_name ];
    }

    localDb.query({
      text: ModelManager.query[db_type],
      values: query_values
    }, function(err, result){
      // console.log( "----->>err")
      // console.log( err)
      if(err) {
        return callback(err);
      }
 
      var rows = result.rows || [];
      callback(null, rows);
    }); 

  },

  saveSchema: function(params, callback){

    var unix_sec = Math.round(Date.now()/1000)

    db.query({
      text: `
              INSERT INTO public.schema_defs (db_id, def, last_sync_attempt_time, last_sync_success_time) 
              VALUES 
              (
                $1, $2, $3, $3
              ) on conflict (db_id) do update set 
              def = $2,
              last_sync_attempt_time = $3,
              last_sync_success_time = $3
              RETURNING custom_columns,enum_tables
              `, 
      values: [params.db_id, JSON.stringify(params.rows), unix_sec],
    },
    function (err, result) {
      if (err) {
        // Sentry.setExtra('data', JSON.stringify({
        //   subdomain: options.subdomain,
        //   db_id: options.db_id,
        // }))
        Sentry.captureError(err) 
        return callback(err);
      }
      callback(err, params)
    });

  },

  extractAndSaveSchema: function(localDb, callback){ 

    ModelManager.extractSchema(localDb, function(err, rows){
      if(err) return callback(err);
      ModelManager.saveSchema({
        db_id: localDb.db_id,
        rows: rows
      }, function(err , result){
        callback(err, result)
      })
    })
    
  } 
  ,

  makeModelFromSchema: function(params){ 

    var rows = params.rows;
     
    var idToName = {}, tidToName = {}, graphql_tables = {}, table_count = 0, schema_count = 0;
    var def = {};
    var tid = 0;
    for (var i = 0; i < rows.length; i++) {
      if(!def[rows[i].nspname]) {
        ++schema_count;
        def[rows[i].nspname] = {};
      }
      // add class and property , and count number of distinct  tables 
      if(!def[rows[i].nspname][rows[i].relname]) {
        ++table_count;
        // ++tid;
        def[rows[i].nspname][rows[i].relname] = class extends base {
          constructor(){
            super();
            return this;
          }
        };
        // def["public"]["customers"]
        def[rows[i].nspname][rows[i].relname].properties = {
          schema_name: rows[i].nspname,
          table_name: rows[i].relname,
          columns: {},
          id: rows[i].attrelid,
          primary: [],
          unique: [],
          relations: {},
          referencedBy: {},
          uindex: {},
          notnulls: [],
          serials: [],
          idToName: {},
          // new
          // types: 1-1, 1-M, M-1
          rels: {},
          rels_new: {}
        };
      }
    }
    // console.log( rows)
    for (let i = 0; i < rows.length; i++) {

      var id = def[rows[i].nspname][rows[i].relname].properties.id + '.' + rows[i].attnum;
      tidToName[def[rows[i].nspname][rows[i].relname].properties.id] = [rows[i].nspname, rows[i].relname];
      idToName[id] = [rows[i].nspname, rows[i].relname, rows[i].name];

      var graphql_table_name = (rows[i].nspname == 'public' ? '' : (rows[i].nspname + '_')) + rows[i].relname;

      graphql_tables[graphql_table_name] = graphql_tables[graphql_table_name] || {
        table_schema: [rows[i].nspname, rows[i].relname],
        rel_tables_raw: {}
      }
      // def.maps.nameToId[rows[i].nspname + '.' + rows[i].relname + '.' + rows[i].name] = id;
      def[rows[i].nspname][rows[i].relname].properties.display_name = rows[i].table_display_name;
      def[rows[i].nspname][rows[i].relname].properties.required_entries = rows[i].table_required_entries;
      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name] = def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name] || {};
      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].id = rows[i].attnum;
      def[rows[i].nspname][rows[i].relname].properties.idToName[rows[i].attnum] = rows[i].name;
      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].type = rows[i].type;
      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].default = rows[i].default;

      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].not_null = rows[i].notnull;

      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].primary = (rows[i].primarykey == 't' ? true : false);

      if (rows[i].foreignkey_fieldname) {
        def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].foreign = true;
        def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].fk_col = `${rows[i].foreignkey_schema}.${rows[i].foreignkey}.${rows[i].foreignkey_fieldname}`;
      } else if (def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].foreign != true) {
        // update only if foreign key is not set to true
        def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].foreign = false;
        def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].fk_col = null;
      } 
       
      if(rows[i].uniquekey == 't') {
        def[rows[i].nspname][rows[i].relname].properties.unique.push(rows[i].name);
      }

      def[rows[i].nspname][rows[i].relname].properties.columns[rows[i].name].unique = (rows[i].uniquekey == 't' ? true : false);

      if(rows[i].uindex) {
        if(!def[rows[i].nspname][rows[i].relname].properties.uindex[rows[i].uindex]) def[rows[i].nspname][rows[i].relname].properties.uindex[rows[i].uindex] = [];
        if(def[rows[i].nspname][rows[i].relname].properties.uindex[rows[i].uindex].indexOf(rows[i].name) == -1) def[rows[i].nspname][rows[i].relname].properties.uindex[rows[i].uindex].push(rows[i].name);
      }
      if (rows[i].primarykey == 't') {
        if(def[rows[i].nspname][rows[i].relname].properties.primary.indexOf(rows[i].name) == -1) def[rows[i].nspname][rows[i].relname].properties.primary.push(rows[i].name);
      }
      // if (rows[i].uniquekey == 't') {
      //   if(def[rows[i].nspname][rows[i].relname].properties.unique.indexOf(rows[i].name) == -1) def[rows[i].nspname][rows[i].relname].properties.unique.push(rows[i].name);
      // }
      if (typeof rows[i].foreignkey == 'string' && def[rows[i].foreignkey_schema]) {
        // if(rows[i].nspname == 'public' && rows[i].relname == 'firms' && rows[i].name == 'preqin_id') console.log('CAUGHT', rows[i]) 
        def[rows[i].nspname][rows[i].relname].properties.relations[rows[i].name] = rows[i].foreignkey_schema + '.' + rows[i].foreignkey + '.' + rows[i].foreignkey_fieldname;

        var rel_id = rows[i].nspname + '.' + rows[i].relname + '.' + rows[i].name + '-' + rows[i].foreignkey_schema + '.' + rows[i].foreignkey + '.' + rows[i].foreignkey_fieldname;
        def[rows[i].nspname][rows[i].relname].properties.rels_new[rel_id] = def[rows[i].nspname][rows[i].relname].properties.rels_new[rel_id] || {};
        def[rows[i].nspname][rows[i].relname].properties.rels[rel_id] = rows[i].uindex ? '1-1' : 'M-1';
        def[rows[i].nspname][rows[i].relname].properties.rels_new[rel_id].type = rows[i].uindex ? '1-1' : 'M-1';
        def[rows[i].nspname][rows[i].relname].properties.rels_new[rel_id].direct = 'out';

        graphql_tables[graphql_table_name].rel_tables_raw[rows[i].foreignkey_schema + '.' + rows[i].foreignkey] = graphql_tables[graphql_table_name].rel_tables_raw[rows[i].foreignkey_schema + '.' + rows[i].foreignkey] || 0;

        ++graphql_tables[graphql_table_name].rel_tables_raw[rows[i].foreignkey_schema + '.' + rows[i].foreignkey];

        def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.referencedBy[rows[i].foreignkey_fieldname] = def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.referencedBy[rows[i].foreignkey_fieldname] || [];

        var rel_id_rev = rows[i].foreignkey_schema + '.' + rows[i].foreignkey + '.' + rows[i].foreignkey_fieldname + '-' + rows[i].nspname + '.' + rows[i].relname + '.' + rows[i].name;
        def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.rels_new[rel_id_rev] = def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.rels_new[rel_id_rev] || {};
        def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.rels[rel_id_rev] = rows[i].uindex ? '1-1' : '1-M';
        def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.rels_new[rel_id_rev].type = rows[i].uindex ? '1-1' : '1-M';
        def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.rels_new[rel_id_rev].direct = 'in';

        if(def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.referencedBy[rows[i].foreignkey_fieldname].indexOf(rows[i].nspname + '.' + rows[i].relname + '.' + rows[i].name) == -1) {
          def[rows[i].foreignkey_schema][rows[i].foreignkey].properties.referencedBy[rows[i].foreignkey_fieldname].push(rows[i].nspname + '.' + rows[i].relname + '.' + rows[i].name);

          var fkey_graphql_table = (rows[i].foreignkey_schema == 'public' ? '' : (rows[i].foreignkey_schema + '_')) + rows[i].foreignkey;
          graphql_tables[fkey_graphql_table] = graphql_tables[fkey_graphql_table] || {
            table_schema: [rows[i].foreignkey_schema, rows[i].foreignkey],
            rel_tables_raw: {}
          }
          graphql_tables[fkey_graphql_table].rel_tables_raw[rows[i].nspname + '.' + rows[i].relname] = graphql_tables[fkey_graphql_table].rel_tables_raw[rows[i].nspname + '.' + rows[i].relname] || 0;
          ++graphql_tables[fkey_graphql_table].rel_tables_raw[rows[i].nspname + '.' + rows[i].relname];
        }
      }
      if (typeof rows[i].default == 'string' && rows[i].default.indexOf('nextval(') > -1) {
        def[rows[i].nspname][rows[i].relname].properties.serials.push(rows[i].name);
      }
      if (rows[i].notnull == true) {
        if(def[rows[i].nspname][rows[i].relname].properties.notnulls.indexOf(rows[i].name) == -1) def[rows[i].nspname][rows[i].relname].properties.notnulls.push(rows[i].name);
      }
    }

    var graphql_models = Object.keys(graphql_tables)

    for (let i = 0; i < graphql_models.length; i++) {
      const element = graphql_models[i];
      graphql_tables[element].relations = {};

      var rels = Object.keys(def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new);
      for (let j = 0; j < rels.length; j++) {
        const element2 = rels[j];
        var rel_table_arr = element2.split('-')[1].split('.');
        var rel_table = rel_table_arr.slice(0, 2).join('.');
        var rel_table_graphql = (rel_table_arr[0] == 'public' ? '' : (rel_table_arr[0] + '_')) + rel_table_arr[1];
        var base_table_arr = element2.split('-')[0].split('.');
        var base_table = base_table_arr.slice(0, 2).join('.');
        var base_table_graphql = (base_table_arr[0] == 'public' ? '' : (base_table_arr[0] + '_')) + base_table_arr[1];

        var base_mod_name = (rel_table_arr[0] == 'public' ? '' : (rel_table_arr[0] + '_')) + rel_table_arr[1];
        var base_rel_name = base_mod_name;
        if(def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new[element2].type.charAt(2) == 'M') {
          base_rel_name = pluralize.plural(base_rel_name);
        } else {
          base_rel_name = pluralize.singular(base_rel_name);
        }
        
        if(graphql_tables[element].rel_tables_raw && graphql_tables[element].rel_tables_raw[rel_table] > 1) {
          // multiple relations to same table
          if(def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new[element2].direct == 'out') {
            // use lhs column name
            base_rel_name = base_rel_name + '_by_' + base_table_arr[2];
          } else {
            // use rhs column name
            base_rel_name = base_rel_name + '_by_' + rel_table_arr[2];
          }
        }
        var text_path_split = element2.split('-');
        var text_path_split_lhs = text_path_split[0].split('.');
        var text_path_split_rhs = text_path_split[1].split('.');
        var id_path = def[text_path_split_lhs[0]][text_path_split_lhs[1]].properties.id + '.' + def[text_path_split_lhs[0]][text_path_split_lhs[1]].properties.columns[text_path_split_lhs[2]].id + '-' + def[text_path_split_rhs[0]][text_path_split_rhs[1]].properties.id + '.' + def[text_path_split_rhs[0]][text_path_split_rhs[1]].properties.columns[text_path_split_rhs[2]].id;

        def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new[element2].alias = base_rel_name;

        graphql_tables[element].relations[base_rel_name] = {
          text_path: element2,
          id_path: id_path,
          type: def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new[element2].type,
          direct: def[graphql_tables[element].table_schema[0]][graphql_tables[element].table_schema[1]].properties.rels_new[element2].direct,
          rel_table: rel_table,
          base_table: base_table,
          rel_table_graphql: rel_table_graphql,
          base_table_graphql: base_table_graphql
        }
      }
      delete graphql_tables[element].rel_tables_raw;
    }

    return {
      models: def,
      idToName: idToName,
      tidToName: tidToName,
      table_count: table_count,
      schema_count: schema_count,
      graphql_tables: graphql_tables
    }; 
  }, 

  query: {
    [POSTGRES]: `

SELECT n.nspname,
    c.relname,
    f.attrelid,
    c.oid,
    f.attnum AS number,
    f.attname AS name,
    f.attnum,
    f.attnotnull AS NOTNULL,
    pg_catalog.format_type(f.atttypid, f.atttypmod) AS TYPE,
    CASE
        WHEN p.contype = 'p' THEN 't'
        ELSE 'f'
    END AS primarykey,
    CASE
        WHEN p.contype = 'u' OR (idx.indisunique AND idx.indrelid IS NOT NULL) THEN 't'
        ELSE 'f'
    END AS uniquekey,
    CASE
        WHEN p.contype = 'u' THEN p.conname
        WHEN idx.indisunique THEN ci.relname
    END AS uindex,
    CASE
        WHEN p.contype = 'f' THEN g.relname
    END AS foreignkey,
    CASE
        WHEN p.contype = 'f' THEN p.confkey
    END AS foreignkey_fieldnum,
    CASE
        WHEN p.contype = 'f' THEN
               (SELECT attname
                FROM pg_attribute
                WHERE attrelid = p.confrelid
                  AND attnum = p.confkey[1])
    END AS foreignkey_fieldname,
    CASE
        WHEN p.contype = 'f' THEN nn.nspname
    END AS foreignkey_schema,
    CASE
        WHEN p.contype = 'f' THEN p.conkey
    END AS foreignkey_connnum,
    CASE
        WHEN f.atthasdef = 't' THEN pg_get_expr(d.adbin, d.adrelid)
    END AS DEFAULT
FROM pg_attribute f
JOIN pg_class c ON c.oid = f.attrelid
JOIN pg_type t ON t.oid = f.atttypid
LEFT JOIN pg_attrdef d ON d.adrelid = c.oid
AND d.adnum = f.attnum
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_constraint p ON p.conrelid = c.oid
AND f.attnum = ANY (p.conkey)
LEFT JOIN pg_class AS g ON p.confrelid = g.oid
LEFT JOIN pg_namespace AS nn ON g.relnamespace = nn.oid
LEFT JOIN pg_index idx ON idx.indrelid = c.oid 
    AND f.attnum = ANY(idx.indkey)
LEFT JOIN pg_class ci ON ci.oid = idx.indexrelid

WHERE c.relkind = 'r'::char
AND f.attnum > 0
AND (n.nspowner != 10
    OR n.nspname = 'public')
ORDER BY c.oid DESC;

    `,
    // TODO  : update to dynamic db_name  in where nspace
    [MYSQL]: `
    WITH tables_list AS (
      SELECT
        columns.table_schema AS nspname,
        SUBSTRING(
          innodb_tables.name,
          length(columns.table_schema) + 2,
          256
        ) AS relname,
        innodb_tables.table_id AS attrelid,
        innodb_tables.table_id AS oid,
        innodb_columns.pos AS number,
        innodb_columns.name,
        innodb_columns.pos AS attnum,
        (
          CASE
            WHEN LOWER(columns.is_nullable) = 'yes' THEN 'false'
            ELSE 'true'
          END
        ) AS notnull,
        columns.data_type AS type,
        (
          CASE
            WHEN LOWER(columns.column_key) = 'pri' THEN 't'
            ELSE 'f'
          END
        ) AS primarykey,
        (
          CASE
            WHEN LOWER(columns.column_key) = 'uni' THEN 't'
            ELSE 'f'
          END
        ) AS uniquekey,
        (
          CASE
            WHEN LOWER(columns.column_key) = 'uni' THEN innodb_columns.pos
          END
        ) AS uindex,
        innodb_columns.default_value AS 'default'
      FROM
        information_schema.innodb_tables
        JOIN information_schema.innodb_columns ON innodb_tables.table_id = innodb_columns.table_id
        JOIN information_schema.columns ON columns.table_name = SUBSTRING(
          innodb_tables.name,
          length(columns.table_schema) + 2,
          256
        )
        AND innodb_tables.table_id = innodb_columns.table_id
        AND columns.ordinal_position - 1 = innodb_columns.pos
      WHERE
        columns.table_schema = ?
    ),
    keys_list AS (
      SELECT
        innodb_foreign_cols.for_col_name,
        innodb_foreign_cols.ref_col_name,
        SUBSTRING(
          innodb_foreign.for_name,
          length(
            referential_constraints.constraint_schema
          ) + 2,
          256
        ) AS forkey,
        SUBSTRING(
          innodb_foreign.ref_name,
          length(
            referential_constraints.constraint_schema
          ) + 2,
          256
        ) AS foreignkey,
        innodb_foreign_cols.pos - 1 AS foreignkey_fieldnum,
        innodb_foreign_cols.ref_col_name AS foreignkey_fieldname,
        referential_constraints.constraint_schema AS foreignkey_schema
      FROM
        information_schema.innodb_foreign_cols
        JOIN information_schema.innodb_foreign ON information_schema.innodb_foreign_cols.id = information_schema.innodb_foreign.id
        JOIN information_schema.referential_constraints ON SUBSTRING(
          innodb_foreign_cols.id,
          length(
            referential_constraints.constraint_schema
          ) + 2,
          256
        ) = information_schema.referential_constraints.constraint_name
      where
        referential_constraints.constraint_schema = ?
    )
    SELECT
      tables_list.nspname, 
      tables_list.relname, 
      tables_list.attrelid, 
      tables_list.oid, 
      tables_list.number, 
      tables_list.name, 
      tables_list.attnum, 
      tables_list.notnull, 
      tables_list.type, 
      tables_list.primarykey, 
      tables_list.uniquekey, 
      tables_list.uindex, 
      keys_list.foreignkey, 
      keys_list.foreignkey_fieldnum, 
      keys_list.foreignkey_fieldname, 
      keys_list.foreignkey_schema,  
      (
        CASE
          WHEN keys_list.foreignkey IS NOT NULL THEN tables_list.number
        END
      ) AS foreignkey_connnum,
      tables_list.DEFAULT
    FROM
      tables_list
      left JOIN keys_list ON tables_list.name COLLATE utf8_general_ci = keys_list.for_col_name
      and tables_list.relname = keys_list.forkey
    WHERE
      nspname = ?
    ORDER BY
      attrelid,
      number ASC
    `
  }

  // extraModels: {

  //   loadAppConfig: function(app_id, callback){
  
  //     var m = new models.
  
  //   }
  
  // }

};

var extramodels = {

  loadAppConfig: function(url, callback){

  }

};

module.exports = ModelManager;

// let connectionString = "mysql://" + params.dbusername + ":" + params.dbpassword + "@" + params.dbhost + ":" + params.dbport + "/" + params.dbname
// console.log(connectionString )

// let connectionString = ''
// try{ 
//   const client = mysql.createConnection(   connectionString  );

//   client.connect(function (err) {
//     if (err) {
//       console.error('connection error', err.stack)
  
//     } 
//     let query =   `show databases;`
    
//     client.query( ModelManager.query[MYSQL], ['mysql'], function (err, result) {
    
//       console.log(JSON.stringify(result, null, 0))
//       console.file( result)
//       client.end();
//     });
//   });