var ModelManager = require.main.require('./models/modelManager');
var v2sql = require.main.require('./models/view2sql.js');
var DB = require.main.require('./models/index.js').db;


// allowed_tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// allowed_methods = ['GET', 'POST', 'PUT']
function autoGen(params, callback) {

    if (
        !params.subdomain ||
        !ModelManager.models[params.subdomain]
    ) return null;

    var all_models = [];


    params.allowed_tables = params.allowed_tables || [];

    if (params.allowed_tables.length == 0) {
        params.all = true;
    } 

    params.app_id = ModelManager.models[params.subdomain].appDetails.app_id;

    params.db_id = Object.keys(ModelManager.models[params.subdomain].databases)[0];

    var clientModel = ModelManager.models[params.subdomain].databases[params.db_id];

    if (params.all) {

        params.allowed_tables = Object.keys(clientModel.tidToName);

    }

    params.allowed_methods = (params.allowed_methods && params.allowed_methods.length > 0) ? params.allowed_methods : ['GET', 'POST', 'PUT'];

    for (let i = 0; i < params.allowed_tables.length; i++) {

        var table_spl = clientModel.tidToName[params.allowed_tables[i]];

        var primary_key = clientModel.models[table_spl[0]][table_spl[1]].properties.primary[0];

        if (!primary_key) {
            var u_indexes = Object.keys(clientModel.models[table_spl[0]][table_spl[1]].properties.uindex);
            sub_p_key_loop:
                for (let j = 0; j < u_indexes.length; j++) {
                    if (clientModel.models[table_spl[0]][table_spl[1]].properties.uindex[u_indexes[j]].length == 1 && clientModel.models[table_spl[0]][table_spl[1]].properties.notnulls && clientModel.models[table_spl[0]][table_spl[1]].properties.notnulls.indexOf(clientModel.models[table_spl[0]][table_spl[1]].properties.uindex[u_indexes[j]][0]) > -1) {
                        primary_key = clientModel.models[table_spl[0]][table_spl[1]].properties.uindex[u_indexes[j]][0];
                        break sub_p_key_loop;
                    }
                }
        }

        var body_ob = {
            db_id: params.db_id,
            subdomain: params.subdomain,
            c: [],
            base: params.allowed_tables[i],
            method: 'select',
            agg_paths: []
        }

        var url_path = '/' + table_spl[1].trim().replaceAll(/\_|\s+/g, '-').replaceAll(/\-+/g, '-').toLowerCase()

        var auto_orderby;

        var column_names = Object.keys(clientModel.models[table_spl[0]][table_spl[1]].properties.columns);

        for (let j = 0; j < column_names.length; j++) {
            var col_id = params.allowed_tables[i] + '.' + clientModel.models[table_spl[0]][table_spl[1]].properties.columns[column_names[j]].id
            body_ob.c.push({
                id: col_id
            })
            if (column_names[j].toLocaleLowerCase().match(/created_at|createdat|created_date|date_created|created_on|creation_date|timestamp_created/)) {
                auto_orderby = [{
                    asc: false,
                    id: col_id,
                    label: column_names[j]
                }];
            }
        }

        // select
        if (params.allowed_methods.indexOf('GET') > -1) {
            var current_query = v2sql.convert(body_ob)
            // console.log(current_query)
            all_models.push({
                db_id: params.db_id,
                query_json: current_query.model,
                query_text: current_query.query,
                query_view_data: {
                    pagination: true,
                    limit: 100,
                    offset: 0,
                    orderby: auto_orderby
                },
                name: url_path,
                deployed: true,
                app_id: params.app_id,
                method: 'GET',
                route: url_path
            })
        }

        // insert
        if (params.allowed_methods.indexOf('POST') > -1) {
            body_ob.method = 'insert'
            current_query = v2sql.convert(body_ob)

            current_query.model = JSON.stringify(current_query.model) // for insert  'model' is array

            all_models.push({
                db_id: params.db_id,
                query_json: current_query.model,
                query_text: current_query.query,
                query_view_data: {},
                name: url_path,
                deployed: true,
                app_id: params.app_id,
                method: 'POST',
                route: url_path
            })
        }

        // update by id
        if (params.allowed_methods.indexOf('PUT') > -1) {
            if (primary_key) {
                body_ob.method = 'update'
                current_query = v2sql.convert(body_ob)

                if(current_query) {

                    all_models.push({
                        db_id: params.db_id,
                        query_json: current_query.model,
                        query_text: current_query.query,
                        query_view_data: {},
                        name: url_path + '/:' + primary_key,
                        deployed: true,
                        app_id: params.app_id,
                        method: 'PUT',
                        route: url_path + '/:' + primary_key
                    })

                }
                
            }
        }

    }

    // console.log(all_models)
    // return callback()

    new DB({}).execute([
        new ModelManager.pgtmodels.models.public.api_queries().insert(all_models).conflict({})
    ], function(err, d) {
        callback(err)
    })

}

exports.autoGenAndSave = function(params, callback) {
    autoGen(params, callback)
}