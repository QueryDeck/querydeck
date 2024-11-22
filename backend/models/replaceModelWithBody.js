var _ = require('lodash')

exports.bodytoquery = bodytoquery;
exports.dynamicInsertModels = dynamicInsertModels;

// todo: add 'final_key' in insert columns
function bodytoquery(models, body) {

    for (let i = 0; i < models.length; i++) {
        var model = models[i];

        if (!model.table_body_path || model.table_body_path == '') continue;

        var modelVal = _.get(body, model.table_body_path);

        if (!modelVal && (model.table_body_path && model.table_body_path != '')) return {
            error: "Value is null for '" + model.table_body_path + "'"
        };

        if (model.allow_multiple_row) {

            if (!Array.isArray(modelVal)) {
                return {
                    error: "Value for '" + model.table_body_path + "' should be an array"
                };
            }

            var new_columns = []

            for (let j = 0; j < modelVal.length; j++) {

                var cols = []

                column_loop:
                    for (let k = 0; k < model.columns.length; k++) {
                        var column = JSON.parse(JSON.stringify(model.columns[k]));
                        if (column.operator == '$req-body') {
                            var col_val_spl = column.value.split('.')
                            var final_key = col_val_spl[col_val_spl.length - 1]
                            if (typeof modelVal[j][final_key] === 'undefined' || modelVal[j][final_key] === null) {
                                if (column.required) return {
                                    error: "Value is null for '" + column.columnName.split('.')[2] + "'"
                                };
                                continue column_loop;
                            }
                            column.value = modelVal[j][final_key]
                        }

                        cols.push(column)
                    }

                new_columns.push(cols)

            }

            model.columns = new_columns

        } else {

            var new_cols = [];

            column_loop:
                for (let j = 0; j < model.columns.length; j++) {

                    if (model.columns[j].operator == '$req-body') {
                        var col_val_spl = model.columns[j].value.split('.')
                        var final_key = col_val_spl[col_val_spl.length - 1]
                        if (typeof modelVal[final_key] === 'undefined' || modelVal[final_key] === null) {
                            if (model.columns[j].required) return {
                                error: "Value is null for '" + model.columns[j].columnName.split('.')[2] + "'"
                            };
                            continue column_loop;
                        }
                        model.columns[j].value = modelVal[final_key];
                        new_cols.push(model.columns[j])
                    }
                }

            if (new_cols.length == 0) return {
                error: 'All values missing for ' + model.table_body_path
            }

            model.columns = new_cols;

            if (model.conflict && model.conflict.columns && model.conflict.columns.length > 0) {

                var con_cols = []

                con_cols_loop:
                    for (let j = 0; j < model.conflict.columns.length; j++) {
                        const element = model.conflict.columns[j];

                        var col_val_spl = element.value.split('.')
                        var final_key = col_val_spl[col_val_spl.length - 1]

                        if (typeof modelVal[final_key] === 'undefined') {
                            continue con_cols_loop;
                        }

                        element.value = modelVal[final_key]

                        delete element.operator;

                        con_cols.push(element)

                    }

                model.conflict.columns = con_cols

            }

        }
        model.values_added = true;
    }

    return {
        models: models
    }

}

function dynamicInsertModels(params) {

    var models = params.models;
    var body = params.body;
    var single_base_insert = models[0].single_base_insert;

    var new_models = []

    var paths = new pathBuilder({
        models: params.models,
        body: params.body,
    })

    var all_return_paths = []

    for (let i = 0; i < (single_base_insert ? 1 : paths.length); i++) {
        // const path = paths[i];
        for (let k = 0; k < models.length; k++) {
            var model = JSON.parse(JSON.stringify(models[k]));
            model.qref_only = true;

            if (model.table_body_path && model.table_body_path != '' && all_return_paths.indexOf(model.table_body_path) == -1) {
                all_return_paths.push(model.table_body_path)
            }
            model.body_vals = []
            // console.log('paths[i][k]', paths[i][k])
            var new_columns = []
            if (paths[i][k]) {
                for (let j = 0; j < paths[i][k].length; j++) {
                    const path = paths[i][k][j];

                    var current_val_ob = _.get(body, path)

                    var cols = []
                    var col_ob = {}
                    for (let l = 0; l < model.columns.length; l++) {
                        const element = model.columns[l];
                        var column = JSON.parse(JSON.stringify(model.columns[l]));
                        if (column.operator == '$req-body') {

                            if (model.qref_only) {

                                model.qref_only = false;

                            }

                            var col_val_spl = column.value.split('.')
                            var final_key = col_val_spl[col_val_spl.length - 1]

                            if(model.columns[l].required && !current_val_ob[final_key]) {
                                return {
                                    error: "Value is null for '" + column.columnName.split('.')[2] + "'"
                                };
                            }

                            column.value = current_val_ob[final_key]
                            col_ob[final_key] = current_val_ob[final_key]
                        }
                        cols.push(column)
                    }
                    model.body_vals.push(col_ob)
                    new_columns.push(cols)
                }
            } else {
                for (let l = 0; l < model.columns.length; l++) {
                    const element = model.columns[l];
                    var column = JSON.parse(JSON.stringify(model.columns[l]));
                    new_columns.push(column)
                }
                new_columns = [new_columns]
            }
            model.columns = new_columns
            model.dynamic_base_index = i.toString()
            model.values_added = true;

            new_models.push(model)
            // if(paths[i][k].length > 1) {

            // }
            // model.new_body_path = 
        }
    }

    return {
        // paths: paths,
        all_return_paths: all_return_paths,
        models: new_models
    }

}

class pathBuilder {

    constructor(params) {
        this.models = params.models;
        this.body = params.body;
        this.final_paths = []

        var dynamic_models = []

        for (let i = 0; i < this.models.length; i++) {
            const model = this.models[i];

            var f = this.keypathsfromarr({
                model: model,
                model_index: i,
                base_index: 0
            })

        }

        return this.final_paths
    }

    keypathsfromarr(params) {

        var model = params.model;
        var body = this.body;
        var current_key_index = params.current_key_index || 0;
        var gen_arr = params.gen_arr ? params.gen_arr.slice() : [];

        var final_arr = [];

        if (gen_arr.length == 0) {
            if (model.table_body_path_arr[0]) gen_arr.push(model.table_body_path_arr[0])
        } else {
            gen_arr.push('.' + model.table_body_path_arr[current_key_index])
        }

        var model_val_arr = _.get(body, gen_arr.join(''));


        if (!Array.isArray(model_val_arr)) {
            model_val_arr = [model_val_arr];
            if (gen_arr.length > 0) _.set(body, gen_arr.join(''), model_val_arr)
        }

        var base_index = params.base_index || 0;

        for (let i = 0; i < model_val_arr.length; i++) {
            const element = model_val_arr[i];

            if (!params.current_key_index) {
                // console.log(element, params)
            }

            if (model.table_body_path_arr[current_key_index + 1]) {
                // gen_arr.push('[' + i + ']')
                var newGenArr = gen_arr.slice();
                newGenArr.push('[' + i + ']');
                this.keypathsfromarr({
                    model: model,
                    body: body,
                    current_key_index: current_key_index + 1,
                    gen_arr: newGenArr,
                    model_index: params.model_index,
                    base_index: base_index
                })

            } else {
                if (gen_arr.length > 0) {
                    // gen_arr.push('[' + i + ']')
                    var newGenArr = gen_arr.slice();
                    newGenArr.push('[' + i + ']');
                    // console.log(base_index, params.model_index, newGenArr)
                    this.final_paths[base_index] = this.final_paths[base_index] || []
                    this.final_paths[base_index][params.model_index] = this.final_paths[base_index][params.model_index] || []
                    this.final_paths[base_index][params.model_index].push(newGenArr.join(''))
                }

            }
            if (!params.current_key_index) {
                ++base_index;
            }

        }

    }

};