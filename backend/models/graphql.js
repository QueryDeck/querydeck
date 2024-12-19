'use strict';

const {
    parse
} = require('graphql');
const v2sql = require.main.require('./models/view2sql.js');
const modelutils = require.main.require('./models/modelUtils.js');
const json2sql = require.main.require('./models/JsonToSql.js');
const v2json = require.main.require('./models/viewToJSON.js');

// TODO: add more operators
const operatorMap = {
    _eq: 'equal',
    _gt: 'greater_than',
    _gte: 'greater_or_equal',
    _lt: 'less_than',
    _lte: 'less_or_equal',
    _in: 'in',
    _ilike: 'ilike',
    _like: 'like'
};

class GraphQLConverter {

    constructor(params) {

        this.currentModel = params.currentModel;
        this.subdomain = params.subdomain;
        this.db_id = Object.keys(this.currentModel.databases)[0];
        this.query = params.query;
        this.variables = params.variables || {};
        // console.log(params)
        var parsedQueries = parse(this.query);
        // return parsedQueries;
        if (parsedQueries.definitions[0].operation == 'query') {
            var json_select_models = this.convertSelectToSQL(parsedQueries.definitions[0].selectionSet.selections);
            // return {type: 'query', query: json_select_models};
            var q = new json2sql(json_select_models, this.currentModel.databases[this.db_id], {
                db_type: this.currentModel.databases[this.db_id].db_type
            }).generate();
            if (json_select_models.length > 1) q.multiple = true;
            else q.base_alias = json_select_models[0].table_alias;
            return {
                type: 'query',
                query: q
            };
        } else if (parsedQueries.definitions[0].operation == 'mutation') {
            var models = this.convertMutationToSQL(parsedQueries.definitions[0].selectionSet.selections);
            // console.log('GraphQLConverter', models);
            return {
                type: 'mutation',
                models: models
            };
        } else {
            // TODO: throw better error
            throw new Error('Invalid operation');
        }

    }

    // TODO: replace with json2sql later
    convertWhereToQueryBuilder(params) {

        const whereValue = params.whereValue;
        if (!whereValue || !whereValue.fields || !params.table || !params.schema) return null;

        const processValue = (value) => {
            if (Array.isArray(value.value)) {
                return value.value.map(v => v.value);
            }
            if (Array.isArray(value.values)) {
                return value.values.map(v => v.value);
            }
            return value.value;
        };

        const processObject = (obj, parentId = 'root') => {

            if (obj.kind !== 'ObjectValue') return null;

            const fields = obj.fields;

            // Check if this is an AND/OR condition
            const andField = fields.find(f => f.name.value === '_and');
            const orField = fields.find(f => f.name.value === '_or');

            if (andField || orField) {
                const condition = andField ? 'AND' : 'OR';
                const values = (andField || orField).value.values;

                return {
                    condition,
                    id: parentId,
                    rules: values.map(v => processObject(v)).filter(rule => rule !== null),
                    not: false
                };
            }
            // Handle leaf nodes (actual conditions)
            const field = fields[0];

            if (!this.currentModel.databases[this.db_id].models[params.schema][params.table].properties.columns[field.name.value]) {
                // TODO: throw error
                return null;
            }
            const operator = field.value.fields[0].name.value
            const value = processValue(field.value.fields[0].value);

            return {
                fieldName: `${params.schema}.${params.table}.${field.name.value}`, // You might need to make this dynamic
                input: 'text', // This might need to be dynamic based on field type
                operator: operatorMap[operator] || operator,
                method: 'static',
                type: 'text', // This might need to be dynamic based on field type
                value: value
            };
        };

        var result = processObject(whereValue);

        if (!result.condition) {
            result.condition = 'AND';
            return {
                condition: 'AND',
                rules: [result]
            }
        } else {
            return result;
        }

    }

    convertMutationToSQL(selections) {
        var all_models = [];

        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            let processedSelection = selection;

            // Only attempt to replace variables if they exist
            if (Object.keys(this.variables).length > 0) {
                processedSelection = this.replaceVariablesInSelection(selection, this.variables);
            }

            if (processedSelection.name.value.startsWith('insert_')) {
                var parsed = this.convertInsertToSQL(processedSelection);
                // console.log('parsed', parsed)
                parsed.method = 'insert';
                all_models.push(parsed);
            } else if (processedSelection.name.value.startsWith('update_')) {
                var parsed = this.convertUpdateToSQL(processedSelection);
                parsed.method = 'update';
                all_models.push(parsed);
            } else {
                throw new Error('Invalid mutation');
            }
        }

        return all_models;
    }

    replaceVariablesInSelection(selection, variables) {
        // Create a deep copy of the selection to avoid modifying the original
        const newSelection = JSON.parse(JSON.stringify(selection));

        // Replace variables in arguments
        if (newSelection.arguments) {
            newSelection.arguments = newSelection.arguments.map(arg => {
                if (arg.value.kind === 'Variable') {
                    // Replace variable with actual value from variables object
                    const variableName = arg.value.name.value;
                    return {
                        ...arg,
                        value: this.convertValueToAST(variables[variableName])
                    };
                }
                return arg;
            });
        }

        return newSelection;
    }

    convertValueToAST(value) {
        // Convert JavaScript values to GraphQL AST nodes
        if (Array.isArray(value)) {
            return {
                kind: 'ListValue',
                values: value.map(v => this.convertValueToAST(v))
            };
        } else if (typeof value === 'object' && value !== null) {
            return {
                kind: 'ObjectValue',
                fields: Object.entries(value).map(([key, val]) => ({
                    kind: 'ObjectField',
                    name: {
                        kind: 'Name',
                        value: key
                    },
                    value: this.convertValueToAST(val)
                }))
            };
        } else {
            return {
                kind: 'StringValue',
                value: String(value)
            };
        }
    }

    convertInsertToSQL(selection) {

        // return selection;
        var base_table_graphql_name = selection.name.value.replace('_one', '').replace('_many', '').replace('insert_', '');

        var table_arr = this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name].table_schema;

        var base_table_id = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id;

        if (!this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name]) {
            // TODO: throw better error
            throw new Error('Table not found');
        }

        var arg_res = this.extractValuesAndOnConflict({
            arguments: selection.arguments,
            table_arr: table_arr,
            table_path_id: base_table_id,
            nested: false
        });

        var values = arg_res.values;

        var on_conflict = {
            [base_table_id]: arg_res.on_conflict
        }

        var return_nested = this.handleNestedReturning({
            returningField: selection.selectionSet.selections[0],
            prefix: '',
            table_arr: table_arr,
            table_id: base_table_id,
            table_graphql_name: base_table_graphql_name,
            nested: false
        });


        var result = this.handleInsert({
            table_path_id: base_table_id,
            table_id: base_table_id,
            table_arr: table_arr,
            values: values,
            on_conflict: on_conflict,
            table_graphql_name: base_table_graphql_name,
            // return_nested: return_nested
        });

        var c = [];

        for (let k = 0; k < result.insert_column_ids.length; k++) {
            const element = result.insert_column_ids[k];
            c.push({
                id: element.toString()
            });
        }

        var query = v2sql.convert({
            c: c,
            base: base_table_id,
            method: 'insert',
            db_id: this.db_id,
            subdomain: this.subdomain,
            return_c: return_nested,
            graphql: true,
            on_conflict: result.on_conflict
            // insert_value_ob: result.insert_value_ob
        });

        // console.log('v2sql query', query)

        return {
            query: query,
            body: result.insert_value_ob
        };
    }

    extractValuesAndOnConflict(params) {
        // console.log('extractValuesAndOnConflict', params)
        var args = params.arguments;
        var table_arr = params.table_arr;
        var values;
        var on_conflict;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;

        for (let i = 0; i < args.length; i++) {
            if (args[i].name.value === 'on_conflict' && args[i].value.fields && args[i].value.fields.length > 0) {
                for (let j = 0; j < args[i].value.fields.length; j++) {
                    const field = args[i].value.fields[j];
                    if (field.name.value === 'constraint') {
                        on_conflict = {
                            constraint: field.value.value
                        }
                    } else if (field.name.value === 'update_columns') {

                        on_conflict.columns = [];
                        for (let k = 0; k < field.value.values.length; k++) {
                            if(this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.value.values[k].value]) {
                                on_conflict.columns.push({
                                    // name: field.value.values[k].value,
                                    id: table_path_id + (nested ? '$' : '.') + this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.value.values[k].value].id
                                });
                            }
                        }
                    }
                }
            } else {
                values = args[i].value.kind == 'ListValue' ? args[i].value.values : [args[i].value];
            }
        }

        return {
            values: values,
            on_conflict: on_conflict
        }
    }

    handleNestedReturning(params) {
        let returningField = params.returningField;
        let prefix = params.prefix;
        var table_arr = params.table_arr;
        var table_id = params.table_id;
        var table_graphql_name = params.table_graphql_name;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;

        var table_columns = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns;

        let columns = [];
        // console.log('handleNestedReturning', prefix)
        // If this is not the returning field itself, get the current field name
        const currentField = returningField.name?.value;

        // Process the selections if they exist
        if (returningField.selectionSet?.selections) {
            for (const selection of returningField.selectionSet.selections) {
                // If the selection has its own selections, it's a nested field
                if (selection.selectionSet) {
                    const newPrefix = prefix ? `${prefix}.${selection.name.value}` : selection.name.value;
                    const rel_name = selection.name.value;
                    columns = columns.concat(this.handleNestedReturning({
                        returningField: selection,
                        prefix: newPrefix,
                        nested: true,
                        table_arr: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table.split('.'),
                        table_id: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table,
                        table_graphql_name: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table_graphql,
                        table_path_id: (nested ? table_path_id + '-' : '') + this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].id_path
                    }));
                } else {
                    // It's a leaf node (actual column)
                    if (table_columns[selection.name.value]) {
                        if (nested) {
                            columns.push({
                                id: table_path_id + '$' + table_columns[selection.name.value].id
                            });
                        } else {
                            columns.push({
                                id: table_id + '.' + table_columns[selection.name.value].id
                            });
                        }
                    }
                }
            }
        }

        return columns;
    }

    handleInsert(params) {

        // console.log('handleInsert', params)

        var table_arr = params.table_arr;
        var table_id = params.table_id;
        var table_graphql_name = params.table_graphql_name;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;

        params.on_conflict = params.on_conflict || {};

        var current_rel_type = 'array';

        if (nested && params.rel_table_def.type.charAt(2) != 'M') {

            current_rel_type = 'object';
        }

        var table_columns = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns;

        var insert_value_ob = {
            [table_arr[1]]: []
        }

        var insert_column_ids = params.insert_column_ids || []

        for (let i = 0; i < params.values.length; i++) {
            var insert_value = {};
            for (let j = 0; j < params.values[i].fields.length; j++) {
                var field = params.values[i].fields[j];
                if (field.value.value) {
                    // column value
                    insert_value[field.name.value] = field.value.value;
                    // add to id array
                    if (table_columns[field.name.value]) {
                        var column_id;
                        if (nested) {
                            column_id = table_path_id + '$' + table_columns[field.name.value].id
                        } else {
                            column_id = table_id + '.' + table_columns[field.name.value].id
                        }
                        if (insert_column_ids.indexOf(column_id) == -1) insert_column_ids.push(column_id);
                    }
                } else if (field.value.fields) {
                    // nested object
                    var rel_name = field.name.value;
                    //this.currentModel.databases[this.db_id].graphql.tables[graphql_table].relations[field.name.value]

                    if (this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name]) {

                        var nested_table_path_id = (nested ? table_path_id + '-' : '') + this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].id_path;
                        var nested_table_arr = this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table.split('.');

                        var arg_res = this.extractValuesAndOnConflict({
                            arguments: field.value.fields,
                            table_arr: nested_table_arr,
                            table_path_id: nested_table_path_id,
                            nested: true
                        });

                        var nested_table = {
                            table_path_id: nested_table_path_id,
                            table_id: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table,
                            table_arr: nested_table_arr,
                            table_graphql_name: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table_graphql,
                            nested: true,
                            values: arg_res.values,
                            // on_conflict: arg_res.on_conflict,
                            // insert_value_ob: insert_value_ob[table_arr[1]][0],
                            insert_column_ids: insert_column_ids,
                            rel_table_def: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name],
                        }

                        params.on_conflict[nested_table.table_path_id] = arg_res.on_conflict;

                        if (!nested_table.values || !nested_table.values.length) {
                            // TODO: throw better error
                            throw new Error('Nested table values not found');
                        }

                        var nested_result = this.handleInsert(nested_table);

                        insert_value[nested_table.table_graphql_name] = nested_result.insert_value_ob[nested_table.table_graphql_name]

                    } else {
                        // TODO: throw better error
                        throw new Error('Relation ' + rel_name + ' not found' + ' in ' + table_graphql_name);
                    }
                }
            }

            if (current_rel_type == 'array') {
                // console.log('array', insert_value_ob, insert_value);
                insert_value_ob[table_arr[1]].push(insert_value);
            } else {
                // console.log('object', insert_value_ob, insert_value);
                insert_value_ob[table_arr[1]] = insert_value;
            }
        }

        return {
            insert_value_ob: insert_value_ob,
            insert_column_ids: insert_column_ids,
            on_conflict: params.on_conflict
        };
    }

    convertSelectToSQL(selections) {

        var all_models = [];

        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];

            var base_table_graphql_name = selection.name.value;

            if(!this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name]) {
                throw new Error('Table ' + base_table_graphql_name + ' not found');
            }

            var table_arr = this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name].table_schema;

            var base_table_id = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id;

            var result = this.handleSelect({
                table_path_id: base_table_id,
                table_id: base_table_id,
                table_arr: table_arr,
                // values: values,
                table_graphql_name: base_table_graphql_name,
                selection: selection
            })

            var c = []

            for (let element of result.select_column_ids) {
                c.push({
                    id: element
                });
            }

            var json_mod = new v2json({
                subdomain: this.subdomain,
                db_id: this.db_id,
                viewdata: {
                    columns: c,
                    base: base_table_id,
                    join_conditions: result.join_conditions,
                    where: result.where,
                    graphql: true,
                    limit: result.limit,
                    offset: result.offset,
                    other_conditions: result.other_conditions,
                    orderby: result.orderby,
                    __typename: result.__typename
                }
            }).convertSelect()

            all_models.push(json_mod.model);

        }

        return all_models;
    }

    handleSelect(params) {

        var table_arr = params.table_arr;
        var table_id = params.table_id;
        var table_graphql_name = params.table_graphql_name;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;
        var selection = params.selection;

        var current_rel_type = 'array';

        if (nested && params.rel_table_def.type.charAt(2) != 'M') {

            current_rel_type = 'object';
        }

        var table_columns = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns;

        var select_column_ids = params.select_column_ids || [];

        var join_conditions = params.join_conditions || {};
        var other_conditions = params.other_conditions || {};

        var limit = null;
        var offset = null;
        var where = {};
        var agg_type = 'row_to_json';
        var order_by = [];
        var __typename = false;

        for (let i = 0; i < selection.arguments.length; i++) {
            const arg = selection.arguments[i];
            if (arg.name.value == 'limit') {
                limit = arg.value.value;
            } else if (arg.name.value == 'offset') {
                offset = arg.value.value;
            } else if (arg.name.value == 'where') {
                where = this.convertWhereToQueryBuilder({
                    whereValue: arg.value,
                    table: table_arr[1],
                    schema: table_arr[0]
                });
            } else if (arg.name.value == 'order_by') {
                // Handle order_by argument
                const orderFields = arg.value.fields;
                for (const field of orderFields) {
                    const columnName = field.name.value;
                    const direction = field.value.value;
                    if (table_columns[columnName]) {
                        order_by.push({
                            id: this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id + '.' + table_columns[columnName].id,
                            dir: direction.toLowerCase(),
                            asc: direction.toLowerCase() == 'asc',
                            name: table_arr.join('.') + '.' + columnName
                        });
                    }
                }
            }

            if (current_rel_type == 'array') {
                agg_type = 'json_agg';
            } else {
                agg_type = 'row_to_json';
            }
        }

        if (nested) {
            join_conditions[table_path_id] = modelutils.idToJoinPathOb({
                id: table_path_id,
                currentModel: this.currentModel.databases[this.db_id]
            });

            if (where.rules) {
                join_conditions[table_path_id].rules.push(where);
            }

            other_conditions[table_path_id] = other_conditions[table_path_id] || {}

            other_conditions[table_path_id].limit = limit;
            other_conditions[table_path_id].offset = offset;
            other_conditions[table_path_id].orderby = order_by;
        }


        for (let i = 0; i < selection.selectionSet.selections.length; i++) {
            const field = selection.selectionSet.selections[i];

            if (field.selectionSet && field.selectionSet.selections.length > 0 && this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value]) {
                //table join
                var nested_table = {
                    table_path_id: (nested ? table_path_id + '-' : '') + this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value].id_path,
                    table_id: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value].rel_table,
                    table_arr: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value].rel_table.split('.'),
                    table_graphql_name: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value].rel_table_graphql,
                    nested: true,
                    // insert_column_ids: insert_column_ids,
                    select_column_ids: select_column_ids,
                    rel_table_def: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[field.name.value],
                    selection: field,
                    join_conditions: join_conditions,
                    other_conditions: other_conditions
                }

                this.handleSelect(nested_table);

            } else if (this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value]) {
                //column
                var column_id;

                if (nested) {
                    column_id = table_path_id + '$' + table_columns[field.name.value].id
                } else {
                    column_id = table_id + '.' + table_columns[field.name.value].id
                }

                if (select_column_ids.indexOf(column_id) == -1) {
                    select_column_ids.push(column_id);
                }

            } else if(field.name.value == '__typename') {
                
                if(nested) {
                    other_conditions[table_path_id].__typename = true;
                } else {
                    __typename = true;
                }
            } else {
                throw new Error('Column ' + field.name.value + ' not found in table ' + table_graphql_name);
            }
        }

        return {
            select_column_ids: select_column_ids,
            join_conditions: join_conditions,
            where: where,
            other_conditions: other_conditions,
            limit: limit,
            offset: offset,
            orderby: order_by,
            __typename: __typename
        };
    }

    convertUpdateToSQL(selection) {

        var base_table_graphql_name = selection.name.value.replace('update_', '');

        if (!this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name]) {
            // TODO: throw better error
            throw new Error('Table not found');
        }

        var table_arr = this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name].table_schema;

        var base_table_id = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id;

        var where = {};

        var c = [];
        var return_c = [];
        var value_ob = {

        }

        for (let i = 0; i < selection.arguments.length; i++) {
            const arg = selection.arguments[i];
            if (arg.name.value == 'where') {

                where = this.convertWhereToQueryBuilder({
                    whereValue: arg.value,
                    table: table_arr[1],
                    schema: table_arr[0]
                });

            } else if (arg.name.value == '_set') {

                for (let j = 0; j < arg.value.fields.length; j++) {
                    const field = arg.value.fields[j];
                    if (this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value]) {
                        c.push({
                            id: base_table_id + '.' + this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value].id
                        });
                        value_ob[field.name.value] = field.value.value;
                    }
                }

            }
        }

        for (let i = 0; i < selection.selectionSet.selections.length; i++) {
            const element = selection.selectionSet.selections[i];
            if (element.name.value == 'returning') {
                // return_c.push({id: element.value.fields[0].value.fields[0].value.value});
                for (let j = 0; j < element.selectionSet.selections.length; j++) {
                    const field = element.selectionSet.selections[j];
                    if (this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value]) {
                        return_c.push({
                            id: base_table_id + '.' + this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value].id
                        });
                    }
                }
            }
        }

        var query = v2sql.convert({
            c: c,
            base: base_table_id,
            method: 'update',
            return_c: return_c,
            db_id: this.db_id,
            subdomain: this.subdomain,
            w: where,
            graphql: true
        });

        return {
            query: query,
            body: {
                [query.model.table_alias]: value_ob
            }
        }
    }

}

exports.GraphQLConverter = GraphQLConverter;