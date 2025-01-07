var json2sql = require.main.require('./models/JsonToSql.js');
var replaceModelWithBody = require.main.require('./models/replaceModelWithBody.js').bodytoquery;
var DynamicInsertModels = require.main.require('./models/replaceModelWithBody.js').DynamicInsertModels;
var _ = require('lodash');
const graphqlConverter = require.main.require('./models/graphql.js').GraphQLConverter;
const modelutils = require.main.require('./models/modelUtils.js');

exports.executeClientRequest = executeClientRequest;

function executeClientRequest(params, callback) {

    if((!params.graphql || !params.graphql.query) && !params.query_model) {
        return callback({
            response_code: 400,
            error: 'GraphQL or REST model is required'
        });
    }

    var db_id = Object.keys(params.currentModel.databases)[0];

    var db = params.currentModel.databases[db_id].query;

    var auth_required = (params.graphql || (params.query_model && params.query_model.auth_required)) ? true : false;
    var user_id, user_role, current_role;

    // console.log('params', params)

    if(auth_required) {
        user_id = _.get(params.request.session, params.auth.user_id_session_key);
        user_role = _.get(params.request.session, params.auth.role_session_key);

        for(let i = 0; i < params.auth.roles.length; i++) {
            if(params.auth.roles[i].role_value == user_role) {  
                current_role = params.auth.roles[i];
            }
        }

        if(!user_id || !user_role || !current_role) {
            return callback({
                response_code: 403,
                error: 'Login required'
            })
        }
    }

    var query_exec_ob;

    if(params.graphql) {
        try {
            query_exec_ob = new graphqlConverter({
                currentModel: params.currentModel,
                subdomain: params.currentModel.appDetails.subdomain, 
                query: params.graphql.query,
                variables: params.graphql.variables,
                current_role: current_role
            });
        } catch (err) {
            console.log('err', err)
            return callback({
                response_code: 400,
                error: err.message
            });
        }
    } else {

        var gq_ob = {};

        if (params.query_model.sqlmethod == 'select' || params.query_model.sqlmethod == 'update' || params.query_model.sqlmethod == 'delete') {

            if(params.query_model.limit_dynamic && params.request.query._limit) {
                let limit = parseInt(params.request.query._limit);
                if(!isNaN(limit)) {
                    params.query_model.query_json.limit = limit;
                }
            }

            if(params.query_model.offset_dynamic && params.request.query._offset) {
                let offset = parseInt(params.request.query._offset);
                if(!isNaN(offset)) {
                    params.query_model.query_json.offset = offset;
                }
            }

            if(params.request.query._order && params.query_model.query_json.orderby_dynamic && params.query_model.query_json.orderby_dynamic_columns && params.query_model.query_json.orderby_dynamic_columns.length > 0) {

                let orderByArr = [];
                let orderItems = params.request.query._order.split(',');
                
                for(let i = 0; i < orderItems.length; i++) {
                    let [columnName, direction] = orderItems[i].split(':');
                    
                    let matchingColumn = params.query_model.query_json.orderby_dynamic_columns.find(
                        col => col.name.split('.').pop() === columnName
                    );

                    if(matchingColumn) {
                        orderByArr.push({
                            id: matchingColumn.id,
                            name: matchingColumn.name,
                            asc: direction.toLowerCase() === 'asc'
                        });
                    }
                }

                if(orderByArr.length > 0) {
                    params.query_model.query_json.orderby = orderByArr;
                }
            }

            if (params.query_model.sqlmethod == 'select') {

                if(auth_required) {
                    try {
                        params.query_model.query_json.where = modelutils.applyPermissions({
                            table: params.query_model.query_json.schema + '.' + params.query_model.query_json.table,
                            method: params.query_model.sqlmethod,
                            conditions: params.query_model.query_json.where,
                            current_role: current_role
                        });
                    } catch(err) {
                        return callback({
                            response_code: 403,
                            error: err.message
                        });
                    }
                    if(params.query_model.query_json.joins && params.query_model.query_json.joins.length > 0) {
                        try {
                            params.query_model.query_json.joins = applyPermissionsToNestedJoins({
                                current_role: current_role,
                                joins: params.query_model.query_json.joins
                            });
                        } catch(err) {
                            return callback({
                                response_code: 403,
                                error: err.message
                            });
                        }
                    }
                }

                var query;
                try {
                    query = new json2sql(
                        [params.query_model.query_json],
                        params.currentModel.databases[db_id], {useDynamicValues: true}, params.request
                    ).generate();
                } catch(err) {
                    return callback({
                        response_code: 400,
                        error: err
                    });
                }

                gq_ob.type = 'query';
                query.base_alias = params.query_model.query_json.table_alias;
                gq_ob.query = query;

            } else {
                gq_ob.type = 'mutation';
                if(auth_required) {
                    try {
                        params.query_model.query_json.where = modelutils.applyPermissions({
                            table: params.query_model.query_json.schema + '.' + params.query_model.query_json.table,
                            method: params.query_model.sqlmethod,
                            conditions: params.query_model.query_json.where,
                            current_role: current_role
                        });
                    } catch(err) {
                        return callback({
                            response_code: 403,
                            error: err.message
                        });
                    }
                }
                gq_ob.models = [{
                    method: params.query_model.sqlmethod,
                    query: {
                        model: params.query_model.query_json
                    },
                    body: params.request.body
                }];
            }

        } else {
            var model_arr = params.query_model.query_json;
            gq_ob.type = 'mutation';
            gq_ob.models = [{
                query: {
                    model: model_arr
                },
                body: params.request.body,
                method: params.query_model.sqlmethod
            }];

            if(auth_required) {
                for(let i = 0; i < model_arr.length; i++) {
                    var permissions = modelutils.getPermissions({
                        table: model_arr[i].schema + '.' + model_arr[i].table,
                        method: 'insert',
                        current_role: current_role
                    });
                    if(permissions.access_type !== 1) {
                        return callback({
                            response_code: 403,
                            error: 'You are not authorized to perform this action'
                        });
                    }
                }
            }
        }

        query_exec_ob = gq_ob;
    }

    // return callback(null, query_exec_ob)

    if (query_exec_ob.type == 'mutation') {

        var parsed_models = query_exec_ob.models;

        var final_models = [];
        var all_return_paths = [];

        for(let i = 0; i < parsed_models.length; i++) {
            const query_model = parsed_models[i];

            if(query_model.method == 'insert') {

                var modelob = new DynamicInsertModels({
                    models: query_model.query.model,
                    body: query_model.body,
                    nested_insert: query_model.query.model.length > 1
                })

                // console.log('modelob', modelob)

                if(modelob.error) {
                    return callback({
                        response_code: 400,
                        error: modelob.error
                    })
                }

                all_return_paths = all_return_paths.concat(modelob.all_return_paths);

                final_models = final_models.concat(modelob.models);

            } else if(query_model.method == 'update') {

                var modelob = replaceModelWithBody([query_model.query.model], query_model.body);
                final_models = final_models.concat(modelob.models);
                all_return_paths.push(modelob.models[0].table_alias);

           } else if(query_model.method == 'delete') {

                final_models = final_models.push(query_model.query.model)
                all_return_paths.push(query_model.query.model.table_alias);

           }
        }

        var query;
        try {
            query = new json2sql(
                final_models,
                params.currentModel.databases[db_id], {useDynamicValues: true}, params.request
            ).generate();
        } catch(err) {
            console.log('err', err)
            return callback({
                response_code: 400,
                error: err.message
            });
        }

        // console.log({
        //     text: query.text,
        //     values: query.values
        // })

        // return callback(null, {
        //     models: final_models,
        //     query: query
        // })

        db({
            text: query.text,
            values: query.values
        }, function(err, query_res) {
            if (err) {
                console.log('err', err, query_res)
                return callback({
                    response_code: 500,
                    error: err
                })
            }

            // if (query_res.rows.length === 0) {
            //     return callback(null, {
            //         data: {}
            //     });
            // }
            
            // console.log('query_res.rows:', JSON.stringify(query_res.rows, null, 2));
            // console.log('query_res', query_res.rows[0])

            // return callback(null, {
            //     data: query_res.rows[0]
            // })
            
            var returnob = {};

            var return_array = []

            // Sort returnpaths by number of '.' in descending order
            all_return_paths.sort((a, b) => {
                const dotsInA = (a.match(/\./g) || []).length;
                const dotsInB = (b.match(/\./g) || []).length;
                return dotsInB - dotsInA;
            });            

            var returned_paths = Object.keys(query_res.rows[0])

            for (let i = 0; i < returned_paths.length; i++) {

                // console.log('returned_paths[i]', returned_paths[i])

                all_paths:
                for (let j = 0; j < all_return_paths.length; j++) {
                    // console.log('all_return_paths[j]', all_return_paths[j])

                    var base_index = parseInt(returned_paths[i].replace((all_return_paths[j] + '_'), ''))

                    

                    if ((returned_paths[i].indexOf(all_return_paths[j]) > -1 && !isNaN(base_index)) || returned_paths[i] == all_return_paths[j]) {
                        var base_key = all_return_paths[j].split('.')[0]

                        // console.log('base_key', base_key)
                        // console.log('base_index', base_index)

                        returnob[base_key] = returnob[base_key] || []

                        return_array[base_index] = return_array[base_index] || {}

                        var new_ob = {}

                        _.set(new_ob, all_return_paths[j], query_res.rows[0][returned_paths[i]])
                        // console.log('new_ob', JSON.stringify(new_ob, null, 2))
                        _.merge(return_array[base_index], new_ob)

                        if(base_key == all_return_paths[j]){
                            if(isNaN(base_index)) {
                                returnob[base_key] = return_array[base_index][base_key]
                            } else {
                                returnob[base_key].push(return_array[base_index][base_key])
                            }
                            
                        }
                        
                        break all_paths;
                    }
                }
            }

            return callback(null, {
                data: returnob,
            })
        })

    } else if (query_exec_ob.type == 'query') {

        // return callback(null, query_exec_ob.query)

        db({
            text: query_exec_ob.query.text,
            values: query_exec_ob.query.values
        }, function(err, query_res) {
            if(err) {
                console.log('err', err)
                return callback({
                    response_code: 500,
                    error: err
                })
            }
            if(query_exec_ob.query.multiple) {
                return callback(null, {
                    data: query_res.rows[0]
                })
            } else {
                return callback(null, {
                    data: {
                        [query_exec_ob.query.base_alias]: query_res.rows
                    }
                })
            }
        })

    } else {
        return callback({
            response_code: 404,
            error: 404
        })
    }

}

function applyPermissionsToNestedJoins(params) {

    var current_role = params.current_role;
    var joins = params.joins;

    try {
        for(let i = 0; i < joins.length; i++) {
            joins[i].on = modelutils.applyPermissions({
                table: joins[i].schema + '.' + joins[i].table,
                method: 'select',
                conditions: joins[i].on,
                current_role: current_role
            });

            if(joins[i].joins && joins[i].joins.length > 0) {
                joins[i].joins = applyPermissionsToNestedJoins({
                    current_role: current_role,
                    joins: joins[i].joins
                });
            }
        }
    } catch(err) {
        throw new Error('You are not authorized to perform this action');
    }

    return joins;

}