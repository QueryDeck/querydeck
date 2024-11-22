'use strict';
const {
	isArray
} = require("lodash");
const {
	postgresql
} = require("sql-formatter");
const _ = require('lodash');

const modelutils = require.main.require('./models/modelUtils')

var agg_types = ['row_to_json', 'json_agg'];
var otherutils = require('./utils');

var MYSQL = 'MySQL'
var POSTGRES = 'Postgres'

module.exports = class builder {

	constructor(models, currentModel, otherOpts, dynamicValues) {
		this.models = models;
		this.currentModel = currentModel;
		this.db_type = otherOpts && otherOpts.db_type || POSTGRES;
		this.quotes = otherOpts && otherOpts.db_type == 'MySQL' ? '`' : '"'
		this.otherOpts = otherOpts;
		this.dynamicValues = dynamicValues || {session: {}, query: {}};
		if (otherOpts && otherOpts.whereOnly) this.whereOnly = true;

		this.depthmap = this.depthmap || [];
		this.depthpaths = this.depthpaths || [];
		this.qref_map = {};
		this.session_vars_used = [];

		return this;
	}

	getParamMapIndex(val) {

		if (!this.paramMap) this.paramMap = {};
		if (!this.paramMapIndex) this.paramMapIndex = 0;
		++this.paramMapIndex;
		var currentIndex = '$' + this.paramMapIndex;
		this.paramMap[currentIndex] = val;
		return currentIndex;
	}

	getParamMapAsIndexArr() {
		var arr = [];
		if (!this.paramMap) this.paramMap = {};
		var param_keys = Object.keys(this.paramMap);

		for (let i = 0; i < param_keys.length; i++) {
			var newi = parseInt(param_keys[i].replace('$', ''));
			arr[(newi - 1)] = this.paramMap[param_keys[i]];
		}
		return arr;
	}

	generate() {
		this.queries = [];

		if (this.otherOpts.method == 'insert' && this.otherOpts.query_values && this.otherOpts.request) {
			this.fomatModelColumn(this.models, this.otherOpts.query_values, this.otherOpts.request)
		}
		if (this.whereOnly) {
			return {
				text: this.resolveWhere(this.models),
				values: [],
				getParamMapAsIndexArr: this.getParamMapAsIndexArr(),
				paramMap: this.paramMap
			};
		}

		for (var i = 0; i < this.models.length; i++) {

			if (this.models[i].method == 'select') {

				this.queries.push({
					query: this.select(this.models[i]),
					alias: 'q' + this.makeid(3)
				});
			} else if(this.models[i].method == 'delete') {

				this.queries.push({
					query: this.delete(this.models[i]),
					alias: 'q' + this.makeid(3)
				});

			} else {

				this.addInupQuery(this.models[i]);
			}
		}

		if (this.queries.length == 1) return {
			text: this.queries[0].query,
			values: this.getParamMapAsIndexArr() || [],
			getParamMapAsIndexArr: this.getParamMapAsIndexArr(),
			paramMap: this.paramMap,
			querypaths: this.depthpaths,
			session_vars_used: this.session_vars_used
		};
		var finalQuery = 'WITH ';
		var aliasArray = [];

		for (var j = 0; j < this.queries.length; j++) {
			if (!this.queries[j].alias.match(/insert|update|delete/)) {
				aliasArray.push(this.queries[j].alias);
			}

			finalQuery += this.queries[j].alias + ' AS (' + this.queries[j].query + ') ';
			if (j != this.queries.length - 1) finalQuery += ', ';
		}
		finalQuery += ' SELECT * FROM ' + aliasArray.join(', ') + ';';
		return {
			text: finalQuery,
			values: this.getParamMapAsIndexArr() || [],
			getParamMapAsIndexArr: this.getParamMapAsIndexArr(),
			paramMap: this.paramMap,
			querypaths: this.depthpaths,
			session_vars_used: this.session_vars_used
		};
	}

	delete(model) {
		var fq = 'DELETE ' +
			' FROM ' +
			`${this.quotes}${model.schema}${this.quotes}.${this.quotes}${model.table}${this.quotes}` +
			this.resolveWhere(model)

		;
		return fq;
	}

	select(model, agg_type) {

		var finalColumns = this.resolveSelectColumns(model);

		var jtext = ' ';

		if (model.joins && model.joins.length > 0) {
			for (var i = 0; i < model.joins.length; i++) {

				if (model.joins[i].agg_type && agg_types.indexOf(model.joins[i].agg_type) > -1) {
					model.joins[i].where = model.joins[i].on;
					finalColumns.push('( ' + this.select(model.joins[i], model.joins[i].agg_type) + ' )');
				} else {
					jtext += ' ' + (model.joins[i].type) + ' JOIN ' + (model.joins[i].schema + '.' + model.joins[i].table);
					// if(model.q.joins[i].model.q.as) jtext += ' AS ' + this.identAlias(model.q.joins[i].model.q.as) + ' ';
					// old
					// jtext += ' ON ' + this.resolveConditions(this.addSchemaToObKeys(model.q.joins[i].on, model.q.joins[i].model), model.q.joins[i].model);
					if (!(this.db_type == POSTGRES && model.joins[i].type == 'CROSS')) {
						jtext += ' ON ' + this.resolveConditions(model.joins[i].on);
					}


					finalColumns = finalColumns.concat(this.resolveSelectColumns(model.joins[i]));
				}
			}
		}

		jtext += ' ';

		var off = model.offset ? ' OFFSET ' + model.offset : '';

		if (finalColumns.length == 0) { // wildcard if not columns
			finalColumns = ['*'];
		}
		var aliastext = '';

		// if(model.q.as) aliastext = ' AS ' + this.identAlias(model.q.as) + ' ';

		// if(model.orderby) model.q.orderby.by = this.addSchemaToObKeys(model.q.orderby.by, model, model.q.as);

		var fq = 'SELECT ' +
			finalColumns.join(',') +
			' FROM ' +
			`${this.quotes}${model.schema}${this.quotes}.${this.quotes}${model.table}${this.quotes}` +
			jtext +
			this.resolveWhere(model) +
			this.resolveGroup(model.groupby) +
			this.resolveOrder(model.orderby) +
			off +
			this.resolveLimit(model.limit)

		;

		// if(single) return fq;
		var id = this.makeid(6);
		if (agg_type) {
			if (agg_type == 'row_to_json') {
				return ' SELECT ROW_TO_JSON(' + id + '.*) AS ' + model.table_alias + ' FROM ( ' + fq + ' ) ' + id;
			} else if (agg_type == 'json_agg') {
				return ' SELECT JSON_AGG(' + id + '.*) AS ' + model.table_alias + ' FROM (' + fq + ') ' + id;
			}
		}
		// if(model.q.aggArray) return ' SELECT ARRAY_AGG(aggm.' + Object.keys(model.q.columns)[0].split('.').pop() + ') AS ' + model.q.aggArray + ' FROM (' + fq + ') aggm ';
		// if(model.q.aggregateOne) return ' SELECT ROW_TO_JSON(' + id + '.*) AS ' + this.identAlias(model.q.aggAlias || model.q.as || model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name) + ' FROM ( ' + fq + ' ) ' + id;
		return fq;

	}

	resolveSelectColumns(model) {


		var finalColumns = [];
		let quotes = this.quotes;
		// quotes =  '`'
		for (let i = 0; i < model.columns.length; i++) {
			// var coltext = this.addSchemaToColumn(model.columns[i].columnName, model);

			// if(model.q.columns[i].alias) coltext += ' AS ' + this.identAlias(model.columns[i].alias);

			// quotes = ''
			var col_name = model.columns[i].columnName;
			let colNameQuotes = quotes + model.columns[i].columnName.split(".").join(quotes + "." + quotes) + quotes;
			// var col_name_quotes = quotes +  model.columns[i].columnName.split(".").join(quotes+ "." + quotes) + quotes;
			if (model.columns[i].fn && !model.columns[i].def) {
				if (['sum', 'count', 'max', 'min', 'avg'].indexOf(model.columns[i].fn) > -1) {
					if (model.columns[i].rowCount) {
						col_name = "count(*)";
					} else {
						col_name = model.columns[i].fn + '(' + colNameQuotes + ')';
						model.columns[i].alias = `${model.columns[i].fn}_${model.table}_${model.columns[i].columnName.split(".").pop()}`; // Expicitly add alias name for aggregate func
					}
				} else if (model.columns[i].fn == 'date_trunc') {
					// var pgtype = this.getType(params.realcname);
					var ts_type = otherutils.gettimeseriestype(col_name, this.getType(col_name));
					if (ts_type) {
						col_name = this.resolveTimeStampColumn(model.columns[i], colNameQuotes, ts_type);
					}
				}
			} else {
				col_name = colNameQuotes;
			}
			if (model.columns[i].def) {
				// alias priority order for custom cols  :  alias > lable > def
				let currAliasName = model.columns[i].alias || model.columns[i].label || model.columns[i].def
				if (['sum', 'count', 'max', 'min', 'avg'].indexOf(model.columns[i].fn) > -1) {
					// if not alias then add agg_func name in columns
					if (currAliasName !== model.columns[i].alias) currAliasName = model.columns[i].fn + "_" + currAliasName;
					finalColumns.push(`${model.columns[i].fn}(${model.columns[i].def}) AS ${quotes}${currAliasName}${quotes}`);
				} else {
					if (model.columns[i].fn === 'date_trunc') {
						if (!model.columns[i].customColType) throw new Error("must have value for 'customColType' ")
						currAliasName = 'tp'; // force alias name as tp if timestamp is selected  
						let ts_type = otherutils.gettimeseriestype(col_name, model.columns[i].customColType);
						colNameQuotes = `(${model.columns[i].def})`;
						col_name = this.resolveTimeStampColumn(model.columns[i], colNameQuotes, ts_type);
						finalColumns.push(`${col_name} AS ${quotes}${currAliasName}${quotes}`);
					} else {
						finalColumns.push(`${model.columns[i].def} AS ${quotes}${currAliasName}${quotes}`);
					}
				}

				// finalColumns.push(`${model.columns[i].def} `);
			} else if(model.columns[i].operator == 'static_value') {
				finalColumns.push(' 1 ')
			} else {
				// col_name = quotes + col_name.split(".").join(quotes + "." + quotes) + quotes;
				if (model.columns[i].alias) {
					finalColumns.push(col_name + ' AS ' + quotes + model.columns[i].alias + quotes);
				} else {
					finalColumns.push(col_name + ' AS ' + quotes + model.columns[i].columnName + quotes);
				}
			}

		}

		return finalColumns;

	}
	resolveTimeStampColumn(column, colNameQuotes, ts_type) {
		let col_name;
		column.alias = 'tp';
		column.ts_gran = column.ts_gran || 'day';
		if (ts_type.type == 'date' || ts_type.type == 'datetime') {
			if (['second', 'minute', 'hour'].indexOf(column.ts_gran) > -1) {
				column.ts_gran = 'week'; // TODO : Weeks or days
			}
			if (this.db_type == MYSQL) col_name = this.dateFormat(colNameQuotes, column.ts_gran);
			else col_name = this.dateFormat(colNameQuotes, column.ts_gran);

		} else if (ts_type.type == 'timestamp' || ts_type.type == 'timestamp without time zone' || ts_type.type == 'time') {
			if (this.db_type == MYSQL) col_name = this.dateFormat(colNameQuotes, column.ts_gran);
			else col_name = this.dateFormat(colNameQuotes, column.ts_gran);

		} else if (ts_type.type.indexOf('unix') > -1) {

			if (ts_type.type.indexOf('unixms') > -1) { // if unix millisecond
				if (this.db_type == MYSQL) col_name = this.dateFormat(` FROM_UNIXTIME(${colNameQuotes}/1000) `, column.ts_gran);
				else col_name = this.dateFormat(` to_timestamp(${colNameQuotes}/1000) `, column.ts_gran);

			} else {

				if (this.db_type == MYSQL) col_name = this.dateFormat(` (CAST(${colNameQuotes} AS DATETIME)) `, column.ts_gran);
				else col_name = this.dateFormat(` to_timestamp(${colNameQuotes}) `, column.ts_gran);

			}
		}
		return col_name;
	}
	dateFormat(col_name, ts_gran) {

		if (this.db_type == MYSQL) {
			switch (ts_gran) {
				case "second":
					return `DATE_FORMAT(${col_name},'%Y-%m-%dT%H:%i:%s.000Z')`;
				case "minute":
					return `DATE_FORMAT(${col_name},'%Y-%m-%dT%H:%i:00.000Z')`;
				case "hour":
					return `DATE_FORMAT(${col_name} , '%Y-%m-%dT%H:00:00.000Z')`;
				case "day":
					return `DATE_FORMAT(${col_name},'%Y-%m-%dT00:00:00.000Z')`;
				case 'week':
					return `DATE_FORMAT(DATE_SUB(${col_name},INTERVAL WEEKDAY(${col_name}) DAY) , '%Y-%m-%dT00:00:00.000Z')`;
				case "month":
					return `DATE_FORMAT(${col_name} ,'%Y-%m-01T00:00:00.000Z')`;
				case "year":
					return `DATE_FORMAT(${col_name},'%Y-01-01T00:00:00.000Z')`;
				default:
					return `DATE_FORMAT(${col_name},'%Y-%m-%dT%H:%i:%s.%fZ')`;
			}

		} else {
			return `DATE_TRUNC('${ts_gran}',${col_name}::TIMESTAMP)`
		}

	}


	addInupQuery(model) {
		if (model.method == 'select') throw 'cannot inup select model';
		model.aggAlias = model.aggAlias || (model.schema != 'public' ? (model.schema + '.') : '') + model.table + '$' + this.makeid(3);

		var ob = this[model.method](model);

		if(ob.multiple) {
			this.qref_map[ob.alias] = this.qref_map[ob.alias] || {};
			this.qref_map[ob.alias].multiple = true;
			this.qref_map[ob.alias].table_alias = model.table_alias;
			this.qref_map[ob.alias].return_arr = ob.return_arr;
		}

		var unused_alias = 'q' + this.makeid(3);
		
		this.queries.push({
			query: ob.query,
			alias: ob.alias
		});

		//, ROW_NUMBER() OVER () AS idx

		if(ob.multiple) {
			this.queries.push({
				query: 'SELECT ' + ob.alias + '.*, ROW_NUMBER() OVER () AS idx ' + ' FROM ' + ob.alias,
				// alias: 'q' + this.makeid(3)
				alias: ob.alias + '_return'
			});
		}

		if(model.table_body_path && model.table_body_path != '') {

			var agg_func = ((model.allow_multiple_row || model.method == 'update' || ob.multiple) ? 'JSON_AGG' : 'ROW_TO_JSON')

		if(ob.return_joins && ob.return_joins.length > 0) {

			// console.log(ob.return_joins, this.qref_map)

			var qq = 'SELECT ' + agg_func + '(main_result) AS "' + (model.dynamic_base_index ? model.table_body_path + '_' + model.dynamic_base_index : model.table_body_path) + '" FROM (SELECT *'

			for(let i = 0; i < ob.return_joins.length; i++) {
				// qq += ' JOIN ' + ob.return_joins[i].text + ' ON ' + ob.return_joins[i].qref + '.idx = ' + ob.alias + '_return.idx'
				qq += ', ' + ob.return_joins[i].text + ' AS ' + this.qref_map[ob.return_joins[i].qref].table_alias
			}

			qq += ' FROM ' + ob.alias + '_return' + ') AS main_result' 

			this.queries.push({
				query: qq,
				alias: 'q' + this.makeid(3),
				table_body_path: model.table_body_path
			});
		} else {
			this.queries.push({
				query: 'SELECT ' + agg_func + '(' + ob.alias + '.*) AS "' + (model.dynamic_base_index ? model.table_body_path + '_' + model.dynamic_base_index : model.table_body_path) + '" FROM ' + ob.alias,
				alias: 'q' + this.makeid(3),
				table_body_path: model.table_body_path
			});
		}
			
		}

		
		
		model.queryAlias = (ob.multiple ? unused_alias : ob.alias);
		model.toReturn = ob.returnVal;
		return {
			queryAlias: (ob.multiple ? unused_alias : ob.alias),
			toReturn: ob.returnVal
		};
	}

	onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}

	resolveConflict(model) {

		if (!model.conflict || model.conflict?.columns?.length === 0) return '';
		let allkeys = [];
		let result;
		for (let i = 0; i < model.conflict.columns.length; i++) {
			allkeys.push(model.conflict.columns[i].columnName.split(".").pop())
		}

		result = ' ON CONFLICT ON CONSTRAINT "' + model.conflict.constraint + '"' +
			' DO UPDATE SET '
		if (allkeys.length > 1) {
			result = result +
				' (' + allkeys.join(',') + ') ' +
				' = ' + this.resolveValues(model.conflict.columns, {
					conflict: true,
					dynamic_base_index: model.dynamic_base_index
				})

		} else {
			result = result +
				' ' + allkeys.join(',') + ' ' +
				' = ' + this.resolveValues(model.conflict.columns, {
					conflict: true,
					dynamic_base_index: model.dynamic_base_index
				})
		}
		return result;
	}


	insert(model) {

		// check for extra columns
		var allkeys = [];
		var li = model.columns.length;
		let col_name;
		for (var i = 0; i < li; i++) {
			if (Array.isArray(model.columns[i])) {
				for (var j = 0; j < model.columns[i].length; j++) {
					col_name = model.columns[i][j].columnName.split(".").pop();
					if (!allkeys.includes(col_name)) allkeys.push(col_name);
				}
			} else {
				col_name = model.columns[i].columnName.split(".").pop();
				if (!allkeys.includes(col_name)) allkeys.push(col_name);
			}
		}
		var return_arr = model.returns.user.map(elem => {
			let colName = elem.columnName.split('.')[2];
			if (elem.alias) return `${colName} AS  ${elem.alias}`;
			else return colName;
		});
		return_arr = return_arr.concat(model.returns.qref)
		return_arr = return_arr.filter(this.onlyUnique);

		var q;
		var multiple = false;

		if(Array.isArray(model.columns[0]) && model.columns.length > 1) {
			multiple = true;
		}

		var return_joins = [];

		var current_alias = 'q' + model.method + '_' + model.table + (model.dynamic_base_index ? '_' + model.dynamic_base_index : '')
		
		if(model.values_added && model.qref_used && model.table_body_type == 'array' && (model.columns.length > 1 || model.qref_only)) {

			var joins = [], joins_resolved = [], qref_arr = [];

			var val_text = 'SELECT '

			for(let i = 0; i < model.columns[0].length; i++) {
				let currColValues = model.columns[0][i];
				// console.log(currColValues)
				if(currColValues.operator == '$req-body') {
					// val_text += '(' + this.resolveValues(currColValues, {dynamic_base_index: model.dynamic_base_index}) + '),'

					val_text += "(insert_object.value ->> '" + currColValues.columnName.split('.').pop() + "')::" + this.getType(currColValues.columnName);

				} else {
					var qref_split = currColValues.value.split('$');

					var qref_dynamic_key = qref_split[0] + (model.dynamic_base_index ? '_' + model.dynamic_base_index : '');
					var qref_dynamic_return_key = qref_dynamic_key;
					
					if(joins_resolved.indexOf(qref_dynamic_key) == -1 && !model.qref_only) {
						joins_resolved.push(qref_dynamic_key);
						// console.log(this.qref_map, qref_dynamic_key)
						if(this.qref_map[qref_dynamic_key] && this.qref_map[qref_dynamic_key].multiple) {
							qref_dynamic_return_key = qref_dynamic_key + '_return';
							joins.push(
								'JOIN ' + qref_dynamic_return_key + ' ON ' + qref_dynamic_return_key + '.idx = insert_object.idx'
							)
							// console.log('return_joins', this.qref_map)
							return_joins.push({
								text: " (SELECT row_to_json(joined_result) FROM (SELECT " + this.qref_map[qref_dynamic_key].return_arr.join(', ') + " FROM " + qref_dynamic_return_key + " WHERE " + qref_dynamic_return_key + ".idx = " + current_alias + '_return' + ".idx) AS joined_result) ",
								qref: qref_dynamic_key
							})
						} else {
							joins.push(
								'CROSS JOIN ' + qref_dynamic_key
							)
						}
					}
					// console.log('new ket', qref_dynamic_return_key)

					qref_arr.push(qref_dynamic_return_key)

					val_text += qref_dynamic_return_key + '.' + qref_split[1]
				}

				if(i !== model.columns[0].length - 1) val_text += ', ';

			}

			// console.log(model)

			if(!model.qref_only) {
				val_text += ' FROM json_array_elements(' + this.getParamMapIndex(JSON.stringify(model.body_vals)) + ') WITH ORDINALITY AS insert_object(value, idx) ' + joins.join(' ')
			} else {
				val_text += ' FROM ' + qref_arr.join(',')
			}

			q = "INSERT INTO " +
			model.schema + '.' + model.table +
			" (" + allkeys.join(', ') + ") " +
			val_text +
			this.resolveConflict(model) +
			' RETURNING ' +
			(return_arr.length > 0 ? return_arr.join(', ') : '*') 
			// + (Array.isArray(model.columns[0]) && model.columns.length > 1 && model.values_added ? ' , ROW_NUMBER() OVER () AS idx' : '')

		} else {


			q = "INSERT INTO " +
			model.schema + '.' + model.table +
			" (" + allkeys.join(', ') + ") " +
			' VALUES ' + this.resolveValues(model.columns, {dynamic_base_index: model.dynamic_base_index}) + ' ' +
			this.resolveConflict(model) +
			' RETURNING ' +
			(return_arr.length > 0 ? return_arr.join(', ') : '*') 
			// + (Array.isArray(model.columns[0]) && model.columns.length > 1 && model.values_added ? ' , ROW_NUMBER() OVER () AS idx' : '')

		}

		return {
			query: q,
			alias: current_alias,
			multiple: multiple,
			return_joins: return_joins,
			return_arr: return_arr
		};

	}

	update(model) {
		var w = this.resolveWhere(model);

		var allkeys = [];


		for (let i = 0; i < model.columns.length; i++) {
			allkeys.push(model.columns[i].columnName.split(".").pop())
		}

		var current_alias = 'q' + model.method + '_' + model.table

		var return_arr = model.returns.user.map(elem => {
			let colName = elem.columnName;
			if (elem.alias) return `${colName} AS  ${elem.alias}`;
			else return colName;
		});
		return_arr = return_arr.concat(model.returns.qref)
		return_arr = return_arr.filter(this.onlyUnique);
		var q;

		if (allkeys.length > 1) {
			q = 'UPDATE ' + model.schema + '.' + model.table +
				' SET (' + allkeys.join(',') + ' ) ' +
				' = ' + this.resolveValues(model.columns, {dynamic_base_index: model.dynamic_base_index}) + ' '
				+
				w +
				' RETURNING ' +
				(return_arr.length > 0 ? return_arr.join(', ') : '*');
		} else {
			q = 'UPDATE ' + model.schema + '.' + model.table +
				' SET ' + allkeys.join(',') +
				' = ' + this.resolveValues(model.columns, {dynamic_base_index: model.dynamic_base_index}) + ' ' +
				w +
				' RETURNING ' +
				(return_arr.length > 0 ? return_arr.join(', ') : '*');
		}

		return {
			query: q,
			alias: current_alias
		};
	}

	fomatModelColumn(models, query_values, request) {


		for (let i = 0; i < models.length; i++) {
			let field_input = _.get(query_values, models[i].table_body_path);
			let table_request_body = _.get(request, models[i].table_body_path);

			let result = [];
			if (models[i].allow_multiple_row) {
				if (!Array.isArray(field_input) || field_input.length === 0) {
					throw new Error(`${models[i].table_body_path} must be of type array  with atleast 1 row values`);
				}
				for (let j = 0; j < field_input.length; j++) {
					let currColumns = normalizeColumns(models[i], field_input, table_request_body[0], j)
					result.push(currColumns)
				}

			} else {
				let currColumns = normalizeColumns(models[i], field_input, table_request_body, )
				result.push(currColumns)
			}
			models[i].columns = result;

		}

		function normalizeColumns(model, input, table_request_body, iteration) {
			let currColumns = [];
			for (let j = 0; j < model.columns.length; j++) {
				let currCol = {
					...model.columns[j],
				}
				let column_name = model.columns[j].columnName.split(".").pop();
				if (model.columns[j].operator === "$req-body") {
					if (Array.isArray(input)) { // for array of  object input 
						if (
							input[iteration][column_name] === undefined && (
								table_request_body[column_name].required === false ||
								table_request_body[column_name].default !== null
							)
						) {
							currCol.operator = "$default"
						} else {
							currCol.value = model.columns[j].value + '[' + iteration + ']';
						}
					} else { // for object  input
						if (input[column_name] === undefined) {
							currCol.operator = "$default"
						}
					}
				}
				currColumns.push(currCol)
			}
			return currColumns;
		}

	}


	resolveValues(columns_arr, options) {

		var val_arr = [];
		var valtext = '';
		let is_multi_col_insert = false;
		if (!Array.isArray(columns_arr[0])) columns_arr = [columns_arr]
		for (let index = 0; index < columns_arr.length; index++) {
			var columns = columns_arr[index]
			let nv_arr = [];
			valtext += '(';
			for (let i = 0; i < columns.length; i++) {


				if (options && options.conflict) columns[i].operator = '$excluded'

				var v = columns[i].value;
				var op = columns[i].operator;
				var nv;
				if (v && typeof v == 'object' && v.model) {
					// model
					if (v.q.method == 'insert' || v.q.method == 'update') {
						if (v.generatedQuery) {
							// repeat
							nv = '(SELECT ' + v.toReturn + ' FROM ' + v.queryAlias + ')';
						} else {
							// new
							var res = this.addInupQuery(v);
							nv = '(SELECT ' + res.toReturn + ' FROM ' + res.queryAlias + ')';
						}
					} else {
						nv = '(' + this.select(v) + ')';
					}
				} else if (op) {
					if (v && op == '$append') {
						nv = 'ARRAY_APPEND(' + columns[i].columnName + ', ' + this.getParamMapIndex(v) + ')';
					} else if (v && op == '$prepend') {
						nv = 'ARRAY_PREPEND(' + columns[i].columnName + ', ' + this.getParamMapIndex(v) + ')';
					} else if (v && op == '$remove') {
						nv = 'ARRAY_REMOVE(' + columns[i].columnName + ', ' + this.getParamMapIndex(v) + ')';
					} else if (v && op == '$cat') {
						nv = 'ARRAY_CAT(' + columns[i].columnName + ', ' + this.getParamMapIndex(v) + ')';
					} else if (op == '$default') {
						nv = 'DEFAULT';
					} else if (op == '$qref') {
						var q_ref_split = v.split && v.split('$') || [v];
						var ref_col = q_ref_split[q_ref_split.length - 1];
						var ref_alias = q_ref_split[q_ref_split.length - 2] + (options.dynamic_base_index ? '_' + options.dynamic_base_index : '');
						nv = ' (select ' + ref_alias + '.' + ref_col + ' from ' + ref_alias + ') ';
					} else if (op == '$excluded') { // for conflict columns 
						nv = 'EXCLUDED.' + columns[i].columnName.split(".").pop();
					} else {
						// throw 'unknown insert operator'
						if (typeof v == 'object' && !Array.isArray(v)) v = JSON.stringify(v)
						nv = this.getParamMapIndex(v);
					}
				} else {
					if (!v) throw "insert value missing";
					nv = this.getParamMapIndex(v);
				}
				nv_arr.push(nv);

				valtext += nv;
				if (i != columns_arr[0].length - 1) valtext += ', ';
			}
			valtext += ')';
			if (index < columns_arr.length - 1) valtext += ', ';
			if (columns.length > 1) {
				val_arr.push(`(${nv_arr.join(",")})`)
				is_multi_col_insert = true;
			} else {
				val_arr.push(nv_arr[0])
			}

		}

		return valtext

	}

	resolveGroup(group) {
		if (!group || group.length == 0) return '';


		let resultGroupByArr = [];
		for (let i = 0; i < group.length; i++) {
			if (group[i].def) resultGroupByArr.push(group[i].def);
			else resultGroupByArr.push(this.quotes + group[i].columnName.split(".").join(this.quotes + "." + this.quotes) + this.quotes)
		}
		return ' GROUP BY ' + resultGroupByArr.join(',');
	}

	resolveOrder(order) {

		if (!order || typeof order != 'object' || !Array.isArray(order) || order.length == 0) return '';

		var orderedt = ' ORDER BY ';
		// var ol  = order.by // orderby option list 
		for (var i = 0; i < order.length; i++) {
			// orderedt += order[i].name;
			let col_name = order[i].name;
			if (order[i].fn === 'date_trunc') {
				if (order[i].def) order[i].alias = 'tp' // force alias name as 'tp' for custom column timestamp  
				else if (!order[i].alias) order[i].alias = 'tp'
			}
			// orderedt +=   col_name ; 
			col_name = this.quotes + col_name.split(".").join(this.quotes + "." + this.quotes) + this.quotes;
			// alias priority order for custom cols  :  alias > lable > def
			//|| order[i].label
			if (order[i].alias) {
				order[i].alias = order[i].alias;
				order[i].alias = this.quotes + order[i].alias + this.quotes;
			} else if (order[i].def) {
				order[i].alias = order[i].def;
			}


			orderedt += order[i].alias ? order[i].alias : col_name;

			if (order[i].asc == false || order[i].desc == true) orderedt += ' DESC';
			else if (order[i].asc == true || order[i].desc == false) orderedt += ' ASC';

			if (i != (order.length - 1)) orderedt += ',';
		}
		return orderedt;

	}
	resolveOffset(l) {
		if (!l) return '';
		return ' OFFSET ' + l;
	}
	resolveLimit(l) {
		if (l == undefined) return '';
		return ' LIMIT ' + l;
	}

	resolveWhere(model) {

		if (!model.where || !model.where.rules || Object.keys(model.where.rules).length === 0 ) return '';
		var w = this.resolveConditions(model.where, model);
		return ' WHERE ' + w;
	}

	resolveConditions(conditions, mymodel, dp, depthpath) {


		dp = dp || {
			depth: 0
		};
		var depthpath = depthpath || '';

		var condt = '';

		var type = (conditions.condition && conditions.condition.toLowerCase() == 'or') ? ' OR ' : ' AND ';

		for (let i = 0; i < conditions.rules.length; i++) {
			const element = conditions.rules[i];
			if((!element.rules) && !conditions.rules[i].operator && !conditions.rules[i].value) continue;
			// console.log('condition', element)
			if (conditions.rules[i].rules && conditions.rules[i].condition) {

				// nest
				condt += ' ( ' + this.resolveConditions(conditions.rules[i], mymodel, ({
					depth: dp.depth + 1,
					superindex: i
				}), depthpath + 'rules[' + i + '].') + ' ) ';

			} else if(conditions.rules[i].operator && conditions.rules[i].operator.indexOf('exists') > -1) {

				var exists_path_spl = conditions.rules[i].exists_path.split('-');
				var schema_split = this.currentModel.idToName[exists_path_spl[exists_path_spl.length - 1]];

				var exists_base_conditions = modelutils.idToJoinPathOb({
					id: conditions.rules[i].exists_path,
					currentModel: this.currentModel
				});
				if(conditions.rules[i].exists_where && conditions.rules[i].exists_where.rules && conditions.rules[i].exists_where.rules.length > 0) {
					exists_base_conditions.rules.push(conditions.rules[i].exists_where)
				}

				var exists_select = this.select({
					schema: schema_split[0],
					table: schema_split[1],
					columns: [
						{
							columnName: 'static_value',
							operator: 'static_value',
							value: 'static_value'
						}
					],
					where: exists_base_conditions
				});

				condt += ' (' + (conditions.rules[i].operator.indexOf('not_exists') > -1 ? 'NOT EXISTS' : 'EXISTS') + ' (' + exists_select + ')) '

			} else {

				let val;
				if (conditions.rules[i].value) {
					val = conditions.rules[i].value;
				}else if (conditions.rules[i].value  === null ) {
					val = conditions.rules[i].value;
				}
				 else if (conditions.rules[i].values  && conditions.rules[i].values[0]) {
					val = conditions.rules[i].values[0].value;
				} else {
					console.log("oepration not found  frp, JTsql ");
					continue;
				}

				var param_val = false;

				// this.depthpaths.push
				if(val !== undefined && 	conditions.rules[i].input_key === undefined  ){
                 // condition  value is static 
				}
				else if (val && (!conditions.rules[i].operator || conditions.rules[i].operator.indexOf('$') == -1)) {

					
					if (conditions.rules[i].input_key && conditions.rules[i].input_key.match(/BODY|QUERY|URL|SESSION/)) {

						var key_spl = conditions.rules[i].input_key.split('.');
						key_spl.shift();
						var key = key_spl.join('.');
						
						if(conditions.rules[i].input_key.indexOf('SESSION') > -1) {

							if(_.get(this.dynamicValues.session, key)) {

								val = _.get(this.dynamicValues.session, key)

							}

							this.session_vars_used.push(key)

						} else if (conditions.rules[i].input_key.indexOf('QUERY') > -1 && this.dynamicValues.query[key]) {

							val = this.dynamicValues.query[key]

						} else if (conditions.rules[i].input_key.indexOf('URL') > -1 && this.dynamicValues.url_param_value) {

							val = this.dynamicValues.url_param_value

						}

						var query_path_ob = {
							path: depthpath + 'rules[' + i + '].',
							input_key: conditions.rules[i].input_key,
							column: conditions.rules[i].columnName || conditions.rules[i].fieldName || conditions.rules[i].id,
							session: {
								key: conditions.rules[i].session_key,
								// name: this.currentModel.idToName[conditions.rules[i].session_key].join('.')
							}
						}

						if(query_path_ob.column && query_path_ob.input_key.indexOf('QUERY') > -1) {
							query_path_ob.type = otherutils.getSuperType(this.getType(query_path_ob.column))
						}

						this.depthpaths.push(query_path_ob)
					}else{
						console.log( 'else not key')
					}
					val = this.getParamMapIndex(val)
					param_val = true;
				}
                 
				condt += this.resolveOperators({
					columnName: conditions.rules[i].columnName || conditions.rules[i].fieldName || conditions.rules[i].id,
					realcname: conditions.rules[i].columnName || conditions.rules[i].fieldName || conditions.rules[i].id,
					operator: conditions.rules[i].operator,
					value: val,
					def: conditions.rules[i].def,
					type: conditions.rules[i].type,
					input_key: conditions.rules[i].input_key,
					param_val: param_val
				});
			}
			if (i != conditions.rules.length - 1) condt += type;
		}

		if (conditions.not) {
			if (conditions.rules.length > 1) condt = ' NOT (' + condt + ' ) ';
			else condt = ' NOT ' + condt;
		}

		return condt;
	}

	// columnName operator value realcname
	resolveOperators(params) {
		
		var pgtype = this.getType(params.realcname);
		var suptype = otherutils.getSuperType(pgtype);
		if (params.def && params.type) {
			pgtype = params.type.toLowerCase();
			suptype = otherutils.getSuperType(pgtype);
		} else {
			pgtype = this.getType(params.realcname);
			suptype = otherutils.getSuperType(pgtype);
		}
		// var optype = typeof params.operator;
		var valtype = typeof params.value;

		var translate = {
			'equal': '$eq',
			'not_equal': '$!eq',
			'less_than': '$lt',
			'less_or_equal': '$lte',
			'greater_than': '$gt',
			'greater_or_equal': '$gte',
			'is_null': '$null',
			'is_empty': '$null',
			'is_not_null': '$!null',
			'is_not_empty': '$!null',
			'is_true': '$true',
			'is_not_true': '$!true',
			'is_false': '$false',
			'is_not_false': '$!false',
			'like': '$regex',
			'not_like': '$!regex',
			'ilike': '$ilike', // case insensitive like
			'not_ilike': '$!ilike', // case  insensitive  not like
			'regex': '$regex',
			'not_regex': '$!regex',
			'contains': '$contains',
			'contained_by': '$contained_by',
			'overlaps': '$overlaps'
		};
		let quotes = this.quotes

		if (params.def) params.columnName = params.def;
		else params.columnName = quotes + params.columnName.split(".").join(quotes + "." + quotes) + quotes;

		if (translate[params.operator]) params.operator = translate[params.operator]; // translate operator

		if (params.operator == '$null') return params.columnName + ' IS NULL ';
		if (params.operator == '$!null') return params.columnName + ' IS NOT NULL ';

		// BOOL
		if (pgtype == 'boolean') {

			if (params.operator == '$true') return params.columnName + ' IS TRUE ';
			else if (params.operator == '$!true') return params.columnName + ' IS NOT TRUE ';
			else if (params.operator == '$false') return params.columnName + ' IS FALSE ';
			else if (params.operator == '$!false') return params.columnName + ' IS NOT FALSE ';
			else return '';
		}
		if(!params.param_val && (suptype == 'text' || suptype ===  'datetime')){ 
			params.value = "'" + params.value + "'"
		}

		if (params.operator === '$gt') return params.columnName + ' > ' + params.value;
		else if (params.operator === '$gte') return params.columnName + ' >= ' + params.value;
		else if (params.operator === '$lt') return params.columnName + ' < ' + params.value;
		else if (params.operator === '$lte') return params.columnName + ' <= ' + params.value;
		else if (params.operator === '$eq') return params.columnName + ' = ' + params.value;
		else if (params.operator === '$!eq') return params.columnName + ' != ' + params.value;
		else if (params.operator === '$columnref') { // add quotes to value if value is also a table columnname
			params.value = quotes + params.value.split(".").join(quotes + "." + quotes) + quotes;
			return params.columnName + ' = ' + params.value;
		} else if (params.operator === '$inq') return params.columnName + ' IN (' + this.select(params.value) + ')';
		// else if (params.operator === '$inq') text += this.wrapType(columnName, realcname) + ' IN (' + this.select(params.value) + ')';
		// else if (params.operator.indexOf('$cilike') > -1) text += 'LOWER(' + this.wrapType(columnName, realcname) + ') ~ LOWER(' + val + ')';
		else if (params.operator === '$like') {
			if (this.db_type == MYSQL) return `${params.columnName} LIKE BINARY '${params.value}'`;
			else return params.columnName + ' LIKE ' + params.value;
		} else if (params.operator === '$!like') {
			if (this.db_type == MYSQL) return `${params.columnName} NOT LIKE BINARY '${params.value}'`;
			else return `${params.columnName} NOT LIKE ${params.value}`;
		} else if (params.operator === '$ilike') {
			if (this.db_type == MYSQL) return `${params.columnName} LIKE '${params.value}'`;
			else return params.columnName + ' ILIKE ' + params.value;
		} else if (params.operator === '$!ilike') {
			if (this.db_type == MYSQL) return `${params.columnName} NOT LIKE '${params.value}'`;
			else return `${params.columnName} NOT ILIKE ${params.value}`;
		} else if (params.operator === '$regex') {
			if (this.db_type == MYSQL) return `${params.columnName} REGEXP '${params.value}'`;
			else return params.columnName + ' ~ ' + params.value;
		} else if (params.operator === '$!regex') {
			if (this.db_type == MYSQL) return `${params.columnName} NOT REGEXP '${params.value}'`;
			else return params.columnName + ' !~ ' + params.value;
		} else if (params.operator === '$contains') {
			return params.columnName + ' @> ' + params.value;
		} else if (params.operator === '$contained_by') {
			return params.columnName + ' <@ ' + params.value;
		} else if (params.operator === '$overlaps') {
			return params.columnName + ' && ' + params.value;
		}

		// else if (params.operator.indexOf('$cnq') > -1) return params.columnName + ' @> ARRAY[(' + this.select(params.value) + ')]';
		// else if (params.operator.indexOf('$cnbq') > -1) return params.columnName + ' <@ ARRAY[(' + this.select(params.value) + ')]';
		// else if (params.operator.indexOf('$cnb') > -1) return params.columnName + ' <@ ' + (params.value.indexOf('$') > -1 ? params.value : 'ARRAY[' + params.value + ']') + '::' + pgtype + '[]';
		// else if (params.operator.indexOf('$!cnb') > -1) return ' NOT (' + params.columnName + ' <@ ' + params.value + '::' + pgtype + '[]) ';
		// else if (params.operator.indexOf('$cn') > -1) return params.columnName + ' @> ' + params.value + '::' + pgtype;
		// else if (params.operator.indexOf('$!cn') > -1) return ' NOT (' + params.columnName + ' @> ' + params.value + '::' + pgtype + ') ';

		return null;
	}

	getType(columnName) {

		var c = columnName.split('.');

		return this.currentModel.models[c[0]][c[1]].properties.columns[c[2]]?.type.toLowerCase() || "";
	}

	makeid(len) {
		len = len + 2;
		var text = "a";
		var possible = "1bc62de3f23gh4ij5k_0_lmno231pq6rst7uvw864xy9z";

		for (var i = 0; i < len; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

};