var json2sql = require.main.require('./models/JsonToSql.js');
var replaceModelWithBody = require.main.require('./models/replaceModelWithBody.js').bodytoquery;
var dynamicInsertModels = require.main.require('./models/replaceModelWithBody.js').dynamicInsertModels;
var _ = require('lodash');
const graphqlConverter = require.main.require('./models/graphql.js').GraphQLConverter;

exports.executeClientRequest = executeClientRequest;

function executeClientRequest(params, callback) {

    if(!params.graphql || !params.graphql.query) {
        return callback({
            response_code: 400,
            error: 'GraphQL query is required'
        });
    }

    var result;

    try {
        result = new graphqlConverter({
            currentModel: params.currentModel,
            subdomain: params.currentModel.appDetails.subdomain, 
            query: params.graphql.query,
            variables: params.graphql.variables
        });
    } catch (err) {
        console.log('err', err)
        return callback({
            response_code: 400,
            error: err.message
        });
    }

    // return callback(null, result)

    if (result.type == 'mutation') {

        var parsed_models = result.models;

        var final_models = [];
        var all_return_paths = [];

        for(let i = 0; i < parsed_models.length; i++) {
            const query_model = parsed_models[i];

            if(query_model.method == 'insert') {

                var modelob = dynamicInsertModels({
                    models: query_model.query.model,
                    body: query_model.body,
                })

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

           }
        }

        var query;
        try {
            query = new json2sql(
                final_models,
                params.currentModel.databases[Object.keys(params.currentModel.databases)[0]], {useDynamicValues: true}
            ).generate();
        } catch(err) {
            console.log('err', err)
            return callback({
                response_code: 400,
                error: err
            });
        }

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
            
            var returnob = {};

            var return_array = []

            // Sort returnpaths by number of '.' in descending order
            all_return_paths.sort((a, b) => {
                const dotsInA = (a.match(/\./g) || []).length;
                const dotsInB = (b.match(/\./g) || []).length;
                return dotsInB - dotsInA;
            });            

            var returned_paths = Object.keys(result.rows[0])

            for (let i = 0; i < returned_paths.length; i++) {

                all_paths:
                for (let j = 0; j < all_return_paths.length; j++) {
                    var base_index = parseInt(returned_paths[i].replace((all_return_paths[j] + '_'), ''))
                    if ((returned_paths[i].indexOf(all_return_paths[j]) > -1 && !isNaN(base_index)) || returned_paths[i] == all_return_paths[j]) {
                        var base_key = all_return_paths[j].split('.')[0]

                        returnob[base_key] = returnob[base_key] || []

                        return_array[base_index] = return_array[base_index] || {}

                        var new_ob = {}

                        _.set(new_ob, all_return_paths[j], result.rows[0][returned_paths[i]])
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

    } else if (result.type == 'query') {

        params.db({
            text: result.query.text,
            values: result.query.values
        }, function(err, result) {
            if(err) {
                console.log('err', err)
                return callback({
                    response_code: 500,
                    error: err
                })
            }
            return callback(null, result)
        })

    } else {
        return callback({
            response_code: 404,
            error: 404
        })
    }

}
