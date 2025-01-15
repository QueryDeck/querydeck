var _ = require('lodash')

exports.bodytoquery = bodytoquery;

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

class DynamicInsertModels {
    constructor(params) {
        this.models = params.models;
        this.body = params.body;
        this.single_base_insert = this.models[0].single_base_insert;
        this.nested_insert = params.nested_insert;
        this.final_paths = [];
        this.new_models = [];
        this.all_return_paths = [];
        this.index_map = {};
        this.body_path_map = {};
        
        this.buildPaths();
        return this.processModels();
    }

    buildPaths() {
        // Create sorted index map based on table_body_path_arr length
        this.sorted_model_map = {};
        
        // Create array of indices and models for sorting
        let modelIndices = this.models.map((model, index) => ({
            index: index,
            pathLength: model.table_body_path_arr.length
        }));

        // Sort by path length ascending
        modelIndices.sort((a, b) => a.pathLength - b.pathLength);

        // Create map of new sorted index -> original model index
        modelIndices.forEach((item, newIndex) => {
            this.sorted_model_map[newIndex] = item.index;
        });

        for (let i = 0; i < this.models.length; i++) {            
            this.keypathsfromarr({
                model: this.models[this.sorted_model_map[i]],
                model_index: this.sorted_model_map[i],
                base_index: 0
            });
        }
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

        var current_len = model_val_arr.length;

        for (let i = 0; i < current_len; i++) {
            const element = model_val_arr[i];

            var newGenArr = gen_arr.slice();
            newGenArr.push('[' + i + ']');
            
            if (model.table_body_path_arr[current_key_index + 1]) {
                // gen_arr.push('[' + i + ']')

                this.keypathsfromarr({
                    model: model,
                    body: body,
                    current_key_index: current_key_index + 1,
                    gen_arr: newGenArr,
                    model_index: params.model_index,
                    base_index: base_index,
                    parent_idx: this.body_path_map[newGenArr.join('')],
                    // parent_idx: i
                })

            } else {

                var current_index = this.getCurrentIndex({
                    table_body_path_arr: model.table_body_path_arr,
                    gen_body_path: newGenArr.join('')
                })

                if(!this.nested_insert) {

                    this.final_paths[0] = this.final_paths[0] || []
                    this.final_paths[0][0] = this.final_paths[0][0] || []
                    this.final_paths[0][0].push({
                        parent_idx: params.parent_idx,
                        path: newGenArr.join(''),
                        current_index: current_index
                    })
                    
                } else if (gen_arr.length > 0) {
                    this.final_paths[base_index] = this.final_paths[base_index] || []
                    this.final_paths[base_index][params.model_index] = this.final_paths[base_index][params.model_index] || []
                    this.final_paths[base_index][params.model_index].push({
                        parent_idx: params.parent_idx,
                        current_index: current_index,
                        path: newGenArr.join('')
                    })
                }

            }
            if (!current_key_index) {
                ++base_index;
            }

        }
    }

    processModels() {
        const paths = this.final_paths;

        for (let i = 0; i < (this.single_base_insert ? 1 : paths.length); i++) {
            for (let k = 0; k < this.models.length; k++) {
                // ... existing model processing code ...
                var model = JSON.parse(JSON.stringify(this.models[k]));
                model.qref_only = true;

            if (model.table_body_path && model.table_body_path != '' && this.all_return_paths.indexOf(model.table_body_path) == -1) {
                this.all_return_paths.push(model.table_body_path)
            }
            model.body_vals = []

            var new_columns = []
            if (paths[i][k]) {
                for (let j = 0; j < paths[i][k].length; j++) {
                    const pathOb = paths[i][k][j];

                    _.set(this.body, pathOb.path + '.__q_idx', pathOb.current_index)
                    _.set(this.body, pathOb.path + '.__q_p_idx', pathOb.parent_idx)

                    var current_val_ob = _.get(this.body, pathOb.path)

                    var cols = []
                    var col_ob = {}
                    sub_loop:
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

                            if(typeof current_val_ob[final_key] === 'undefined') {
                                continue sub_loop;
                            }

                            column.value = current_val_ob[final_key]
                            col_ob[final_key] = current_val_ob[final_key]
                        }
                        cols.push(column)
                    }
                    col_ob.__q_idx = pathOb.current_index;
                    col_ob.__q_p_idx = pathOb.parent_idx;
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

            model.nested_insert = this.nested_insert;
                this.new_models.push(model);
            }
        }

        return {
            all_return_paths: this.all_return_paths,
            models: this.new_models
        };
    }

    getCurrentIndex(params) {
        var p = params.table_body_path_arr.join('.');

        if(!this.index_map[p] && this.index_map[p] !== 0) {
            this.index_map[p] = 0;
        } else {
            ++this.index_map[p];
        }

        this.body_path_map[params.gen_body_path] = this.index_map[p];

        return this.index_map[p];
    }
}

exports.DynamicInsertModels = DynamicInsertModels;
