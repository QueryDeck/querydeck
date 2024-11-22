var json2sql = require.main.require('./models/JsonToSql.js');
var replaceModelWithBody = require.main.require('./models/replaceModelWithBody.js').bodytoquery;
var dynamicInsertModels = require.main.require('./models/replaceModelWithBody.js').dynamicInsertModels;
var _ = require('lodash')

exports.executeClientRequest = executeClientRequest;

function executeClientRequest(params, callback) {

    
    var base_table_arr, base_table;

    if(params.currentModel.tidToName[params.query_model.base]) {

        base_table_arr = params.currentModel.tidToName[params.query_model.base];
        base_table = base_table_arr.join('.');

    } else {
        return callback({
            response_code: 500
        })
    }

    var auth_required = params.query_model.auth_required;
    var user_id, user_role;
    var current_role;
    var base_table_permission_condition;

    if(auth_required) {

        user_id = _.get(params.request.session, params.auth.user_id_session_key);
        user_role = _.get(params.request.session, params.auth.role_session_key);

        params.auth.roles = params.auth.roles || []

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

        if(current_role.role_type_name !== 'Admin') {
            // check base table access for custom role
            if(
                current_role.custom_permissions[base_table] 
                && current_role.custom_permissions[base_table][params.query_model.sqlmethod]
                && (
                    current_role.custom_permissions[base_table][params.query_model.sqlmethod].access_type == 1
                    || (
                        current_role.custom_permissions[base_table][params.query_model.sqlmethod].access_type == 0
                        && current_role.custom_permissions[base_table][params.query_model.sqlmethod].conditions
                        && current_role.custom_permissions[base_table][params.query_model.sqlmethod].conditions.rules
                    )
                )
            ) {

                base_table_permission_condition = current_role.custom_permissions[base_table][params.query_model.sqlmethod].conditions;

            } else {
                return callback({
                    response_code: 403,
                    error: 'Access denied'
                })
            }
        }
    }

    if (params.query_model.sqlmethod == 'insert') {

        var modelob = dynamicInsertModels({
            models: params.query_model.query_json,
            body: params.request.body,
        })

        if (modelob.error) {
            return callback({
                response_code: 400,
                error: modelob.error
            })
        }

        var query = new json2sql(
            modelob.models,
            params.currentModel, {}
        ).generate();

        // return callback(null, {
        //     data: {
        //         query: {
        //             text: query.text,
        //             values: query.values
        //         },
        //         new_models: modelob,
        //         old_models: params.query_model.query_json
        //     }
        // })

        // console.log(query)

        // TODO: logrocket console.log(query)

        params.db({
            text: query.text,
            values: query.values
        }, function(err, result) {
            if (err) {
                return callback({
                    response_code: 500,
                    error: err
                })
            }

            // return callback(null, {
            //     data: result.rows
            // })

            var returnob = {};
            // var returnpaths = modelob.all_return_paths
            var return_array = []

            // Sort returnpaths by number of '.' in descending order
            modelob.all_return_paths.sort((a, b) => {
                const dotsInA = (a.match(/\./g) || []).length;
                const dotsInB = (b.match(/\./g) || []).length;
                return dotsInB - dotsInA;
            });
            // console.log('BASE KEY', modelob.all_return_paths)
            var base_key = modelob.all_return_paths[modelob.all_return_paths.length - 1]

            returnob[base_key] = []

            var returned_paths = Object.keys(result.rows[0])

            for (let i = 0; i < returned_paths.length; i++) {
                // console.log('returned_paths', returned_paths[i])
                all_paths:
                for (let j = 0; j < modelob.all_return_paths.length; j++) {
                    // console.log('modelob.all_return_paths', modelob.all_return_paths[j])
                    var base_index = parseInt(returned_paths[i].replace((modelob.all_return_paths[j] + '_'), ''))
                    if (returned_paths[i].indexOf(modelob.all_return_paths[j]) > -1 && !isNaN(base_index)) {
                        // console.log('base_index', base_index, modelob.all_return_paths[j])
                        // path match 
                        // var newob = {}
                        return_array[base_index] = return_array[base_index] || {}
                        // console.log('apply', modelob.all_return_paths[j], result.rows[0][returned_paths[i]])


                        var new_ob = {}

                        _.set(new_ob, modelob.all_return_paths[j], result.rows[0][returned_paths[i]])
                        _.merge(return_array[base_index], new_ob)

                        // _.set(return_array[base_index], modelob.all_return_paths[j], result.rows[0][returned_paths[i]])
                        // console.log('return_array[base_index]', base_index, return_array[base_index])
                        // _.set(returnob, modelob.all_return_paths[j], result.rows[0][returned_paths[i]])
                        if(base_key == modelob.all_return_paths[j]){
                            returnob[base_key].push(return_array[base_index][base_key])
                        }
                        
                        break all_paths;
                    }
                }
                // _.set(returnob, returnpaths[i], result.rows[0][returnpaths[i]])
            }

            return callback(null, {
                data: returnob,
                // original:result.rows[0]
            })

        })


    } else if (params.query_model.sqlmethod == 'select' || params.query_model.sqlmethod == 'update' || params.query_model.sqlmethod == 'delete') {

        

        if (params.query_model.sqlmethod == 'update') {
            var modelob = replaceModelWithBody([params.query_model.query_json], params.request.body);
            if (modelob.error) {
                return callback({
                    response_code: 400,
                    error: modelob.error
                })
            }
        }

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

        // params.request.query._order=column1:asc,column2:desc
        // params.query_model.query_json.orderby_dynamic_columns=[{id:1,asc:true,name:'schema.table.column1'},{id:2,asc:false,name:'schema.table.column2' }]

        if(params.request.query._order && params.query_model.query_json.orderby_dynamic && params.query_model.query_json.orderby_dynamic_columns && params.query_model.query_json.orderby_dynamic_columns.length > 0) {

            let orderByArr = [];
            let orderItems = params.request.query._order.split(',');
            
            for(let i = 0; i < orderItems.length; i++) {
                let [columnName, direction] = orderItems[i].split(':');
                
                // Find matching column in dynamic columns
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

        if(base_table_permission_condition) {
            // rebuild where condition with base table permission condition
            var where_condition = {
                condition: 'AND',
                rules: [
                    base_table_permission_condition,
                    params.query_model.query_json.where
                ]
            }
            params.query_model.query_json.where = where_condition
        }

        var query = new json2sql(
            [params.query_model.query_json],
            params.currentModel, {}, params.request
        ).generate();

        // return callback(null, {
        //     data: {
        //         query_json: params.query_model.query_json,
        //         query: {
        //             text: query.text,
        //             values: query.values
        //         }
        //     }
        // })

        params.db({
            text: query.text,
            values: query.values
        }, function(err, result) {
            if (err) {
                return callback({
                    response_code: 500,
                    error: err
                })
            }

            var resob;

            if (params.query_model.sqlmethod == 'select') {
                resob = {
                    [params.query_model.query_json.table_alias]: result.rows
                }
            } else {
                resob = result.rows[0]
            }

            return callback(null, {
                data: resob
            })
        })


    } else {
        return callback({
            response_code: 404,
            error: 404
        })
    }

}