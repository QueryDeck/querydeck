// var ModelManager = require.main.require('./models/modelManager');
var v2json = require.main.require('./models/viewToJSON.js');
var json2sql = require.main.require('./models/JsonToSql.js');

exports.convert = function(params){

    if(
        !params.db_id || 
        !params.subdomain || 
        // !ModelManager.models[params.subdomain] ||
        !params.currentModel ||
        !params.c ||
        !Array.isArray(params.c) ||
        !params.base
    ) return null;

    params.method = params.method || 'select';

    // let currentModel = ModelManager.models[params.subdomain].databases[params.db_id];
    let currentModel = params.currentModel;

    // var roles = ModelManager.models[params.subdomain].appDetails.auth.roles;
    var roles = params.roles;

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
            currentModel: currentModel,
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
              where: params.w,
              graphql: params.graphql,
              joins: params.joins,
              include_result_count: params.include_result_count
            }
          })[params.select_by_id ? 'convertSelectByID' : 'convertSelect']()

          queryob.query = new json2sql(
            [queryob.model],
            currentModel,
            { db_type: currentModel.db_type }
          ).generate();

          if(queryob.model.limit_dynamic) {
            request_query_params._limit = {
              type: 'number',
              description: 'Number of results to return per page (default: ' + queryob.model.limit + ', max: 1000)'
            }
          }

          if(queryob.model.offset_dynamic) {
            request_query_params._offset = {
              type: 'number',
              description: 'The initial index from which to return the results (default: 0)'
            }
          }

          if(queryob.model.orderby_dynamic && queryob.model.orderby_dynamic_columns.length > 0) {
            request_query_params._order = {
              type: 'text',
              description: 'Order results by columns. Format: column1:asc,column2:desc. Available columns: ' + 
                queryob.model.orderby_dynamic_columns.map(col => col.alias).join(', ')
            }

            if(queryob.model.orderby && queryob.model.orderby.length > 0) {
              request_query_params._order.description += ' (default: ' + queryob.model.orderby.map(col => (col.name.split('.').pop() + ':' + (col.asc ? 'asc' : 'desc'))).join(',') + ')'
            }
          }

          queryob.query.querypaths = queryob.query.querypaths || [];

          for(let i = 0; i < queryob.query.querypaths.length; i++) {
            if(queryob.query.querypaths[i].input_key.indexOf('QUERY') > -1) {
              request_query_params[queryob.query.querypaths[i].input_key.split('.')[1]] = {
                type: queryob.query.querypaths[i].type,
                required: queryob.query.querypaths[i].required
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
            currentModel: currentModel,
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
              single_base_insert: params.single_base_insert,
              graphql: params.graphql
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
            currentModel: currentModel,
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
              where: params.w,
              graphql: params.graphql
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
        currentModel: currentModel,
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
          where: params.w,
          graphql: params.graphql
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
    queryob.docs.llm_agent_tooling = {
      name: 'search_investors',
      description: `Get the investors filters and search for investors or people within investor organizations. Filters are same as tool_input produced by this tool. 
         If user is asking to perform a search to find any investor or people within investor firms, provide brief of the filters applied based on tool result.
         Do not use if query is about a single investor and user is providing the name. 
         If user asking to narrow down filter with a vague ask, ask the user to try to get more details from user like geography, industries, etc.
         ex user: Further refine this search result. assistant: Can you please help me with specific sector or country.

         RETURNS:
         totalResultNumber: Total number of results found after applying filters.`,
      input_schema: {
        type: 'object',
        properties: {
          cities: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'City name, ex New York. Use this field when searching for investors based on what city they are based in. Select multiple cities when relevant, not just one. Ex: ["New York", "Los Angeles"]',
          },
          isPeople: {
            type: 'boolean',
            description:
              'Set to true when searching for specific people within investor organizations (e.g., "find managers at VC firms", "search for partners"). Set to false when searching for investor firms/entities themselves (e.g., "find VCs investing in fintech", "search for angel investors"). Default is false.',
          },
          has_email: {
            type: 'boolean',
            description:
              'Set to true when searching for people within investor organizations who have email addresses available (e.g., "find VC partners with contact emails", "search for investment managers with email contacts"). Only relevant when isPeople is true. Set to false when email availability is not a requirement. Default is false.',
          },
          states: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'State name, ex California. Use this field when searching for investors based on what state they are based in. Select multiple states when relevant, not just one. Ex: ["Texas", "California"]',
          },
          designations: {
            type: 'array',
            items: {
              type: 'string',
              // enum: pd,
            },
            description:
              'Designation of people within investor organizations. Use this field when searching for specific roles within investor firms like Managing Partners, Investment Directors, etc. Select multiple designations when relevant, not just one. Ex: ["Managing Director", "Investment Manager"]',
          },
          keyword: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'Specific keywords or terms used to find industries or categorize data in a simple searchable word form. Examples: ["tech", "technology", "IT", "iot", "bio"]. These keywords help identify which types of business the investor wants to invest.',
          },
          investorIndustries: {
            type: 'array',
            items: {
              type: 'string',
              // enum: i,
            },
            description:
              'The industry preference for given investor. Select multiple industries when relevant, not just one. Ex: ["Financial Technology (FinTech)", "Artificial Intelligence"]',
          },
          investorsType: {
            type: 'array',
            items: {
              type: 'string',
              // enum: t,
            },
            description:
              'The type of investor. Select multiple types when relevant, not just one. Ex: ["Venture Capital", "Angel Investor"]',
          },

          investmentStage: {
            type: 'array',
            items: {
              type: 'string',
              // enum: s,
            },
            description:
              'The investment stage of the company. Select multiple stages when relevant, not just one. Ex: ["Seed", "Early Stage VC"]',
          },
          investorCountryHQ: {
            type: 'array',
            items: {
              type: 'string',
              // enum: c,
            },
            description:
              'Investor country code. Use this field when searching for investors located in a specific country. This is different from the investorCountryPref field. An investor might be based in India but might prefer to invest in multiple countries. Select multiple countries when relevant, not just one. Ex: ["India", "United States"]',
          },
          investorCountryPref: {
            type: 'array',
            items: {
              type: 'string',
              // enum: c,
            },
            description:
              'Investor country preference, ex India. Use this field when searching for investors based on what country they prefer to invest in. This is different from the investorCountry field. An investor might be based in India but might prefer to invest in multiple countries. Select multiple countries when relevant, not just one. Ex: ["India", "United States"]',
          },
          dealCountry: {
            type: 'array',
            items: {
              type: 'string',
              // enum: c,
            },
            description:
              'Deal country criteria - Filter investors by the countries where they have made investments/deals. Used to find investors with deal activity in specific geographic markets. Select multiple countries when relevant, not just one. Ex: ["India", "United States"]',
          },
          dealIndustry: {
            type: 'array',
            items: {
              type: 'string',
              // enum: i,
            },
            description:
              'Deal industry criteria - Filter investors by the industries where they have made investments/deals. Used to find investors with deal activity in specific industry sectors. Select multiple industries when relevant, not just one. Example: ["Financial Technology (FinTech)", "Artificial Intelligence", "Healthcare"]',
          },
          dealType: {
            type: 'array',
            items: {
              type: 'string',
              // enum: d,
            },
            description:
              'The type of Deal. Select multiple types when relevant, not just one. Ex: ["Capitalization", "Angel", "Seed Round"]',
          },
          minDealSize: {
            type: 'number',
            description:
              'Minimum deal amount raised by the company, always in million USD',
          },
          maxDealSize: {
            type: 'number',
            description:
              'Maximum deal amount raised by the company, always in million USD',
          },
          minAUM: {
            type: 'number',
            description:
              'Minimum AUM(Asset Under Management) raised by the company, always in million USD',
          },
          maxAUM: {
            type: 'number',
            description:
              'Maximum AUM(Asset Under Management) raised by the company, always in million USD',
          },
          dealDateMin: {
            type: 'string',
            format: 'date',
            description:
              'Minimum deal date in format YYYY-MM-DD, ex 2025-05-14',
          },
          dealDateMax: {
            type: 'string',
            format: 'date',
            description:
              'Maximum deal date in format YYYY-MM-DD, ex 2025-05-14',
          },
          minYearFounded: {
            type: 'number',
            description: 'The Minimum year a company was founded.',
          },
          maxYearFounded: {
            type: 'number',
            description: 'The Maximum year a company was founded.',
          },

          // Fund Criteria fields

          minInvestmentRequired: {
            type: 'number',
            description:
              'Minimum investment amount preferred by the investor, always in million USD. Use this when searching for investors with specific investment criteria.',
          },
          maxInvestmentRequired: {
            type: 'number',
            description:
              'Maximum investment amount preferred by the investor, always in million USD. Use this when searching for investors with specific investment criteria.',
          },

          valuationMin: {
            type: 'number',
            description:
              'Minimum valuation amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific valuation criteria.',
          },
          valuationMax: {
            type: 'number',
            description:
              'Maximum valuation amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific valuation criteria.',
          },
          revenueMin: {
            type: 'number',
            description:
              'Minimum revenue amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific revenue criteria.',
          },
          revenueMax: {
            type: 'number',
            description:
              'Maximum revenue amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific revenue criteria.',
          },
          ebitdaMin: {
            type: 'number',
            description:
              'Minimum EBITDA amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific EBITDA criteria.',
          },
          ebitdaMax: {
            type: 'number',
            description:
              'Maximum EBITDA amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific EBITDA criteria.',
          },
          ebitMin: {
            type: 'number',
            description:
              'Minimum EBIT amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific EBIT criteria.',
          },
          ebitMax: {
            type: 'number',
            description:
              'Maximum EBIT amount (always in million USD) for companies that the investor prefers to invest in. Use this when searching for investors with specific EBIT criteria.',
          },
        },
        required: ['At least one of the fields is required', 'isPeople'],
      },
    };

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