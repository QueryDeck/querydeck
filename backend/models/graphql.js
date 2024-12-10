'use strict';

const {
    parse
} = require('graphql');
const v2sql = require.main.require('./models/view2sql.js');
const modelutils = require.main.require('./models/modelutils.js');
const json2sql = require.main.require('./models/JsonToSql.js');

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

// example query
var example_select_query = `query GetCustomerOrders {
    nyCustomers: actor(
      where: { first_name: { _eq: "New York" } }
      limit: 10
      offset: 0
    ) {
      actor_id
      first_name
      last_name
      film_actors(
        where: { last_update: { _gt: "2023-01-01 12:00:00" } }
        limit: 5
      ) {
        film_id
        actor_id
        film (
        where: {
                _and: [{
                        release_year: {
                            _gte: 2000
                        }
                    },
                    {
                        rating: {
                            _in: ["PG", "PG-13", "R"]
                        }
                    },
                    {
                        _or: [{
                                title: {
                                    _ilike: "%adventure%"
                                }
                            },
                            {
                                description: {
                                    _ilike: "%action%"
                                }
                            }
                        ]
                    }
                ]
            }
            limit: 10
            offset: 0
        ) {
          film_id
          title
          description
          release_year
          rating
          special_features
        }
      }
    }
}`;

var example_insert_query = `mutation {
  insert_actor(
    objects: [
      {
        first_name: "John",
        last_name: "Doe",
        film_actors: {
          data: [
            {
              last_update: "2024-01-01 12:00:00",
              film: {
                data: {
                  title: "New Movie",
                  description: "A fantastic new film",
                  release_year: 2024,
                  language_id: 1,
                  rental_duration: 7,
                  rental_rate: 4.99,
                  length: 120,
                  replacement_cost: 19.99
                }
              }
            }
          ]
        }
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        film_actors: {
          data: [
            {
              last_update: "2024-01-01 10:00:00",
              film: {
                data: {
                  title: "Another Movie",
                  description: "Another fantastic film",
                  release_year: 2024,
                  language_id: 1,
                  rental_duration: 7,
                  rental_rate: 4.99,
                  length: 110,
                  replacement_cost: 19.99
                }
              }
            }
          ]
        }
      }
    ]
  ) {
    returning {
      actor_id
      first_name
      last_name
      film_actors {
        film {
          film_id
          title
          description
        }
      }
    }
  }
}`;

class GraphQLConverter {

    constructor(params) {
        this.currentModel = params.currentModel;
        this.subdomain = params.subdomain;
        this.db_id = Object.keys(this.currentModel.databases)[0];
        this.query = params.query;
        var parsedQueries = parse(this.query);
        if(parsedQueries.definitions[0].operation == 'query') {
            return this.convertQueryToSQL(parsedQueries.definitions[0].selectionSet.selections[0]);
        } else if(parsedQueries.definitions[0].operation == 'mutation') {
            return this.convertMutationToSQL(parsedQueries.definitions[0].selectionSet.selections[0]);
        } else {
            // TODO: throw better error
            throw new Error('Invalid operation');
        }



            // else if(parsedQueries.definitions[0].operation == 'mutation') console.log('INSERT')
            // else if(parsedQueries.definitions[0].operation == 'subscription') console.log('SUBSCRIPTION')
        return parsedQueries;
    }

    // TODO: replace with json2sql later
    convertWhereToQueryBuilder(params) {
        const whereValue = params.whereValue;
        if (!whereValue || !whereValue.fields || !params.table || !params.schema) return null;

        const processValue = (value) => {
            if (Array.isArray(value.value)) {
                return value.value.map(v => v.value);
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

    convertMutationToSQL(selection) {

        // return parsedQuery;
        var base_table_graphql_name = selection.name.value.replace('_one', '').replace('_many', '').replace('insert_', '');

        var table_arr = this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name].table_schema;

        var base_table_id = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id;

        if(!this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name]) {
            // TODO: throw better error
            throw new Error('Table not found');
        }

        var values = selection.arguments[0].name.value == 'objects' ? selection.arguments[0].value.values : [selection.arguments[0].value];

        var result = this.handleMutationSelection({
            table_path_id: base_table_id,
            table_id: base_table_id,
            table_arr: table_arr,
            values: values,
            table_graphql_name: base_table_graphql_name
        });

        var c = []
        for (let k = 0; k < result.insert_column_ids.length; k++) {
            const element = result.insert_column_ids[k];
            c.push({id: element.toString()});
        }

        var query = v2sql.convert({
            c: c,
            base: base_table_id,
            method: 'insert',
            db_id: this.db_id,
            subdomain: this.subdomain,
            // insert_value_ob: result.insert_value_ob
        });

        return {
            text: query.query.text,
            params: query.query.values
        };
    }

    handleMutationSelection(params) {
        
        var table_arr = params.table_arr;
        var table_id = params.table_id;
        var table_graphql_name = params.table_graphql_name;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;

        var current_rel_type = 'array';

        if(nested && params.rel_table_def.type.charAt(2) != 'M') {

            current_rel_type = 'object';
        }

        var table_columns = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns;

        var insert_value_ob = {
            [table_arr[1]]: []
        }

        var insert_column_ids = params.insert_column_ids || []

        for(let i = 0; i < params.values.length; i++) {
            var insert_value = {};  
            for(let j = 0; j < params.values[i].fields.length; j++) {
                var field = params.values[i].fields[j];
                if(field.value.value) {
                    // column value
                    insert_value[field.name.value] = field.value.value;
                    // add to id array
                    if(table_columns[field.name.value]) {
                        var column_id;
                        if(nested) {
                            column_id = table_path_id + '$' + table_columns[field.name.value].id
                        } else {
                            column_id = table_id + '.' + table_columns[field.name.value].id
                        }
                        if(insert_column_ids.indexOf(column_id) == -1) insert_column_ids.push(column_id);
                    }
                } else if(field.value.fields) {
                    // nested object
                    var rel_name = field.name.value;
                    //this.currentModel.databases[this.db_id].graphql.tables[graphql_table].relations[field.name.value]

                    if(this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name]) {

                        var nested_table = {
                            table_path_id: (nested ? table_path_id + '-' : '') + this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].id_path,
                            table_id: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table,
                            table_arr: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table.split('.'),
                            table_graphql_name: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name].rel_table_graphql,
                            nested: true,
                            values: (field.value.fields[0].value.kind == 'ListValue') ? field.value.fields[0].value.values : [field.value.fields[0].value],
                            // insert_value_ob: insert_value_ob[table_arr[1]][0],
                            insert_column_ids: insert_column_ids,
                            rel_table_def: this.currentModel.databases[this.db_id].graphql.tables[table_graphql_name].relations[rel_name]
                        }

                        if(!nested_table.values || !nested_table.values.length) {
                            // TODO: throw better error
                            throw new Error('Nested table values not found');
                        }

                        var nested_result = this.handleMutationSelection(nested_table);

                        insert_value[nested_table.table_graphql_name] = nested_result.insert_value_ob[nested_table.table_graphql_name]

                    } else {
                        // TODO: throw better error
                        throw new Error('Relation not found');
                    }
                }
            }

            if(current_rel_type == 'array') {
                // console.log('array', insert_value_ob, insert_value);
                insert_value_ob[table_arr[1]].push(insert_value);
            } else {
                // console.log('object', insert_value_ob, insert_value);
                insert_value_ob[table_arr[1]] = insert_value;
            }
        }

        return {
            insert_value_ob: insert_value_ob,
            insert_column_ids: insert_column_ids
        };
    }

    convertQueryToSQL(selection) {

        // return parsedQuery;
        var base_table_graphql_name = selection.name.value

        var table_arr = this.currentModel.databases[this.db_id].graphql.tables[selection.name.value].table_schema;

        var base_table_id = this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.id;

        if(!this.currentModel.databases[this.db_id].graphql.tables[base_table_graphql_name]) {
            // TODO: throw better error
            throw new Error('Table not found');
        }

        var result = this.handleQuerySelection({
            table_path_id: base_table_id,
            table_id: base_table_id,
            table_arr: table_arr,
            // values: values,
            table_graphql_name: base_table_graphql_name,
            selection: selection
        })

        var c = []

        for (let element of result.select_column_ids) {
            c.push({id: element});
        }

        // return result;

        var query = v2sql.convert({
            c: c,
            base: base_table_id,
            method: 'select',
            db_id: this.db_id,
            subdomain: this.subdomain,
            join_conditions: result.join_conditions,
            w: result.where
        });

        return {
            text: query.query.text,
            params: query.query.values
        };
    }

    handleQuerySelection(params) {
        
        var table_arr = params.table_arr;
        var table_id = params.table_id;
        var table_graphql_name = params.table_graphql_name;
        var nested = params.nested || false;
        var table_path_id = params.table_path_id;
        var selection = params.selection;

        var current_rel_type = 'array';

        if(nested && params.rel_table_def.type.charAt(2) != 'M') {

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
            }

            if(current_rel_type == 'array') {
                agg_type = 'json_agg';
            } else {
                agg_type = 'row_to_json';
            }
        }

        if(nested) {
            join_conditions[table_path_id] = modelutils.idToJoinPathOb({
                id: table_path_id,
                currentModel: this.currentModel.databases[this.db_id]
            });

            if(where.rules) {
                join_conditions[table_path_id].rules.push(where);
            }

            other_conditions[table_path_id] = other_conditions[table_path_id] || {}
            
            other_conditions[table_path_id].limit = limit;
            other_conditions[table_path_id].offset = offset;
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
                    join_conditions: join_conditions
                }

                this.handleQuerySelection(nested_table);

            } else if(this.currentModel.databases[this.db_id].models[table_arr[0]][table_arr[1]].properties.columns[field.name.value]) {
                //column
                var column_id;

                if(nested) {
                    column_id = table_path_id + '$' + table_columns[field.name.value].id
                } else {
                    column_id = table_id + '.' + table_columns[field.name.value].id
                }

                if(select_column_ids.indexOf(column_id) == -1) {
                    select_column_ids.push(column_id);
                }

            } else {
                // TODO: throw better error
                throw new Error('Column not found');
            }
        }

        return {
            select_column_ids: select_column_ids,
            join_conditions: join_conditions,
            where: where,
            other_conditions: other_conditions,
            limit: limit,
            offset: offset
        };
    }

}

exports.test = function(currentModel) {
    var parsed = new GraphQLConverter({currentModel: currentModel.currentModel, subdomain: currentModel.currentModel.appDetails.subdomain, query: example_insert_query});
    return parsed;
}
