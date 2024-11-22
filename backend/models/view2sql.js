var ModelManager = require.main.require('./models/modelManager');
var v2json = require.main.require('./models/viewToJSON.js');
var json2sql = require.main.require('./models/JsonToSql.js');

exports.convert = function(params){

    if(
        !params.db_id || 
        !params.subdomain || 
        !ModelManager.models[params.subdomain] ||
        !params.c ||
        !Array.isArray(params.c) ||
        !params.base
    ) return null;

    params.method = params.method || 'select';

    let currentModel = ModelManager.models[params.subdomain].databases[params.db_id];

    var roles = ModelManager.models[params.subdomain].appDetails.auth.roles;

    var role_arr = []

    roles = roles || [];

    var allowed_role_names = [];

    for(let i = 0; i < roles.length; i++) {
      var role_ob = {
        role_name: roles[i].role_name,
        role_type_name: roles[i].role_type_name,
      }
      var tab_name = currentModel.tidToName[params.base];

      if(tab_name) tab_name = tab_name.join('.');
      else continue;

      if(roles[i].role_type_name == 'Admin') {
        role_ob.access_type = 1;
      } else {
        if(roles[i].custom_permissions && roles[i].custom_permissions[tab_name] && roles[i].custom_permissions[tab_name][params.method]) {
          role_ob.access_type = roles[i].custom_permissions[tab_name][params.method].access_type;
          role_ob.conditions = roles[i].custom_permissions[tab_name][params.method].conditions;
        } else {
          role_ob.access_type = -1;
        }
      }
      if(role_ob.access_type != -1) allowed_role_names.push(role_ob.role_name);
      role_arr.push(role_ob);
    }

    var queryob;

    var request_query_params = {}

    var docs = {
      apiRoute: params.apiRoute
    };
    
    if(params.method == 'select'){

      docs.title = (params.select_by_id ? 'Get ' : 'List ') + cleanTname(currentModel.tidToName[params.base][1], (params.select_by_id ? false : true)) + (params.select_by_id ? ' by ID' : '');

        queryob = new v2json({
            subdomain: params.subdomain,
            db_id: params.db_id,
            viewdata: {
              columns: params.c,
              all_columns: params.all_columns,
              // agg_paths: params.agg_paths,
              regular_join_paths: params.regular_join_paths,
              join_type: params.join_type,
              orderby: params.orderby,
              orderby_dynamic: params.orderby_dynamic ? true : false,
              orderby_dynamic_columns: params.orderby_dynamic_columns,
              limit: params.limit,
              limit_dynamic: params.limit_dynamic ? true : false,
              offset: params.offset,
              offset_dynamic: params.offset_dynamic ? true : false,
              base: params.base,
              join_conditions: params.join_conditions,
              where: params.w
            }
          })[params.select_by_id ? 'convertSelectByID' : 'convertSelect']()

          queryob.query = new json2sql(
            [queryob.model],
            currentModel,
            { db_type: currentModel.db_type }
          ).generate();

          if(params.orderby_dynamic) {
            request_query_params._order = {
              type: 'text'
            }
          }

          if(params.limit_dynamic) {
            request_query_params._limit = {
              type: 'number',
              description: 'Number of results to return per page (default: ' + params.limit + ', max: 1000)'
            }
          }

          if(params.offset_dynamic) {
            request_query_params._offset = {
              type: 'number',
              description: 'The initial index from which to return the results (default: 0)'
            }
          }

          queryob.query.querypaths = queryob.query.querypaths || [];

          for(let i = 0; i < queryob.query.querypaths.length; i++) {
            if(queryob.query.querypaths[i].input_key.indexOf('QUERY') > -1) {
              request_query_params[queryob.query.querypaths[i].input_key.split('.')[1]] = {
                type: queryob.query.querypaths[i].type,
                required: true
              };
            }
          }

          docs.request_query = request_query_params;
          docs.response = queryob.response || {};
          docs.response_detailed = queryob.response_detailed || {};

          queryob.query.request_query_params = request_query_params;

          docs.sql_query = {text: queryob.query.text};

    } else if(params.method == 'insert'){

      docs.title = 'Create ' + cleanTname(currentModel.tidToName[params.base][1], true);

        queryob = new v2json({
            subdomain: params.subdomain,
            db_id: params.db_id,
            viewdata: {
              columns: params.c,
              all_columns: params.all_columns,
              return_columns: params.return_c,
              on_conflict: params.on_conflict,
              allow_multiple_row_paths: params.allow_multiple_row_paths,
              // agg_paths: params.agg_paths,
              join_type: params.join_type,
              orderby: params.orderby,
              limit: params.limit,
              offset: params.offset,
              base: params.base,
              single_base_insert: params.single_base_insert
            }
          }).convertInsert();

          queryob.query = new json2sql(
            queryob.model,
            currentModel,
            { db_type: currentModel.db_type }
          ).generate();

          docs.request_body = queryob.formatted_request_body || queryob.request || {};
          docs.request_body_detailed = queryob.detailed_body || {};
          docs.response = queryob.response || {};
          docs.response_detailed = queryob.response_detailed || {};

          docs.sql_query = {text: queryob.query.text};

    } else if(params.method == 'update'){

      docs.title = 'Update ' + cleanTname(currentModel.tidToName[params.base][1], false);

        queryob = new v2json({
            subdomain: params.subdomain,
            db_id: params.db_id,
            viewdata: {
              columns: params.c,
              all_columns: params.all_columns,
              return_columns: params.return_c,
              // agg_paths: params.agg_paths,
              join_type: params.join_type,
              orderby: params.orderby,
              limit: params.limit,
              offset: params.offset,
              base: params.base,
              allowedPaths: params.allowedPaths,
              where: params.w
            }
          }).convertUpdate();

          if(queryob) {
            queryob.query = new json2sql(
              [queryob.model],
              currentModel,
              { db_type: currentModel.db_type }
            ).generate();

            queryob.query.querypaths = queryob.query.querypaths || [];

            for(let i = 0; i < queryob.query.querypaths.length; i++) {
              if(queryob.query.querypaths[i].input_key.indexOf('QUERY') > -1) {
                request_query_params[queryob.query.querypaths[i].input_key.split('.')[1]] = {
                  type: queryob.query.querypaths[i].type
                };
              }
            }

            queryob.query.request_query_params = request_query_params;
            docs.request_query = request_query_params;
            docs.request_body = queryob.formatted_request_body || queryob.request || {};
            docs.request_body_detailed = queryob.detailed_body || {};
            docs.response = queryob.response || {};
            docs.response_detailed = queryob.response_detailed || {};

            docs.sql_query = {text: queryob.query.text};
          } else {
            return null;
          }
          
    } else if(params.method == 'delete') {

      docs.title = 'Delete ' + cleanTname(currentModel.tidToName[params.base][1], false);
      
      queryob = new v2json({
        subdomain: params.subdomain,
        db_id: params.db_id,
        viewdata: {
          columns: params.c,
          all_columns: params.all_columns,
          return_columns: params.return_c,
          // agg_paths: params.agg_paths,
          join_type: params.join_type,
          orderby: params.orderby,
          limit: params.limit,
          offset: params.offset,
          base: params.base,
          allowedPaths: params.allowedPaths,
          where: params.w
        }
      }).convertDelete();

      if(queryob) {
        queryob.query = new json2sql(
          [queryob.model],
          currentModel,
          { db_type: currentModel.db_type }
        ).generate();
        queryob.query.querypaths = queryob.query.querypaths || [];

        for(let i = 0; i < queryob.query.querypaths.length; i++) {
          if(queryob.query.querypaths[i].input_key.indexOf('QUERY') > -1) {
            request_query_params[queryob.query.querypaths[i].input_key.split('.')[1]] = {
              type: queryob.query.querypaths[i].type
            };
          }
        }

        queryob.query.request_query_params = request_query_params;
        docs.request_query = request_query_params;
        docs.response = queryob.response || {};
        docs.response_detailed = queryob.response_detailed || {};

        docs.sql_query = {text: queryob.query.text};
      } else {
        return null;
      }
    }

    queryob.model.method = params.method;

    docs.method = params.method;
    docs.request_query = request_query_params;
    docs.request_body = queryob.formatted_request_body || queryob.request || {};
    docs.request_body_detailed = queryob.detailed_body || {};
    docs.response = queryob.response || {};
    docs.response_detailed = queryob.response_detailed || {};
    docs.allowed_roles = allowed_role_names;
    docs.auth_required = params.auth_required;
    docs.request_url_param = queryob.url_param_column;

    queryob.roles = role_arr;

    queryob.docs = docs;

    return queryob;

}

const pluralize = require('pluralize');

function cleanTname(tname, plural) {

  let words = tname.split('_');
  words = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
  if (plural) {
    words[words.length - 1] = pluralize(words[words.length - 1]);
  } else {
    words[words.length - 1] = pluralize.singular(words[words.length - 1]);
  }

  return words.join(' ');
}