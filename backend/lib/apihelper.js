var ModelManager = require.main.require('./models/modelManager');
var v2sql = require.main.require('./models/view2sql.js');
var { condition_count } = require.main.require('./models/viewToJSON.js');
var DB = require.main.require('./models/index.js').db;
var repoManager = require.main.require('./repo-gen/index.js');
var qutils = require.main.require('./models/utils.js');

// allowed_tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// allowed_methods = ['GET', 'POST', 'PUT']
function getFormattedData({ body_ob, query_data, subdomain, db_id, url_path, method, primary_key }) {


    let appData = ModelManager.models[subdomain]
    let currModel = appData.databases[db_id].models;
    let idToName = appData.databases[db_id].idToName
    let currTablePath = appData.databases[db_id].tidToName[body_ob.base]
    let properties = currModel[currTablePath[0]][currTablePath[1]].properties


    query_data.model.method = body_ob.method;
    // query_data.model = JSON.stringify(query_data.model)  // for insert  'model' is array 
    let table_alias = query_data.model.table;
    if (method === 'POST') {
        table_alias = currTablePath[1]
    }

    let query_view_data = {
        column_ids: body_ob.c,
        return_column_ids: body_ob.return_c,
        column_names: query_data.all_col_names,
        where_conditions: body_ob.w,
        condition_count: condition_count(body_ob.w),
        body_key_props: query_data.body_key_props,

        join_type: body_ob.join_type,
        base: body_ob.base,
        apiRoute: url_path || "",
        pagination: body_ob.pagination,
        method: body_ob.method,
        single_base_insert: body_ob.single_base_insert,
        table_alias: table_alias,
        allowedPaths: body_ob.allowedPaths,
        allow_multiple_row_paths: body_ob.allow_multiple_row_paths,
        on_conflict: body_ob.on_conflict,
        conflictColumns: body_ob.conflictColumns,
        join_conditions: body_ob.join_conditions,
        filterList: body_ob.filterList,

        original_state: {
            data: {
                name: url_path,
                method: {
                    "label": "Select",
                    "method": "GET",
                    "value": "select"
                },
                route: url_path,
                base: {
                    "label": currTablePath[1],
                    "value": String(body_ob.base),
                    "primaryKeyCols": properties.primary,
                    "hasSingleId": properties.unique.length == 1 ? true : false
                },
                "expandedKeys": [],
                "checkedKeys": {
                    "checked": [],
                    "halfChecked": []
                },

                columns: body_ob.c.map((item) => {
                    let colFullName = idToName[item.id]

                    let colProperties = properties.columns[colFullName[2]]

                    return {
                        id: item.id,
                        label: colFullName[2],

                        optionType: qutils.getSuperType(colProperties.type, appData.db_type),
                        primary: colProperties.primary,
                        forceRequired: colProperties.not_null && colProperties.default === null ? true : false,
                        required: colProperties.not_null,
                        tableID: String(properties.id),
                        tableLabel: properties.schema_name + '.' + properties.table_name,
                        unique: properties.unique,
                        uniqueColumns: qutils.getUniqueColumnData(
                            String(properties.id),
                            properties.uindex,
                            properties
                        ),
                        value: item.id


                    }
                }),
                joinConditions: {},
                conflictColumns: {},
                returnColumns: [],
                multipleRowsHash: {},
                filters: "{\"condition\":\"AND\",\"id\":\"root\",\"rules\":[],\"not\":false}",

                authentication: {
                    "label": "Disabled",
                    "value": false
                },


            }
        },

    };


    if (method === "GET") {


        query_view_data.original_state.data = {
            ...query_view_data.original_state.data,
            sorts: body_ob.sort,
            sorts_dynamic: body_ob.sorts_dynamic,
            offset: body_ob.offset,
            offset_dynamic: body_ob.offset_dynamic,
            limit: body_ob.limit,
            limit_dynamic: body_ob.limit_dynamic,
        }
    }
    if (method === "GET_BY_ID") {
        let currColProperties = properties.columns[primary_key]
        let inputType = qutils.getSuperType(currColProperties.type, appData.db_type);


        query_view_data.original_state.data.method = {
            "label": "Select by ID",
            "method": "GET",
            "value": "select_id"
        }

        query_view_data.original_state.data.select_by_id = true;
        query_view_data.original_state.data.filters = JSON.stringify({
            condition: "AND",
            id: "root",
            rules: [
                {
                    fieldName: `${currTablePath[0]}.${currTablePath[1]}.${primary_key}`,
                    id: "root_base",
                    input: inputType,
                    operator: "equal",
                    method: "dynamic",
                    type: inputType,
                    value: `URLParam.${primary_key}`,
                    input_key: `URLParam.${primary_key}`
                }
            ],
            "not": false
        })

        query_view_data.original_state.data = {
            ...query_view_data.original_state.data,
            sorts: body_ob.sort,
            sorts_dynamic: body_ob.sorts_dynamic,
            offset: body_ob.offset,
            offset_dynamic: body_ob.offset_dynamic,
            limit: body_ob.limit,
            limit_dynamic: body_ob.limit_dynamic,
        }
    }


    else if (method === "POST") {
        query_view_data.original_state.data.method = {
            "label": "Insert",
            "method": "POST",
            "value": "insert"
        }

        query_view_data.original_state.data.returnColumns = JSON.parse(JSON.stringify(query_view_data.original_state.data.columns))
    }
    else if (method === "PUT") {


        query_view_data.original_state.data.method = {
            "label": "Update",
            "method": "PUT",
            "value": "update"
        }
        query_view_data.original_state.data.returnColumns = JSON.parse(JSON.stringify(query_view_data.original_state.data.columns))


        // primary_key
        let currColProperties = properties.columns[primary_key]
        let inputType = qutils.getSuperType(currColProperties.type, appData.db_type);

        query_view_data.original_state.data.filters = JSON.stringify({
            condition: "AND",
            id: "root",
            rules: [
                {
                    fieldName: `${currTablePath[0]}.${currTablePath[1]}.${primary_key}`,
                    id: "root_base",
                    input: inputType,
                    operator: "equal",
                    method: "dynamic",
                    type: inputType,
                    value: `URLParam.${primary_key}`,
                    input_key: `URLParam.${primary_key}`
                }
            ],
            "not": false
        })
       
        query_view_data.original_state.data = {
            ...query_view_data.original_state.data,
            sorts: body_ob.sort,
            sorts_dynamic: body_ob.sorts_dynamic,
            offset: body_ob.offset,
            offset_dynamic: body_ob.offset_dynamic,
            limit: body_ob.limit,
            limit_dynamic: body_ob.limit_dynamic,
        }


    }
    else if (method === "DELETE") {


        query_view_data.original_state.data.method = {
            "label": "Delete",
            "method": "DELETE",
            "value": "delete"
        }

        query_view_data.original_state.data.returnColumns = JSON.parse(JSON.stringify(query_view_data.original_state.data.columns))

        // primary_key
        let currColProperties = properties.columns[primary_key]
        let inputType = qutils.getSuperType(currColProperties.type, appData.db_type);

        query_view_data.original_state.data.filters = JSON.stringify({
            condition: "AND",
            id: "root",
            rules: [
                {
                    fieldName: `${currTablePath[0]}.${currTablePath[1]}.${primary_key}`,
                    id: "root_base",
                    input: inputType,
                    operator: "equal",
                    method: "dynamic",
                    type: inputType,
                    value: `URLParam.${primary_key}`,
                    input_key: `URLParam.${primary_key}`
                }
            ],
            "not": false
        })

        query_view_data.original_state.data = {
            ...query_view_data.original_state.data,
            sorts: body_ob.sort,
            sorts_dynamic: body_ob.sorts_dynamic,
            offset: body_ob.offset,
            offset_dynamic: body_ob.offset_dynamic,
            limit: body_ob.limit,
            limit_dynamic: body_ob.limit_dynamic,
        }


    }



    return {
        docs: {
            ...query_data.docs,
            "apiRoute": url_path,
            "auth_required": false,
        },
        query_view_data,
    }


}

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

        var url_path = '/auto/' + table_spl[1].trim().replaceAll(/\_|\s+/g, '-').replaceAll(/\-+/g, '-').toLowerCase()

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


            let body_ob_copied = JSON.parse(JSON.stringify(body_ob))
            body_ob_copied.orderby = auto_orderby;
            body_ob_copied.limit_dynamic = true;
            body_ob_copied.limit = 100;
            body_ob_copied.offset = 0;
            body_ob_copied.offset_dynamic = true;
            body_ob_copied.sorts_dynamic = auto_orderby;
            body_ob_copied.sorts = auto_orderby;


            var current_query = v2sql.convert(body_ob_copied)

            const formattedData = getFormattedData({
                body_ob: body_ob_copied,
                query_data: current_query,
                subdomain: params.subdomain,
                db_id: params.db_id,
                url_path,
                auto_orderby,
                method: 'GET',

            })
            all_models.push({
                db_id: params.db_id,
                query_json: current_query.model,
                query_text: current_query.query,
                query_view_data: formattedData.query_view_data,
                //  {
                //     pagination: true,
                //     limit: 100,
                //     offset: 0,
                //     orderby: auto_orderby
                // }, 
                auth_required: body_ob.auth_required || false,

                name: url_path,
                deployed: true,
                app_id: params.app_id,
                method: 'GET',
                route: url_path,
                docs: formattedData.docs
            })
        }

        // select by id
        if (params.allowed_methods.indexOf('GET_BY_ID') > -1) {

            if (primary_key) {
                let new_url_path = url_path + '/:' + primary_key;
                let body_ob_copied = JSON.parse(JSON.stringify(body_ob))
                body_ob_copied.orderby = auto_orderby;
                body_ob_copied.limit_dynamic = true;
                body_ob_copied.limit = 100;
                body_ob_copied.offset = 0;
                body_ob_copied.offset_dynamic = true;
                body_ob_copied.sorts_dynamic = auto_orderby;
                body_ob_copied.sorts = auto_orderby;

                clientModel.models[table_spl[0]][table_spl[1]].properties

                let currColProperties = clientModel.models[table_spl[0]][table_spl[1]].properties.columns[primary_key]
                let inputType = qutils.getSuperType(currColProperties.type, ModelManager.models[params.subdomain].db_type);

                body_ob_copied.w = {
                    condition: "AND",
                    id: "root",
                    rules: [
                        {
                            fieldName: `${table_spl[0]}.${table_spl[1]}.${primary_key}`,
                            id: "root_base",
                            input: inputType,
                            operator: "equal",
                            method: "dynamic",
                            type: inputType,
                            value: `URLParam.${primary_key}`,
                            input_key: `URLParam.${primary_key}`
                        }
                    ],
                    "not": false
                }


                var current_query = v2sql.convert(body_ob_copied)

                const formattedData = getFormattedData({
                    body_ob: body_ob_copied,
                    query_data: current_query,
                    subdomain: params.subdomain,
                    db_id: params.db_id,
                    url_path: new_url_path,
                    auto_orderby,
                    method: 'GET_BY_ID',
                    primary_key,
                })
                all_models.push({
                    db_id: params.db_id,
                    query_json: current_query.model,
                    query_text: current_query.query,
                    query_view_data: formattedData.query_view_data,

                    auth_required: body_ob.auth_required || false,

                    name: new_url_path,
                    deployed: true,
                    app_id: params.app_id,
                    method: 'GET',
                    route: new_url_path,
                    docs: formattedData.docs
                })
            }
        }


        // insert
        if (params.allowed_methods.indexOf('POST') > -1) {

            let body_ob_copied = JSON.parse(JSON.stringify(body_ob))

            body_ob_copied.method = 'insert'
            body_ob_copied.return_c = body_ob_copied.c;

            body_ob_copied.join_type = {};
            body_ob_copied.allow_multiple_row_paths = [];
            body_ob_copied.on_conflict = {};
            body_ob_copied.table_alias = {};

            current_query = v2sql.convert(body_ob_copied)


            body_ob_copied.request = current_query.formatted_request_body;
            body_ob_copied.request_detailed = current_query.detailed_body;
            body_ob_copied.response = current_query.response;
            body_ob_copied.response_detailed = current_query.response_detailed;


            const formattedData = getFormattedData({
                body_ob: body_ob_copied,
                query_data: current_query,
                subdomain: params.subdomain,
                db_id: params.db_id,
                url_path,
                auto_orderby,
                method: 'POST',

            })

            current_query.model = JSON.stringify(current_query.model) // for insert  'model' is array


            all_models.push({
                db_id: params.db_id,
                query_json: current_query.model,
                query_text: current_query.query,
                query_view_data: formattedData.query_view_data,
                name: url_path,
                deployed: true,
                app_id: params.app_id,
                method: 'POST',
                route: url_path,
                docs: formattedData.docs
            })
        }

        // update by id
        if (params.allowed_methods.indexOf('PUT') > -1) {

            if (primary_key) {
                let new_url_path = url_path + '/:' + primary_key;
                let body_ob_copied = JSON.parse(JSON.stringify(body_ob))

                body_ob_copied.method = 'update'
                body_ob_copied.return_c = body_ob_copied.c;

                body_ob_copied.join_type = {};
                body_ob_copied.allow_multiple_row_paths = [];
                body_ob_copied.on_conflict = {};
                body_ob_copied.table_alias = {};

                current_query = v2sql.convert(body_ob_copied)

                body_ob_copied.request = current_query.formatted_request_body;
                body_ob_copied.request_detailed = current_query.detailed_body;
                body_ob_copied.response = current_query.response;
                body_ob_copied.response_detailed = current_query.response_detailed;


                const formattedData = getFormattedData({
                    body_ob: body_ob_copied,
                    query_data: current_query,
                    subdomain: params.subdomain,
                    db_id: params.db_id,
                    url_path: new_url_path,
                    auto_orderby,
                    method: 'PUT',
                    primary_key,
                })

                current_query.model = JSON.stringify(current_query.model)

                if (current_query) {

                    all_models.push({
                        db_id: params.db_id,
                        query_json: current_query.model,
                        query_text: current_query.query,
                        query_view_data: formattedData.query_view_data,
                        name: new_url_path,
                        deployed: true,
                        app_id: params.app_id,
                        method: 'PUT',
                        route: new_url_path,
                        docs: formattedData.docs,


                    })

                }

            }
        }

        // delete  by id
        if (params.allowed_methods.indexOf('DELETE') > -1) {
            if (primary_key) {
                let new_url_path = url_path + '/:' + primary_key;
                let body_ob_copied = JSON.parse(JSON.stringify(body_ob))

                body_ob_copied.method = 'delete'
                body_ob_copied.return_c = body_ob_copied.c;

                body_ob_copied.join_type = {};
                body_ob_copied.allow_multiple_row_paths = [];
                body_ob_copied.on_conflict = {};
                body_ob_copied.table_alias = {};


                current_query = v2sql.convert(body_ob_copied)

                body_ob_copied.request = current_query.formatted_request_body;
                body_ob_copied.request_detailed = current_query.detailed_body;
                body_ob_copied.response = current_query.response;
                body_ob_copied.response_detailed = current_query.response_detailed;



                const formattedData = getFormattedData({
                    body_ob: body_ob_copied,
                    query_data: current_query,
                    subdomain: params.subdomain,
                    db_id: params.db_id,
                    url_path: new_url_path,
                    auto_orderby,
                    method: 'DELETE',
                    primary_key,
                })

                current_query.model = JSON.stringify(current_query.model)

                if (current_query) {



                    all_models.push({
                        db_id: params.db_id,
                        query_json: current_query.model,
                        query_text: current_query.query,
                        query_view_data: formattedData.query_view_data,
                        name: new_url_path,
                        deployed: true,
                        app_id: params.app_id,
                        method: 'DELETE',
                        route: new_url_path,
                        docs: formattedData.docs,


                    })

                }

            }
        }

    }


    new DB({}).execute([
        new ModelManager.pgtmodels.models.public.api_queries().insert(all_models)
    ], function (err, result) {
        // console.log('data', result)
        const allQueries = result?.newrows?.api_queries || []
        for (let i = 0; i < allQueries.length; i++) {
            const currRow = allQueries[i];

            var new_r_ob = {
                query_id: currRow.query_id,
                db_id: currRow.db_id,
                route: currRow.route,
                method: currRow.method,
                query_json: currRow.query_json,
                sqlmethod: currRow.query_view_data.method,
                querypaths: currRow.query_text.querypaths,
                pagination: currRow.query_view_data.pagination,
                auth_required: currRow.auth_required,
                subdomain: params.subdomain,
                body_key_props: currRow.query_view_data.body_key_props,
                single_base_insert: currRow.query_view_data.single_base_insert,
                base: currRow.query_view_data.base
            }
            ModelManager.updateRoute(new_r_ob)

        }
        repoManager.overwriteRepo({ subdomain: params.subdomain }).then(() => {
            console.log('repo overwritten')
        }).catch((err) => {
            console.log('repo overwrite failed', err)
        })
        callback(err)
    })

}

exports.autoGenAndSave = function (params, callback) {
    autoGen(params, callback)
}