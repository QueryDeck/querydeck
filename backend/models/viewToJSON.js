'use strict';
const allModels = require.main.require('./models/modelManager').models;
const e = require('express');
const _ = require('lodash');
const {
    MYSQL,
    POSTGRES
} = require('../envconfig.js').constant;
const crypto = require('crypto');
const {
    v4: uuidv4
} = require('uuid');

const pluralize = require('pluralize');

const otherutils = require("./utils");
const modelutils = require.main.require('./models/modelUtils')

module.exports = class ViewToJSON {

    constructor(data) {
        this.viewdata = data.viewdata;
        this.subdomain = data.subdomain;
        this.currentModel = allModels[this.subdomain].databases[data.db_id];
        this.db_id = data.db_id;
        // this.db_type = data.otherOpts && data.otherOpts.db_type || POSTGRES;
        // this.insert 
        return this;
    }

    convertSelect() {
        return this.convertSelectDeep(this.viewdata);
    }

    convertSelectByID() {
        return this.convertSelectByIDDeep(this.viewdata);
    }

    convertUpdate() {
        return this.convertUpdatePlain(this.viewdata);
    }

    convertDelete() {
        return this.convertDeletePlain(this.viewdata);
    }

    convertInsert() {
        this.insertOb = {};
        this.insertPaths = [];
        return this.convertInsertDeep(this.viewdata);
    }

    convertInsertUpdateDynamic() {
        this.insertOb = {};
        this.insertPaths = [];
        return this.convertInupDeep(this.viewdata);
    }

    convertInsertDeep(params) {

        let base_table_id = params.base;

        let tab_name_spl = this.currentModel.tidToName[params.base_table];

        params.columns = params.columns.sort(sortIdAsc);
        params.allow_multiple_row_paths = params.allow_multiple_row_paths || [];
        let isColumnUnshifted = false;
        if (params.columns[0].id.indexOf('-') > -1) {
            // base table not added

            params.columns.unshift({
                id: params.columns[0].id.split('-')[0]
            });
            isColumnUnshifted = true;
        }

        let resolvedExtendedPaths = [];
        let colToColData = {}; // col id to col data map 

        // let this.insertPaths = [];
        main_col_loop:
            for (let i = 0; i < params.columns.length; i++) {

                colToColData[params.columns[i].id] = params.columns[i];
                // convert frontend input to standard ob
                // todo add column and table names for model construction
                let id_split$ = params.columns[i].id.split('$');
                let pathid, columnid, tableid;
                if (id_split$.length == 1) {
                    let id_split$_spl = id_split$[0].split('.');
                    pathid = id_split$_spl[0];
                    columnid = id_split$_spl[1];
                    tableid = pathid;
                } else {
                    pathid = id_split$[0];
                    columnid = id_split$[1];
                    let psplit = pathid.split('-');
                    tableid = psplit[psplit.length - 1].split('.')[0];
                }
                this.initColumn(pathid, tableid + '.' + columnid, {
                    required: params.columns[i].required
                });

                if (pathid.indexOf('-') > -1) {

                    let path_split = pathid.split('-');
                    let path_split_length = path_split.length;


                    let path_id_build = [];

                    // iterate over the entire path and make sure all rels are added as columns
                    // todo: this loop is fucked up. figure out a better way later
                    for (let j = 0; j < (path_split_length); j++) {

                        if (j % 2 == 1) {
                            // path_id_build += path_split[j - 1] + '-' + path_split[j];
                            path_id_build.push(path_split[j - 1]);
                            path_id_build.push(path_split[j]);
                        }

                        let coltab_loop = path_split[j];

                        if (j == 0) {
                            // base coltab_loop
                            this.initColumn(base_table_id, coltab_loop);
                        } else {
                            this.initColumn(path_id_build.join('-'), coltab_loop);

                        }

                    }

                }
                resolvedExtendedPaths.push(pathid);
            }

        let insert_json = [];

        // let form_body = {};  
        let body_key_props = {}

        var final_request_body = {}

        var table_insert_type = {}

        for (let i = 0; i < this.insertPaths.length; i++) {
            const element = this.insertPaths[i];
            let col_keys = Object.keys(this.insertOb[this.insertPaths[i]].columns);
            let tabob = {
                schema: this.insertOb[this.insertPaths[i]].schema,
                table: this.insertOb[this.insertPaths[i]].table,
                table_alias: this.insertOb[this.insertPaths[i]].table,
                table_body_path: null,
                columns: [],
                with_alias: this.insertOb[this.insertPaths[i]].with_alias,
                returns: this.insertOb[this.insertPaths[i]].returns,
                conflict: null,
                method: this.insertOb[this.insertPaths[i]].method,
                allow_multiple_row: params.allow_multiple_row_paths.includes(this.insertPaths[i]),
                qref_used: this.insertOb[this.insertPaths[i]].qref_used,
                single_base_insert: params.single_base_insert
            };
            if (
                params?.on_conflict &&
                params.on_conflict[this.insertPaths[i]] &&
                params?.on_conflict[this.insertPaths[i]].columns
            ) {
                tabob.conflict = {
                    ...params.on_conflict[this.insertPaths[i]],
                    columns: []
                }
                let conflict_columns = params.on_conflict[this.insertPaths[i]].columns;
                for (let k = 0; k < conflict_columns.length; k++) {
                    let column_id = otherutils.pathIdToId(conflict_columns[k].id)
                    let column_name = this.currentModel.idToName[column_id].join(".")
                    // if (this.insertOb[this.insertPaths[i]].columns[column_name]) {
                    tabob.conflict.columns.push({
                        ...this.insertOb[this.insertPaths[i]].columns[column_name],
                        id: column_id,
                        pathid: conflict_columns[k].id,
                        columnName: column_name,
                        operator: '$excluded'
                    })
                    // }
                }
            }

            let column_value_split = [];
            let body_path_split = [];
            for (let index = 0; index < col_keys.length; index++) {

                if (this.insertOb[this.insertPaths[i]].columns[col_keys[index]].operator === "$req-body") {
                    column_value_split = this.insertOb[this.insertPaths[i]].columns[col_keys[index]].value.split(".")
                } else {

                    if (this.insertOb[this.insertPaths[i]].columns[col_keys[index]].body_path) {
                        body_path_split = this.insertOb[this.insertPaths[i]].columns[col_keys[index]].body_path.split(".")
                    }
                }
            }
            let table_body_path_arr = []
            let table_body_path;
            // columns_keys.filter(;
            if (column_value_split.length > 1) {
                table_body_path_arr = column_value_split.slice(0, column_value_split.length - 1);
                table_body_path = column_value_split.slice(0, column_value_split.length - 1).join('.');
            } else {
                table_body_path_arr = body_path_split;
            }


            tabob.table_body_path = table_body_path;
            tabob.table_body_path_arr = table_body_path_arr;

            var path_split = this.insertPaths[i].split('-');
            var current_path = path_split[path_split.length - 2] ? (path_split[path_split.length - 2] + '-' + path_split[path_split.length - 1]) : null;
            var current_rel_type = this.relType(current_path)

            table_insert_type[table_body_path_arr.join('.')] = table_insert_type[table_body_path_arr[table_body_path_arr.length - 1]] || {
                static_path_arr: table_body_path_arr,
                data: {},
                key: table_body_path_arr[table_body_path_arr.length - 1]
            }

            if (current_rel_type && current_rel_type.charAt(2) == 'M') {
                table_insert_type[table_body_path_arr.join('.')].type = 'array'
                tabob.table_body_type = 'array'
            } else if (current_rel_type) {
                table_insert_type[table_body_path_arr.join('.')].type = 'object'
                tabob.table_body_type = 'object'
            } else {
                table_insert_type[table_body_path_arr.join('.')].type = (params.single_base_insert ? 'object' : 'array')
                tabob.table_body_type = (params.single_base_insert ? 'object' : 'array')
            }

            table_insert_type[table_body_path_arr.join('.')].returning_data = table_insert_type[table_body_path_arr.join('.')].returning_data || {};
            table_insert_type[table_body_path_arr.join('.')].returning_data_detailed = table_insert_type[table_body_path_arr.join('.')].returning_data_detailed || {};

            for (let k = 0; k < tabob.returns.user.length; k++) {

                let colPathSplit = tabob.returns.user[k].columnName.split(".");
                table_insert_type[table_body_path_arr.join('.')].returning_data[colPathSplit[colPathSplit.length - 1]] = otherutils.getDummyValue(this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type) || this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type;
                table_insert_type[table_body_path_arr.join('.')].returning_data_detailed[colPathSplit[colPathSplit.length - 1]] = {
                    '$qd_column': true,
                    type: otherutils.getSuperType(this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type, this.currentModel.db_type) || this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type,
                    dataType: this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type
                }
            }

            let requiredFields = [];
            for (let k = 0; k < col_keys.length; k++) {

                tabob.columns.push(this.insertOb[this.insertPaths[i]].columns[col_keys[k]]);
                if (this.insertOb[this.insertPaths[i]].columns[col_keys[k]].operator == '$req-body') {
                    // add to sample body
                    let colPathSplit = this.insertOb[this.insertPaths[i]].columns[col_keys[k]].columnName.split(".");

                    let input = {
                        // id: this.insertOb[this.insertPaths[i]].columns[col_keys[k]].id,
                        // colFullpath : colPathSplit.join("."),
                        title: colPathSplit[colPathSplit.length - 1],
                        type: otherutils.getSuperType(this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type, this.currentModel.db_type) || "string",
                        required: this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].not_null && !this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].default,
                        default: this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].default,
                        dataType: this.currentModel.models[colPathSplit[0]][colPathSplit[1]].properties.columns[colPathSplit[2]].type,
                        tableName: this.insertOb[this.insertPaths[i]].table
                    }
                    // input.aldsfdsf = 'sdfdkfdjk'
                    let currColumnPathId
                    if (this.insertOb[this.insertPaths[i]].columns[col_keys[k]].pathid.indexOf('-') > -1) {
                        currColumnPathId = this.insertOb[this.insertPaths[i]].columns[col_keys[k]].pathid;
                    } else {
                        currColumnPathId = this.insertOb[this.insertPaths[i]].columns[col_keys[k]].id;
                    }
                    /* add columns original data to new column obj */
                    if (colToColData[currColumnPathId]) {
                        input.alias = colToColData[currColumnPathId].alias;
                        if (input.required == false) {
                            // if required is false then check  if required is true from frontend and use it 
                            input.isSetRequired = colToColData[currColumnPathId].required || false; // is user has set this columns is required
                        }
                        input.enumValue = colToColData[currColumnPathId].enumValue;
                        input.dynamic = colToColData[currColumnPathId].dynamic;
                    }
                    table_insert_type[table_body_path_arr.join('.')].data_detailed = table_insert_type[table_body_path_arr.join('.')].data_detailed || {};
                    table_insert_type[table_body_path_arr.join('.')].data[input.title] = otherutils.getDummyValue(input.dataType) || input.dataType;
                    table_insert_type[table_body_path_arr.join('.')].data_detailed[input.title] = {
                        '$qd_column': true,
                        type: input.type,
                        required: input.required,
                        default: input.default,
                        dataType: input.dataType
                    }

                }
            }

            var key_name;
            if (table_body_path_arr.length == 0) {
                var current_table = this.insertPaths[i].split('-').pop().split('.')[0]
                key_name = this.currentModel.tidToName[current_table][1]
            } else {
                key_name = table_body_path_arr[table_body_path_arr.length - 1]
            }
            body_key_props[key_name] = tabob.table_body_type


            insert_json.push(tabob);
        }
        if (isColumnUnshifted) { // remove explicitly added base table 
            params.columns.shift();
        }

        var detailed_body = {}
        var response = {}
        var response_detailed = {}

        var table_insert_type_keys = Object.keys(table_insert_type)
        table_insert_type_keys.sort((a, b) => a.length - b.length);
        for (let index = 0; index < table_insert_type_keys.length; index++) {
            const element = table_insert_type_keys[index];
            var new_path_arr = []
            for (var i = 0; i < table_insert_type[element].static_path_arr.length; i++) {

                var lookup_key = table_insert_type[element].static_path_arr.slice(0, i + 1).join('.')

                if (table_insert_type[lookup_key].type == 'array') {
                    new_path_arr.push(table_insert_type[lookup_key].static_path_arr[i] + '[0]')
                } else {
                    new_path_arr.push(table_insert_type[lookup_key].static_path_arr[i])
                }
            }
            _.set(final_request_body, new_path_arr.join('.'), table_insert_type[element].data, (table_insert_type[element].type == 'array' ? Array : Object));
            _.set(detailed_body, new_path_arr.join('.'), table_insert_type[element].data_detailed, (table_insert_type[element].type == 'array' ? Array : Object));
            _.set(response, new_path_arr.join('.'), table_insert_type[element].returning_data, (table_insert_type[element].type == 'array' ? Array : Object));
            _.set(response_detailed, new_path_arr.join('.'), table_insert_type[element].returning_data_detailed, (table_insert_type[element].type == 'array' ? Array : Object));
        }

        return {
            model: insert_json,
            // body:  sample_body   ,
            // request: sample_body,
            formatted_request_body: final_request_body,
            detailed_body: detailed_body,
            response: response,
            response_detailed: response_detailed
        }
    }
    makeInsertFromCompatible(jsonData, type) {


        if (type == 'second_form') {

            let tables = Object.keys(jsonData);
            let result = {};
            let columnNameToCount = {}; // columnName to  column occurence count

            for (let i = 0; i < tables.length; i++) {
                if (columnNameToCount[jsonData[tables[i]].title]) columnNameToCount[jsonData[tables[i]].title]++;
                else columnNameToCount[jsonData[tables[i]].title] = 1;
            }

            // add  table name to repeated  columnName
            for (let i = 0; i < tables.length; i++) {
                const key = tables[i];

                let colData = jsonData[key]
                if (Array.isArray(colData)) continue;
                let column_path = key

                if (columnNameToCount[colData.title] > 1) {
                    colData.title = colData.tableName + "." + colData.title // add tableName to repeated columnNames
                }
                let typeData = otherutils.getFormSupportedType2(colData.dataType)
                result[column_path] = {
                    default: colData.default,
                    label: colData.title,
                    placeholder: `Enter ${ colData.alias|| colData.title}`,
                    required: colData.default ? false : colData.required,
                    type: typeData.name,
                    alias: colData.alias,
                    // dataType: colData.dataType, 
                    validation: typeData.validation,
                    enumValue: colData.enumValue,
                    dynamic: colData.dynamic,
                    id: uuidv4()
                    // colData : colData,
                }
                if (colData.isSetRequired) {
                    result[column_path].required = colData.isSetRequired
                }
            }
            return result
        } else {
            let result = _.cloneDeep(jsonData);

            let tables = Object.keys(result);
            for (let i = 0; i < tables.length; i++) {
                const key = tables[i];
                result[key] = {
                    "type": "array",
                    "title": key,

                    "items": {
                        properties: result[key],
                        "required": result[key].required,
                    }
                }
                delete result[key].items.properties.required;
                let obj = result[key].items.properties
                for (const colName in obj) {
                    delete obj[colName].required;
                }
            }
            return {
                "title": "Form Name Here",
                "description": "Linear Form generated through SQL",
                "required": [],
                "properties": result
            };

        }

    }
    hasMultipleRefs(pathid) {

        let dir = this.relDirection(pathid, this.subdomain);
        let pathid_split = pathid.split('-');
        if (pathid_split.length == 1) return false;
        let base_tab, ref_col, base_tab_name_split, ref_col_name_split;
        // let last_path = [];
        if (dir == 'in') {
            base_tab = pathid_split[pathid_split.length - 1].split('.')[0];
            ref_col = pathid_split[pathid_split.length - 2];
        } else {
            base_tab = pathid_split[pathid_split.length - 2].split('.')[0];
            ref_col = pathid_split[pathid_split.length - 1];
        }

        base_tab_name_split = this.currentModel.tidToName[base_tab];
        ref_col_name_split = this.currentModel.idToName[ref_col];
        let ref_col_name = this.currentModel.idToName[ref_col].join('.');

        let ref_keys = Object.keys(this.currentModel.models[base_tab_name_split[0]][base_tab_name_split[1]].properties.rels_new);

        let ref_col_count = 0;
        for (let i = 0; i < ref_keys.length; i++) {
            const element = ref_keys[i];
            let ref_key_split = ref_keys[i].split('-');
            if (ref_key_split[1] == ref_col_name) ++ref_col_count;
        }

        if (ref_col_count > 1) return true;
        return false;
    }

    initPath(pathid) {
        let dir = this.relDirection(pathid, this.subdomain);
        let havemultiplerefs = this.hasMultipleRefs(pathid);

        let psplit_init = pathid.split('-');
        let tab = psplit_init[psplit_init.length - 1].split('.')[0];
        let tab_name_arr = this.currentModel.tidToName[tab];
        let with_alias, body_alias;
        if (havemultiplerefs) {
            let col_name_with_alias;
            if (dir == 'in') {
                col_name_with_alias = this.currentModel.idToName[psplit_init[psplit_init.length - 1]];
            } else {
                col_name_with_alias = this.currentModel.idToName[psplit_init[psplit_init.length - 2]];
            }

            body_alias = (tab_name_arr[0] == 'public' ? col_name_with_alias[2] + '_' + tab_name_arr[1] : col_name_with_alias[2] + '_' + tab_name_arr.join('_'));

        } else {
            body_alias = (tab_name_arr[0] == 'public' ? tab_name_arr[1] : tab_name_arr.join('_'));

        }

        let currMethod = this.viewdata?.submittedPkeys && this.viewdata.submittedPkeys[pathid] ? 'update' : 'insert';
        with_alias = 'q' + currMethod + '_' + body_alias;
        this.insertOb[pathid] = {
            method: currMethod,
            columns: {},
            schema: tab_name_arr[0],
            table: tab_name_arr[1],
            with_alias: with_alias,
            body_alias: body_alias,
            returns: {
                qref: [],
                user: []
            }
        };
        // add not nulls
        if (currMethod !== 'update') {
            let nn_arr = this.currentModel.models[tab_name_arr[0]][tab_name_arr[1]].properties.notnulls;
            let nn_nd_na_arr = [] // not null , not have default value , not have auto fill datatype 
            for (let i = 0; i < nn_arr.length; i++) {
                if (!this.currentModel.models[tab_name_arr[0]][tab_name_arr[1]].properties.columns[nn_arr[i]].default) {
                    nn_nd_na_arr.push(nn_arr[i]);
                }
            }
            for (let i = 0; i < nn_nd_na_arr.length; i++) {
                this.initColumn(pathid, tab + '.' + this.currentModel.models[tab_name_arr[0]][tab_name_arr[1]].properties.columns[nn_nd_na_arr[i]].id);
            }
        }

        if (!dir || dir == 'out') this.insertPaths.unshift(pathid);
        else this.insertPaths.push(pathid);
    }

    initColumn(pathid, coltabid, user_opts) {

        if (typeof pathid !== 'string') pathid = pathid.toString();
        if (!this.insertOb[pathid]) this.initPath(pathid);
        let col_name_split = this.currentModel.idToName[coltabid];

        var required = (user_opts && user_opts.required) ? user_opts.required : false;
        if (!required && this.currentModel.models[col_name_split[0]][col_name_split[1]].properties.columns[col_name_split[2]].not_null && !this.currentModel.models[col_name_split[0]][col_name_split[1]].properties.columns[col_name_split[2]].default) required = true;

        let col_name = col_name_split.join('.');
        let psplit_init = pathid.split('-');
        // let index_of_coltabid = psplit_init.indexOf(coltabid);
        let val, op;
        if (this.insertOb[pathid].returns.user.length == 0) {
            this.insertOb[pathid].returns.user = this.getAllReturningColumns(pathid)
        }

        let out_rel_path, out_rel_ref_id;

        if (psplit_init[psplit_init.length - 1] == coltabid) {

            let last_ref_path = psplit_init[psplit_init.length - 2] + '-' + psplit_init[psplit_init.length - 1];
            let dir = this.relDirection(last_ref_path, this.subdomain);

            if (dir == 'out') {

                // req body
                op = '$req-body';
                if (this.insertOb[pathid].returns.qref.indexOf(col_name_split[2]) == -1) this.insertOb[pathid].returns.qref.push(col_name_split[2]);

                if (psplit_init.length == 2) {

                    let b_split = psplit_init[0].split('.');
                    let col_build_name = this.currentModel.idToName[psplit_init[0]].join('.');
                    this.initColumn(b_split[0], psplit_init[0]);
                    this.insertOb[b_split[0]].columns[col_build_name].operator = '$qref';
                    this.insertOb[b_split[0]].columns[col_build_name].value = this.insertOb[pathid].with_alias + '$' + col_name_split[2];
                    val = this.buildBodyPath(pathid, col_name_split[2]);

                } else {

                    let qref_path_build = psplit_init.slice(0, psplit_init.length - 2).join('-');
                    let col_build_name = this.currentModel.idToName[psplit_init[psplit_init.length - 2]].join('.');
                    this.initColumn(qref_path_build, psplit_init[psplit_init.length - 2]);

                    this.insertOb[qref_path_build].columns[col_build_name].operator = '$qref';
                    this.insertOb[qref_path_build].columns[col_build_name].value = this.insertOb[pathid].with_alias + '$' + col_name_split[2];
                    val = this.buildBodyPath(pathid, col_name_split[2]);

                }

            } else {


                // qref
                op = "$qref";
                let q_ref_path, ref_col_name;
                if (psplit_init.length == 2) {

                    let b_split = psplit_init[0].split('.');
                    q_ref_path = b_split[0];
                    ref_col_name = this.currentModel.idToName[psplit_init[0]][2];

                } else {

                    q_ref_path = psplit_init.slice(0, psplit_init.length - 2).join('-');
                    ref_col_name = this.currentModel.idToName[psplit_init[psplit_init.length - 2]][2];

                }

                if (this.insertOb[q_ref_path]?.returns.qref.indexOf(ref_col_name) == -1) this.insertOb[q_ref_path].returns.qref.push(ref_col_name);
                val = this.insertOb[q_ref_path]?.with_alias + '$' + ref_col_name;

            }

        } else {
            // req body
            op = '$req-body';

            val = this.buildBodyPath(pathid, col_name_split[2]);
        }

        if (this.currentModel.models[col_name_split[0]][col_name_split[1]].properties.serials.indexOf(col_name_split[2]) > -1) {

            return;
        }

        if (!this.insertOb[pathid].columns[col_name]) {
            this.insertOb[pathid].columns[col_name] = {
                id: coltabid,
                pathid: pathid + '$' + coltabid.split('.')[1],
                columnName: col_name,
                operator: op,
                value: val,
                required: required
            };

            if (this.insertOb[pathid].columns[col_name].operator === '$req-body') {
                let value_split = this.insertOb[pathid].columns[col_name].value.split('.')
                value_split.pop();
                this.insertOb[pathid].columns[col_name].body_path = value_split.join(".");

            }
            if (this.insertOb[pathid].columns[col_name].operator === '$qref') {
                this.insertOb[pathid].qref_used = true;
            }
        } else {
            if (this.insertOb[pathid].columns[col_name].operator == '$qref') {
                // TODO: check why value is undefined here. does not make sense
                this.insertOb[pathid].columns[col_name].value = val;
            }

        }

    }
    getAllReturningColumns(pathid) {
        let return_col_id_split;
        let return_col_table_id;
        let result = []
        this.viewdata.return_columns?.map((colData) => {
            return_col_id_split = colData.id.includes("$") ? colData.id.split('$') : colData.id.split('.')
            return_col_table_id = return_col_id_split[0].split("-").pop().split(".")[0]
            let colname_arr = this.currentModel.idToName[return_col_table_id + '.' + return_col_id_split[return_col_id_split.length - 1]];
            if (return_col_id_split[0] == pathid) {
                result.push({
                    ...colData,
                    id: colData.id,
                    columnName: colname_arr.join('.'),
                    alias: colData.alias, // TODO: add alias for repeating columns
                })
            }

        })


        return result;
    }
    buildBodyPath(pathid, colname) {

        let dir = this.relDirection(pathid, this.subdomain);
        let psplit_b = pathid.split('-');
        let basetid;
        if (psplit_b.length == 1) {
            basetid = psplit_b[0];
            let t = this.currentModel.tidToName[psplit_b[0]];
            if (t[0] == 'public') return t[1] + '.' + colname;
            else return t.join('_') + '.' + colname;
        } else {
            basetid = psplit_b[0].split('.')[0];
        }

        let havemultiplerefs = this.hasMultipleRefs(pathid);

        let col_name_add;
        if (havemultiplerefs) {
            let col_name_add_split;
            if (dir == 'in') {
                col_name_add_split = this.currentModel.idToName[psplit_b[psplit_b.length - 1]];
            } else {
                col_name_add_split = this.currentModel.idToName[psplit_b[psplit_b.length - 2]];
            }
            col_name_add = col_name_add_split[2];
        }
        let b_arr = [];
        for (let i = 0; i < psplit_b.length; i++) {
            const element = psplit_b[i];
            let curr_tab = this.currentModel.tidToName[psplit_b[i].split('.')[0]];
            if (curr_tab[0] == 'public') curr_tab = curr_tab[1];
            else curr_tab = curr_tab.join('_');
            if (b_arr.length > 0) {
                if (b_arr[b_arr.length - 1] != curr_tab) b_arr.push(curr_tab);
            } else {
                b_arr.push(curr_tab);
            }
        }
        if (!this.insertOb[basetid]) {
            this.initPath(basetid);
            // return "";
        }
        let b_arr_new = [this.insertOb[basetid].body_alias];
        let b_path_build = '';

        for (let i = 0; i < psplit_b.length - 1; i = i + 2) {

            if (b_path_build == '') b_path_build += psplit_b[i] + '-' + psplit_b[i + 1];
            else b_path_build += '-' + psplit_b[i] + '-' + psplit_b[i + 1];

            if (!this.insertOb[b_path_build]) this.initPath(b_path_build);
            b_arr_new.push(this.insertOb[b_path_build].body_alias);
        }
        if (col_name_add) {

            b_arr[b_arr.length - 1] = col_name_add + '_' + b_arr[b_arr.length - 1];

        }
        b_arr.push(colname);
        b_arr_new.push(colname);

        return b_arr_new.join('.');
    }

    convertUpdatePlain(params) {
        params.columns = params.columns || [];

        let base_table = params.base;

        let tab_name_spl = this.currentModel.tidToName[base_table];

        let request_sample = {
            [tab_name_spl[1]]: {}
        };

        var p_key = this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.primary;
        if (p_key.length != 1) return null;

        var p_key_type = otherutils.getSuperType(this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type) || this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type;

        var disabled_condition_ids = [
            "8a9a98a9-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-71915b01dfc3"
        ];

        let main_model = {
            schema: tab_name_spl[0],
            table: tab_name_spl[1],
            table_body_path: tab_name_spl[1],
            method: 'update',
            table_alias: tab_name_spl[1],
            columns: [],
            where: params.where,
            returns: {
                qref: [],
                user: []
            },
            default_where: {
                "id": disabled_condition_ids[0],
                "type": "group",
                "children1": {
                    "b9b898aa-89ab-4cde-b012-31915b040152": {
                        "type": "rule",
                        "properties": {
                            "field": [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                            "operator": "equal",
                            "value": [
                                'URLParam.' + p_key[0]
                            ],
                            "valueSrc": [
                                'URLParam.' + p_key[0]
                            ],
                            "valueType": [
                                "text"
                            ]
                        }
                    }
                }
            }
        };

        main_model.condition_count = condition_count(main_model.where);

        if (!params.graphql) {
            var rebuilt_where = {
                condition: 'AND',
                rules: [{
                    fieldName: [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                    operator: 'equal',
                    input: 'text',
                    input_key: 'URLParam.' + p_key[0],
                    type: 'text',
                    value: 'URLParam.' + p_key[0]
                }]
            }

            main_model.where = main_model.where || {};
            main_model.where.rules = main_model.where.rules || [];

            for (let k = 1; k < main_model.where.rules.length; k++) {
                const element = main_model.where.rules[k];
                rebuilt_where.rules.push(main_model.where.rules[k])
            }

            main_model.where = rebuilt_where;
        }

        for (let i = 0; i < params.columns.length; i++) {
            if (!params.columns[i] || !params.columns[i].id || params.columns[i].id.indexOf('-') > -1) return null;

            // let base_col_spl = params.columns[i].id.split('.');
            let col_arr = this.currentModel.idToName[params.columns[i].id];

            // col_last_name_arr.push(col_arr[2]);
            let col_text = col_arr.join('.');
            if (!col_text) return null;

            if (this.currentModel.models[col_arr[0]][col_arr[1]].properties.serials.indexOf(col_arr[2]) > -1) {
                continue;
            }

            main_model.columns.push({
                columnName: col_text,
                operator: '$req-body',
                value: col_arr[2]
            });

        }
        let formatted_request_body = {
            [tab_name_spl[1]]: {}
        };
        let formatted_request_body_detailed = {
            [tab_name_spl[1]]: {}
        };

        //add request body
        let table_properties = this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties
        for (let i = 0; i < main_model.columns.length; i++) {
            request_sample[tab_name_spl[1]][main_model.columns[i].value] = {
                ...table_properties.columns[main_model.columns[i].value],
                dataType: table_properties.columns[main_model.columns[i].value].type,
                type: otherutils.getFormSupportedType2(table_properties.columns[main_model.columns[i].value].type).name
            }

            formatted_request_body[tab_name_spl[1]][main_model.columns[i].value] = otherutils.getDummyValue(table_properties.columns[main_model.columns[i].value].type) || table_properties.columns[main_model.columns[i].value].type;
            formatted_request_body_detailed[tab_name_spl[1]][main_model.columns[i].value] = {
                '$qd_column': true,
                type: request_sample[tab_name_spl[1]][main_model.columns[i].value].type,
                required: request_sample[tab_name_spl[1]][main_model.columns[i].value].required,
                default: request_sample[tab_name_spl[1]][main_model.columns[i].value].default,
                dataType: request_sample[tab_name_spl[1]][main_model.columns[i].value].dataType
            }
        }

        let response_sample = {};
        let response_sample_detailed = {};

        // add response body 
        response_sample[main_model.table_alias] = response_sample[main_model.table_alias] || {}
        response_sample_detailed[main_model.table_alias] = response_sample_detailed[main_model.table_alias] || {}
        main_model.returns.user = this.getAllReturningColumns(base_table)

        for (let k = 0; k < main_model.returns.user.length; k++) {
            let col_name = main_model.returns.user[k].columnName.split(".").pop();

            response_sample[main_model.table_alias][col_name] = otherutils.getDummyValue(this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type) || this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type;
            response_sample_detailed[main_model.table_alias][col_name] = {
                '$qd_column': true,
                type: otherutils.getSuperType(this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type) || this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type,
                dataType: this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type
            }
        }

        return {
            model: main_model,
            response: response_sample,
            response_detailed: response_sample_detailed,
            request: request_sample,
            formatted_request_body: formatted_request_body,
            base_table_name_arr: tab_name_spl,
            disabled_condition_ids: disabled_condition_ids,
            detailed_body: formatted_request_body_detailed,
            url_param_column: {
                column: p_key[0],
                type: p_key_type
            }
        };
    }

    convertDeletePlain(params) {
        params.columns = [];

        let base_table = params.base;

        let tab_name_spl = this.currentModel.tidToName[base_table];

        let request_sample = {
            // [tab_name_spl[1]]: {}
        };
        let formatted_request_body = {
            // [tab_name_spl[1]]: {}
        };

        var p_key = this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.primary;
        if (p_key.length != 1) return null;

        var p_key_type = otherutils.getSuperType(this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type) || this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type;

        var disabled_condition_ids = [
            "8a9a98a9-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-71915b01dfc3"
        ];

        let main_model = {
            schema: tab_name_spl[0],
            table: tab_name_spl[1],
            table_body_path: tab_name_spl[1],
            method: 'delete',
            table_alias: tab_name_spl[1],
            columns: [],
            where: params.where,
            returns: {
                qref: [],
                user: []
            },
            default_where: {
                "id": disabled_condition_ids[0],
                "type": "group",
                "children1": {
                    "b9b898aa-89ab-4cde-b012-31915b040152": {
                        "type": "rule",
                        "properties": {
                            "field": [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                            "operator": "equal",
                            "value": [
                                'URLParam.' + p_key[0]
                            ],
                            "valueSrc": [
                                'URLParam.' + p_key[0]
                            ],
                            "valueType": [
                                "text"
                            ]
                        }
                    }
                }
            }
        };

        main_model.condition_count = condition_count(main_model.where);

        var rebuilt_where = {
            condition: 'AND',
            rules: [{
                fieldName: [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                operator: 'equal',
                input: 'text',
                input_key: 'URLParam.' + p_key[0],
                type: 'text',
                value: 'URLParam.' + p_key[0]
            }]
        }

        main_model.where = main_model.where || {};
        main_model.where.rules = main_model.where.rules || [];

        for (let k = 1; k < main_model.where.rules.length; k++) {
            const element = main_model.where.rules[k];
            rebuilt_where.rules.push(main_model.where.rules[k])
        }

        main_model.where = rebuilt_where;

        for (let i = 0; i < params.columns.length; i++) {
            if (!params.columns[i] || !params.columns[i].id || params.columns[i].id.indexOf('-') > -1) return null;

            // let base_col_spl = params.columns[i].id.split('.');
            let col_arr = this.currentModel.idToName[params.columns[i].id];

            // col_last_name_arr.push(col_arr[2]);
            let col_text = col_arr.join('.');
            if (!col_text) return null;

            if (this.currentModel.models[col_arr[0]][col_arr[1]].properties.serials.indexOf(col_arr[2]) > -1) {
                continue;
            }

            main_model.columns.push({
                columnName: col_text,
                operator: '$req-body',
                value: col_arr[2]
            });

        }

        //add request body
        // let table_properties = this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties
        // for (let i = 0; i < main_model.columns.length; i++) {
        //     request_sample[tab_name_spl[1]][main_model.columns[i].value] = {
        //         ...table_properties.columns[main_model.columns[i].value],
        //         dataType: table_properties.columns[main_model.columns[i].value].type,
        //         type: otherutils.getFormSupportedType2(table_properties.columns[main_model.columns[i].value].type).name
        //     }
        //     formatted_request_body[tab_name_spl[1]][main_model.columns[i].value] = request_sample[tab_name_spl[1]][main_model.columns[i].value].type
        // }

        let response_sample = {};
        let response_sample_detailed = {};

        // add response body 
        response_sample[main_model.table_alias] = response_sample[main_model.table_alias] || {}
        response_sample_detailed[main_model.table_alias] = response_sample_detailed[main_model.table_alias] || {}
        main_model.returns.user = this.getAllReturningColumns(base_table)

        for (let k = 0; k < main_model.returns.user.length; k++) {
            let col_name = main_model.returns.user[k].columnName.split(".").pop();

            response_sample[main_model.table_alias][col_name] = otherutils.getDummyValue(this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type) || this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type;
            response_sample_detailed[main_model.table_alias][col_name] = {
                '$qd_column': true,
                type: otherutils.getSuperType(this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type) || this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type,
                dataType: this.currentModel.models[this.currentModel.idToName[main_model.returns.user[k].id][0]][this.currentModel.idToName[main_model.returns.user[k].id][1]].properties.columns[this.currentModel.idToName[main_model.returns.user[k].id][2]].type
            }
        }

        return {
            model: main_model,
            response: response_sample,
            response_detailed: response_sample_detailed,
            request: request_sample,
            formatted_request_body: formatted_request_body,
            base_table_name_arr: tab_name_spl,
            disabled_condition_ids: disabled_condition_ids,
            url_param_column: {
                column: p_key[0],
                type: p_key_type
            }
        };
    }

    convertSelectByIDDeep(params) {

        let main_t_spl = params.columns[0]?.id.split('-') || [];
        let base_table = main_t_spl[0]?.split('.')[0] || params.base;

        let tab_name_spl = this.currentModel.tidToName[base_table];

        var p_key = this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.primary;
        if (p_key.length != 1) return null;

        params.disabled_condition_ids = [
            "8a9a98a9-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-71915b01dfc3"
        ];

        params.default_where = {
            "id": params.disabled_condition_ids[0],
            "type": "group",
            "children1": {
                "b9b898aa-89ab-4cde-b012-31915b040152": {
                    "type": "rule",
                    "properties": {
                        "field": [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                        "operator": "equal",
                        "value": [
                            'URLParam.' + p_key[0]
                        ],
                        "valueSrc": [
                            'URLParam.' + p_key[0]
                        ],
                        "valueType": [
                            "text"
                        ]
                    }
                }
            }
        }

        var rebuilt_where = {
            condition: 'AND',
            rules: [{
                fieldName: [tab_name_spl[0], tab_name_spl[1], p_key[0]].join('.'),
                operator: 'equal',
                input: 'text',
                input_key: 'URLParam.' + p_key[0],
                type: 'text',
                value: 'URLParam.' + p_key[0]
            }]
        }

        params.where = params.where || {};
        params.where.rules = params.where.rules || [];

        for (let k = 1; k < params.where.rules.length; k++) {
            const element = params.where.rules[k];
            rebuilt_where.rules.push(params.where.rules[k])
        }

        var p_key_type = otherutils.getSuperType(this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type) || this.currentModel.models[tab_name_spl[0]][tab_name_spl[1]].properties.columns[p_key[0]].type;

        params.where = rebuilt_where;
        params.url_param_column = {
            column: p_key[0],
            type: p_key_type
        };

        return this.convertSelectDeep(params)

    }

    convertSelectDeep(params) {

        params.columns = params.columns.sort(sortIdAsc);

        if (params.graphql) {
            var all_join_paths = [];
            for (let i = 0; i < params.columns.length; i++) {
                var path_id = params.columns[i].id.split('$')[0];
                all_join_paths.push(path_id);
                var sub_paths = allPossiblePaths(path_id);
                for (let sub_path of sub_paths) {
                    if (all_join_paths.indexOf(sub_path) == -1) {
                        all_join_paths.push(sub_path);
                        params.columns.push({
                            id: sub_path + '$' + sub_path.split('.').pop(),
                            dummyjoin: true
                        });
                    }
                }
            }
            params.columns = params.columns.sort(sortIdAsc);
        }

        params.join_conditions = params.join_conditions || {};
        let main_t_spl = params.columns[0]?.id.split('-') || [];
        let base_table = main_t_spl[0]?.split('.')[0] || params.base; //base table id 
        let currentModel = this.currentModel;
        let tab_name_spl = currentModel.tidToName[base_table];
        // let columns = [], agg_clusters = [];

        params.agg_paths = params.agg_paths || []

        params.agg_paths && params.agg_paths.sort();

        // generate new ids
        let agg_clusters = {
            // "full_id": {
            //     columns: [],
            //     agg_paths: []
            // }
        };

        var disabled_condition_ids = params.disabled_condition_ids || [];

        params.orderby_dynamic_columns = params.orderby_dynamic_columns || [];

        var clean_orderby_dynamic_columns = [];

        // Convert column IDs to names for dynamic ordering
        for (let i = 0; i < params.orderby_dynamic_columns.length; i++) {
            let columnId = params.orderby_dynamic_columns[i].id;
            if (currentModel.idToName[columnId]) {
                let columnName = currentModel.idToName[columnId].join('.');
                params.orderby_dynamic_columns[i].name = columnName;
                clean_orderby_dynamic_columns.push(params.orderby_dynamic_columns[i]);
            }
        }
        // let columns = [];

        // let mainMod = new currentModel.models[tab_name_spl[0]][tab_name_spl[1]]();
        let main_model = {
            schema: tab_name_spl[0],
            table: tab_name_spl[1],
            method: 'select',
            table_alias: tab_name_spl[1],
            where: params.where,
            orderby_dynamic: params.orderby_dynamic ? true : false,
            orderby_dynamic_columns: clean_orderby_dynamic_columns,
            limit_dynamic: params.limit_dynamic ? true : false,
            offset_dynamic: params.offset_dynamic ? true : false,
            offset: params.offset,
            limit: params.limit,
            default_where: params.default_where
        };

        let all_col_names = [];
        let all_true_col_names = []; // { columnName : "" , def: "" }
        let all_cols_for_where = [];
        let all_tabs = [tab_name_spl];
        let all_listed_col = params.columns; // all  listed columns  ( used later for  orderby  )

        let response_sample = {};
        let response_sample_detailed = {};
        let request_sample = {};

        response_sample[tab_name_spl[1]] = [{}];
        response_sample_detailed[tab_name_spl[1]] = [{}];

        var join_conditions_default = {}

        let nested = {};

        // let join_paths_where = params.join_paths_where || [];
        let join_paths_where = params.join_paths_where || [];

        let regular_join_paths = params.regular_join_paths || [];

        var join_paths_text = {};

        let same_tab_refs = this.sametablerels(tab_name_spl);

        // let nested_ids = []

        let col_last_name_arr = [];

        let ts = false;
        let tsColData;
        var agg_alias_count = {

        }
        for (let i = 0; i < params.columns.length; i++) {
            let customColumnId = null;
            if (params.columns[i].resolved) {
                continue;
            }
            if (params.columns[i].rowCount) params.columns[i].fn = 'count' // if rowCount is true then add agg_func 'count' 
            // ts = (params.columns[i].fn == 'date_trunc' && !ts ? true : false)
            if (!ts && params.columns[i].fn == 'date_trunc') {

                ts = true;
                tsColData = params.columns[i];
            }
            // id cannot be null
            if (!params.columns[i] || !params.columns[i].id) return null;

            // TODO: check if fn is allowed
            if (params.columns[i].fn) {
                main_model.auto_group = true;
            }

            if (params.columns[i].def) {
                customColumnId = params.columns[i].id;
                if (params.columns[i].id.indexOf('-') == -1) {
                    let id_split = params.columns[i].id.split(".");
                    params.columns[i].id = id_split[0] + '.1';
                } else {
                    let id_split = params.columns[i].id.split("$");
                    params.columns[i].id = id_split[0] + '$1';
                }
            }
            if (params.columns[i].id.indexOf('-') == -1) {
                // base column
                let base_col_spl = params.columns[i].id.split('.');
                // all_tabs.push(base_col_spl)
                // base tables must match
                if (base_col_spl[0] != base_table) return null;
                if (!nested[base_table]) nested[base_table] = {
                    columns: []
                };
                let col_arr = currentModel.idToName[params.columns[i].id];
                col_last_name_arr.push(col_arr[2]);
                let col_text = col_arr.join('.');
                all_col_names.push(col_text);
                if (!params.columns[i].fn) all_true_col_names.push({
                    columnName: col_text,
                    def: params.columns[i].def,
                });

                if (!params.columns[i].dummyjoin) {
                    nested[base_table].columns.push({
                        columnName: col_text,
                        fn: params.columns[i].fn,
                        ts_gran: params.columns[i].ts_gran,
                        def: params.columns[i].def,
                        customColType: params.columns[i].customColType,
                        alias: (params.columns[i].alias || col_arr[2]),
                        label: params.columns[i].label,
                        rowCount: params.columns[i].rowCount,
                    });
                    let properties = this.currentModel.models[col_arr[0]][col_arr[1]].properties;
                    response_sample[tab_name_spl[1]][0][col_arr[2]] = otherutils.getDummyValue(properties.columns[col_arr[2]].type) || properties.columns[col_arr[2]].type;
                    response_sample_detailed[tab_name_spl[1]][0][col_arr[2]] = {
                        '$qd_column': true,
                        type: otherutils.getSuperType(properties.columns[col_arr[2]].type) || properties.columns[col_arr[2]].type,
                        dataType: properties.columns[col_arr[2]].type
                    }
                }

            } else {
                // join
                let id_spl0 = params.columns[i].id.split('$');
                let column = id_spl0[1];
                let id_pure = id_spl0[0];
                let id_spl = id_pure.split('-');

                let rel_type = this.relType(id_pure);
                let rel_type_split = rel_type.split('-');
                var alt_alias_prefix;

                if (id_spl.length > 2) {
                    // get last table
                    var prev_tab = currentModel.idToName[id_spl[id_spl.length - 2]][1];
                    alt_alias_prefix = prev_tab + '_';
                } else {
                    // get last column
                    var prev_col = currentModel.idToName[id_spl[0]][2];
                    alt_alias_prefix = prev_col + '_';
                }

                // check agg
                let nested_in_agg_path = false;

                let col_arr;

                if (id_spl.length == 2) {
                    col_arr = currentModel.idToName[id_spl[1].split('.')[0] + '.' + column];
                } else {
                    col_arr = currentModel.idToName[id_spl[id_spl.length - 1].split('.')[0] + '.' + column];
                }

                // force agg all joins
                if (params.agg_paths?.indexOf(id_pure) == -1 && regular_join_paths.indexOf(id_pure) == -1) params.agg_paths.push(id_pure);

                aggloop:
                    for (let j = 0; j < (params.agg_paths && params.agg_paths.length); j++) {
                        const element = params.agg_paths[j];
                        if (id_pure.indexOf(params.agg_paths[j]) == 0 && (id_pure == params.agg_paths[j] || nested[params.agg_paths[j]] || agg_clusters[params.agg_paths[j]])) {

                            nested_in_agg_path = true;
                            // let sub_agg_paths = [];
                            // let add_to_agg_paths = false;

                            let agg_cluster_id = params.agg_paths[j];

                            let tempkeys = Object.keys(nested);

                            let longest_existing_subpath;
                            for (let k = 0; k < tempkeys.length; k++) {
                                if (tempkeys[k].indexOf('-') > -1 && tempkeys[k].length < params.agg_paths[j].length && params.agg_paths[j].indexOf(tempkeys[k]) == 0) {
                                    if (!longest_existing_subpath || tempkeys[k].length > longest_existing_subpath.length) longest_existing_subpath = tempkeys[k];
                                }
                            }

                            if (longest_existing_subpath) {
                                let new_agg_id_spl = params.agg_paths[j].split(longest_existing_subpath);
                                agg_cluster_id = new_agg_id_spl[1].substr(1);
                            }

                            if (!agg_clusters[agg_cluster_id]) {
                                agg_alias_count[col_arr[1]] = agg_alias_count[col_arr[1]] || 0;
                                ++agg_alias_count[col_arr[1]];
                                agg_clusters[agg_cluster_id] = {
                                    columns: [],
                                    agg_paths: [],
                                    alt_alias_prefix: alt_alias_prefix
                                }
                            }
                            let col_path_id;
                            if (id_pure == params.agg_paths[j]) {
                                // base
                                col_path_id = id_spl[id_spl.length - 1].split('.')[0] + '.' + column;
                            } else {
                                // sub join
                                let remaining_id_split = id_pure.split(params.agg_paths[j]);
                                let sub_id_pure = remaining_id_split[1].substr(1);
                                col_path_id = sub_id_pure + '$' + column;
                                // check if needed to add to agg_path
                                if (params.agg_paths.indexOf(id_pure) > -1) {
                                    // agg the sub join
                                    agg_clusters[agg_cluster_id].agg_paths.push(sub_id_pure);
                                }
                            }
                            agg_clusters[agg_cluster_id].columns.push({
                                id: col_path_id,
                                dummyjoin: params.columns[i].dummyjoin,
                                id_pure: params.columns[i].id_pure || id_pure
                            });
                            var join_condition_id = params.columns[i].id_pure || agg_cluster_id;
                            agg_clusters[agg_cluster_id].id_pure = params.columns[i].id_pure || id_pure;
                            agg_clusters[agg_cluster_id].agg_type = (rel_type_split[1] == 1 ? 'row_to_json' : 'json_agg');
                            // agg_clusters[agg_cluster_id].sub_join_conditions = params.join_conditions[id_pure] || {};
                            agg_clusters[agg_cluster_id].sub_join_conditions = params.join_conditions[join_condition_id] || {};
                            agg_clusters[agg_cluster_id].join_conditions = params.join_conditions;
                            break aggloop;
                        }
                    }

                if (nested_in_agg_path) continue;

                // all_col_names.push(col_arr.join('.'))

                let alias = params.columns[i].alias; /* let should not be used here */

                if (col_last_name_arr.indexOf(col_arr[2]) > -1) { // if column with same name already exist then  use alias 
                    // force alias
                    // col_last_name_arr.ind
                    let ref_id_name = currentModel.idToName[id_spl[id_spl.length - 1]];
                    alias = alias || ref_id_name[0] + '.' + ref_id_name[1] + '.' + col_arr[2];
                    col_last_name_arr.push(alias);
                    response_sample[tab_name_spl[1]][0][alias.split('.').slice(1, 3).join(".")] = col_arr[2];
                } else {
                    col_last_name_arr.push(col_arr[2]);
                    response_sample[tab_name_spl[1]][0][col_arr[2]] = col_arr[2];
                }

                let join_type = "INNER"; // default join type 
                if (params.join_type) {
                    if (params.join_type[id_pure] == 'right') join_type = "RIGHT";
                    else if (params.join_type[id_pure] == 'left') join_type = "LEFT";
                    else if (params.join_type[id_pure] == 'cross') join_type = "CROSS";

                }
                if (!nested[id_pure]) nested[id_pure] = {
                    columns: [],
                    schema: col_arr[0],
                    table: col_arr[1],
                    join_type: join_type,
                    alt_alias_prefix: alt_alias_prefix,
                    // agg_type: (rel_type_split[1] == 1 ? 'row_to_json' : 'json_agg')
                };

                if (!params.columns[i].dummyjoin) {
                    nested[id_pure].columns.push({
                        columnName: col_arr.join('.'),
                        alias: alias,
                        fn: params.columns[i].fn,
                        ts_gran: params.columns[i].ts_gran,
                        def: params.columns[i].def,
                        customColType: params.columns[i].customColType,
                        label: params.columns[i].label,
                        rowCount: params.columns[i].rowCount,

                    });
                    all_col_names.push(col_arr.join('.'));
                    if (!params.columns[i].fn) all_true_col_names.push({
                        columnName: col_arr.join('.'),
                        def: params.columns[i].def,
                    });
                }
            }
            if (customColumnId) params.columns[i].id = customColumnId;

        }

        let nested_keys = Object.keys(nested);
        main_model.columns = nested[base_table]?.columns || [];

        main_model.joins = [];

        if ((main_model.auto_group && all_true_col_names.length > 0) || ts) {
            if (ts) all_true_col_names.push({
                columnName: 'tp',
                def: null
            });
            main_model.groupby = all_true_col_names;
        }

        /*  ------------  Resolve Order by -----------  */
        // if(ts && !params.orderby) {
        //    // default orderby 
        //    main_model.orderby  = [{
        //         id:   tsColData.id, 
        //         name: 'tp',  // default timestamp name is 'tp' 
        //         asc:  true, 
        //    }]  ; 
        // }    else  
        /*  ------------  Resolve Order by -----------  */
        if (params.orderby && Array.isArray(params.orderby)) {

            let orderby = params.orderby;
            let finalOrderby = [];
            let colidToColData = {}; // column id to column  data
            let isSelectHasAggreate = false; // is select column has aggreate function 

            for (let i = 0; i < all_listed_col.length; i++) {
                colidToColData[all_listed_col[i].id] = all_listed_col[i];
                if (all_listed_col[i].fn) isSelectHasAggreate = true;
            }

            for (let i = 0; i < orderby.length; i++) {
                if (orderby[i] && orderby[i].id && typeof orderby[i].id == 'string') {

                    if (orderby[i].id.indexOf('-') == -1) {
                        // base column
                        let base_col_spl = orderby[i].id.split('.');
                        // base tables must match
                        if (base_col_spl[0] != base_table) continue;
                        if (!orderby[i].def && !currentModel.idToName[orderby[i].id]) continue; // move forward only  if orderby column name exist  or it def (custom column ) 

                        if (orderby[i].def) {
                            orderby[i].name = orderby[i].def;
                        } else {
                            let col_arr = currentModel.idToName[orderby[i].id];
                            orderby[i].name = col_arr.join(".");
                        }


                    } else if (orderby[i].id.indexOf('-') != -1) {
                        /*    handle condtion for id value  17437.1-17463.1$2  */

                        let link_spl = orderby[i].id.split('-'); // 17437.1 | 17463.1$2 

                        if (link_spl.length > 2) {
                            // handle condition for id value     17437.1- ... - 17463.1$2 
                            link_spl = [link_spl[0], link_spl.pop()];
                        }

                        // TODO : join column   must appear in the GROUP BY clause or be used in an aggregate funct
                        let base_col_spl = link_spl[0].split("."); // 17437 | 1 
                        if (base_col_spl[0] != base_table) continue;

                        if (!link_spl[1] || link_spl[1].indexOf('$') == -1) continue;

                        let join_col = link_spl[1].split("$"); //17463.1 |  2 
                        let join_col_spl = join_col[0].split("."); //17463 | 1 
                        let join_col_id = join_col_spl[0] + "." + join_col[1]; // 17463.2

                        if (join_col.length != 2) continue;
                        // move forward only  if orderby base column ,join column , orderby join col  exist 

                        if (!currentModel.idToName[link_spl[0]]) continue;
                        if (!currentModel.idToName[join_col[0]]) continue;
                        if (!currentModel.idToName[join_col_id]) continue;

                        let col_arr = currentModel.idToName[join_col_id];
                        orderby[i].name = col_arr.join(".");

                    }

                    /* include all details  */
                    // if (colidToColData[orderby[i].id]?.alias) {    
                    //     orderby[i].alias = colidToColData[orderby[i].id].alias;
                    // } 
                    if (colidToColData[orderby[i].id]?.fn) {
                        orderby[i].fn = colidToColData[orderby[i].id].fn;
                    }
                    if (colidToColData[orderby[i].id]?.ts_gran) {
                        orderby[i].ts_gran = colidToColData[orderby[i].id].ts_gran;
                    }
                    if (tsColData && tsColData.id == orderby[i].id) tsColData.asc = orderby[i].asc;

                    finalOrderby.push(orderby[i]);

                    /*if aggregate function or groupby is used  then groupby must contain all  orderby column */
                    if (isSelectHasAggreate || main_model.groupby) {
                        // if(colidToColData[orderby[i].id]?.fn == 'date_trunc') continue; //TODO : remove this after removing alias tp 
                        if (!main_model.groupby) {
                            main_model.groupby = [{
                                columnName: orderby[i].name,
                                def: orderby[i].def || null
                            }];
                        } else if (!main_model.groupby.find(obj => obj.columnName == orderby[i].name || (orderby[i].def && obj.def === orderby[i].def))) {
                            if (orderby[i].fn !== 'date_trunc')
                                main_model.groupby.push({
                                    columnName: orderby[i].name,
                                    def: orderby[i].def || null
                                });
                        }


                    }

                }

            }

            main_model.orderby = finalOrderby;
        } else {
            // main_model.orderby = [{ 'id': 0, name: 'tp', asc: true }] ; 

        }

        for (let i = 0; i < nested_keys.length; i++) {
            // const element = nested_keys[i];
            if (nested_keys[i] == base_table) continue;
            join_paths_where.push(nested_keys[i]);
            let nes_spl = currentModel.idToName[nested_keys[i].split('-')[1]];

            all_tabs.push([
                nested[nested_keys[i]].schema, nested[nested_keys[i]].table
            ]);
            var on_conditions = modelutils.idToJoinPathOb({
                id: nested_keys[i],
                currentModel: this.currentModel
            });
            join_paths_text[nested_keys[i]] = modelutils.idToJoinPathText({
                id: nested_keys[i],
                currentModel: this.currentModel
            })
            var id1 = "8a9a98a9-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-71915b01dfc3"
            var id2 = "b9b898aa-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-31915b040152"
            disabled_condition_ids.push(id2)
            join_conditions_default[nested_keys[i]] = {
                "id": id1,
                "type": "group",
                "children1": {
                    [id2]: {
                        "type": "rule",
                        "properties": {
                            "field": join_paths_text[nested_keys[i]][0],
                            "operator": "equal",
                            "join_path_id": nested_keys[i],
                            "value": [
                                join_paths_text[nested_keys[i]][1]
                            ],
                            "valueSrc": [
                                "value"
                            ],
                            "valueType": [
                                "text"
                            ]
                        }
                    }
                }
            }

            if (params.join_conditions[nested_keys[i]] && params.join_conditions[nested_keys[i]].rules) {
                for (let k = 1; k < params.join_conditions[nested_keys[i]].rules.length; k++) {
                    const element = params.join_conditions[nested_keys[i]].rules[k];
                    on_conditions.rules.push(params.join_conditions[nested_keys[i]].rules[k])
                }
            }
            main_model.joins.push({
                // schema: nes_spl[0],
                // table: nes_spl[1],
                schema: nested[nested_keys[i]].schema,
                table: nested[nested_keys[i]].table,
                columns: nested[nested_keys[i]].columns,
                // agg_type: nested[nested_keys[i]].agg_type,
                joins: nested[nested_keys[i]].joins,
                type: nested[nested_keys[i]].join_type,
                on: on_conditions,
                alt_alias_prefix: nested[nested_keys[i]].alt_alias_prefix
            });
        }

        let agg_keys = Object.keys(agg_clusters);

        for (let i = 0; i < agg_keys.length; i++) {
            const element = agg_keys[i];

            let agg_complete_return = this.convertSelectDeep(agg_clusters[agg_keys[i]]);
            let agg_mod = agg_complete_return.model;
            agg_mod.agg_type = agg_clusters[agg_keys[i]].agg_type;
            agg_mod.alt_alias_prefix = agg_clusters[agg_keys[i]].alt_alias_prefix;

            if (agg_alias_count[agg_mod.table_alias] > 1) {
                // agg_mod.table_alias = agg_mod.alt_alias_prefix + cleanTname(agg_mod.table_alias, (agg_mod.agg_type.indexOf('row') > -1 ? false : true));
                agg_mod.table_alias = agg_mod.alt_alias_prefix + (agg_mod.agg_type.indexOf('row') > -1 ? pluralize.singular(agg_mod.table_alias) : pluralize.plural(agg_mod.table_alias));
            } else {
                agg_mod.table_alias = (agg_mod.agg_type.indexOf('row') > -1 ? pluralize.singular(agg_mod.table_alias) : pluralize.plural(agg_mod.table_alias))
            }

            join_paths_where.push(agg_keys[i]);
            join_paths_where = join_paths_where.concat(agg_complete_return.join_paths_where);
            agg_mod.on = modelutils.idToJoinPathOb({
                id: agg_keys[i],
                currentModel: this.currentModel
            });
            join_paths_text[agg_keys[i]] = modelutils.idToJoinPathText({
                id: agg_keys[i],
                currentModel: this.currentModel
            })
            var id1 = "8a9a98a9-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-71915b01dfc3"
            var id2 = "b9b898aa-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-31915b040152"
            disabled_condition_ids.push(id2)
            join_conditions_default[agg_keys[i]] = {
                "id": id1,
                "type": "group",
                "children1": {
                    [id2]: {
                        "type": "rule",
                        "properties": {
                            "field": join_paths_text[agg_keys[i]][0],
                            "operator": "equal",
                            "join_path_id": agg_keys[i],
                            "value": [
                                join_paths_text[agg_keys[i]][1]
                            ],
                            "valueSrc": [
                                "value"
                            ],
                            "valueType": [
                                "text"
                            ]
                        }
                    }
                }
            }
            var id_pure = agg_clusters[agg_keys[i]].id_pure;

            if (false && params.join_conditions[id_pure] && params.join_conditions[id_pure].rules) {
                for (let k = 1; k < params.join_conditions[id_pure].rules.length; k++) {
                    const element = params.join_conditions[id_pure].rules[k];
                    agg_mod.on.rules.push(params.join_conditions[id_pure].rules[k])
                }
            } else if (agg_clusters[agg_keys[i]].sub_join_conditions) {
                if (agg_clusters[agg_keys[i]].sub_join_conditions.rules) {
                    for (let k = 1; k < agg_clusters[agg_keys[i]].sub_join_conditions.rules.length; k++) {
                        const element = agg_clusters[agg_keys[i]].sub_join_conditions.rules[k];
                        agg_mod.on.rules.push(agg_clusters[agg_keys[i]].sub_join_conditions.rules[k])
                    }
                }

            } else {
                throw new Error('No join conditions found for id_pure: ' + id_pure);
            }

            main_model.joins.push(agg_mod);

            let agg_key_1 = Object.keys(agg_complete_return.response);

            if (agg_mod.agg_type == 'json_agg') {
                response_sample[tab_name_spl[1]][0][agg_mod.table_alias] = agg_complete_return.response[agg_key_1];
                response_sample_detailed[tab_name_spl[1]][0][agg_mod.table_alias] = agg_complete_return.response_detailed[agg_key_1];
            } else {
                response_sample[tab_name_spl[1]][0][agg_mod.table_alias] = agg_complete_return.response[agg_key_1][0];
                response_sample_detailed[tab_name_spl[1]][0][agg_mod.table_alias] = agg_complete_return.response_detailed[agg_key_1][0];
            }

        }

        for (let i = 0; i < all_tabs.length; i++) {
            // const element = all_tabs[i];
            let all_tab_col_keys = Object.keys(currentModel.models[all_tabs[i][0]][all_tabs[i][1]].properties.columns);

            for (let j = 0; j < all_tab_col_keys.length; j++) {

                let col_type = otherutils.getSuperType(currentModel.models[all_tabs[i][0]][all_tabs[i][1]].properties.columns[all_tab_col_keys[j]].type) || currentModel.models[all_tabs[i][0]][all_tabs[i][1]].properties.columns[all_tab_col_keys[j]].type;
                if (col_type) {
                    all_cols_for_where.push({
                        id: all_tabs[i].join('.') + '.' + all_tab_col_keys[j],
                        label: all_tab_col_keys[j],
                        displayName: all_tab_col_keys[j],
                        primary: currentModel.models[all_tabs[i][0]][all_tabs[i][1]].properties.columns[all_tab_col_keys[j]].primary,
                        type: col_type
                    });
                } else {


                }

            }
        }

        /*  ------------  Resolve limit and offset -----------  */
        let isAllMatrixSelected = true; // coumns with agg_func selected 
        let isAnyColumnSelected = false; // columns which are not martix 
        let agg_func = ['sum', 'count', 'max', 'min', 'avg'];
        for (let i = 0; i < main_model.columns.length; i++) {
            if (!main_model.columns[i].fn || !agg_func.includes(main_model.columns[i].fn)) {
                isAllMatrixSelected = false;

            }
            isAnyColumnSelected = true;

        }
        for (let i = 0; i < main_model.joins.length; i++) {
            for (let j = 0; j < main_model.joins[i].columns.length; j++) {
                if (!main_model.joins[i].columns[j].fn || !agg_func.includes(main_model.joins[i].columns[j].fn)) {
                    isAllMatrixSelected = false;
                }
                isAnyColumnSelected = true;
            }
        }

        /* 
        add limit if no columns is selected 
        remove limit if all columns are matrix or agg functions 
         */
        if ((!isAllMatrixSelected || !isAnyColumnSelected) && !params.agg_type) { //  
            main_model.limit = params.limit !== undefined && !isNaN(parseInt(params.limit)) ? Math.abs(parseInt(params.limit)) : 1;
            if (this.subdomain == 'hidden-mountain-7') main_model.limit = main_model.limit
            else main_model.limit = Math.min(main_model.limit, 1000);
        }
        if (params.offset) {
            main_model.offset = Math.abs(parseInt(params.offset)) || 0;
        }
        main_model.tsColumnData = tsColData;

        /*  If no columns in base and join then include all columns  */
        if (!isAnyColumnSelected) {
            this.insertAllColumns(main_model);
            for (let i = 0; i < main_model.joins.length; i++) {
                this.insertAllColumns(main_model.joins[i]);
            }
        }
        main_model.condition_count = condition_count(main_model.where);
        return {
            model: main_model,
            request: request_sample,
            response: response_sample,
            response_detailed: response_sample_detailed,
            join_paths_where: join_paths_where,
            base_table_name_arr: tab_name_spl,
            all_col_names: all_col_names,
            all_tabs: all_tabs,
            all_cols_for_where: all_cols_for_where,
            join_paths_text: join_paths_text,
            join_conditions_default: join_conditions_default,
            disabled_condition_ids: disabled_condition_ids,
            url_param_column: params.url_param_column
        };


    }
    insertAllColumns(baseModel) {

        let baseTableCols = this.currentModel.models[baseModel.schema][baseModel.table].properties.columns;
        let baseTableCols_keys = Object.keys(baseTableCols);
        for (let i = 0; i < baseTableCols_keys.length; i++) {
            baseModel.columns.push({
                columnName: baseModel.schema + "." + baseModel.table + "." + baseTableCols_keys[i],
                label: baseTableCols_keys[i],
            })
        }
    }

    sametablerels(tab_name_arr) {

        let all_arr = [],
            dups_arr = [];

        let rels = Object.keys(this.currentModel.models[tab_name_arr[0]][tab_name_arr[1]].properties.rels_new);

        for (let i = 0; i < rels.length; i++) {
            const element = rels[i];
            let rel_split = rels[i].split('-');
            let rel_to_split = rel_split[1].split('.');
            let rel_to_tab = rel_to_split[0] + '.' + rel_to_split[1];
            if (all_arr.indexOf(rel_to_tab) > -1) {
                // dups_arr.push([rel_to_split[0], rel_to_split[1]]);
                dups_arr.push(rel_to_tab);
            } else {
                all_arr.push(rel_to_tab);
            }
        }
        return dups_arr;
    }

    pathToText(pathid) {

        if (pathid.indexOf('-') == -1) return null;

        let spl = pathid.split('-');

        let arr = [];

        for (let i = 0; i < spl.length; i++) {
            arr.push(this.currentModel.idToName[spl[i]]);
        }
        return arr;
    }

    relDirection(id) {

        if (id.indexOf('-') == -1) return null;

        let idspl = this.pathToText(id);

        let rel_id = (idspl[idspl.length - 2].join('.') + '-' + idspl[idspl.length - 1].join('.'));

        let dir = this.currentModel.models[idspl[idspl.length - 2][0]][idspl[idspl.length - 2][1]].properties.rels_new[rel_id].direct;

        return dir;

    }

    relType(id) {

        if (!id) return null
        if (id.indexOf('-') == -1) return null;

        let idspl = this.pathToText(id);

        var rhs_m = false;
        var lhs_m = false;

        for (let i = 0; i < idspl.length; i += 2) {
            // Access elements at index i
            const currentElement = idspl[i];

            // If there's a next element (to avoid going out of bounds)
            if (i + 1 < idspl.length) {
                const nextElement = idspl[i + 1];
                // Do something with currentElement and nextElement

                var cur_rel_id = currentElement.join('.') + '-' + nextElement.join('.')

                var rel_type = this.currentModel.models[currentElement[0]][currentElement[1]].properties.rels_new[cur_rel_id].type;

                if (rel_type.indexOf('M-') > -1) {

                    lhs_m = true

                } else if (rel_type.indexOf('-M') > -1) {

                    rhs_m = true

                }

            }

        }

        return ((lhs_m ? 'M' : '1') + '-' + (rhs_m ? 'M' : '1'));

    }

};

function sortIdAsc(b, a) {

    let a_split = a.id.split('-');
    let b_split = b.id.split('-');
    if (a_split.length < b_split.length) {
        return 1;
    }
    if (a_split.length > b_split.length) {
        return -1;
    }
    return 0;
}

function makeid(len) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function condition_count(w) {
    var c = 0;
    w = w || {
        rules: []
    };
    if (!w.rules) return 0;
    for (let i = 0; i < w.rules.length; i++) {
        const element = w.rules[i];
        if (w.rules[i].condition && w.rules[i].rules) {
            c += condition_count(w.rules[i]);
        } else {
            ++c;
        }
    }
    return c;
}

module.exports.condition_count = condition_count;

function allPossiblePaths(id) {
    // Split by $ to remove any column reference
    let pathOnly = id.split('$')[0];

    // Split by - to get individual segments
    let segments = pathOnly.split('-');

    let paths = [];
    let currentPath = '';

    // Loop through segments taking 2 at a time
    for (let i = 1; i < segments.length; i += 2) {
        currentPath += (i == 1 ? '' : '-') + segments[i - 1] + '-' + segments[i];
        if (currentPath.length < pathOnly.length) paths.push(currentPath);
    }

    return paths;
}